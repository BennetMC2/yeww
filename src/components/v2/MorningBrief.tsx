'use client';

import { useRouter } from 'next/navigation';
import { HealthMetrics } from '@/types';

interface MorningBriefProps {
  name: string;
  metrics: HealthMetrics | null;
  isLoading?: boolean;
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getGreeting(timeOfDay: string): string {
  switch (timeOfDay) {
    case 'morning': return 'Good morning';
    case 'afternoon': return 'Good afternoon';
    case 'evening': return 'Good evening';
    default: return 'Hey';
  }
}

function generateBrief(name: string, metrics: HealthMetrics | null): { greeting: string; message: string; highlight?: string } {
  const timeOfDay = getTimeOfDay();
  const greeting = `${getGreeting(timeOfDay)}, ${name}.`;

  if (!metrics) {
    return {
      greeting,
      message: "I don't have your health data yet. Connect a wearable to get personalized insights about your sleep, recovery, and more.",
    };
  }

  const parts: string[] = [];
  let highlight: string | undefined;

  // Sleep commentary
  if (metrics.sleep) {
    const hours = metrics.sleep.lastNightHours;
    if (hours >= 7.5) {
      parts.push(`Sleep was solid last night—${hours} hours, ${metrics.sleep.quality} quality.`);
    } else if (hours >= 6) {
      parts.push(`You got ${hours} hours of sleep. Not bad, but there's room to improve.`);
    } else {
      parts.push(`Only ${hours} hours of sleep last night. That might catch up with you today.`);
      highlight = 'sleep';
    }
  }

  // Recovery commentary
  if (metrics.recovery) {
    const score = metrics.recovery.score;
    const label = metrics.recovery.label || 'Recovery';
    if (score >= 70) {
      parts.push(`${label}'s at ${score}—good day to push if you want to.`);
    } else if (score >= 40) {
      parts.push(`${label}'s at ${score}. Moderate day—listen to your body.`);
    } else {
      parts.push(`${label}'s low at ${score}. Might be worth taking it easy.`);
      highlight = highlight || 'recovery';
    }
  }

  // RHR commentary (if concerning)
  if (metrics.rhr && metrics.rhr.current > metrics.rhr.baseline + 3) {
    const diff = metrics.rhr.current - metrics.rhr.baseline;
    parts.push(`Your RHR is up ${diff} bpm from baseline. Worth watching.`);
    highlight = highlight || 'rhr';
  }

  // HRV commentary (if concerning)
  if (metrics.hrv && metrics.hrv.current < metrics.hrv.baseline * 0.85) {
    parts.push(`HRV is down from your baseline—recovery might be taking a hit.`);
    highlight = highlight || 'hrv';
  }

  if (parts.length === 0) {
    parts.push("Your metrics look stable today. Nothing unusual to flag.");
  }

  return {
    greeting,
    message: parts.join(' '),
    highlight,
  };
}

export default function MorningBrief({ name, metrics, isLoading }: MorningBriefProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 animate-pulse">
        <div className="h-6 bg-[#F5EDE4] rounded-lg w-48 mb-3" />
        <div className="h-4 bg-[#F5EDE4] rounded-lg w-full mb-2" />
        <div className="h-4 bg-[#F5EDE4] rounded-lg w-3/4 mb-2" />
        <div className="h-4 bg-[#F5EDE4] rounded-lg w-5/6" />
      </div>
    );
  }

  const brief = generateBrief(name, metrics);

  const handleTellMeMore = () => {
    // Navigate to chat with context
    const context = brief.highlight
      ? `Tell me more about my ${brief.highlight}`
      : 'Tell me more about my health today';
    router.push(`/v2/chat?context=${encodeURIComponent(context)}`);
  };

  return (
    <div className="bg-white rounded-2xl p-5">
      <p className="text-lg font-semibold text-[#2D2A26] mb-2">
        {brief.greeting}
      </p>
      <p className="text-[#2D2A26] leading-relaxed mb-4">
        {brief.message}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => {}}
          className="px-4 py-2 rounded-full bg-[#F5EDE4] text-[#2D2A26] text-sm font-medium hover:bg-[#EBE3DA] transition-colors"
        >
          Got it
        </button>
        <button
          onClick={handleTellMeMore}
          className="px-4 py-2 rounded-full bg-[#E07A5F] text-white text-sm font-medium hover:bg-[#D36B4F] transition-colors"
        >
          Tell me more
        </button>
      </div>
    </div>
  );
}
