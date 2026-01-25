'use client';

import { Zap, Clock, CheckCircle2, XCircle, Building2 } from 'lucide-react';
import { ProofOpportunity, RequirementType } from '@/types';
import { formatThreshold } from '@/lib/proofGenerator';

interface OpportunityCardProps {
  opportunity: ProofOpportunity & {
    isEligible: boolean;
    actualValue?: number;
    alreadyClaimed: boolean;
  };
  onShare: () => void;
}

export default function OpportunityCard({ opportunity, onShare }: OpportunityCardProps) {
  const {
    title,
    description,
    partnerName,
    hpReward,
    requirementType,
    requirementThreshold,
    requirementDays,
    expiresAt,
    isEligible,
    actualValue,
    alreadyClaimed,
  } = opportunity;

  // Format expiry
  const formatExpiry = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / 86400000);
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `${diffDays} days left`;
  };

  const expiryText = formatExpiry(expiresAt);
  const thresholdText = formatThreshold(requirementType as RequirementType, requirementThreshold);

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border ${
      alreadyClaimed ? 'border-green-200 bg-green-50/50' :
      isEligible ? 'border-[#E07A5F]/30' : 'border-gray-100'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <h3 className="font-semibold text-[#2D2A26]">{title}</h3>
            <p className="text-xs text-[#8A8580]">{partnerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-[#E07A5F]/10 rounded-full">
          <Zap className="w-3.5 h-3.5 text-[#E07A5F]" />
          <span className="text-sm font-semibold text-[#E07A5F]">{hpReward}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[#6B6560] mb-3">{description}</p>

      {/* Requirement */}
      <div className="flex items-center gap-4 text-xs text-[#8A8580] mb-4">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {requirementDays} days
        </span>
        <span>Target: {thresholdText}</span>
        {actualValue !== undefined && !alreadyClaimed && (
          <span className={isEligible ? 'text-green-600' : 'text-orange-500'}>
            You: {actualValue.toLocaleString()}
          </span>
        )}
      </div>

      {/* Expiry badge */}
      {expiryText && (
        <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block mb-3">
          {expiryText}
        </div>
      )}

      {/* Action */}
      {alreadyClaimed ? (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">Claimed</span>
        </div>
      ) : isEligible ? (
        <button
          onClick={onShare}
          className="w-full py-2.5 bg-[#E07A5F] text-white rounded-lg font-medium hover:bg-[#D36B4F] transition-colors flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Share & Earn
        </button>
      ) : (
        <div className="flex items-center gap-2 text-[#8A8580]">
          <XCircle className="w-5 h-5" />
          <span className="text-sm">Keep going to qualify</span>
        </div>
      )}
    </div>
  );
}
