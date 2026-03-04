'use client'
import clsx from 'clsx';
import 'highlight.js/styles/github.css'
import React, { useEffect, useRef, useState } from 'react'
import { FaStop } from 'react-icons/fa'
import { FiPaperclip, FiX } from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'
import TextareaAutosize from 'react-textarea-autosize'
import { toast, ToastContainer } from 'react-toastify'
import Image from "next/image";
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight';
import { HiArrowUp } from 'react-icons/hi';
import ScrollToBottomButton from '@/components/scrollToBottomButton/ScrollToBottomButton';

export default function ClaudeForm() {
  const [input, setInput] = useState('');
  const [file, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; imgLink?: string; pdfName?: string }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [followupQuestions, setFollowupQuestions] = useState<string[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  // Remove labPDF state - we'll handle it differently
  const [isFromLabAnalyst, setIsFromLabAnalyst] = useState(false);

  // เพิ่ม state สำหรับตรวจสอบ scroll
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const run = async () => {
      const fromLabAnalyst = localStorage.getItem('from_lab_analyst') === "true";
      const labLink = localStorage.getItem('lab_link');
      
      // Clear localStorage immediately to prevent issues
      localStorage.removeItem("from_lab_analyst");
      localStorage.removeItem("lab_link");
      
      if (fromLabAnalyst && labLink && labLink !== "") {
        setIsFromLabAnalyst(true);
        // Send with a default message for lab results
        const defaultMessage = "วิเคราะห์ผลตรวจ LAB";
        
        // Directly call handleSubmit without setting input state
        await handleSubmit({ 
          labLink: labLink,
          isInitialLabSubmit: true 
        });
        setIsFromLabAnalyst(false); // Reset after submission
      }
    };
    run();
  }, []);

  // ตรวจสอบว่าผู้ใช้เลื่อนลงมาล่างสุดหรือไม่
  useEffect(() => {
    const checkIfAtBottom = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      // ถือว่าอยู่ล่างสุดถ้าเหลือไม่เกิน 100px
      const threshold = 100;
      const atBottom = scrollTop + clientHeight >= scrollHeight - threshold;

      setIsAtBottom(atBottom);
    };

    // ฟังก์ชันสำหรับ scroll event
    const handleScroll = () => {
      checkIfAtBottom();
    };

    // เพิ่ม event listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // ตรวจสอบครั้งแรกเมื่อ component mount
    checkIfAtBottom();

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // ตรวจสอบครั้งใหม่เมื่อ messages เปลี่ยน (เพื่อ update ความสูงของหน้า)
  useEffect(() => {
    const timer = setTimeout(() => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const threshold = 100;
      const atBottom = scrollTop + clientHeight >= scrollHeight - threshold;
      setIsAtBottom(atBottom);
    }, 100);

    return () => clearTimeout(timer);
  }, [messages, isThinking, streamingText]);

  function getImageMimeType(base64: string): string | null {
    const signatures: { [key: string]: string } = {
      // Images
      '/9j/': 'image/jpeg',
      'iVBORw0KGgo': 'image/png',
      'R0lGODdh': 'image/gif',
      'R0lGODlh': 'image/gif',
      'Qk': 'image/bmp',
      'SUkqAA': 'image/tiff',
      'AAABAAEAEBA': 'image/x-icon',

      // PDF
      'JVBERi0': 'application/pdf',

      // Office (old formats)
      'UEsDB': 'application/zip', // could be .docx, .xlsx, .pptx, .odt, etc.
      '0M8R4KGx': 'application/msword', // .doc
      'd0lG': 'application/vnd.ms-excel', // .xls
      'E1xy': 'application/vnd.ms-powerpoint', // .ppt

      // Audio
      'SUQz': 'audio/mpeg', // .mp3
      'UklGR': 'audio/wav', // .wav
      'T2dnUw': 'audio/ogg',

      // Video
      'AAAAFGZ0': 'video/mp4',
      'fLaC': 'audio/flac',
      'RIFF': 'video/avi', // .avi (might also be .wav)

      // Archives
      '1F8B': 'application/gzip', // .gz
      'Rar!': 'application/x-rar-compressed', // .rar
    };

    for (const [prefix, mime] of Object.entries(signatures)) {
      if (base64.startsWith(prefix)) {
        return mime
      }
    }
    return null // ถ้าไม่ตรงกับ signature ใด
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);

    for (const file of droppedFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const imageBase64: string = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = getImageMimeType(imageBase64);


      const sizeInBytes = getBase64SizeInBytes(imageBase64);
      if (mimeType?.startsWith('image/') && sizeInBytes > 12194304) {
        toast.error(
          `Error: ไฟล์รูปภาพมีขนาดเกิน 4MB`,
          { position: "top-right", autoClose: 1000 }
        );
        return; // หรือ continue ถ้าต้องการข้ามไฟล์นี้แล้วไปไฟล์ถัดไป
      }
    }

    // ถ้าผ่านทุกไฟล์
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
  const getBase64SizeInBytes = (base64: string): number => {
    const padding = (base64.match(/=+$/) || [''])[0].length
    return (base64.length * 3) / 4 - padding
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);

      const validFiles: File[] = [];

      for (const selectedFile of selectedFiles) {
        const isValidType = selectedFile.type.startsWith("image/") || selectedFile.type === "application/pdf";
        if (!isValidType) {
          toast.error(
            `Error: ${selectedFile.name} is not a valid file. Please upload a PDF or an image.`,
            { position: "top-right", autoClose: 1000 }
          );
          continue;
        }

        if (selectedFile.type.startsWith("image/") && selectedFile.size > 12194304) {
          toast.error(
            `Error: ${selectedFile.name} มีขนาด MB เกินขนาดที่กำหนด (4MB)`,
            { position: "top-right", autoClose: 2000 }
          );
          continue;
        }

        toast.success(`File attached: ${selectedFile.name}`, {
          position: "top-right",
          autoClose: 500,
          theme: "light",
          style: { zIndex: 99999 },
        });

        validFiles.push(selectedFile);
      }

      // ✅ เพิ่มไฟล์ใหม่ที่ผ่านเงื่อนไขเข้ากับ state เดิม
      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
        setError(null);
      }
    }

    // ✅ รีเซ็ต input เพื่อให้สามารถเลือกไฟล์เดิมได้อีกครั้ง
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  useEffect(() => {
    //ENV file verison
    const apiKeyENV = process.env.ANTHROPIC_API_KEY! || '';
    if (apiKey === undefined || null) {
      setApiKey(apiKeyENV)
    }
  }, [apiKey])
  const handleRemoveFile = (indexToRemove: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
  };


  const uploadToS3 = async (files: File[]) => {
    const uploaded: { fileName: string; url: string }[] = [];

    for (const file of files) {
      const reader = new FileReader();

      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64 = dataUrl.split(',')[1]; // remove prefix

      const payload = {
        file_base64: base64,
      };

      const response = await fetch('https://shop.api-apsx.co/crm/queue/aifile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer 769167175e6a64fd8e898crm2b3381a591db1e8df29`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`Upload failed for ${file.name}`);
        continue;
      }

      const result = await response.json();


      if (result?.data?.quef_path) {
        uploaded.push({
          fileName: file.name,
          url: result.data.quef_path,
        });
      }
    }

    return uploaded;
  };
  
  const handleSubmit = async (params: {
    e?: React.FormEvent;
    labLink?: string;
    isInitialLabSubmit?: boolean;
  } = {}) => {
    params.e?.preventDefault();
    
    // Store current input value before clearing
    const currentInput = input;
    
    // For initial lab submit, we already set the input
    if (!params.isInitialLabSubmit && !file.length && !currentInput.trim()) return;
    
    // Clear input and files immediately
    setInput('');
    setFiles([]);
    setIsLoading(true);
    setFollowupQuestions([]);
    setIsThinking(true);

    const attachedFilesText = file.length > 0
      ? '\n\n📎 แนบไฟล์: ' + file.map(f => f.name).join(', ')
      : '';

    const displayInput = params.isInitialLabSubmit 
      ? "วิเคราะห์ผลตรวจ LAB" 
      : currentInput;

    const userMessage = {
      role: 'user' as const,
      content: displayInput + attachedFilesText,
    };
    
    setMessages((prev) => {
      const greetings = ["สวัสดี", "hello", "hi", "hey"];
      if (greetings.includes(displayInput.trim().toLowerCase())) {
        setFollowupQuestions([]);
      }
      return [...prev, userMessage, { role: 'assistant', content: '' }];
    });

    controllerRef.current = new AbortController();
    const previousMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Determine endpoint based on file or labLink presence
    let endpoint = '/api/chatStreamText';
    let response: Response;

    if (file.length > 0) {
      // Handle regular file upload
      endpoint = '/api/chatStreamFile';
      let uploadedFiles;
      try {
        uploadedFiles = await uploadToS3(file);
      } catch {
        toast.error("ไม่สามารถอัปโหลดไฟล์ได้", {
          position: "top-right",
          autoClose: 2000,
        });
        setIsThinking(false);
        setIsLoading(false);
        return;
      }
      
      response = await fetch(endpoint, {
        method: 'POST',
        signal: controllerRef.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: displayInput || '',
          files: uploadedFiles,
          history: previousMessages,
        }),
      });
    } else if (params.labLink) {
      // Handle lab link
      endpoint = '/api/chatStreamFile';
      response = await fetch(endpoint, {
        method: 'POST',
        signal: controllerRef.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: displayInput || '',
          files: [
            {
              fileName: "Lab_Result.pdf",
              url: params.labLink
            }
          ],
          history: previousMessages,
        }),
      });
    } else {
      // Handle regular text
      response = await fetch(endpoint, {
        method: 'POST',
        signal: controllerRef.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: displayInput || '',
          history: previousMessages,
        }),
      });
    }

    // Process the response stream
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
    // ✅ เคลียร์ตอนจบ
    setIsThinking(false);
    setStreamingText('');
    // ✅ พยายาม parse เป็น JSON และเรียก generateQuestions
    let outputCode = fullText;
    try {
      const parsed = JSON.parse(fullText);
      outputCode = parsed.outputCode || '';
      if (parsed.followupQuestions) setFollowupQuestions(parsed.followupQuestions);

      // อัปเดตข้อความสุดท้ายด้วย Markdown ที่สรุป
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === prev.length - 1 && msg.role === 'assistant'
            ? { ...msg, content: outputCode || msg.content }
            : msg
        )
      );
    } catch {
      // ถ้าไม่ใช่ JSON ก็ใช้ข้อความตรง ๆ
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === prev.length - 1 && msg.role === 'assistant'
            ? { ...msg, content: fullText }
            : msg
        )
      );
    }

    // ✅ สร้างคำถามแนะนำเพิ่ม
    if (outputCode.trim()) {
      setIsGeneratingQuestions(true);
      try {
        const greetings = [
          // --- ภาษาไทย ---
          "สวัสดี",
          "สวัสดีครับ",
          "สวัสดีค่ะ",
          "หวัดดี",
          "ดีจ้า",
          "ดีครับ",
          "ดีค่ะ",
          "ไง",
          "ว่าไง",
          "โย่ว",
          "ฮัลโหล",
          "ฮาย",
          "อรุณสวัสดิ์",
          "สวัสดีตอนเช้า",
          "สวัสดีตอนสาย",
          "สวัสดีตอนบ่าย",
          "สวัสดีตอนเย็น",
          "ราตรีสวัสดิ์",
          "ฝันดี",
          "นอนหลับฝันดี",
          "ยินดีที่ได้รู้จัก",
          "ยินดีที่ได้เจอ",
          "คิดถึงนะ",
          "มีอะไรให้ช่วยไหม",
          "เป็นยังไงบ้าง",
          "ไปไหนมา",
          "หายไปไหนมา",
          "นานเลยนะ",
          "มานานหรือยัง",
          "มากันครบไหม",
          "สบายดีไหม",
          "เจอกันอีกแล้ว",
          "วันนี้เป็นไงบ้าง",
          "หิวหรือยัง",
          "อยู่ไหน",
          "โอเคไหม",
          "เอาไงดี",
          "เริ่มกันเลยไหม",
          "ขอโทษนะ",
          "มาแล้ว",
          "พึ่งตื่น",
          "ว้าว",
          "สุดยอด",
          "โอ้โห",
          "เจ๋งอ่ะ",
          "ไปกันเลย",
          "พร้อมยัง",
          "พร้อมลุย",
          "เริ่มได้เลย",
          "ว่าไงเพื่อน",
          "สวัสดีเพื่อนรัก",
          "ทำอะไรได้บ้าง?",
          "ทำอะไรได้บ้าง",

          // --- ภาษาอังกฤษ ---
          "hello",
          "hi",
          "hey",
          "howdy",
          "yo",
          "hiya",
          "what's up",
          "sup",
          "good morning",
          "good afternoon",
          "good evening",
          "good night",
          "nice to meet you",
          "pleasure to meet you",
          "great to see you",
          "long time no see",
          "how have you been?",
          "how's it going?",
          "what's going on?",
          "how are you?",
          "greetings",
          "good to see you",
          "look who it is!",
          "how are things?",
          "been a while!",
          "hey there",
          "hello there",
          "how do you do?",
          "yo dude",
          "yo bro",
          "hey buddy",
          "hey mate",
          "hey man",
          "hey girl",
          "good to hear from you",
          "hey, stranger!",
          "hi there!",
          "hello again!",
          "how's life?",
          "what's new?",
          "ready to go?",
          "all good?",
          "top of the morning!",
          "welcome back!",
          "it's been too long",
          "where have you been?",
          "what's the word?",
          "hope you're well",
          "salutations",
          "cheers",
          "hi everyone!",
          "hello world!",
          "just checking in",
          "glad to meet you",
          "hi all"
        ];

        if (!greetings.includes(displayInput.trim().toLowerCase())) {
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

    setIsLoading(false);
    setStreamingText('');
  };
  
  const askFollowup = (q: string) => {
    setInput(q);
    // Trigger form submission immediately
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    }, 0);
  };
  const handleAbort = () => {
    controllerRef.current?.abort(); // หยุด stream
    setIsThinking(false);           // ปิด bubble loading
    setIsLoading(false);            // ปิดปุ่มโหลด
    setStreamingText('');           // เคลียร์ข้อความที่กำลัง stream

    toast.warn('⛔️ หยุดการตอบกลับแล้ว', {
      position: "top-right",
      autoClose: 1000,
    });
  };
  const [showExtendedMessage, setShowExtendedMessage] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isThinking && streamingText.trim() === '') {
      // ตั้งเวลา 4 วินาที
      timer = setTimeout(() => {
        setShowExtendedMessage(true);
      }, 4000);
    } else {
      // รีเซ็ตเมื่อไม่ได้ thinking หรือมี streamingText แล้ว
      setShowExtendedMessage(false);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isThinking, streamingText]);

  // ฟังก์ชันตรวจสอบว่าควรแสดงคำถามหรือไม่
  const shouldShowQuestions = () => {
    const greetings = [
      // --- ภาษาไทย ---
      "สวัสดี",
      "สวัสดีครับ",
      "สวัสดีค่ะ",
      "หวัดดี",
      "ดีจ้า",
      "ดีครับ",
      "ดีค่ะ",
      "ไง",
      "ว่าไง",
      "โย่ว",
      "ฮัลโหล",
      "ฮาย",
      "อรุณสวัสดิ์",
      "สวัสดีตอนเช้า",
      "สวัสดีตอนสาย",
      "สวัสดีตอนบ่าย",
      "สวัสดีตอนเย็น",
      "ราตรีสวัสดิ์",
      "ฝันดี",
      "นอนหลับฝันดี",
      "ยินดีที่ได้รู้จัก",
      "ยินดีที่ได้เจอ",
      "คิดถึงนะ",
      "มีอะไรให้ช่วยไหม",
      "เป็นยังไงบ้าง",
      "ไปไหนมา",
      "หายไปไหนมา",
      "นานเลยนะ",
      "มานานหรือยัง",
      "มากันครบไหม",
      "สบายดีไหม",
      "เจอกันอีกแล้ว",
      "วันนี้เป็นไงบ้าง",
      "หิวหรือยัง",
      "อยู่ไหน",
      "โอเคไหม",
      "เอาไงดี",
      "เริ่มกันเลยไหม",
      "ขอโทษนะ",
      "มาแล้ว",
      "พึ่งตื่น",
      "ว้าว",
      "สุดยอด",
      "โอ้โห",
      "เจ๋งอ่ะ",
      "ไปกันเลย",
      "พร้อมยัง",
      "พร้อมลุย",
      "เริ่มได้เลย",
      "ว่าไงเพื่อน",
      "สวัสดีเพื่อนรัก",
      "ทำอะไรได้บ้าง?",
      "ทำอะไรได้บ้าง",

      // --- ภาษาอังกฤษ ---
      "hello",
      "hi",
      "hey",
      "howdy",
      "yo",
      "hiya",
      "what's up",
      "sup",
      "good morning",
      "good afternoon",
      "good evening",
      "good night",
      "nice to meet you",
      "pleasure to meet you",
      "great to see you",
      "long time no see",
      "how have you been?",
      "how's it going?",
      "what's going on?",
      "how are you?",
      "greetings",
      "good to see you",
      "look who it is!",
      "how are things?",
      "been a while!",
      "hey there",
      "hello there",
      "how do you do?",
      "yo dude",
      "yo bro",
      "hey buddy",
      "hey mate",
      "hey man",
      "hey girl",
      "good to hear from you",
      "hey, stranger!",
      "hi there!",
      "hello again!",
      "how's life?",
      "what's new?",
      "ready to go?",
      "all good?",
      "top of the morning!",
      "welcome back!",
      "it's been too long",
      "where have you been?",
      "what's the word?",
      "hope you're well",
      "salutations",
      "cheers",
      "hi everyone!",
      "hello world!",
      "just checking in",
      "glad to meet you",
      "hi all"
    ];

    return !greetings.includes(input.trim().toLowerCase()) &&
      followupQuestions.length > 0 &&
      isAtBottom; // เพิ่มเงื่อนไขนี้
  };
  return (
    // className="relative min-h-screen bg-gray-50 flex flex-col items-center px-4 pb-36 sm:pb-28 dark:bg-gray-900 justify-center"
    <div
      className={clsx(
        `w-full mx-auto mt-15 chat-font ${!(isThinking || messages.length > 0) ? '' : 'fixed bottom-4'}`,
        {
          'relative min-h-96 bg-gray-50 flex flex-col items-center px-4 pb-50 sm:pb-50 dark:bg-gray-900 ': isThinking || messages.length > 0,
          'relative min-h-96 bg-gray-50 flex flex-col items-center px-4 pb-50 sm:pb-50 dark:bg-gray-900 justify-center': !(isThinking || messages.length > 0),
        }
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!(isThinking || messages.length > 0) && (
        <div className=".fixed mt-20 .flex justify-center items-center pointer-events-none text-center text-[#10203C]">
          <p className="text-xl font-semibold max-w-[600px] mb-0 leading-snug">
            EXA สวัสดีค่ะ ฉันคือ Health Assistant
          </p>
          <p className="text-base font-normal max-w-[600px] leading-relaxed mt-2">
            ผู้ช่วย AI ด้านสุขภาพของคุณ คุณสามารถสอบถามปัญหาสุขภาพ
            หรือส่งผลตรวจเลือดเพื่อรับการวิเคราะห์และคำแนะนำเฉพาะบุคคลได้เลยค่ะ
          </p>
        </div>
      )}
      <div
        className="sm:hidden fixed top-20 flex items-center z-[99] gap-2 px-4 py-2 mb-10 rounded-xl shadow-deep text-md font-bold  bg-white text-gray-800 dark:bg-gray-800 dark:text-white"
        style={{
          boxShadow: 'rgba(112, 139, 152, 0.2) 0px 5px 45px',
        }}
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
      max-w-[100%] py-2 rounded-xl
      ${msg.role === 'user'
                ? 'self-end bg-white dark:bg-purple-900 text-right text-black dark:text-white shadow px-3'
                : ''
              }
    `}
          >
            <div className="prose prose-sm break-words max-w-full">
              {msg.role === 'assistant' ? (
                <div className="flex items-start gap-3">

                  <div className="break-words text-lg">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="text">
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
              <Image
                src={"/images/gif/ai_thinking.gif"}
                alt="User profile"
                width={30}
                height={30}
                className="object-cover"
              />
              <p>
                {showExtendedMessage
                  ? "อาจใช้เวลาวิเคราะห์ไฟล์นานกว่าปกติ กรุณารอสักครู่..."
                  : "กำลังวิเคราะห์..."
                }
              </p>
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
        shouldShowQuestions() && (
          <div className="mt-6 flex flex-col gap-2 items-start px-4 sm:px-0 mb-2 fixed bottom-24 z-10 w-full sm:w-[640px] md:w-[768px] lg:w-[1024px] 2xl:w-[1280px] .left-1/2 .transform .-translate-x-1/2">
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
          `w-full mx-auto mt-3 px-2 ${!(isThinking || messages.length > 0) ? 'z-10' : 'fixed bottom-4 z-10'}`,
          {
            'sm:w-[640px] md:w-[768px] lg:w-[1024px] 2xl:w-[1280px]': isThinking || messages.length > 0,
            'max-w-[520px] ': !(isThinking || messages.length > 0),
          }
        )}
      >
        <div className="p-[1px] rounded-xl bg-gradient-to-r from-[#4385EF] to-[#FF68F5]">
          <div className="bg-white dark:bg-gray-800 rounded-xl flex items-start px-3 py-2 gap-3 shadow-lg">

            {/* ไอคอนแนบไฟล์ */}
            <div className="relative group">
              {/* Tooltip */}
              <div className="absolute bottom-8 left-5/3 -translate-x-1/2 bg-white text-[#10203C] text-sm px-3 py-1 rounded-lg shadow-md
                  opacity-0 group-hover:opacity-100 transition z-10
                  whitespace-nowrap min-w-max
                  before:content-['']">
                <svg className="absolute text-white h-2 left-0 ml-3 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0" /></svg>
                เพิ่มไฟล์ที่นี่
              </div>

              {/* File Label */}
              <label
                title="เพิ่มไฟล์ที่นี่"
                className={`cursor-pointer transition text-gray-600 dark:text-gray-300 hover:text-purple-600 ${input.trim().length > 0 ? 'self-end mb-3' : 'self-center'}`}
              >
                <svg className="text-[#4385EF] mt-2" width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.11084 13.8753L12.4528 4.5333C12.9371 4.0388 13.5145 3.64523 14.1518 3.37535C14.7891 3.10547 15.4736 2.96464 16.1657 2.96101C16.8578 2.95738 17.5437 3.09101 18.1838 3.35419C18.824 3.61736 19.4055 4.00485 19.8949 4.49423C20.3843 4.98362 20.7718 5.56519 21.035 6.20529C21.2981 6.8454 21.4318 7.53133 21.4281 8.22342C21.4245 8.9155 21.2837 9.6 21.0138 10.2373C20.7439 10.8746 20.3503 11.4521 19.8558 11.9363L11.1298 20.6603C10.5893 21.1833 9.86479 21.473 9.11262 21.4668C8.36045 21.4606 7.64085 21.1591 7.10896 20.6272C6.57708 20.0953 6.27553 19.3757 6.26934 18.6235C6.26314 17.8713 6.55279 17.1469 7.07584 16.6063L15.4478 8.2333" stroke="#4385EF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                {/* <FiFilePlus size={20} className="text-[#4385EF]" /> */}
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


            {/* กล่องข้อความ */}
            <div className="flex flex-col flex-grow min-w-0">
              <TextareaAutosize
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() || file.length > 0) handleSubmit({ e });
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
                className="bg-transparent border-none outline-none text-sm px-2 py-3 resize-none
                     text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/60
                     overflow-auto max-h-[250px]"
                style={{ fontSize: '16px' }}
                rows={1}
              />

              {/* แสดงชื่อไฟล์ที่แนบ */}
              {file.length > 0 && file.map((f, idx) => (
                <div key={idx} className="mt-2 flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-100 px-3 py-1 rounded-full w-fit">
                  <FiPaperclip />
                  <span className="truncate max-w-[160px]">{f.name}</span>
                  <button
                    type="button"
                    className="hover:text-red-500"
                    onClick={() => handleRemoveFile(idx)} // ✅ ส่ง index
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>

            {/* ปุ่มส่งหรือหยุด */}
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
                    className={`rounded-full p-3.5 px-3.5 text-white transition
                          ${isThinking || isLoading || (!input.trim() && file.length === 0)
                        ? 'bg-[#F639BD] opacity-60 cursor-not-allowed'
                        : 'bg-[#F639BD] '}`}
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