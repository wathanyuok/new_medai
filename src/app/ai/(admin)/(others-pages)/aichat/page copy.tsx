'use client'
import clsx from 'clsx';
import 'highlight.js/styles/github.css'
import React, { useEffect, useRef, useState } from 'react'
import { FaStop } from 'react-icons/fa'
import { FiPaperclip, FiX } from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'
import TextareaAutosize from 'react-textarea-autosize'
import { toast, ToastContainer } from 'react-toastify'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight';
import { HiArrowUp } from 'react-icons/hi';

export default function ClaudeForm() {
  const [input, setInput] = useState('');
  const [file, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; imgLink?: string; pdfName?: string }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [followupQuestions, setFollowupQuestions] = useState<string[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  useEffect(() => {
    const raw = localStorage.getItem("aichat-input");
    if (raw) {
      const parsed = raw;
      setInput(parsed || '');
      localStorage.removeItem("aichat-input");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      if (!selectedFile.type.startsWith("image/") && selectedFile.type !== "application/pdf") {
        setError("โปรดอัปโหลดไฟล์ PDF หรือรูปภาพเท่านั้น");
        toast.error(
          `Error: ${selectedFile.name} is not a valid file. Please upload a PDF or an image.`,
          {
            position: "top-right",
            autoClose: 1000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          }
        );
        setFiles([]);
        return;
      }

      toast.success(`File attached: ${selectedFile.name}`, {
        position: "top-right",
        autoClose: 100,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        style: { zIndex: 99999 },
      });

      setFiles((prev) => [...prev, selectedFile])
      setError(null);
    }
  };

  useEffect(() => {
    const apiKeyENV = process.env.ANTHROPIC_API_KEY!;
    if (apiKey === undefined || null) {
      setApiKey(apiKeyENV)
    }
  }, [apiKey])

  const handleRemoveFile = () => {
    setFiles([]);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file.length === 0 && !input.trim()) return;

    // อย่าเคลียร์ input/files ตรงนี้ (จะย้ายไปตอนจบ)
    setIsLoading(true);
    setFollowupQuestions([]);
    setIsThinking(true);

    const attachedFilesText = file.length > 0
      ? '\n\n📎 แนบไฟล์: ' + file.map(f => f.name).join(', ')
      : '';

    // 1) เตรียม userMessage ล่าสุด
    const userMessage = {
      role: 'user' as const,
      content: input + attachedFilesText,
    };

    // 2) อัปเดต UI ให้เห็นข้อความผู้ใช้ + สร้าง placeholder ให้ assistant
    setMessages((prev) => {
      const greetings = ["สวัสดี", "hello", "hi", "hey"];
      if (greetings.includes(input.trim().toLowerCase())) {
        setFollowupQuestions([]);
      }
      return [...prev, userMessage, { role: 'assistant', content: '' }];
    });

    // 3) สร้าง history ที่ "รวม" userMessage ล่าสุดเข้าไปด้วย (สำคัญ)
    const previousMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));
    const history = [...previousMessages, userMessage];

    controllerRef.current = new AbortController();
    const endpoint = file.length > 0 ? '/api/chatStreamFile' : '/api/chatStreamText';

    let response: Response;

    if (file.length > 0) {
      // 4) สร้าง payload ไฟล์ให้เสร็จก่อน แล้วค่อยส่ง
      const fileArray = await Promise.all(file.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        return {
          base64Data: Buffer.from(arrayBuffer).toString('base64'),
          mimeType: file.type,
          fileName: file.name,
        };
      }));

      response = await fetch(endpoint, {
        method: 'POST',
        signal: controllerRef.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input || '',
          files: fileArray,
          history, // ใช้ history ที่รวม userMessage
        }),
      });
    } else {
      response = await fetch(endpoint, {
        method: 'POST',
        signal: controllerRef.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input || '',
          history, // ใช้ history ที่รวม userMessage
        }),
      });
    }

    // 5) อ่านสตรีมผลลัพธ์
    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (line.startsWith('data:')) {
          const jsonStr = line.replace('data:', '').trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed?.delta?.text || parsed?.delta?.text_delta?.text;
            if (delta) {
              fullText += delta;
              setStreamingText((prev) => prev + delta);
            }
          } catch (err) {
            console.error('JSON parse error:', err);
          }
        }
      }

      buffer = lines[lines.length - 1];
    }

    setIsThinking(false);
    setStreamingText('');

    // 6) อัปเดตข้อความ assistant (รองรับทั้ง text ธรรมดา/JSON wrapper)
    let outputCode = fullText;
    try {
      const parsed = JSON.parse(fullText);
      outputCode = parsed.outputCode || '';
      if (parsed.followupQuestions) setFollowupQuestions(parsed.followupQuestions);

      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === prev.length - 1 && msg.role === 'assistant'
            ? { ...msg, content: outputCode || msg.content }
            : msg
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === prev.length - 1 && msg.role === 'assistant'
            ? { ...msg, content: fullText }
            : msg
        )
      );
    }

    // 7) สร้างคำถามแนะนำเพิ่มเติม (ถ้าไม่ใช่คำทักทาย)
    if (outputCode.trim()) {
      setIsGeneratingQuestions(true);
      try {
        const greetings = [
          // TH
          "สวัสดี","สวัสดีครับ","สวัสดีค่ะ","หวัดดี","ดีจ้า","ดีครับ","ดีค่ะ","ไง","ว่าไง","โย่ว","ฮัลโหล","ฮาย",
          "อรุณสวัสดิ์","สวัสดีตอนเช้า","สวัสดีตอนสาย","สวัสดีตอนบ่าย","สวัสดีตอนเย็น","ราตรีสวัสดิ์","ฝันดี",
          "นอนหลับฝันดี","ยินดีที่ได้รู้จัก","ยินดีที่ได้เจอ","คิดถึงนะ","มีอะไรให้ช่วยไหม","เป็นยังไงบ้าง","ไปไหนมา",
          "หายไปไหนมา","นานเลยนะ","มานานหรือยัง","มากันครบไหม","สบายดีไหม","เจอกันอีกแล้ว","วันนี้เป็นไงบ้าง",
          "หิวหรือยัง","อยู่ไหน","โอเคไหม","เอาไงดี","เริ่มกันเลยไหม","ขอโทษนะ","มาแล้ว","พึ่งตื่น","ว้าว",
          "สุดยอด","โอ้โห","เจ๋งอ่ะ","ไปกันเลย","พร้อมยัง","พร้อมลุย","เริ่มได้เลย","ว่าไงเพื่อน","สวัสดีเพื่อนรัก",
          "ทำอะไรได้บ้าง?","ทำอะไรได้บ้าง",
          // EN
          "hello","hi","hey","howdy","yo","hiya","what's up","sup","good morning","good afternoon","good evening",
          "good night","nice to meet you","pleasure to meet you","great to see you","long time no see","how have you been?",
          "how’s it going?","what’s going on?","how are you?","greetings","good to see you","look who it is!","how are things?",
          "been a while!","hey there","hello there","how do you do?","yo dude","yo bro","hey buddy","hey mate","hey man",
          "hey girl","good to hear from you","hey, stranger!","hi there!","hello again!","how’s life?","what’s new?",
          "ready to go?","all good?","top of the morning!","welcome back!","it's been too long","where have you been?",
          "what’s the word?","hope you’re well","salutations","cheers","hi everyone!","hello world!","just checking in","glad to meet you","hi all"
        ];

        if (!greetings.includes(input.trim().toLowerCase())) {
          const res = await fetch('/api/generateQuestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ summary: outputCode }),
          });
          const data = await res.json();
          if (data.followupQuestions) setFollowupQuestions(data.followupQuestions);
        }
      } catch (err) {
        console.error('❌ generateQuestions API error:', err);
      }
    }
    setIsGeneratingQuestions(false);

    // 8) เคลียร์ค่าหลังงานเสร็จ (ย้ายมาไว้ตอนจบเพื่อกัน race)
    setInput('');
    setFiles([]); // เคลียร์ไฟล์ที่นี่
    setIsLoading(false);
    setStreamingText('');
  };

  const askFollowup = (q: string) => {
    setInput(q);
    setTimeout(() => {
      document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true }));
    }, 100);
  };

  const handleAbort = () => {
    controllerRef.current?.abort();
    setIsThinking(false);
    setIsLoading(false);
    setStreamingText('');
    toast.warn('⛔️ หยุดการตอบกลับแล้ว', {
      position: "top-right",
      autoClose: 1000,
    });
  };

  return (
    <div
      className={clsx(
        `w-full mx-auto mt-3 ${!(isThinking || messages.length > 0) ? '' : 'fixed bottom-4 ใz-10'}`,
        {
          'relative min-h-screen bg-gray-50 flex flex-col items-center px-4 pb-36 sm:pb-28 dark:bg-gray-900 ': isThinking || messages.length > 0,
          'relative min-h-screen bg-gray-50 flex flex-col items-center px-4 pb-36 sm:pb-28 dark:bg-gray-900 justify-center': !(isThinking || messages.length > 0),
        }
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!(isThinking || messages.length > 0) && (
        <div className=".fixed .mt-20 .flex justify-center items-center pointer-events-none text-center text-[#10203C]">
          <p className="text-xl font-semibold max-w-[600px] leading-snug">
            EXA สวัสดีค่ะ ฉันคือ Health Assistant
          </p>
          <p className="text-base font-normal max-w-[600px] leading-relaxed">
            ผู้ช่วย AI ด้านสุขภาพของคุณ คุณสามารถสอบถามปัญหาสุขภาพ
            หรือส่งผลตรวจเลือดเพื่อรับการวิเคราะห์และคำแนะนำเฉพาะบุคคลได้เลยค่ะ
          </p>
        </div>
      )}

      <div
        className="fixed top-20 flex items-center gap-2 px-4 py-2 mb-10 rounded-xl shadow-deep text-lg font-bold  bg-white text-gray-800 dark:bg-gray-800 dark:text-white"
        style={{ boxShadow: 'rgba(112, 139, 152, 0.2) 0px 5px 45px' }}
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
            className={`
              max-w-[100%] . py-2 rounded-xl
              ${msg.role === 'user'
                ? 'self-end bg-white dark:bg-purple-900 text-right text-black dark:text-white shadow px-3'
                : '.self-start .bg-white .dark:bg-gray-800 .text-left .text-gray-800 .dark:text-white .shadow'
              }
            `}
          >
            <div className="prose prose-sm break-words max-w-full">
              {msg.role === 'assistant' ? (
                <div className="flex items-start gap-3">
                  <div className="break-words text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          streamingText.trim() === '' ? (
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-xl animate-pulse text-gray-500 dark:text-gray-300">
              <p>กำลังวิเคราะห์...</p>
            </div>
          ) : (
            <div className="max-w-full px-4 py-3 rounded-xl shadow self-start bg-white dark:bg-gray-800 border border-dashed border-purple-200 dark:border-purple-700 flex gap-2">
              <div className="prose prose-sm max-w-full break-words text-gray-600 dark:text-gray-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {streamingText}
                </ReactMarkdown>
              </div>
            </div>
          )
        )}
      </div>

      {isGeneratingQuestions ? (
        <div className="mt-6 flex flex-col gap-2 items-start pl-3 sm:pl-0 mb-4 fixed bottom-24 z-10 left-0">
          <div className="h-4 w-40 bg-gradient-to-r from-pink-100 via-pink-200 to-pink-100 rounded-full animate-pulse" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-64 bg-gradient-to-r from-pink-100 via-pink-200 to-pink-100 rounded-full animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : (
        ![
          "สวัสดี","สวัสดีครับ","สวัสดีค่ะ","หวัดดี","ดีจ้า","ดีครับ","ดีค่ะ","ไง","ว่าไง","โย่ว","ฮัลโหล","ฮาย",
          "อรุณสวัสดิ์","สวัสดีตอนเช้า","สวัสดีตอนสาย","สวัสดีตอนบ่าย","สวัสดีตอนเย็น","ราตรีสวัสดิ์","ฝันดี",
          "นอนหลับฝันดี","ยินดีที่ได้รู้จัก","ยินดีที่ได้เจอ","คิดถึงนะ","มีอะไรให้ช่วยไหม","เป็นยังไงบ้าง","ไปไหนมา",
          "หายไปไหนมา","นานเลยนะ","มานานหรือยัง","มากันครบไหม","สบายดีไหม","เจอกันอีกแล้ว","วันนี้เป็นไงบ้าง",
          "หิวหรือยัง","อยู่ไหน","โอเคไหม","เอาไงดี","เริ่มกันเลยไหม","ขอโทษนะ","มาแล้ว","พึ่งตื่น","ว้าว","สุดยอด",
          "โอ้โห","เจ๋งอ่ะ","ไปกันเลย","พร้อมยัง","พร้อมลุย","เริ่มได้เลย","ว่าไงเพื่อน","สวัสดีเพื่อนรัก",
          "ทำอะไรได้บ้าง?","ทำอะไรได้บ้าง",
          "hello","hi","hey","howdy","yo","hiya","what's up","sup","good morning","good afternoon","good evening",
          "good night","nice to meet you","pleasure to meet you","great to see you","long time no see","how have you been?",
          "how’s it going?","what’s going on?","how are you?","greetings","good to see you","look who it is!","how are things?",
          "been a while!","hey there","hello there","how do you do?","yo dude","yo bro","hey buddy","hey mate","hey man",
          "hey girl","good to hear from you","hey, stranger!","hi there!","hello again!","how’s life?","what’s new?",
          "ready to go?","all good?","top of the morning!","welcome back!","it's been too long","where have you been?",
          "what’s the word?","hope you’re well","salutations","cheers","hi everyone!","hello world!","just checking in","glad to meet you","hi all"
        ].includes(input.trim().toLowerCase()) && followupQuestions.length > 0 && (
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

      <form
        onSubmit={handleSubmit}
        className={clsx(
          `w-full mx-auto mt-3 px-2 ${!(isThinking || messages.length > 0) ? 'z-10' : 'fixed bottom-4 z-10'}`,
          {
            'sm:w-[640px] md:w-[768px] lg:w-[1024px] 2xl:w-[1280px]': isThinking || messages.length > 0,
            'max-w-[520px] ': !(isThinking || messages.length > 0),
          }
        )}
      >
        <div className="p-[1px] rounded-xl bg-gradient-to-r from-[#4385EF] to-[#FF68F5]">
          <div className="bg-white dark:bg-gray-800 rounded-xl flex items-start px-3 py-2 gap-3 shadow-lg">
            <div className="relative group">
              <div className="absolute bottom-8 left-5/3 -translate-x-1/2 bg-white text-[#10203C] text-sm px-3 py-1 rounded-lg shadow-md
                  opacity-0 group-hover:opacity-100 transition z-10 whitespace-nowrap min-w-max before:content-['']">
                <svg className="absolute text-white h-2 left-0 ml-3 top-full" x="0px" y="0px" viewBox="0 0 255 255">
                  <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
                </svg>
                เพิ่มไฟล์ที่นี่
              </div>

              <label
                title="เพิ่มไฟล์ที่นี่"
                className={`cursor-pointer transition text-gray-600 dark:text-gray-300 hover:text-purple-600 ${input.trim().length > 0 ? 'self-end mb-3' : 'self-center'}`}
              >
                <svg className="text-[#4385EF] mt-2" width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.11084 13.8753L12.4528 4.5333C12.9371 4.0388 13.5145 3.64523 14.1518 3.37535C14.7891 3.10547 15.4736 2.96464 16.1657 2.96101C16.8578 2.95738 17.5437 3.09101 18.1838 3.35419C18.824 3.61736 19.4055 4.00485 19.8949 4.49423C20.3843 4.98362 20.7718 5.56519 21.035 6.20529C21.2981 6.8454 21.4318 7.53133 21.4281 8.22342C21.4245 8.9155 21.2837 9.6 21.0138 10.2373C20.7439 10.8746 20.3503 11.4521 19.8558 11.9363L11.1298 20.6603C10.5893 21.1833 9.86479 21.473 9.11262 21.4668C8.36045 21.4606 7.64085 21.1591 7.10896 20.6272C6.57708 20.0953 6.27553 19.3757 6.26934 18.6235C6.26314 17.8713 6.55279 17.1469 7.07584 16.6063L15.4478 8.2333" stroke="#4385EF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  multiple
                />
              </label>
            </div>

            <div className="flex flex-col flex-grow min-w-0">
              <TextareaAutosize
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() || file.length > 0) handleSubmit(e);
                  }
                }}
                onInput={() => {
                  const el = textareaRef.current;
                  if (el) {
                    el.style.height = 'auto';
                    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
                  }
                }}
                placeholder="Ask anything about your health"
                className="bg-transparent border-none outline-none text-sm px-2 py-3 resize-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/60 overflow-auto max-h-[250px]"
                rows={1}
              />

              {file.length > 0 && file.map((f, idx) => (
                <div key={idx} className="mt-2 flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-100 px-3 py-1 rounded-full w-fit">
                  <FiPaperclip />
                  <span className="truncate max-w-[160px]">{f.name}</span>
                  <button type="button" className="hover:text-red-500" onClick={handleRemoveFile}>
                    <FiX />
                  </button>
                </div>
              ))}
            </div>

            <div className={`flex flex-col ${input.trim().length > 0 || file.length > 0 ? 'self-end' : 'self-center'} h-full`}>
              <div className="flex items-center">
                {isThinking || isLoading ? (
                  <button
                    type="button"
                    onClick={handleAbort}
                    className="bg-red-600 hover:bg-red-700 rounded-full p-2 px-3.5 text-white transition"
                  >
                    <FaStop size={18} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isThinking || isLoading || (!input.trim() && file.length === 0)}
                    className={`rounded-full p-3.5 px-3.5 text-white transition ${isThinking || isLoading || (!input.trim() && file.length === 0) ? 'bg-[#F639BD] opacity-60 cursor-not-allowed' : 'bg-[#F639BD]'}`}
                  >
                    <HiArrowUp />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ zIndex: 99999 }}
      />
    </div>
  )
}
