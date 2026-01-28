'use client';

import { Lightbulb } from 'lucide-react';
import { ProactiveInsight } from '@/types';

interface InsightCardProps {
  insight: ProactiveInsight;
  onDismiss?: (id: string) => void;
  onDiscuss?: (insight: ProactiveInsight) => void;
}

// Format relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

export default function InsightCard({ insight, onDismiss, onDiscuss }: InsightCardProps) {
  const isNew = !insight.read;
  const timestamp = getRelativeTime(insight.createdAt);

  return (
    <div
      className="rounded-[24px] p-5 mb-4"
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFBF8 100%)',
        border: '1px solid rgba(224, 122, 95, 0.15)',
        boxShadow: '0 2px 16px rgba(224, 122, 95, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #FFE8DC 0%, #FFD4C4 100%)' }}
        >
          <Lightbulb className="w-[22px] h-[22px] text-[#E07A5F]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-[#2D2A26]">yeww</div>
          <div className="text-[11px] text-[#B5AFA8]">{timestamp}</div>
        </div>
        {isNew && (
          <span
            className="text-[10px] font-bold text-white uppercase tracking-wide px-2 py-1 rounded-lg"
            style={{ background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)' }}
          >
            New
          </span>
        )}
      </div>

      {/* Message */}
      <p
        className="text-[15px] leading-relaxed text-[#2D2A26] mb-4"
        dangerouslySetInnerHTML={{
          __html: insight.message.replace(
            /(\d+%?|\d+\.\d+)/g,
            '<strong class="font-semibold">$1</strong>'
          ),
        }}
      />

      {/* Actions */}
      <div className="flex gap-2.5">
        <button
          onClick={() => onDismiss?.(insight.id)}
          className="flex-1 py-3 px-4 rounded-[14px] text-[14px] font-semibold text-[#6B6560] bg-[#F5EDE4] hover:bg-[#EBE3DA] active:scale-[0.98] transition-all"
        >
          Dismiss
        </button>
        <button
          onClick={() => onDiscuss?.(insight)}
          className="flex-1 py-3 px-4 rounded-[14px] text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)',
            boxShadow: '0 4px 12px rgba(224, 122, 95, 0.3)',
          }}
        >
          Tell me more
        </button>
      </div>
    </div>
  );
}
