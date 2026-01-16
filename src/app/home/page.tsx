'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flame, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import HealthScoreGauge from '@/components/scores/HealthScoreGauge';
import ReputationBadge from '@/components/scores/ReputationBadge';
import PointsDisplay from '@/components/scores/PointsDisplay';
import { useApp } from '@/contexts/AppContext';
import { PRIORITIES } from '@/types';

type CheckInResponse = 'great' | 'okay' | 'rough' | null;

export default function HomePage() {
  const router = useRouter();
  const { profile, isLoading, recordCheckIn, addMessage, recalculateScores } = useApp();
  const [selectedResponse, setSelectedResponse] = useState<CheckInResponse>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!isLoading && !profile?.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [isLoading, profile, router]);

  // Recalculate scores on mount
  useEffect(() => {
    if (profile?.onboardingCompleted) {
      recalculateScores();
    }
  }, [profile?.onboardingCompleted, recalculateScores]);

  const getGreeting = () => {
    const name = profile?.name || 'there';
    const lastCheckIn = profile?.lastCheckIn ? new Date(profile.lastCheckIn) : null;
    const now = new Date();

    // Check if already checked in today
    const checkedInToday = lastCheckIn &&
      lastCheckIn.toDateString() === now.toDateString();

    if (checkedInToday) {
      return `Hey ${name}, good to see you back.`;
    }

    // Check if it's been a while
    if (lastCheckIn) {
      const daysDiff = Math.floor((now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 3) {
        return `Hey ${name}, been a few days. How's everything going?`;
      }
    }

    return `GM, ${name}. How are you feeling?`;
  };

  const getFeedbackMessage = (response: CheckInResponse) => {
    switch (response) {
      case 'great':
        return "That's great to hear! Keep it up.";
      case 'okay':
        return "Thanks for sharing. I'm here if you want to talk more.";
      case 'rough':
        return "I'm sorry to hear that. I'm here for you if you want to chat.";
      default:
        return '';
    }
  };

  const handleCheckIn = (response: CheckInResponse) => {
    setSelectedResponse(response);
    recordCheckIn();

    // Add messages to conversation
    const responseText = response === 'great' ? "I'm feeling great!" :
      response === 'okay' ? "I'm feeling okay." :
        "I'm having a rough day.";
    addMessage('user', responseText);
    addMessage('assistant', getFeedbackMessage(response));

    setShowFeedback(true);
  };

  // Get smart nudge based on profile
  const getSmartNudge = () => {
    if (!profile) return null;

    // If streak is 0 or 1, encourage consistency
    if (profile.checkInStreak <= 1) {
      return "Check in daily to build your streak and improve your Health Score.";
    }

    // If no data sources connected
    if (profile.dataSources.length === 0) {
      return "Connect a health app to get more accurate insights.";
    }

    // Reference priorities
    if (profile.priorities.length > 0) {
      const priority = PRIORITIES.find(p => p.id === profile.priorities[0]);
      if (priority) {
        return `Working on "${priority.name.toLowerCase()}" — let's talk about your progress.`;
      }
    }

    return null;
  };

  if (isLoading || !profile?.onboardingCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6F1]">
        <p className="text-[#B5AFA8]">Loading...</p>
      </div>
    );
  }

  const smartNudge = getSmartNudge();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1] pb-20">
      <Header />

      <main className="flex-1 flex flex-col px-6 pt-4">
        {/* Health Score Section */}
        <div className="flex flex-col items-center mb-6">
          <HealthScoreGauge
            score={profile.healthScore}
            size="lg"
            animated={false}
            onClick={() => router.push('/health')}
          />
          <p className="text-xs text-[#8A8580] mt-2">Tap to see breakdown</p>
        </div>

        {/* Quick Stats Row */}
        <div className="flex justify-center gap-6 mb-8">
          {/* Points */}
          <div className="flex flex-col items-center">
            <PointsDisplay points={profile.points} size="md" />
            <p className="text-xs text-[#8A8580] mt-1">Points</p>
          </div>

          {/* Streak */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <Flame className="w-5 h-5 text-[#E07A5F]" />
              <span className="text-lg font-semibold text-[#2D2A26]">{profile.checkInStreak}</span>
            </div>
            <p className="text-xs text-[#8A8580] mt-1">Streak</p>
          </div>

          {/* Reputation */}
          <div className="flex flex-col items-center">
            <ReputationBadge level={profile.reputationLevel} size="md" showLabel={false} />
            <p className="text-xs text-[#8A8580] mt-1">{profile.reputationLevel}</p>
          </div>
        </div>

        {/* Daily Check-in Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          {!showFeedback ? (
            <>
              {/* AI Greeting */}
              <p className="text-lg text-[#2D2A26] leading-relaxed mb-4">{getGreeting()}</p>

              {/* Quick Responses */}
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => handleCheckIn('great')}
                  className="px-5 py-2.5 rounded-full bg-[#F5EDE4] text-[#2D2A26] font-medium hover:bg-[#EBE3DA] transition-colors"
                >
                  Great
                </button>
                <button
                  onClick={() => handleCheckIn('okay')}
                  className="px-5 py-2.5 rounded-full bg-[#F5EDE4] text-[#2D2A26] font-medium hover:bg-[#EBE3DA] transition-colors"
                >
                  Okay
                </button>
                <button
                  onClick={() => handleCheckIn('rough')}
                  className="px-5 py-2.5 rounded-full bg-[#F5EDE4] text-[#2D2A26] font-medium hover:bg-[#EBE3DA] transition-colors"
                >
                  Rough
                </button>
              </div>

              <Link
                href="/chat"
                className="text-[#8A8580] hover:text-[#2D2A26] transition-colors text-sm"
              >
                Or tell me more...
              </Link>
            </>
          ) : (
            <div className="space-y-4">
              {/* User response bubble */}
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-[#FFE8DC] rounded-2xl rounded-br-sm px-4 py-2.5">
                  <p className="text-[#2D2A26]">
                    {selectedResponse === 'great' ? "I'm feeling great!" :
                      selectedResponse === 'okay' ? "I'm feeling okay." :
                        "I'm having a rough day."}
                  </p>
                </div>
              </div>

              {/* AI feedback */}
              <p className="text-[#2D2A26] leading-relaxed">
                {getFeedbackMessage(selectedResponse)}
              </p>

              {/* Points earned notification */}
              <div className="flex items-center gap-2 text-sm text-[#4ADE80]">
                <span>+10 points earned</span>
                {profile.checkInStreak > 3 && (
                  <span>+{(profile.checkInStreak - 3) * 5} streak bonus</span>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowFeedback(false)}
                  className="flex-1 px-5 py-3 rounded-full bg-[#F5EDE4] text-[#2D2A26] font-medium hover:bg-[#EBE3DA] transition-colors"
                >
                  Done
                </button>
                <Link href="/chat" className="flex-1">
                  <button className="w-full px-5 py-3 rounded-full bg-[#E07A5F] text-white font-medium hover:bg-[#D36B4F] transition-colors">
                    Keep chatting
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Smart Nudge */}
        {smartNudge && !showFeedback && (
          <Link href="/chat">
            <div className="bg-[#FFE8DC] rounded-2xl p-4 flex items-center justify-between">
              <p className="text-sm text-[#2D2A26] flex-1">{smartNudge}</p>
              <ChevronRight className="w-5 h-5 text-[#E07A5F] flex-shrink-0 ml-2" />
            </div>
          </Link>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
