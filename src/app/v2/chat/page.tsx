'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowUp } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Message } from '@/types';

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, conversations, addMessage, isLoading, homeDataCache } = useApp();

  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [initialContextSent, setInitialContextSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get context from URL params
  const contextParam = searchParams.get('context');

  // Mock profile for demo
  const displayProfile = profile?.onboardingCompleted ? profile : {
    id: 'demo',
    name: 'Demo User',
    coachingStyle: 'balanced' as const,
    healthAreas: [],
    createdAt: new Date().toISOString(),
    healthScore: 72,
    reputationLevel: 'trusted' as const,
    points: 450,
    priorities: [],
    pastAttempt: null,
    barriers: [],
    dataSources: [],
    checkInStreak: 5,
    lastCheckIn: null,
  };

  // Load existing messages
  useEffect(() => {
    const allMessages = conversations.conversations.flatMap(c => c.messages);
    setLocalMessages(allMessages);
  }, [conversations]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  // Handle context from URL - auto-send as first message
  useEffect(() => {
    if (contextParam && !initialContextSent && !isLoading && !isSending) {
      setInitialContextSent(true);
      // Small delay to ensure component is ready
      setTimeout(() => {
        sendMessageWithContent(contextParam);
      }, 100);
    }
  }, [contextParam, initialContextSent, isLoading, isSending]);

  const sendMessageWithContent = async (content: string) => {
    if (!content.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      // Add user message to local state immediately for instant feedback
      const tempUserMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      setLocalMessages(prev => [...prev, tempUserMessage]);

      // Also persist to storage
      const userMessage = await addMessage('user', content);

      const recentMessages = [...localMessages, tempUserMessage].slice(-20).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentMessages,
          userProfile: {
            id: displayProfile.id,
            name: displayProfile.name,
            coachingStyle: displayProfile.coachingStyle,
            healthAreas: displayProfile.healthAreas,
            createdAt: displayProfile.createdAt,
            healthScore: displayProfile.healthScore,
            reputationLevel: displayProfile.reputationLevel,
            points: displayProfile.points,
            priorities: displayProfile.priorities,
            pastAttempt: displayProfile.pastAttempt,
            barriers: displayProfile.barriers,
            dataSources: displayProfile.dataSources,
            checkInStreak: displayProfile.checkInStreak,
            lastCheckIn: displayProfile.lastCheckIn,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = await addMessage('assistant', data.message);
      setLocalMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Add error message to chat
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Sorry, I couldn't respond right now. Try again?",
        timestamp: new Date().toISOString(),
      };
      setLocalMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    const content = inputValue.trim();
    setInputValue('');
    await sendMessageWithContent(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#B5AFA8]">Loading...</p>
      </div>
    );
  }

  // Render inline data card for specific metrics mentioned
  const renderInlineDataCard = (metric: string) => {
    const metrics = homeDataCache?.metrics;
    if (!metrics) return null;

    if (metric === 'sleep' && metrics.sleep) {
      return (
        <div className="bg-[#F5EDE4] rounded-xl p-3 my-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#2D2A26]">Sleep</span>
            <span className="text-sm text-[#8A8580]">{metrics.sleep.lastNightHours}h last night</span>
          </div>
          <div className="mt-2 h-8 flex items-end gap-0.5">
            {[6.5, 7.2, 5.8, 7.4, 6.9, 7.8, metrics.sleep.lastNightHours].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-[#E07A5F] rounded-t opacity-60"
                style={{ height: `${(h / 9) * 100}%`, opacity: i === 6 ? 1 : 0.4 }}
              />
            ))}
          </div>
        </div>
      );
    }

    if (metric === 'hrv' && metrics.hrv) {
      return (
        <div className="bg-[#F5EDE4] rounded-xl p-3 my-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#2D2A26]">HRV</span>
            <span className="text-sm text-[#8A8580]">
              {metrics.hrv.current} ms (baseline {metrics.hrv.baseline})
            </span>
          </div>
        </div>
      );
    }

    if (metric === 'rhr' && metrics.rhr) {
      return (
        <div className="bg-[#F5EDE4] rounded-xl p-3 my-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#2D2A26]">Resting Heart Rate</span>
            <span className="text-sm text-[#8A8580]">
              {metrics.rhr.current} bpm (baseline {metrics.rhr.baseline})
            </span>
          </div>
        </div>
      );
    }

    if (metric === 'recovery' && metrics.recovery) {
      return (
        <div className="bg-[#F5EDE4] rounded-xl p-3 my-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#2D2A26]">{metrics.recovery.label}</span>
            <span className="text-sm text-[#8A8580]">{metrics.recovery.score}</span>
          </div>
          <div className="mt-2 w-full h-2 bg-[#EBE3DA] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E07A5F] rounded-full"
              style={{ width: `${metrics.recovery.score}%` }}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  // Check if message mentions specific metrics
  const detectMetricMention = (content: string): string | null => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('sleep')) return 'sleep';
    if (lowerContent.includes('hrv') || lowerContent.includes('heart rate variability')) return 'hrv';
    if (lowerContent.includes('rhr') || lowerContent.includes('resting heart rate')) return 'rhr';
    if (lowerContent.includes('recovery') || lowerContent.includes('body battery') || lowerContent.includes('readiness')) return 'recovery';
    return null;
  };

  return (
    <div className="flex flex-col h-full">
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
        {localMessages.length === 0 && !isSending ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-[#8A8580]">Ask me anything about your health...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {localMessages.map((message) => {
              const metricMention = message.role === 'assistant' ? detectMetricMention(message.content) : null;

              return (
                <div key={message.id}>
                  {message.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] bg-[#FFE8DC] rounded-2xl rounded-br-sm px-4 py-2.5">
                        <p className="text-[#2D2A26]">{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[90%]">
                      <p className="text-[#2D2A26] leading-relaxed">{message.content}</p>
                      {metricMention && renderInlineDataCard(metricMention)}
                    </div>
                  )}
                </div>
              );
            })}

            {isSending && (
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

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#EBE3DA]">
        <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 shadow-sm">
          <input
            ref={inputRef}
            type="text"
            placeholder="Message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="flex-1 bg-transparent text-[#2D2A26] placeholder-[#B5AFA8] focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isSending}
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
