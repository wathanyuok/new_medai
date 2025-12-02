"use client";
import clsx from "clsx";
import "highlight.js/styles/github.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaStop } from "react-icons/fa";
import { FiPaperclip, FiX } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import TextareaAutosize from "react-textarea-autosize";
import { toast, ToastContainer } from "react-toastify";
import Image from "next/image";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { HiArrowUp } from "react-icons/hi";
import ScrollToBottomButton from "@/components/scrollToBottomButton/ScrollToBottomButton";

/**
 * ✅ จุดแก้หลัก ๆ
 * 1) ไม่ล้างไฟล์ก่อนส่ง – ใช้สำเนา filesToUpload แล้วค่อยเคลียร์หลังจบ
 * 2) history รวมข้อความ user ล่าสุด (ไม่ใช้ messages เดิมเฉย ๆ)
 * 3) แยกเส้นทางส่งกรณี labLink ให้ชัดเจน
 * 4) ปรับ drag & drop ไม่พึ่ง Buffer (ใช้ FileReader/ArrayBuffer)
 * 5) ลด race condition ของ state ด้วยการคำนวณค่าที่ต้องใช้ก่อน setState
 * 6) reset file input อย่างปลอดภัยหลังรับไฟล์แล้ว
 */

export default function ClaudeForm() {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; imgLink?: string; pdfName?: string }[]
  >([]);
  const [isThinking, setIsThinking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [followupQuestions, setFollowupQuestions] = useState<string[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isFromLabAnalyst, setIsFromLabAnalyst] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  // รายการคำทักทาย (ใช้ซ้ำหลายจุด)
  const greetings = useMemo(
    () =>
      [
        // TH
        "สวัสดี",
        "สวัสดีครับ",
        "สวัสดีค่ะ",
        "หวัดดี",
        "ดีจ้า",
        "ดีครับ",
        "ดีค่ะ",
        "ไง",
        "ว่าไง",
        "ฮัลโหล",
        "ฮาย",
        "อรุณสวัสดิ์",
        "สวัสดีตอนเช้า",
        "สวัสดีตอนสาย",
        "สวัสดีตอนบ่าย",
        "สวัสดีตอนเย็น",
        "ทำอะไรได้บ้าง?",
        "ทำอะไรได้บ้าง",
        // EN
        "hello",
        "hi",
        "hey",
        "howdy",
        "yo",
        "what's up",
        "good morning",
        "good afternoon",
        "good evening",
      ].map((s) => s.toLowerCase()),
    []
  );

  // --- startup: รับ labLink จาก localStorage แล้วส่งทันที ---
  useEffect(() => {
    const run = async () => {
      const fromLabAnalyst = localStorage.getItem("from_lab_analyst") === "true";
      const labLink = localStorage.getItem("lab_link") || "";
      localStorage.removeItem("from_lab_analyst");
      localStorage.removeItem("lab_link");
      if (fromLabAnalyst && labLink) {
        setIsFromLabAnalyst(true);
        await handleSubmit({ labLink, isInitialLabSubmit: true });
        setIsFromLabAnalyst(false);
      }
    };
    run();
  }, []);

  // ตรวจสถานะ scroll
  useEffect(() => {
    const checkIfAtBottom = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const threshold = 100;
      const atBottom = scrollTop + clientHeight >= scrollHeight - threshold;
      setIsAtBottom(atBottom);
    };
    const onScroll = () => checkIfAtBottom();
    window.addEventListener("scroll", onScroll, { passive: true });
    checkIfAtBottom();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const threshold = 100;
      const atBottom = scrollTop + clientHeight >= scrollHeight - threshold;
      setIsAtBottom(atBottom);
    }, 120);
    return () => clearTimeout(timer);
  }, [messages, isThinking, streamingText]);

  // รับค่าเก่าจาก localStorage (กรณี redirect)
  useEffect(() => {
    const raw = localStorage.getItem("aichat-input");
    if (raw) {
      setInput(raw);
      localStorage.removeItem("aichat-input");
    }
  }, []);

  // ดึง API key จาก env ถ้ายังไม่มี
  useEffect(() => {
    const apiKeyENV = process.env.ANTHROPIC_API_KEY || "";
    if (!apiKey) setApiKey(apiKeyENV);
  }, [apiKey]);

  // ---------- Helpers ----------
  const getBase64SizeInBytes = (base64: string): number => {
    const padding = (base64.match(/=+$/) || [""])[0].length;
    return (base64.length * 3) / 4 - padding;
  };

  const readFileAsBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1] || "");
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

 const uploadToS3 = async (filesToUpload: File[]) => {
  const uploaded: { fileName: string; url: string }[] = [];

  for (const f of filesToUpload) {
    try {
      const base64 = await readFileAsBase64(f);

      if (f.type.startsWith("image/") && getBase64SizeInBytes(base64) > 4 * 1024 * 1024) {
        toast.error(`Error: ${f.name} มีขนาดเกิน 4MB`, { position: "top-right", autoClose: 1500 });
        continue;
      }

      const payload = { file_base64: base64 };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/queue/aifile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${process.env.NEXT_PUBLIC_TK_PUBLIC_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("upload failed");

      const result = await res.json();
      if (result?.data?.quef_path) {
        uploaded.push({ fileName: f.name, url: result.data.quef_path });
      }

    } catch (e) {
      console.error("Upload error:", e);
      toast.error(`อัปโหลดไฟล์ ${f.name} ไม่สำเร็จ`, {
        position: "top-right",
        autoClose: 1500,
      });
    }
  }

  return uploaded;
};


  // ---------- Drag & Drop ----------
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    const valid: File[] = [];
    for (const f of dropped) {
      const isValidType = f.type.startsWith("image/") || f.type === "application/pdf";
      if (!isValidType) {
        toast.error(`Error: ${f.name} ต้องเป็นภาพหรือ PDF เท่านั้น`, { autoClose: 1200 });
        continue;
      }
      if (f.type.startsWith("image/") && f.size > 4 * 1024 * 1024) {
        toast.error(`Error: ${f.name} เกิน 4MB`, { autoClose: 1200 });
        continue;
      }
      valid.push(f);
    }
    if (valid.length) {
      setFiles((prev) => [...prev, ...valid]);
      setError(null);
    }
  };

  // ---------- File input ----------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      const valid: File[] = [];
      for (const f of selected) {
        const isValidType = f.type.startsWith("image/") || f.type === "application/pdf";
        if (!isValidType) {
          toast.error(`Error: ${f.name} ไม่ใช่ไฟล์ที่รองรับ (PDF/รูป)`, { autoClose: 1200 });
          continue;
        }
        if (f.type.startsWith("image/") && f.size > 4 * 1024 * 1024) {
          toast.error(`Error: ${f.name} เกิน 4MB`, { autoClose: 1500 });
          continue;
        }
        toast.success(`File attached: ${f.name}`, { autoClose: 600, theme: "light", style: { zIndex: 99999 } });
        valid.push(f);
      }
      if (valid.length) {
        setFiles((prev) => [...prev, ...valid]);
        setError(null);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ""; // reset
  };

  // ---------- Submit ----------
  const handleSubmit = async (params: {
    e?: React.FormEvent;
    labLink?: string;
    isInitialLabSubmit?: boolean;
  } = {}) => {
    params.e?.preventDefault();

    // snapshot ค่าที่ต้องใช้ทันที เพื่อลด race condition จาก setState
    const currentInput = input.trim();
    const filesToUpload = [...files];
    const isTextOnly = !params.labLink && filesToUpload.length === 0;

    if (!params.isInitialLabSubmit && isTextOnly && !currentInput) return;

    // สร้างข้อความ user ที่จะ push เข้า history ก่อน
    const attachedFilesText = filesToUpload.length
      ? "\n\n📎 แนบไฟล์: " + filesToUpload.map((f) => f.name).join(", ")
      : "";
    const displayInput = params.isInitialLabSubmit ? "วิเคราะห์ผลตรวจ LAB" : currentInput;
    const userMessage = { role: "user" as const, content: displayInput + attachedFilesText };

    // set state ของ UI ก่อนเริ่มเรียก API
    setIsLoading(true);
    setIsThinking(true);
    setStreamingText("");
    setFollowupQuestions([]);
    setInput("");

    // แสดงข้อความ user + เตรียมที่ว่างสำหรับ assistant streaming
    setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "" }]);

    // เตรียม history โดยรวม userMessage ล่าสุดเข้าไปด้วย
    const historyForServer = [...messages, userMessage].map((m) => ({ role: m.role, content: m.content }));

    // เลือก endpoint ตามประเภทคำขอ
    let endpoint = "/api/chatStreamText";
    let body: any = { input: displayInput || "", history: historyForServer };

    if (filesToUpload.length > 0 || params.labLink) {
      endpoint = "/api/chatStreamFile";
      let uploadedFiles: { fileName: string; url: string }[] = [];
      try {
        if (params.labLink) {
          uploadedFiles = [{ fileName: "Lab_Result.pdf", url: params.labLink }];
        } else {
          uploadedFiles = await uploadToS3(filesToUpload);
        }
      } catch (err) {
        toast.error("ไม่สามารถอัปโหลดไฟล์ได้", { position: "top-right", autoClose: 1800 });
        setIsThinking(false);
        setIsLoading(false);
        return;
      }
      body = { input: displayInput || "", files: uploadedFiles, history: historyForServer };
    }

    controllerRef.current = new AbortController();

    let response: Response | undefined;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        signal: controllerRef.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      toast.error("เครือข่ายมีปัญหา กรุณาลองใหม่อีกครั้ง", { autoClose: 1500 });
      setIsThinking(false);
      setIsLoading(false);
      return;
    }

    if (!response?.ok || !response.body) {
      toast.error("เซิร์ฟเวอร์ไม่ตอบสนอง", { autoClose: 1500 });
      setIsThinking(false);
      setIsLoading(false);
      return;
    }

    // อ่านสตรีม
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (line.startsWith("data:")) {
          const jsonStr = line.replace("data:", "").trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed?.delta?.text || parsed?.delta?.text_delta?.text;
            if (delta) {
              fullText += delta;
              setStreamingText((prev) => prev + delta);
            }
          } catch (err) {
            console.error("JSON parse error:", err);
          }
        }
      }
      buffer = lines[lines.length - 1];
    }

    // จบสตรีม -> เคลียร์สถานะ
    setIsThinking(false);

    // อัปเดตข้อความ assistant สุดท้าย
    let outputCode = fullText;
    try {
      const parsed = JSON.parse(fullText);
      outputCode = parsed.outputCode || "";
      if (parsed.followupQuestions) setFollowupQuestions(parsed.followupQuestions);
      setMessages((prev) =>
        prev.map((msg, idx) => (idx === prev.length - 1 && msg.role === "assistant" ? { ...msg, content: outputCode || msg.content } : msg))
      );
    } catch {
      setMessages((prev) =>
        prev.map((msg, idx) => (idx === prev.length - 1 && msg.role === "assistant" ? { ...msg, content: fullText } : msg))
      );
    }

    // สร้างคำถามแนะนำเพิ่มเติม (ยกเว้นคำทักทาย)
    if ((outputCode || fullText).trim()) {
      setIsGeneratingQuestions(true);
      try {
        if (!greetings.includes(displayInput.toLowerCase())) {
          const res = await fetch("/api/generateQuestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ summary: outputCode || fullText }),
          });
          const data = await res.json();
          if (data.followupQuestions) setFollowupQuestions(data.followupQuestions);
        }
      } catch (err) {
        console.error("generateQuestions error:", err);
      }
      setIsGeneratingQuestions(false);
    }

    setIsLoading(false);
    setStreamingText("");

    // ✅ เคลียร์ไฟล์หลังจบจริง ๆ (ไม่ใช่ก่อนส่ง)
    setFiles([]);
  };

  const askFollowup = (q: string) => {
    setInput(q);
    setTimeout(() => {
      const form = document.querySelector("form");
      form?.requestSubmit();
    }, 0);
  };

  const handleAbort = () => {
    controllerRef.current?.abort();
    setIsThinking(false);
    setIsLoading(false);
    setStreamingText("");
    toast.warn("⛔️ หยุดการตอบกลับแล้ว", { position: "top-right", autoClose: 1000 });
  };


const [showExtendedMessage, setShowExtendedMessage] = useState(false);

useEffect(() => {
  // ใช้ชนิดที่ปลอดภัยทั้ง Node/Dom
  let timer: ReturnType<typeof setTimeout> | null = null;

  if (isThinking && streamingText.trim() === "") {
    timer = setTimeout(() => setShowExtendedMessage(true), 4000);
  } else {
    setShowExtendedMessage(false);
  }

  // cleanup ต้องคืนค่า void เสมอ
  return () => {
    if (timer !== null) {
      clearTimeout(timer);
    }
  };
}, [isThinking, streamingText]);


  const shouldShowQuestions = () => {
    return !greetings.includes(input.trim().toLowerCase()) && followupQuestions.length > 0 && isAtBottom;
  };

  return (
    <div
      className={clsx(
        `w-full mx-auto mt-15 chat-font ${!(isThinking || messages.length > 0) ? "" : "fixed bottom-4"}`,
        {
          "relative min-h-96 bg-gray-50 flex flex-col items-center px-4 pb-50 sm:pb-50 dark:bg-gray-900 ":
            isThinking || messages.length > 0,
          "relative min-h-96 bg-gray-50 flex flex-col items-center px-4 pb-50 sm:pb-50 dark:bg-gray-900 justify-center":
            !(isThinking || messages.length > 0),
        }
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!(isThinking || messages.length > 0) && (
        <div className=".fixed mt-20 .flex justify-center items-center pointer-events-none text-center text-[#10203C]">
          <p className="text-xl font-semibold max-w-[600px] mb-0 leading-snug">EXA สวัสดีค่ะ ฉันคือ Health Assistant</p>
          <p className="text-base font-normal max-w-[600px] leading-relaxed mt-2">
            ผู้ช่วย AI ด้านสุขภาพของคุณ คุณสามารถสอบถามปัญหาสุขภาพ หรือส่งผลตรวจเลือดเพื่อรับการวิเคราะห์และคำแนะนำเฉพาะบุคคลได้เลยค่ะ
          </p>
        </div>
      )}

      <div
        className="sm:hidden fixed top-20 flex items-center z-[99] gap-2 px-4 py-2 mb-10 rounded-xl shadow-deep text-md font-bold  bg-white text-gray-800 dark:bg-gray-800 dark:text-white"
        style={{ boxShadow: "rgba(112, 139, 152, 0.2) 0px 5px 45px" }}
      >
        by Claude.AI
      </div>

      {isDragging && (
        <div className="fixed inset-0 bg-gray-400 opacity-60 flex justify-center items-center z-[999999] pointer-events-none text-gray-800">
          <span>วางไฟล์ที่นี่เพื่อแนบ</span>
        </div>
      )}

      <div className="w-full sm:w-[640px] md:w-[768px] lg:w-[1024px] 2xl:w-[1280px] flex flex-col gap-4 z-10 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[100%] py-2 rounded-xl ${msg.role === "user" ? "self-end bg-white dark:bg-purple-900 text-right text-black dark:text-white shadow px-3" : ""}`}
          >
            <div className="prose prose-sm break-words max-w-full">
              {msg.role === "assistant" ? (
                <div className="flex items-start gap-3">
                  <div className="break-words text-lg">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="text">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking &&
          (streamingText.trim() === "" ? (
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-xl animate-pulse text-gray-500 dark:text-gray-300">
              <Image src={"/images/gif/ai_thinking.gif"} alt="AI thinking" width={30} height={30} className="object-cover" />
              <p>{showExtendedMessage ? "อาจใช้เวลาวิเคราะห์ไฟล์นานกว่าปกติ กรุณารอสักครู่..." : "กำลังวิเคราะห์..."}</p>
            </div>
          ) : (
            <div className="max-w-full px-4 py-3 rounded-xl shadow self-start bg-white dark:bg-gray-800 border border-dashed border-purple-200 dark:border-purple-700 flex gap-2">
              <div className="prose prose-sm max-w-full break-words text-gray-600 dark:text-gray-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{streamingText}</ReactMarkdown>
              </div>
            </div>
          ))}
      </div>

      {isGeneratingQuestions ? (
        <div className="mt-6 flex flex-col gap-2 items-start pl-3 sm:pl-0 mb-4 fixed bottom-24 z-10 left-0">
          <div className="h-4 w-40 bg-gradient-to-r from-pink-100 via-pink-200 to-pink-100 rounded-full animate-pulse" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-64 bg-gradient-to-r from-pink-100 via-pink-200 to-pink-100 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        shouldShowQuestions() && (
          <div className="mt-6 flex flex-col gap-2 items-start px-4 sm:px-0 mb-2 fixed bottom-24 z-10 w-full sm:w-[640px] md:w-[768px] lg:w-[1024px] 2xl:w-[1280px]">
            {followupQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => askFollowup(q)}
                className="px-4 py-2 text-sm rounded-full text-start bg-[#EFDDFD] text-[#F639BD] hover:bg-pink-200 transition-all duration-200 shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        )
      )}

      <ScrollToBottomButton messages={messages.map((msg, index) => ({ id: index.toString(), text: msg.content }))} />

      <form
        onSubmit={(e) => handleSubmit({ e })}
        className={clsx(
          `w-full mx-auto mt-3 px-2 ${!(isThinking || messages.length > 0) ? "z-10" : "fixed bottom-4 z-10"}`,
          { "sm:w-[640px] md:w-[768px] lg:w-[1024px] 2xl:w-[1280px]": isThinking || messages.length > 0, "max-w-[520px] ": !(isThinking || messages.length > 0) }
        )}
      >
        <div className="p-[1px] rounded-xl bg-gradient-to-r from-[#4385EF] to-[#FF68F5]">
          <div className="bg-white dark:bg-gray-800 rounded-xl flex items-start px-3 py-2 gap-3 shadow-lg">
            {/* แนบไฟล์ */}
            <div className="relative group">
              <div
                className="absolute bottom-8 left-5/3 -translate-x-1/2 bg-white text-[#10203C] text-sm px-3 py-1 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition z-10 whitespace-nowrap min-w-max"
              >
                <svg className="absolute text-white h-2 left-0 ml-3 top-full" viewBox="0 0 255 255">
                  <polygon className="fill-current" points="0,0 127.5,127.5 255,0" />
                </svg>
                เพิ่มไฟล์ที่นี่
              </div>
              <label title="เพิ่มไฟล์ที่นี่" className={`cursor-pointer transition text-gray-600 dark:text-gray-300 hover:text-purple-600 ${input.trim().length > 0 ? "self-end mb-3" : "self-center"}`}>
                <svg className="text-[#4385EF] mt-2" width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.11084 13.8753L12.4528 4.5333C12.9371 4.0388 13.5145 3.64523 14.1518 3.37535C14.7891 3.10547 15.4736 2.96464 16.1657 2.96101C16.8578 2.95738 17.5437 3.09101 18.1838 3.35419C18.824 3.61736 19.4055 4.00485 19.8949 4.49423C20.3843 4.98362 20.7718 5.56519 21.035 6.20529C21.2981 6.8454 21.4318 7.53133 21.4281 8.22342C21.4245 8.9155 21.2837 9.6 21.0138 10.2373C20.7439 10.8746 20.3503 11.4521 19.8558 11.9363L11.1298 20.6603C10.5893 21.1833 9.86479 21.473 9.11262 21.4668C8.36045 21.4606 7.64085 21.1591 7.10896 20.6272C6.57708 20.0953 6.27553 19.3757 6.26934 18.6235C6.26314 17.8713 6.55279 17.1469 7.07584 16.6063L15.4478 8.2333" stroke="#4385EF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} multiple />
              </label>
            </div>

            {/* กล่องข้อความ */}
            <div className="flex flex-col flex-grow min-w-0">
              <TextareaAutosize
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() || files.length > 0) handleSubmit({ e });
                  }
                }}
                onInput={() => {
                  const el = textareaRef.current;
                  if (el) {
                    el.style.height = "auto";
                    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
                  }
                }}
                placeholder="Ask anything about your health"
                className="bg-transparent border-none outline-none text-sm px-2 py-3 resize-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/60 overflow-auto max-h-[250px]"
                style={{ fontSize: "16px" }}
                rows={1}
              />

              {files.length > 0 &&
                files.map((f, idx) => (
                  <div key={idx} className="mt-2 flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-100 px-3 py-1 rounded-full w-fit">
                    <FiPaperclip />
                    <span className="truncate max-w-[160px]">{f.name}</span>
                    <button type="button" className="hover:text-red-500" onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}>
                      <FiX />
                    </button>
                  </div>
                ))}
            </div>

            {/* ปุ่มส่ง/หยุด */}
            <div className={`flex flex-col ${input.trim().length > 0 || files.length > 0 ? "self-end" : "self-center"} h-full`}>
              <div className="flex items-center">
                {isThinking || isLoading ? (
                  <button type="button" onClick={handleAbort} className="bg-red-600 hover:bg-red-700 rounded-full p-2 px-3.5 text-white transition">
                    <FaStop size={18} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isThinking || isLoading || (!input.trim() && files.length === 0)}
                    className={`rounded-full p-3.5 px-3.5 text-white transition ${isThinking || isLoading || (!input.trim() && files.length === 0) ? "bg-[#F639BD] opacity-60 cursor-not-allowed" : "bg-[#F639BD]"}`}
                  >
                    <HiArrowUp />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      <ToastContainer position="top-right" autoClose={3000} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover style={{ zIndex: 99999 }} />
    </div>
  );
}
