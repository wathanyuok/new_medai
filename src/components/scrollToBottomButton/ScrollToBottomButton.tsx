import { useEffect, useRef, useState } from 'react'
import { FiArrowDown } from 'react-icons/fi'

export default function ScrollToBottomButton({ messages }: { messages: { id: string; text: string }[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const innerHeight = window.innerHeight
      const scrollHeight = document.documentElement.scrollHeight

      // ถ้าไม่อยู่ล่างสุด (มีระยะห่างมากกว่า 100px)
      setShowButton(scrollY + innerHeight < scrollHeight - 100)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // check ครั้งแรก

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  // useEffect(() => {
  //   // ถ้าเพิ่งมี messages ใหม่ ให้ scroll ไปล่างสุด
  //   bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  // }, [messages])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }


  return (
    <>
      {/* ปุ่ม Scroll to Bottom */}
      {showButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-21 z-50 bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-700 transition"
          title="เลื่อนลงล่างสุด"
        >
          <FiArrowDown size={20} />
        </button>
      )}

      {/* จุดเลื่อนลงถึง */}
      <div ref={bottomRef} />
    </>
  )
}
