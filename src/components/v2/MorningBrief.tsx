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

interface BriefResult {
  greeting: string;
  message: string;
  tip?: string;
  highlight?: string;
}

function generateBrief(name: string, metrics: HealthMetrics | null): BriefResult {
  const timeOfDay = getTimeOfDay();
  const greeting = `${getGreeting(timeOfDay)}, ${name}.`;

  if (!metrics) {
    return {
      greeting,
      message: "I don't have your health data yet. Connect a wearable to get personalized insights about your sleep, recovery, and more.",
    };
  }

  const parts: string[] = [];
  let tip: string | undefined;
  let highlight: string | undefined;

  // Build a comprehensive brief that reads like a knowledgeable friend

  // Sleep commentary - more detailed
  if (metrics.sleep) {
    const hours = Number(metrics.sleep.lastNightHours.toFixed(1));
    const quality = metrics.sleep.quality;
    const avgWeek = Number(metrics.sleep.avgWeekHours.toFixed(1));
    const diff = Number((hours - avgWeek).toFixed(1));

    if (hours >= 7.5 && quality === 'excellent') {
      parts.push(`Great night—${hours} hours with excellent quality. That's ${diff}h above your weekly average.`);
      tip = "Your body's in a good recovery window. Consider something more challenging today if you've been wanting to push.";
    } else if (hours >= 7) {
      parts.push(`Solid ${hours} hours of ${quality} sleep. Slightly above your ${avgWeek}h average.`);
      tip = "You're well-rested. A good day for focused work or a moderate workout.";
    } else if (hours >= 6) {
      parts.push(`You managed ${hours} hours. Not ideal, but you can work with it.`);
      tip = "Consider a short power nap (20 min) early afternoon if energy dips.";
      highlight = 'sleep';
    } else {
      parts.push(`Rough night—only ${hours} hours. This might affect your focus and recovery.`);
      tip = "Skip the intense workout today. Your body needs recovery more than gains right now.";
      highlight = 'sleep';
    }
  }

  // Recovery + HRV combined insight
  if (metrics.recovery && metrics.hrv) {
    const recoveryScore = metrics.recovery.score;
    const hrvCurrent = metrics.hrv.current;
    const hrvBaseline = metrics.hrv.baseline;
    const hrvDiff = hrvCurrent - hrvBaseline;
    const label = metrics.recovery.label || 'Recovery';

    if (recoveryScore >= 75 && hrvDiff >= 0) {
      parts.push(`${label} is strong at ${recoveryScore} and your HRV is tracking ${hrvDiff > 0 ? hrvDiff + 'ms above' : 'at'} baseline.`);
    } else if (recoveryScore >= 60) {
      parts.push(`${label} at ${recoveryScore}—moderate day ahead. HRV is ${hrvDiff >= 0 ? 'holding steady' : 'a bit below normal'}.`);
    } else {
      parts.push(`${label}'s at ${recoveryScore}${hrvDiff < -5 ? ' and HRV is down' : ''}. Your body's asking for rest.`);
      highlight = highlight || 'recovery';
    }
  } else if (metrics.recovery) {
    const score = metrics.recovery.score;
    const label = metrics.recovery.label || 'Recovery';
    if (score >= 70) {
      parts.push(`${label}'s at ${score}—green light to push if you want to.`);
    } else if (score >= 40) {
      parts.push(`${label}'s at ${score}. Moderate day—listen to your body.`);
    } else {
      parts.push(`${label}'s low at ${score}. Worth taking it easy.`);
      highlight = highlight || 'recovery';
    }
  }

  // RHR insight - only if notable
  if (metrics.rhr) {
    const current = metrics.rhr.current;
    const baseline = metrics.rhr.baseline;
    if (current < baseline - 2) {
      parts.push(`Your resting heart rate dropped to ${current} bpm—a sign of good cardiovascular adaptation.`);
    } else if (current > baseline + 3) {
      const diff = current - baseline;
      parts.push(`RHR is up ${diff} bpm. Could be stress, dehydration, or fighting something off.`);
      tip = tip || "Hydrate extra today and consider if you're under more stress than usual.";
      highlight = highlight || 'rhr';
    }
  }

  // Steps context if notable
  if (metrics.steps && metrics.steps.today > 8000) {
    parts.push(`Already ${(metrics.steps.today / 1000).toFixed(1)}k steps in—nice momentum.`);
  }

  if (parts.length === 0) {
    parts.push("Your metrics look balanced today. Nothing unusual to flag—steady state.");
    tip = "Consistency is key. Keep doing what you're doing.";
  }

  return {
    greeting,
    message: parts.join(' '),
    tip,
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
      <p className="text-[#2D2A26] leading-relaxed">
        {brief.message}
      </p>

      {/* Actionable tip */}
      {brief.tip && (
        <div className="mt-3 p-3 bg-[#FFF8F5] rounded-xl border border-[#FFE8DC]">
          <p className="text-sm text-[#2D2A26]">
            <span className="font-medium text-[#E07A5F]">Tip:</span> {brief.tip}
          </p>
        </div>
      )}

      <div className="flex gap-2 mt-4">
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
