'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowUp } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, isLoading } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialSent = useRef(false);

  // Get context from URL
  const contextParam = searchParams.get('context');

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle initial context from URL
  useEffect(() => {
    if (contextParam && !initialSent.current && !isLoading) {
      initialSent.current = true;
      handleSend(contextParam);
    }
  }, [contextParam, isLoading]);

  const handleSend = async (text?: string) => {
    const content = text || input.trim();
    if (!content || sending) return;

    // Clear input immediately
    if (!text) setInput('');

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          userProfile: {
            id: profile?.id || 'demo',
            name: profile?.name || 'User',
            coachingStyle: profile?.coachingStyle || 'balanced',
            healthAreas: profile?.healthAreas || [],
            createdAt: profile?.createdAt || new Date().toISOString(),
            healthScore: profile?.healthScore || 70,
            reputationLevel: profile?.reputationLevel || 'starter',
            points: profile?.points || 0,
            priorities: profile?.priorities || [],
            pastAttempt: profile?.pastAttempt || null,
            barriers: profile?.barriers || [],
            dataSources: profile?.dataSources || [],
            checkInStreak: profile?.checkInStreak || 0,
            lastCheckIn: profile?.lastCheckIn || null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'Sorry, I could not respond.',
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#B5AFA8]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[#EBE3DA]">
        <button
          onClick={() => router.push('/v2')}
          className="p-2 rounded-full hover:bg-[#F5EDE4] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#2D2A26]" />
        </button>
        <span className="font-medium text-[#2D2A26]">Chat</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !sending ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-[#8A8580]">Ask me anything about your health...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-[#FFE8DC] rounded-2xl rounded-br-sm px-4 py-2.5">
                      <p className="text-[#2D2A26]">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[90%]">
                    <p className="text-[#2D2A26] leading-relaxed">{msg.content}</p>
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-[#B5AFA8] rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-[#B5AFA8] rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                <div className="w-2 h-2 bg-[#B5AFA8] rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#EBE3DA]">
        <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 shadow-sm">
          <input
            type="text"
            placeholder="Message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1 bg-transparent text-[#2D2A26] placeholder-[#B5AFA8] focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || sending}
            className="w-9 h-9 rounded-full bg-[#E07A5F] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-[#D36B4F]"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function V2ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#B5AFA8]">Loading...</p>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
