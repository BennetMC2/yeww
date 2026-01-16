'use client';

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
}

export default function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  return (
    <div className={`h-1 bg-[#F5EDE4] rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-[#E07A5F] transition-all duration-500 ease-out rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  );
}
