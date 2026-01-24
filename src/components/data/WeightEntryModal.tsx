'use client';

import { useState } from 'react';
import { X, Scale } from 'lucide-react';

interface WeightEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weightKg: number, date: string) => Promise<void>;
}

export default function WeightEntryModal({ isOpen, onClose, onSave }: WeightEntryModalProps) {
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError(null);
    const weightNum = parseFloat(weight);

    if (isNaN(weightNum) || weightNum <= 0) {
      setError('Please enter a valid weight');
      return;
    }

    // Convert to kg if needed
    const weightKg = unit === 'lbs' ? weightNum * 0.453592 : weightNum;

    // Validate reasonable weight range (20-300 kg)
    if (weightKg < 20 || weightKg > 300) {
      setError('Please enter a weight between 20-300 kg (44-660 lbs)');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(Math.round(weightKg * 10) / 10, date);
      // Reset form
      setWeight('');
      setDate(new Date().toISOString().split('T')[0]);
      onClose();
    } catch {
      setError('Failed to save weight. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#FAF6F1] rounded-2xl w-full max-w-[400px] overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E07A5F]/10 flex items-center justify-center">
                <Scale className="w-5 h-5 text-[#E07A5F]" />
              </div>
              <h3 className="text-lg font-semibold text-[#2D2A26]">Log Weight</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#F5EDE4] transition-colors"
            >
              <X className="w-5 h-5 text-[#8A8580]" />
            </button>
          </div>

          {/* Weight Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#8A8580] mb-2">
                Weight
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder={unit === 'kg' ? '70.5' : '155'}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  step="0.1"
                  min="0"
                  className="flex-1 px-4 py-3 bg-white text-[#2D2A26] placeholder-[#B5AFA8] rounded-xl border-2 border-transparent focus:outline-none focus:border-[#E07A5F]/30 transition-all text-lg"
                  autoFocus
                />
                <div className="flex rounded-xl overflow-hidden border-2 border-[#F5EDE4]">
                  <button
                    onClick={() => setUnit('kg')}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      unit === 'kg'
                        ? 'bg-[#E07A5F] text-white'
                        : 'bg-white text-[#8A8580] hover:bg-[#F5EDE4]'
                    }`}
                  >
                    kg
                  </button>
                  <button
                    onClick={() => setUnit('lbs')}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      unit === 'lbs'
                        ? 'bg-[#E07A5F] text-white'
                        : 'bg-white text-[#8A8580] hover:bg-[#F5EDE4]'
                    }`}
                  >
                    lbs
                  </button>
                </div>
              </div>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-sm font-medium text-[#8A8580] mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-white text-[#2D2A26] rounded-xl border-2 border-transparent focus:outline-none focus:border-[#E07A5F]/30 transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3.5 rounded-full bg-[#F5EDE4] text-[#2D2A26] font-medium hover:bg-[#EBE3DA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!weight || isSaving}
                className="flex-1 px-6 py-3.5 rounded-full bg-[#E07A5F] text-white font-medium hover:bg-[#D36B4F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
