'use client';

import { useState } from 'react';
import { FileCheck, ChevronDown, ChevronUp, Lock, Building2, Calendar, Zap } from 'lucide-react';

export interface SharedProof {
  id: string;
  proofHash: string;
  partnerName: string;
  claim: string;
  threshold: string;
  periodDays: number;
  hpEarned: number;
  sharedAt: string;
  expiresAt?: string;
}

interface ProofHistoryProps {
  proofs: SharedProof[];
}

export default function ProofHistory({ proofs }: ProofHistoryProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedProof, setSelectedProof] = useState<SharedProof | null>(null);

  if (proofs.length === 0) {
    return null;
  }

  const displayProofs = expanded ? proofs : proofs.slice(0, 2);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[#2D2A26] flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-[#8A8580]" />
          Shared Proofs
        </h3>
        <span className="text-xs text-[#8A8580]">{proofs.length} total</span>
      </div>

      <div className="space-y-2">
        {displayProofs.map((proof) => (
          <button
            key={proof.id}
            onClick={() => setSelectedProof(proof)}
            className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-[#E07A5F]/30 transition-colors text-left"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2D2A26]">{proof.claim}</p>
                  <p className="text-xs text-[#8A8580]">
                    Shared with {proof.partnerName} · {new Date(proof.sharedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-sm font-semibold">+{proof.hpEarned}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {proofs.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-2 py-2 text-sm text-[#8A8580] hover:text-[#6B6560] flex items-center justify-center gap-1"
        >
          {expanded ? (
            <>Show less <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>Show all {proofs.length} proofs <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
      )}

      {/* Proof Detail Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-5">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#2D2A26]">Proof Details</h3>
                  <p className="text-xs text-[#8A8580]">Verified and shared</p>
                </div>
              </div>

              {/* Proof Certificate */}
              <div className="border border-green-200 rounded-xl p-4 bg-green-50/50 mb-4">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-green-200">
                  <Lock className="w-4 h-4 text-green-600" />
                  <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">Zero-Knowledge Proof</p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                      <FileCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-green-600">Verified Claim</p>
                      <p className="text-green-900 font-medium">{selectedProof.claim}</p>
                      <p className="text-xs text-green-600 mt-0.5">Threshold: {selectedProof.threshold}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-green-600">Shared With</p>
                      <p className="text-green-900 font-medium">{selectedProof.partnerName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-green-600">Date Shared</p>
                      <p className="text-green-900 font-medium">
                        {new Date(selectedProof.sharedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-[#E07A5F]/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-[#E07A5F]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#8A8580]">HP Earned</p>
                      <p className="text-[#E07A5F] font-bold">+{selectedProof.hpEarned} HP</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-green-200">
                  <p className="text-[10px] text-green-600 mb-1">Proof ID</p>
                  <p className="text-[10px] text-green-700 font-mono break-all bg-green-100 p-2 rounded">
                    {selectedProof.proofHash}
                  </p>
                </div>
              </div>

              {/* Privacy note */}
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg mb-4">
                <Lock className="w-4 h-4 text-[#8A8580] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#6B6560]">
                  Only this proof was shared. {selectedProof.partnerName} cannot see your actual health data, daily values, or any other information.
                </p>
              </div>

              <button
                onClick={() => setSelectedProof(null)}
                className="w-full py-2.5 bg-[#2D2A26] text-white rounded-lg font-medium hover:bg-[#1a1816] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
