'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowUp } from 'lucide-react';
import { HealthMetrics, UserProfile } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Local profile for chat - subset of UserProfile stored in localStorage
interface LocalProfile {
  id: string;
  name: string;
  coachingStyle: string;
  healthAreas: { id: string; name: string; active: boolean; addedAt: string }[];
  createdAt: string;
  healthScore: number;
  reputationLevel: string;
  points: number;
  priorities: string[];
  pastAttempt: string | null;
  barriers: string[];
  dataSources: string[];
  checkInStreak: number;
  lastCheckIn: string | null;
}

// Mock metrics for when real data isn't available
const MOCK_METRICS: HealthMetrics = {
  provider: 'GARMIN',
  sleep: {
    lastNightHours: 7.8,
    quality: 'excellent',
    avgWeekHours: 6.9,
  },
  recovery: {
    score: 82,
    status: 'high',
    label: 'Body Battery',
  },
  hrv: {
    current: 58,
    baseline: 52,
    trend: 'up',
  },
  rhr: {
    current: 54,
    baseline: 56,
    trend: 'down',
  },
  steps: {
    today: 8420,
    avgDaily: 7200,
  },
  stress: {
    level: 28,
    category: 'low',
  },
};

// Read profile directly from localStorage - matches storage.ts keys
function getStoredProfile(): LocalProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    // Try fallback profile first (always persisted)
    const fallback = localStorage.getItem('yeww_profile_fallback');
    if (fallback) return JSON.parse(fallback) as LocalProfile;

    // Try new profile key
    const newProfile = localStorage.getItem('longevity_user_profile');
    if (newProfile) return JSON.parse(newProfile) as LocalProfile;
  } catch (e) {
    console.error('Failed to read profile from localStorage:', e);
  }
  return null;
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialSent = useRef(false);

  const contextParam = searchParams.get('context');

  // Load profile from localStorage on mount
  useEffect(() => {
    const stored = getStoredProfile();
    if (stored) setProfile(stored);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (contextParam && !initialSent.current) {
      initialSent.current = true;
      handleSend(contextParam);
    }
  }, [contextParam]);

  const handleSend = async (text?: string) => {
    const content = text || input.trim();
    if (!content || sending) return;

    if (!text) setInput('');
    setError(null);

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
            id: profile?.id || 'user',
            name: profile?.name || 'User',
            coachingStyle: profile?.coachingStyle || 'balanced',
            healthAreas: profile?.healthAreas?.length
              ? profile.healthAreas
              : [
                  { id: 'sleep', name: 'Sleep', active: true, addedAt: new Date().toISOString() },
                  { id: 'fitness', name: 'Fitness', active: true, addedAt: new Date().toISOString() },
                ],
            createdAt: profile?.createdAt || new Date().toISOString(),
            healthScore: profile?.healthScore || 72,
            reputationLevel: profile?.reputationLevel || 'trusted',
            points: profile?.points || 450,
            priorities: profile?.priorities?.length
              ? profile.priorities
              : ['energy', 'sleep', 'fitness'],
            pastAttempt: profile?.pastAttempt || 'tracking-apps',
            barriers: profile?.barriers?.length
              ? profile.barriers
              : ['consistency', 'time'],
            dataSources: profile?.dataSources?.length
              ? profile.dataSources
              : ['wearable'],
            checkInStreak: profile?.checkInStreak || 5,
            lastCheckIn: profile?.lastCheckIn || null,
          },
          // Include health metrics so the AI knows about the user's current health data
          healthMetrics: MOCK_METRICS,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API ${response.status}: ${errText}`);
      }

      const data = await response.json();

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'No response',
      }]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center gap-3"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
          borderBottom: '1px solid rgba(235, 227, 218, 0.6)',
          boxShadow: '0 2px 8px rgba(45, 42, 38, 0.04)',
        }}
      >
        <button
          onClick={() => router.push('/v2')}
          className="w-9 h-9 rounded-[12px] flex items-center justify-center transition-all hover:bg-[#F5EDE4] active:scale-[0.95]"
        >
          <ArrowLeft className="w-5 h-5 text-[#2D2A26]" />
        </button>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[12px] font-bold text-[#E07A5F]"
            style={{ background: 'linear-gradient(135deg, #FFE8DC 0%, #FFD4C4 100%)' }}
          >
            y
          </div>
          <span className="font-semibold text-[#2D2A26]">yeww</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          className="mx-4 mt-3 px-4 py-3 rounded-[14px] text-[13px] text-red-700"
          style={{
            background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
          }}
        >
          Error: {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {messages.length === 0 && !sending ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div
              className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, #FFE8DC 0%, #FFD4C4 100%)',
                boxShadow: '0 4px 12px rgba(224, 122, 95, 0.2)',
              }}
            >
              <span className="text-[24px] font-bold text-[#E07A5F]">y</span>
            </div>
            <p className="text-[15px] text-[#8A8580]">Ask me anything about your health...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="animate-fade-in">
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div
                      className="max-w-[85%] rounded-[18px] rounded-br-[6px] px-4 py-3"
                      style={{
                        background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)',
                        boxShadow: '0 2px 8px rgba(224, 122, 95, 0.2)',
                      }}
                    >
                      <p className="text-[15px] text-white leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div
                      className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-[#E07A5F]"
                      style={{ background: 'linear-gradient(135deg, #FFE8DC 0%, #FFD4C4 100%)' }}
                    >
                      y
                    </div>
                    <div
                      className="max-w-[85%] rounded-[18px] rounded-tl-[6px] px-4 py-3"
                      style={{
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
                        boxShadow: '0 2px 12px rgba(45, 42, 38, 0.06)',
                      }}
                    >
                      <p className="text-[15px] text-[#2D2A26] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-[#E07A5F]"
                  style={{ background: 'linear-gradient(135deg, #FFE8DC 0%, #FFD4C4 100%)' }}
                >
                  y
                </div>
                <div className="flex gap-1.5 px-4 py-3">
                  <div className="w-2 h-2 bg-[#E07A5F] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-[#E07A5F] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-[#E07A5F] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="px-4 py-3"
        style={{
          background: 'linear-gradient(135deg, #FAF6F1 0%, #F5EDE4 100%)',
          borderTop: '1px solid rgba(235, 227, 218, 0.6)',
        }}
      >
        <div
          className="flex items-center gap-3 rounded-[18px] px-4 py-3"
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
            boxShadow: '0 2px 12px rgba(45, 42, 38, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          }}
        >
          <input
            type="text"
            placeholder="Message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={sending}
            className="flex-1 bg-transparent text-[15px] text-[#2D2A26] placeholder-[#B5AFA8] focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-[14px] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:scale-[0.95]"
            style={{
              background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)',
              boxShadow: input.trim() && !sending ? '0 4px 12px rgba(224, 122, 95, 0.3)' : 'none',
            }}
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
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}
