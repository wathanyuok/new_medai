import AiChatPage from '@/components/pages/AiChatPage';
import { Metadata } from 'next';
import React from 'react';
export const metadata: Metadata = {
  title: "EXA AI Health Assistant | EXA Med+",
  description: "This is Next.js SignUp Page TailAdmin Dashboard Template",
  // other metadata
};
const AiChat = () => {
  return (
    <AiChatPage />
  );
}

export default AiChat;
