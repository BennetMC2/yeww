'use client';

interface ProgressDotsProps {
  total: number;
  current: number;
}

export default function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={`
            w-2 h-2 rounded-full transition-all duration-200
            ${index < current ? 'bg-[#7FB685]' : 'bg-gray-200'}
          `}
        />
      ))}
    </div>
  );
}
