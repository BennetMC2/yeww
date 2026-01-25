'use client';

import { useState } from 'react';
import { X, Shield, Zap, Check, Loader2 } from 'lucide-react';
import { ProofOpportunity, RequirementType } from '@/types';
import { formatThreshold } from '@/lib/proofGenerator';

interface ProofShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: ProofOpportunity;
  userId: string;
  onSuccess?: (hpAwarded: number) => void;
}

type ModalState = 'confirm' | 'loading' | 'success' | 'error';

export default function ProofShareModal({
  isOpen,
  onClose,
  opportunity,
  userId,
  onSuccess,
}: ProofShareModalProps) {
  const [state, setState] = useState<ModalState>('confirm');
  const [hpAwarded, setHpAwarded] = useState(0);
  const [proofHash, setProofHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
    onClose();
  };

  const thresholdText = formatThreshold(
    opportunity.requirementType as RequirementType,
    opportunity.requirementThreshold
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {state === 'success' ? 'Success!' : 'Verify & Share'}
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
              {/* Privacy assurance */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg mb-4">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Your data stays private</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Only a verified proof is shared, not your actual health data.
                  </p>
                </div>
              </div>

              {/* What will be verified */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-[#8A8580] mb-2">What will be verified:</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-[#2D2A26]">
                    You averaged <span className="font-semibold">{thresholdText}</span> or more over the past{' '}
                    <span className="font-semibold">{opportunity.requirementDays} days</span>
                  </p>
                </div>
              </div>

              {/* Reward */}
              <div className="flex items-center justify-between p-3 bg-[#E07A5F]/10 rounded-lg mb-5">
                <span className="text-sm text-[#2D2A26]">You will earn:</span>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-[#E07A5F]" />
                  <span className="text-lg font-bold text-[#E07A5F]">{opportunity.hpReward} HP</span>
                </div>
              </div>

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
                  Verify & Share
                </button>
              </div>
            </>
          )}

          {state === 'loading' && (
            <div className="py-8 text-center">
              <Loader2 className="w-12 h-12 text-[#E07A5F] animate-spin mx-auto mb-4" />
              <p className="text-[#6B6560]">Generating proof...</p>
              <p className="text-xs text-[#8A8580] mt-1">This may take a moment</p>
            </div>
          )}

          {state === 'success' && (
            <div className="py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-[#2D2A26] mb-2">Proof Verified!</h3>
              <div className="flex items-center justify-center gap-2 text-[#E07A5F] mb-4">
                <Zap className="w-5 h-5" />
                <span className="text-2xl font-bold">+{hpAwarded} HP</span>
              </div>
              <p className="text-sm text-[#8A8580] mb-4">
                Proof ID: <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{proofHash.slice(0, 20)}...</code>
              </p>
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
