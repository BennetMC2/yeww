'use client';

import { Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { DailyInsight, InsightSentiment } from '@/lib/insightGenerator';

interface DailyInsightCardProps {
  insight: DailyInsight | null;
  isLoading?: boolean;
}

function getBackgroundColor(sentiment: InsightSentiment): string {
  switch (sentiment) {
    case 'positive':
      return 'bg-gradient-to-r from-green-50 to-emerald-50';
    case 'attention':
      return 'bg-gradient-to-r from-amber-50 to-orange-50';
    case 'neutral':
    default:
      return 'bg-gradient-to-r from-[#FAF6F1] to-[#F5EDE4]';
  }
}

function getIconColor(sentiment: InsightSentiment): string {
  switch (sentiment) {
    case 'positive':
      return 'text-emerald-500';
    case 'attention':
      return 'text-amber-500';
    case 'neutral':
    default:
      return 'text-[#E07A5F]';
  }
}

function getArrowColor(sentiment: InsightSentiment): string {
  switch (sentiment) {
    case 'positive':
      return 'text-emerald-400';
    case 'attention':
      return 'text-amber-400';
    case 'neutral':
    default:
      return 'text-[#E07A5F]';
  }
}

export default function DailyInsightCard({ insight, isLoading }: DailyInsightCardProps) {
  if (isLoading) {
    return (
      <div className="bg-[#F5EDE4] rounded-2xl p-4 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-[#EBE3DA] rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#EBE3DA] rounded w-3/4" />
            <div className="h-4 bg-[#EBE3DA] rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="bg-gradient-to-r from-[#FAF6F1] to-[#F5EDE4] rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/50 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#E07A5F]" />
          </div>
          <p className="text-[#2D2A26] flex-1">
            Check in daily to unlock personalized insights.
          </p>
        </div>
      </div>
    );
  }

  const bgColor = getBackgroundColor(insight.sentiment);
  const iconColor = getIconColor(insight.sentiment);
  const arrowColor = getArrowColor(insight.sentiment);

  // Build chat URL with context
  const chatUrl = insight.learnMoreContext
    ? `/chat?context=${encodeURIComponent(insight.learnMoreContext)}`
    : '/chat';

  return (
    <Link href={chatUrl}>
      <div className={`${bgColor} rounded-2xl p-4 transition-all hover:shadow-md cursor-pointer`}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-white/50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className={`w-4 h-4 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#2D2A26] leading-relaxed">
              {insight.text}
            </p>
          </div>
          <ChevronRight className={`w-5 h-5 ${arrowColor} flex-shrink-0 mt-0.5`} />
        </div>
      </div>
    </Link>
  );
}
