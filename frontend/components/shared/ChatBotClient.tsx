'use client';

import dynamic from 'next/dynamic';

// Dynamically import ChatBot with no SSR to prevent hydration issues
const ChatBot = dynamic(() => import('@/components/shared/ChatBot'), {
  ssr: false,
});

export default function ChatBotClient() {
  return <ChatBot />;
}
