import React from 'react';
import { Metadata } from 'next';
import { ChatView } from '@/components/dashboard/chat/ChatView';

export const metadata: Metadata = {
  title: 'Team Chat Messages - Krishna Tent & Events ERP',
  description: 'Real-time team messaging, voice notes, and event channel communications.',
};

export default function ChatPage() {
  return <ChatView />;
}
