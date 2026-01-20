'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { CheckInContext, getCheckInResponse } from '@/lib/checkInContext';

interface SmartCheckInCardProps {
  checkInContext: CheckInContext;
  onCheckIn: (value: string) => void;
  pointsEarned?: number;
  streakBonus?: number;
  alreadyCheckedIn?: boolean;
}

export default function SmartCheckInCard({
  checkInContext,
  onCheckIn,
  pointsEarned = 10,
  streakBonus = 0,
  alreadyCheckedIn = false,
}: SmartCheckInCardProps) {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showPoints, setShowPoints] = useState(false);

  // Reset state when already checked in status changes
  useEffect(() => {
    if (alreadyCheckedIn) {
      setSelectedValue(null);
      setShowFeedback(false);
      setShowPoints(false);
    }
  }, [alreadyCheckedIn]);

  const handleOptionClick = (value: string) => {
    setSelectedValue(value);
    onCheckIn(value);
    setShowFeedback(true);

    // Show points animation after a brief delay
    setTimeout(() => {
      setShowPoints(true);
    }, 300);
  };

  const feedbackMessage = selectedValue
    ? getCheckInResponse(selectedValue, checkInContext.contextType)
    : '';

  if (alreadyCheckedIn && !showFeedback) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <span className="text-lg">✓</span>
          </div>
          <div className="flex-1">
            <p className="text-[#2D2A26] font-medium">Checked in today</p>
            <p className="text-sm text-[#8A8580]">See you tomorrow!</p>
          </div>
          <Link
            href="/chat"
            className="px-4 py-2 rounded-full bg-[#F5EDE4] text-[#2D2A26] text-sm font-medium hover:bg-[#EBE3DA] transition-colors"
          >
            Chat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      {!showFeedback ? (
        <>
          {/* Question */}
          <p className="text-lg text-[#2D2A26] leading-relaxed mb-4">
            {checkInContext.question}
          </p>

          {/* Response options */}
          <div className="flex flex-wrap gap-2 mb-3">
            {checkInContext.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className="px-4 py-2.5 rounded-full bg-[#F5EDE4] text-[#2D2A26] font-medium hover:bg-[#EBE3DA] transition-colors flex items-center gap-1.5"
              >
                {option.emoji && <span>{option.emoji}</span>}
                {option.label}
              </button>
            ))}
          </div>

          {/* Tell me more link */}
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 text-[#8A8580] hover:text-[#2D2A26] transition-colors text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Tell me more...
          </Link>
        </>
      ) : (
        <div className="space-y-4">
          {/* User response bubble */}
          <div className="flex justify-end">
            <div className="max-w-[85%] bg-[#FFE8DC] rounded-2xl rounded-br-sm px-4 py-2.5">
              <p className="text-[#2D2A26]">
                {checkInContext.options.find(o => o.value === selectedValue)?.emoji}{' '}
                {checkInContext.options.find(o => o.value === selectedValue)?.label}
              </p>
            </div>
          </div>

          {/* AI feedback */}
          <p className="text-[#2D2A26] leading-relaxed">
            {feedbackMessage}
          </p>

          {/* Points earned notification */}
          <div
            className={`flex items-center gap-2 text-sm transition-all duration-500 ${
              showPoints ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}
          >
            <span className="text-green-500 font-medium">+{pointsEarned} points earned</span>
            {streakBonus > 0 && (
              <span className="text-amber-500 font-medium">+{streakBonus} streak bonus</span>
            )}
          </div>

          {/* Action buttons */}
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
  );
}
