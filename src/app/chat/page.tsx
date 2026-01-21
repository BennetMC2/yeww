'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp, Camera, ImagePlus, X } from 'lucide-react';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import ProactiveInsightCard from '@/components/ProactiveInsightCard';
import { useApp } from '@/contexts/AppContext';
import { Message, MessageImage, ProactiveInsight } from '@/types';
import { compressImage } from '@/lib/imageUtils';

export default function ChatPage() {
  const router = useRouter();
  const { profile, conversations, addMessage, isLoading, proactiveInsights, fetchProactiveInsights, dismissInsight } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [pendingImages, setPendingImages] = useState<MessageImage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !profile?.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [isLoading, profile, router]);

  // Fetch proactive insights on mount
  useEffect(() => {
    if (profile?.onboardingCompleted) {
      fetchProactiveInsights();
    }
  }, [profile?.onboardingCompleted, fetchProactiveInsights]);

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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit to 4 images per message
      if (pendingImages.length >= 4) {
        alert('Maximum 4 images per message');
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image (JPEG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image must be less than 10MB');
        return;
      }

      try {
        // Compress image to reduce storage size
        const compressed = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
        });

        setPendingImages(prev => [...prev, {
          id: crypto.randomUUID(),
          data: compressed.data,
          mediaType: compressed.mediaType as MessageImage['mediaType']
        }]);
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Failed to process image. Please try again.');
      }
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const removePendingImage = (id: string) => {
    setPendingImages(prev => prev.filter(img => img.id !== id));
  };

  const sendMessage = async () => {
    if ((!inputValue.trim() && pendingImages.length === 0) || isSending || !profile) return;

    const userMessageContent = inputValue.trim();
    const userMessageImages = pendingImages.length > 0 ? pendingImages : undefined;

    setInputValue('');
    setPendingImages([]);
    setIsSending(true);

    try {
      // Save user message and add to local state
      const userMessage = await addMessage('user', userMessageContent, { images: userMessageImages });
      setLocalMessages(prev => [...prev, userMessage]);

      // Prepare messages for API (include images)
      const recentMessages = [...localMessages, userMessage].slice(-20).map(m => ({
        role: m.role,
        content: m.content,
        images: m.images?.map(img => ({
          data: img.data,
          mediaType: img.mediaType
        }))
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentMessages,
          userProfile: {
            id: profile.id,
            name: profile.name,
            coachingStyle: profile.coachingStyle,
            healthAreas: profile.healthAreas,
            createdAt: profile.createdAt,
            healthScore: profile.healthScore,
            reputationLevel: profile.reputationLevel,
            points: profile.points,
            priorities: profile.priorities,
            pastAttempt: profile.pastAttempt,
            barriers: profile.barriers,
            dataSources: profile.dataSources,
            checkInStreak: profile.checkInStreak,
            lastCheckIn: profile.lastCheckIn,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const assistantMessage = await addMessage('assistant', data.message);
      setLocalMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = await addMessage('assistant', "Sorry, I couldn't respond right now. Try again?");
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

  // Handle discussing a proactive insight
  const handleDiscussInsight = (insight: ProactiveInsight) => {
    // Generate a contextual prompt based on the insight type
    let discussPrompt = '';
    if (insight.type === 'concern') {
      discussPrompt = `Tell me more about what might be affecting my metrics. ${insight.message}`;
    } else if (insight.type === 'milestone') {
      discussPrompt = `What should I do to keep this momentum going? You mentioned: ${insight.message}`;
    } else {
      discussPrompt = `Can you tell me more about this? ${insight.message}`;
    }

    setInputValue(discussPrompt);
    dismissInsight(insight.id);
    inputRef.current?.focus();
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
        {/* Proactive Insights */}
        {proactiveInsights.length > 0 && (
          <div className="pt-4">
            {proactiveInsights.map((insight) => (
              <ProactiveInsightCard
                key={insight.id}
                insight={insight}
                onDismiss={dismissInsight}
                onDiscuss={handleDiscussInsight}
              />
            ))}
          </div>
        )}

        {localMessages.length === 0 ? (
          <div className={`${proactiveInsights.length > 0 ? 'pt-4' : 'h-full'} flex items-center`}>
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
                      {/* User images */}
                      {message.images && message.images.length > 0 && (
                        <div className="mb-2">
                          {message.images.map((img) => (
                            <div key={img.id} className="relative rounded-2xl overflow-hidden">
                              <Image
                                src={img.data}
                                alt="Uploaded image"
                                width={200}
                                height={200}
                                className="max-w-full h-auto rounded-2xl"
                                style={{ maxHeight: '200px', objectFit: 'cover' }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {message.content && (
                        <p className="text-[#2D2A26]">{message.content}</p>
                      )}
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
        {/* Image previews */}
        {pendingImages.length > 0 && (
          <div className="mb-3 flex gap-2 flex-wrap">
            {pendingImages.map((img) => (
              <div key={img.id} className="relative">
                <div className="relative rounded-2xl overflow-hidden border-2 border-[#E07A5F]">
                  <Image
                    src={img.data}
                    alt="Preview"
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover"
                  />
                  <button
                    onClick={() => removePendingImage(img.id)}
                    className="absolute top-1 right-1 w-5 h-5 bg-[#2D2A26] bg-opacity-70 rounded-full flex items-center justify-center text-white hover:bg-opacity-90 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 bg-[#F5EDE4] rounded-3xl px-4 py-3">
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Camera button */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={isSending}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#B5AFA8] hover:text-[#2D2A26] hover:bg-[#EBE3DA] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            title="Take photo"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#B5AFA8] hover:text-[#2D2A26] hover:bg-[#EBE3DA] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            title="Upload image"
          >
            <ImagePlus className="w-5 h-5" />
          </button>

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
            disabled={(!inputValue.trim() && pendingImages.length === 0) || isSending}
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
