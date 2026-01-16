'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useApp } from '@/contexts/AppContext';
import { Message } from '@/types';

export default function ChatPage() {
  const router = useRouter();
  const { profile, conversations, addMessage, isLoading } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && !profile?.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [isLoading, profile, router]);

  useEffect(() => {
    const allMessages = conversations.conversations.flatMap(c => c.messages);
    setLocalMessages(allMessages);
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isSending || !profile) return;

    const userMessageContent = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    const userMessage = addMessage('user', userMessageContent);
    setLocalMessages(prev => [...prev, userMessage]);

    try {
      const recentMessages = [...localMessages, userMessage].slice(-20).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentMessages,
          userProfile: {
            name: profile.name,
            coachingStyle: profile.coachingStyle,
            healthAreas: profile.healthAreas,
            createdAt: profile.createdAt,
            // Enhanced context fields
            healthScore: profile.healthScore,
            reputationLevel: profile.reputationLevel,
            points: profile.points,
            priorities: profile.priorities,
            pastAttempt: profile.pastAttempt,
            barriers: profile.barriers,
            dataSources: profile.dataSources,
            checkInStreak: profile.checkInStreak,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const assistantMessage = addMessage('assistant', data.message);
      setLocalMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = addMessage('assistant', "Sorry, I couldn't respond right now. Try again?");
      setLocalMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading || !profile?.onboardingCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6F1]">
        <p className="text-[#B5AFA8]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1] pb-20">
      {/* Simple header */}
      <header className="px-6 pt-8 pb-4">
        <span className="text-[#E07A5F] text-xl font-semibold">yeww</span>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-6">
        {localMessages.length === 0 ? (
          <div className="h-full flex items-center">
            <div>
              <p className="text-2xl text-[#2D2A26] leading-relaxed mb-6">
                Hey {profile.name}. What&apos;s on your mind?
              </p>
              <div className="flex flex-wrap gap-2">
                {['How am I doing?', 'I need advice', 'Just checking in'].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInputValue(prompt)}
                    className="px-4 py-2 rounded-full bg-[#F5EDE4] text-[#2D2A26] text-sm hover:bg-[#EBE3DA] transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-6">
            {localMessages.map((message) => (
              <div key={message.id}>
                {message.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-[#FFE8DC] rounded-3xl rounded-br-lg px-5 py-3">
                      <p className="text-[#2D2A26]">{message.content}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[#2D2A26] text-lg leading-relaxed">{message.content}</p>
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-[#B5AFA8] rounded-full animate-pulse-slow" />
                <div className="w-2 h-2 bg-[#B5AFA8] rounded-full animate-pulse-slow" style={{ animationDelay: '200ms' }} />
                <div className="w-2 h-2 bg-[#B5AFA8] rounded-full animate-pulse-slow" style={{ animationDelay: '400ms' }} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input */}
      <div className="sticky bottom-20 px-6 py-4 bg-[#FAF6F1]">
        <div className="flex items-end gap-3 bg-[#F5EDE4] rounded-3xl px-4 py-3">
          <textarea
            ref={inputRef}
            placeholder="Message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            rows={1}
            className="flex-1 bg-transparent text-[#2D2A26] placeholder-[#B5AFA8] focus:outline-none resize-none text-base leading-6 max-h-[120px]"
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isSending}
            className="w-9 h-9 rounded-full bg-[#E07A5F] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:bg-[#D36B4F] active:scale-95 flex-shrink-0"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
