'use client';

import { Coins, Plus } from 'lucide-react';
import Link from 'next/link';

interface HPCardProps {
  balance: number;
  isLoading?: boolean;
}

export default function HPCard({ balance, isLoading = false }: HPCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-[20px] p-4 animate-pulse" style={{ background: 'linear-gradient(135deg, #FFF9F0 0%, #FFF3E0 100%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[14px] bg-[#F5EDE4]" />
            <div className="space-y-1">
              <div className="h-6 w-16 bg-[#F5EDE4] rounded" />
              <div className="h-3 w-20 bg-[#F5EDE4] rounded" />
            </div>
          </div>
          <div className="h-10 w-24 bg-[#F5EDE4] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-[20px] p-4"
      style={{
        background: 'linear-gradient(135deg, #FFF9F0 0%, #FFF3E0 100%)',
        border: '1px solid rgba(242, 204, 143, 0.3)',
        boxShadow: '0 2px 12px rgba(242, 204, 143, 0.15)',
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Icon and Value */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-[14px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #F2CC8F 0%, #E9B949 100%)',
              boxShadow: '0 4px 12px rgba(242, 204, 143, 0.4)',
            }}
          >
            <Coins className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-[24px] font-bold text-[#2D2A26] leading-none">
              {balance.toLocaleString()}
            </div>
            <div className="text-[12px] text-[#8A8580] mt-0.5">Health Points</div>
          </div>
        </div>

        {/* Right side - Earn Button */}
        <Link
          href="/v2/rewards"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)',
            boxShadow: '0 4px 12px rgba(224, 122, 95, 0.3)',
          }}
        >
          <Plus className="w-4 h-4" />
          Earn more
        </Link>
      </div>
    </div>
  );
}
