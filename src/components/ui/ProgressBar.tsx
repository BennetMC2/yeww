'use client';

import { Check } from 'lucide-react';

interface Milestone {
  position: number; // 0-100
  label?: string;
}

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  milestones?: Milestone[];
  showMilestones?: boolean;
}

const DEFAULT_MILESTONES: Milestone[] = [
  { position: 0, label: 'Start' },
  { position: 37, label: 'Vision' },
  { position: 68, label: 'Connect' },
  { position: 100, label: 'Ready' },
];

export default function ProgressBar({
  progress,
  className = '',
  milestones = DEFAULT_MILESTONES,
  showMilestones = true,
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`relative ${className}`}>
      {/* Main progress track */}
      <div className="h-1.5 bg-[#F5EDE4] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#E07A5F] transition-all duration-500 ease-out rounded-full"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      {/* Milestone markers */}
      {showMilestones && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
          {milestones.map((milestone, index) => {
            const isCompleted = clampedProgress >= milestone.position;
            const isCurrent = clampedProgress >= milestone.position &&
              (index === milestones.length - 1 || clampedProgress < milestones[index + 1].position);

            return (
              <div
                key={index}
                className="absolute -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${milestone.position}%` }}
              >
                {/* Milestone dot */}
                <div
                  className={`w-3 h-3 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                    isCompleted
                      ? 'bg-[#E07A5F] border-[#E07A5F]'
                      : 'bg-[#FAF6F1] border-[#F5EDE4]'
                  } ${isCurrent ? 'ring-4 ring-[#E07A5F]/20' : ''}`}
                >
                  {isCompleted && milestone.position < clampedProgress && (
                    <Check className="w-2 h-2 text-white" strokeWidth={3} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
