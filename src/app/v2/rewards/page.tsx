'use client';

import { useState, useEffect, useCallback } from 'react';
import { Footprints, Moon, Battery, ChevronDown, ChevronUp, History, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import HealthIDCard from '@/components/rewards/HealthIDCard';
import HPBalanceCard from '@/components/rewards/HPBalanceCard';
import OpportunityCard from '@/components/rewards/OpportunityCard';
import ProofShareModal from '@/components/rewards/ProofShareModal';
import {
  UserRewards,
  HPTransaction,
  ProofOpportunity,
  ReputationTier,
} from '@/types';

// Mock data for demo - simulates an active user ~1 week in
const MOCK_REWARDS: UserRewards = {
  userId: 'demo',
  hpBalance: 450,
  lifetimeEarned: 1250,
  reputationScore: 120,
  reputationTier: 'verified',
};

const DAY_MS = 86400000;
const MOCK_TRANSACTIONS: HPTransaction[] = [
  {
    id: '1',
    userId: 'demo',
    amount: 10,
    type: 'earn_behavior',
    description: 'Hit 8k+ steps today',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'demo',
    amount: 10,
    type: 'earn_behavior',
    description: 'Got 7+ hours of sleep',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: '3',
    userId: 'demo',
    amount: 100,
    type: 'earn_sharing',
    description: 'Verified: Sleep Champion proof',
    createdAt: new Date(Date.now() - DAY_MS).toISOString(),
  },
  {
    id: '4',
    userId: 'demo',
    amount: 5,
    type: 'earn_behavior',
    description: 'Recovery above 70+',
    createdAt: new Date(Date.now() - 2 * DAY_MS).toISOString(),
  },
  {
    id: '5',
    userId: 'demo',
    amount: 10,
    type: 'earn_behavior',
    description: 'Hit 8k+ steps',
    createdAt: new Date(Date.now() - 3 * DAY_MS).toISOString(),
  },
  {
    id: '6',
    userId: 'demo',
    amount: 100,
    type: 'bonus',
    description: 'First wearable connected',
    createdAt: new Date(Date.now() - 4 * DAY_MS).toISOString(),
  },
  {
    id: '7',
    userId: 'demo',
    amount: 50,
    type: 'bonus',
    description: 'Welcome bonus',
    createdAt: new Date(Date.now() - 5 * DAY_MS).toISOString(),
  },
  {
    id: '8',
    userId: 'demo',
    amount: 10,
    type: 'earn_behavior',
    description: 'Got 7+ hours of sleep',
    createdAt: new Date(Date.now() - 6 * DAY_MS).toISOString(),
  },
  {
    id: '9',
    userId: 'demo',
    amount: 25,
    type: 'bonus',
    description: 'Completed onboarding',
    createdAt: new Date(Date.now() - 7 * DAY_MS).toISOString(),
  },
];

// Mock opportunities showing different states
const MOCK_OPPORTUNITIES: (ProofOpportunity & { isEligible: boolean; actualValue?: number; alreadyClaimed: boolean })[] = [
  {
    id: 'opp-1',
    title: 'Sleep Champion',
    description: 'Prove you consistently get quality sleep. Share your 3-day sleep average to earn HP.',
    partnerName: 'Sleep Research Co',
    hpReward: 100,
    requirementType: 'sleep_avg',
    requirementThreshold: 7,
    requirementDays: 3,
    expiresAt: new Date(Date.now() + 5 * DAY_MS).toISOString(),
    isActive: true,
    isEligible: true,
    actualValue: 7.8,
    alreadyClaimed: false,
  },
  {
    id: 'opp-2',
    title: 'Step Streak Master',
    description: 'Show your commitment to daily movement with a 5-day step streak above 8,000 steps.',
    partnerName: 'FitLife Insurance',
    hpReward: 150,
    requirementType: 'steps_avg',
    requirementThreshold: 8000,
    requirementDays: 5,
    expiresAt: new Date(Date.now() + 10 * DAY_MS).toISOString(),
    isActive: true,
    isEligible: false,
    actualValue: 6500,
    alreadyClaimed: false,
  },
  {
    id: 'opp-3',
    title: 'Recovery Pro',
    description: 'Demonstrate excellent recovery habits with a high recovery score.',
    partnerName: 'Wellness Inc',
    hpReward: 75,
    requirementType: 'recovery_avg',
    requirementThreshold: 80,
    requirementDays: 3,
    isActive: true,
    isEligible: true,
    actualValue: 85,
    alreadyClaimed: true,
  },
];

interface DailyGoal {
  type: 'steps' | 'sleep' | 'recovery';
  label: string;
  description: string;
  reward: number;
  icon: typeof Footprints;
  met: boolean;
  claimed: boolean;
}

export default function RewardsPage() {
  const { profile } = useApp();
  const userId = profile?.id || 'demo-user';

  const [rewards, setRewards] = useState<UserRewards>(MOCK_REWARDS);
  const [transactions, setTransactions] = useState<HPTransaction[]>(MOCK_TRANSACTIONS);
  const [opportunities, setOpportunities] = useState<(ProofOpportunity & { isEligible: boolean; actualValue?: number; alreadyClaimed: boolean })[]>(MOCK_OPPORTUNITIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<ProofOpportunity | null>(null);
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([
    { type: 'steps', label: '8k Steps', description: 'Hit 8,000+ steps today', reward: 10, icon: Footprints, met: true, claimed: false }, // Met but not claimed - prompts "Check rewards"
    { type: 'sleep', label: '7h Sleep', description: 'Get 7+ hours of sleep', reward: 10, icon: Moon, met: true, claimed: true }, // Already claimed today
    { type: 'recovery', label: '70+ Recovery', description: 'Recovery score of 70+', reward: 5, icon: Battery, met: false, claimed: false }, // Not met yet
  ]);
  const [checkingDaily, setCheckingDaily] = useState(false);
  const [healthScore, setHealthScore] = useState(72);

  // Fetch rewards data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [balanceRes, txRes, oppRes, metricsRes] = await Promise.all([
        fetch(`/api/rewards/balance?userId=${userId}`),
        fetch(`/api/rewards/transactions?userId=${userId}&limit=10`),
        fetch(`/api/proofs/opportunities?userId=${userId}`),
        fetch(`/api/health/metrics?userId=${userId}`),
      ]);

      // Track if any critical fetch failed
      let hasErrors = false;

      // Fetch balance
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setRewards(balanceData);
      } else {
        hasErrors = true;
      }

      // Fetch transactions
      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData.transactions?.length > 0) {
          setTransactions(txData.transactions);
        }
      }

      // Fetch opportunities - only update if we get real data
      if (oppRes.ok) {
        const oppData = await oppRes.json();
        if (oppData.opportunities && oppData.opportunities.length > 0) {
          setOpportunities(oppData.opportunities);
        }
        // Keep mock opportunities if API returns empty
      }

      // Fetch health metrics to determine daily goal status
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        if (metricsData.metrics) {
          setDailyGoals(prev => prev.map(goal => {
            if (goal.type === 'steps' && metricsData.metrics.steps?.today) {
              return { ...goal, met: metricsData.metrics.steps.today >= 8000 };
            }
            if (goal.type === 'sleep' && metricsData.metrics.sleep?.lastNightHours) {
              return { ...goal, met: metricsData.metrics.sleep.lastNightHours >= 7 };
            }
            if (goal.type === 'recovery' && metricsData.metrics.recovery?.score) {
              return { ...goal, met: metricsData.metrics.recovery.score >= 70 };
            }
            return goal;
          }));
        }
      }

      if (hasErrors) {
        setError('Some data could not be loaded. Showing cached values.');
      }
    } catch (err) {
      console.error('Error fetching rewards data:', err);
      setError('Failed to load rewards data. Tap to retry.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check daily rewards
  const checkDailyRewards = async () => {
    setCheckingDaily(true);
    try {
      const response = await fetch('/api/rewards/check-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.awarded?.length > 0) {
          // Mark claimed goals
          setDailyGoals(prev => prev.map(goal => {
            const awarded = data.awarded.find((a: { type: string }) => a.type === goal.type);
            return awarded ? { ...goal, claimed: true } : goal;
          }));
          // Refresh data
          fetchData();
        }
      }
    } catch (error) {
      console.error('Error checking daily rewards:', error);
    } finally {
      setCheckingDaily(false);
    }
  };

  // Handle proof share success
  const handleProofSuccess = () => {
    fetchData();
  };

  // Check if using mock data
  const usingMockRewards = rewards.userId === 'demo';
  const usingMockTransactions = transactions.length > 0 && transactions[0].userId === 'demo';

  if (loading) {
    return (
      <div className="px-6 py-8 flex items-center justify-center">
        <p className="text-[#8A8580]">Loading rewards...</p>
      </div>
    );
  }

  return (
    <div className="px-6 pb-8 space-y-6">
      {/* Error Banner */}
      {error && (
        <button
          onClick={fetchData}
          className="w-full flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <RefreshCw className="w-4 h-4" />
        </button>
      )}

      {/* Mock Data Indicator */}
      {(usingMockRewards || usingMockTransactions) && (
        <div className="text-xs text-amber-600 text-center py-1">
          Using demo data — connect your wearable for real metrics
        </div>
      )}

      {/* HealthID Card */}
      <HealthIDCard
        name={profile?.name || 'Demo User'}
        healthScore={healthScore}
        reputationScore={rewards.reputationScore}
        reputationTier={rewards.reputationTier as ReputationTier}
        memberSince={profile?.createdAt || new Date().toISOString()}
      />

      {/* HP Balance */}
      <HPBalanceCard
        balance={rewards.hpBalance}
        lifetimeEarned={rewards.lifetimeEarned}
        recentTransactions={transactions.slice(0, 3)}
        onViewHistory={() => setShowAllTransactions(!showAllTransactions)}
      />

      {/* Transaction History (expandable) */}
      {showAllTransactions && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-[#8A8580]" />
            <h3 className="font-medium text-[#2D2A26]">Transaction History</h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm text-[#2D2A26]">{tx.description}</p>
                  <p className="text-xs text-[#8A8580]">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} HP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Goals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#2D2A26]">Daily Goals</h3>
          <button
            onClick={checkDailyRewards}
            disabled={checkingDaily}
            className="text-sm text-[#E07A5F] font-medium hover:underline disabled:opacity-50"
          >
            {checkingDaily ? 'Checking...' : 'Check rewards'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {dailyGoals.map((goal) => {
            const Icon = goal.icon;
            return (
              <div
                key={goal.type}
                className={`p-3 rounded-xl text-center transition-all ${
                  goal.claimed
                    ? 'bg-green-50 border border-green-200'
                    : goal.met
                    ? 'bg-[#E07A5F]/10 border border-[#E07A5F]/30'
                    : 'bg-gray-50 border border-gray-100'
                }`}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${
                  goal.claimed ? 'text-green-500' : goal.met ? 'text-[#E07A5F]' : 'text-gray-400'
                }`} />
                <p className="text-xs font-medium text-[#2D2A26]">{goal.label}</p>
                <p className={`text-xs ${goal.claimed ? 'text-green-600' : 'text-[#8A8580]'}`}>
                  {goal.claimed ? 'Claimed!' : `+${goal.reward} HP`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sharing Opportunities */}
      <div>
        <h3 className="font-semibold text-[#2D2A26] mb-3">Earn by Sharing</h3>
        {opportunities.length > 0 ? (
          <div className="space-y-3">
            {opportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onShare={() => setSelectedOpportunity(opp)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center">
            <p className="text-[#8A8580]">No opportunities available yet.</p>
            <p className="text-xs text-[#B5AFA8] mt-1">Check back soon for new ways to earn!</p>
          </div>
        )}
      </div>

      {/* Proof Share Modal */}
      {selectedOpportunity && (
        <ProofShareModal
          isOpen={!!selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          opportunity={selectedOpportunity}
          userId={userId}
          onSuccess={handleProofSuccess}
        />
      )}
    </div>
  );
}
