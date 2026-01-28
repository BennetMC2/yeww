'use client';

import { useState } from 'react';
import { X, Shield, Zap, Check, Loader2, Eye, EyeOff, Lock, ChevronDown, ChevronUp, FileCheck } from 'lucide-react';
import { ProofOpportunity, RequirementType } from '@/types';
import { formatThreshold } from '@/lib/proofGenerator';

interface ProofShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: ProofOpportunity;
  userId: string;
  actualValue?: number;
  onSuccess?: (hpAwarded: number) => void;
}

type ModalState = 'confirm' | 'loading' | 'success' | 'error';

export default function ProofShareModal({
  isOpen,
  onClose,
  opportunity,
  userId,
  actualValue,
  onSuccess,
}: ProofShareModalProps) {
  const [state, setState] = useState<ModalState>('confirm');
  const [hpAwarded, setHpAwarded] = useState(0);
  const [proofHash, setProofHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showLearnMore, setShowLearnMore] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setState('loading');

    try {
      const response = await fetch('/api/proofs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          opportunityId: opportunity.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setHpAwarded(data.hpAwarded);
        setProofHash(data.proofHash);
        setState('success');
        onSuccess?.(data.hpAwarded);
      } else {
        setErrorMessage(data.reason || 'Verification failed');
        setState('error');
      }
    } catch (error) {
      console.error('Error generating proof:', error);
      setErrorMessage('Something went wrong. Please try again.');
      setState('error');
    }
  };

  const handleClose = () => {
    setState('confirm');
    setErrorMessage('');
    setShowLearnMore(false);
    onClose();
  };

  const thresholdText = formatThreshold(
    opportunity.requirementType as RequirementType,
    opportunity.requirementThreshold
  );

  // Format the metric type for display
  const getMetricLabel = (type: string) => {
    switch (type) {
      case 'steps_avg': return 'steps';
      case 'sleep_avg': return 'hours sleep';
      case 'recovery_avg': return 'recovery score';
      case 'hrv_avg': return 'HRV';
      case 'rhr_avg': return 'resting HR';
      default: return type;
    }
  };

  const metricLabel = getMetricLabel(opportunity.requirementType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {state === 'success' ? 'Proof Shared!' : 'Share Health Proof'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {state === 'confirm' && (
            <>
              {/* What partner sees vs doesn't see */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-[#2D2A26] mb-3">Zero-Knowledge Proof</h3>

                {/* Partner sees */}
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg mb-2">
                  <Eye className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-green-800 mb-1">Partner receives:</p>
                    <ul className="text-xs text-green-700 space-y-0.5">
                      <li>✓ Verified: meets {thresholdText} threshold</li>
                      <li>✓ Time period: {opportunity.requirementDays} days</li>
                      <li>✓ Cryptographic proof of validity</li>
                    </ul>
                  </div>
                </div>

                {/* Partner doesn't see */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <EyeOff className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Partner does NOT see:</p>
                    <ul className="text-xs text-gray-500 space-y-0.5">
                      <li>✗ Your actual {metricLabel} {actualValue ? `(${actualValue.toLocaleString()})` : ''}</li>
                      <li>✗ Daily breakdown or patterns</li>
                      <li>✗ Any other health data</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Proof Preview Card */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-[#8A8580] mb-2">Proof preview:</h3>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#2D2A26] flex items-center justify-center">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#2D2A26] uppercase tracking-wide">Verified Health Proof</p>
                      <p className="text-[10px] text-[#8A8580]">Cryptographically secured</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#8A8580]">Claim:</span>
                      <span className="text-[#2D2A26] font-medium">{metricLabel} ≥ {opportunity.requirementThreshold.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A8580]">Period:</span>
                      <span className="text-[#2D2A26] font-medium">{opportunity.requirementDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A8580]">Status:</span>
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-[10px] text-[#8A8580] font-mono">proof_id: will be generated...</p>
                  </div>
                </div>
              </div>

              {/* Reward */}
              <div className="flex items-center justify-between p-3 bg-[#E07A5F]/10 rounded-lg mb-4">
                <span className="text-sm text-[#2D2A26]">You will earn:</span>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-[#E07A5F]" />
                  <span className="text-lg font-bold text-[#E07A5F]">{opportunity.hpReward} HP</span>
                </div>
              </div>

              {/* Learn more expandable */}
              <button
                onClick={() => setShowLearnMore(!showLearnMore)}
                className="w-full flex items-center justify-between text-xs text-[#8A8580] mb-4 hover:text-[#6B6560]"
              >
                <span>What is a zero-knowledge proof?</span>
                {showLearnMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showLearnMore && (
                <div className="p-3 bg-blue-50 rounded-lg mb-4 text-xs text-blue-800">
                  <p className="mb-2">
                    <strong>Zero-knowledge proofs</strong> let you prove something is true without revealing the underlying data.
                  </p>
                  <p className="text-blue-600">
                    Think of it like proving you&apos;re over 21 without showing your actual birthdate. The partner knows your claim is verified, but learns nothing else about your health data.
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-[#6B6560] font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 bg-[#E07A5F] text-white rounded-lg font-medium hover:bg-[#D36B4F] transition-colors flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Share Proof
                </button>
              </div>
            </>
          )}

          {state === 'loading' && (
            <div className="py-8 text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <Loader2 className="w-16 h-16 text-[#E07A5F] animate-spin" />
                <Lock className="w-6 h-6 text-[#E07A5F] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[#2D2A26] font-medium">Creating zero-knowledge proof...</p>
              <p className="text-xs text-[#8A8580] mt-2 max-w-[240px] mx-auto">
                Your data is being verified locally. Only the proof will be shared, never your raw data.
              </p>
            </div>
          )}

          {state === 'success' && (
            <div className="py-2">
              {/* Success header */}
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <FileCheck className="w-7 h-7 text-green-600" />
                </div>
                <div className="flex items-center justify-center gap-2 text-[#E07A5F] mb-1">
                  <Zap className="w-5 h-5" />
                  <span className="text-2xl font-bold">+{hpAwarded} HP</span>
                </div>
                <p className="text-sm text-[#8A8580]">Proof shared with {opportunity.partnerName}</p>
              </div>

              {/* Proof Certificate */}
              <div className="border border-green-200 rounded-xl p-4 bg-green-50/50 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">Verified Health Proof</p>
                    <p className="text-[10px] text-green-600">Shared successfully</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Claim:</span>
                    <span className="text-green-900 font-medium">{metricLabel} ≥ {opportunity.requirementThreshold.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Period:</span>
                    <span className="text-green-900 font-medium">{opportunity.requirementDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Shared with:</span>
                    <span className="text-green-900 font-medium">{opportunity.partnerName}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-[10px] text-green-600 font-mono break-all">proof_id: {proofHash}</p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-[#2D2A26] text-white rounded-lg font-medium hover:bg-[#1a1816] transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {state === 'error' && (
            <div className="py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-[#2D2A26] mb-2">Verification Failed</h3>
              <p className="text-sm text-[#6B6560] mb-4">{errorMessage}</p>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-[#6B6560] font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => setState('confirm')}
                  className="flex-1 py-2.5 bg-[#E07A5F] text-white rounded-lg font-medium hover:bg-[#D36B4F] transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
