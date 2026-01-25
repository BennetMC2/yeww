'use client';

import { Zap, TrendingUp, ChevronRight } from 'lucide-react';
import { HPTransaction } from '@/types';

interface HPBalanceCardProps {
  balance: number;
  lifetimeEarned: number;
  recentTransactions?: HPTransaction[];
  onViewHistory?: () => void;
}

export default function HPBalanceCard({
  balance,
  lifetimeEarned,
  recentTransactions = [],
  onViewHistory,
}: HPBalanceCardProps) {
  // Format numbers with commas
  const formatNumber = (n: number) => n.toLocaleString();

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-gradient-to-br from-[#E07A5F] to-[#D36B4F] rounded-2xl p-5 text-white shadow-lg">
      {/* Balance */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-yellow-300" />
            <span className="text-sm font-medium text-white/80">Health Points</span>
          </div>
          <div className="text-4xl font-bold tracking-tight">
            {formatNumber(balance)} <span className="text-xl font-medium">HP</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-white/70">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Lifetime</span>
          </div>
          <div className="text-lg font-semibold">{formatNumber(lifetimeEarned)}</div>
        </div>
      </div>

      {/* Recent transactions */}
      {recentTransactions.length > 0 && (
        <div className="border-t border-white/20 pt-3 mt-3">
          <div className="space-y-2">
            {recentTransactions.slice(0, 3).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-sm">
                <span className="text-white/80 truncate max-w-[200px]">{tx.description}</span>
                <span className={`font-medium ${tx.amount > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} HP
                </span>
              </div>
            ))}
          </div>
          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="flex items-center gap-1 mt-3 text-sm text-white/70 hover:text-white transition-colors"
            >
              View history
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
