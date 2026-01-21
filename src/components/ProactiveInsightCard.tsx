'use client';

import { Lightbulb, X, MessageCircle } from 'lucide-react';
import { ProactiveInsight } from '@/types';

interface ProactiveInsightCardProps {
  insight: ProactiveInsight;
  onDismiss: (id: string) => void;
  onDiscuss: (insight: ProactiveInsight) => void;
}

export default function ProactiveInsightCard({
  insight,
  onDismiss,
  onDiscuss,
}: ProactiveInsightCardProps) {
  // Priority-based styling
  const priorityStyles = {
    high: 'border-[#E07A5F] bg-[#FFF5F2]',
    medium: 'border-[#E8A87C] bg-[#FFF9F5]',
    low: 'border-[#D4C5B0] bg-[#FAF6F1]',
  };

  const iconColors = {
    high: 'text-[#E07A5F]',
    medium: 'text-[#E8A87C]',
    low: 'text-[#B5AFA8]',
  };

  return (
    <div
      className={`relative rounded-2xl border-2 p-4 mb-4 ${priorityStyles[insight.priority]}`}
    >
      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(insight.id)}
        className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-[#B5AFA8] hover:text-[#2D2A26] hover:bg-[#EBE3DA] transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className={`w-4 h-4 ${iconColors[insight.priority]}`} />
        <span className="text-xs font-medium text-[#B5AFA8] uppercase tracking-wide">
          New insight from your data
        </span>
      </div>

      {/* Message */}
      <p className="text-[#2D2A26] text-base leading-relaxed pr-6 mb-4">
        &ldquo;{insight.message}&rdquo;
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onDiscuss(insight)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#E07A5F] text-white text-sm font-medium hover:bg-[#D36B4F] transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Discuss this
        </button>
        <button
          onClick={() => onDismiss(insight.id)}
          className="px-4 py-2 rounded-full text-[#B5AFA8] text-sm hover:text-[#2D2A26] hover:bg-[#EBE3DA] transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
