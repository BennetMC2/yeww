'use client';

import { useState, useRef } from 'react';
import { X, Camera, Loader2, AlertCircle, Check } from 'lucide-react';

interface ExtractedData {
  weightKg: number | null;
  bodyFatPercent: number | null;
  steps: number | null;
  sleepHours: number | null;
  heartRate: number | null;
  bloodPressure: string | null;
  sourceApp: string | null;
  confidence: number;
  extractedDate: string;
}

interface ScreenshotImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSaveComplete: () => void;
}

type Step = 'upload' | 'extracting' | 'review' | 'saving' | 'success';

export default function ScreenshotImportModal({
  isOpen,
  onClose,
  userId,
  onSaveComplete,
}: ScreenshotImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [stagingId, setStagingId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Partial<ExtractedData>>({});
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read file as base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      setPreviewImage(imageData);
      setStep('extracting');
      setError(null);

      try {
        // Call extraction API
        const response = await fetch('/api/health/extract-screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            imageData,
          }),
        });

        if (!response.ok) {
          throw new Error('Extraction failed');
        }

        const result = await response.json();

        if (result.success) {
          setExtractedData(result.extracted);
          setStagingId(result.stagingId);
          setEditedData(result.extracted);
          setValidationIssues(result.validation?.issues || []);
          setStep('review');
        } else {
          throw new Error(result.error || 'Extraction failed');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to extract data');
        setStep('upload');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!editedData.extractedDate) return;

    setStep('saving');
    setError(null);

    try {
      const response = await fetch('/api/health/confirm-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          stagingId,
          targetDate: editedData.extractedDate,
          confirmedMetrics: {
            weightKg: editedData.weightKg,
            bodyFatPercent: editedData.bodyFatPercent,
            steps: editedData.steps,
            sleepHours: editedData.sleepHours,
            heartRate: editedData.heartRate,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      setStep('success');
      setTimeout(() => {
        onSaveComplete();
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save data');
      setStep('review');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setPreviewImage(null);
    setExtractedData(null);
    setStagingId(null);
    setEditedData({});
    setValidationIssues([]);
    setError(null);
    onClose();
  };

  const updateField = (field: keyof ExtractedData, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setEditedData(prev => ({
      ...prev,
      [field]: field === 'extractedDate' ? value : numValue,
    }));
  };

  const hasAnyData = extractedData && (
    extractedData.weightKg ||
    extractedData.bodyFatPercent ||
    extractedData.steps ||
    extractedData.sleepHours ||
    extractedData.heartRate
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-[#FAF6F1] rounded-2xl w-full max-w-[420px] overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E07A5F]/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-[#E07A5F]" />
              </div>
              <h3 className="text-lg font-semibold text-[#2D2A26]">Import Screenshot</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-[#F5EDE4] transition-colors"
            >
              <X className="w-5 h-5 text-[#8A8580]" />
            </button>
          </div>

          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-sm text-[#8A8580]">
                Upload a screenshot from your health app or a photo of your scale to automatically extract data.
              </p>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-[#E07A5F]/30 rounded-xl hover:border-[#E07A5F]/60 hover:bg-[#E07A5F]/5 transition-all flex flex-col items-center gap-2"
              >
                <Camera className="w-8 h-8 text-[#E07A5F]" />
                <span className="text-sm font-medium text-[#2D2A26]">Upload Image</span>
                <span className="text-xs text-[#8A8580]">PNG, JPG, or WEBP</span>
              </button>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
            </div>
          )}

          {/* Extracting Step */}
          {step === 'extracting' && (
            <div className="space-y-4 text-center py-8">
              {previewImage && (
                <div className="rounded-xl overflow-hidden mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-48 object-contain bg-white"
                  />
                </div>
              )}
              <Loader2 className="w-8 h-8 text-[#E07A5F] animate-spin mx-auto" />
              <p className="text-sm text-[#8A8580]">Analyzing image...</p>
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && extractedData && (
            <div className="space-y-4">
              {/* Confidence indicator */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#8A8580]">
                  {extractedData.sourceApp ? `Detected: ${extractedData.sourceApp}` : 'Unknown source'}
                </span>
                <span className={`font-medium ${
                  extractedData.confidence >= 0.7 ? 'text-green-600' :
                  extractedData.confidence >= 0.5 ? 'text-yellow-600' : 'text-red-500'
                }`}>
                  {Math.round(extractedData.confidence * 100)}% confidence
                </span>
              </div>

              {/* Validation warnings */}
              {validationIssues.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-700">
                      {validationIssues.map((issue, i) => (
                        <p key={i}>{issue}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Editable fields */}
              <div className="space-y-3">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-[#8A8580] mb-1">Date</label>
                  <input
                    type="date"
                    value={editedData.extractedDate || ''}
                    onChange={(e) => updateField('extractedDate', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-[#E5E0DB] focus:outline-none focus:border-[#E07A5F]"
                  />
                </div>

                {/* Weight */}
                {(extractedData.weightKg !== null || editedData.weightKg !== null) && (
                  <div>
                    <label className="block text-sm font-medium text-[#8A8580] mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editedData.weightKg ?? ''}
                      onChange={(e) => updateField('weightKg', e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-[#E5E0DB] focus:outline-none focus:border-[#E07A5F]"
                    />
                  </div>
                )}

                {/* Body Fat */}
                {(extractedData.bodyFatPercent !== null || editedData.bodyFatPercent !== null) && (
                  <div>
                    <label className="block text-sm font-medium text-[#8A8580] mb-1">Body Fat (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editedData.bodyFatPercent ?? ''}
                      onChange={(e) => updateField('bodyFatPercent', e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-[#E5E0DB] focus:outline-none focus:border-[#E07A5F]"
                    />
                  </div>
                )}

                {/* Steps */}
                {(extractedData.steps !== null || editedData.steps !== null) && (
                  <div>
                    <label className="block text-sm font-medium text-[#8A8580] mb-1">Steps</label>
                    <input
                      type="number"
                      value={editedData.steps ?? ''}
                      onChange={(e) => updateField('steps', e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-[#E5E0DB] focus:outline-none focus:border-[#E07A5F]"
                    />
                  </div>
                )}

                {/* Sleep */}
                {(extractedData.sleepHours !== null || editedData.sleepHours !== null) && (
                  <div>
                    <label className="block text-sm font-medium text-[#8A8580] mb-1">Sleep (hours)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editedData.sleepHours ?? ''}
                      onChange={(e) => updateField('sleepHours', e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-[#E5E0DB] focus:outline-none focus:border-[#E07A5F]"
                    />
                  </div>
                )}

                {/* Heart Rate */}
                {(extractedData.heartRate !== null || editedData.heartRate !== null) && (
                  <div>
                    <label className="block text-sm font-medium text-[#8A8580] mb-1">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      value={editedData.heartRate ?? ''}
                      onChange={(e) => updateField('heartRate', e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-[#E5E0DB] focus:outline-none focus:border-[#E07A5F]"
                    />
                  </div>
                )}
              </div>

              {!hasAnyData && (
                <p className="text-sm text-center text-[#8A8580] py-4">
                  No health data could be extracted from this image.
                </p>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 rounded-full bg-[#F5EDE4] text-[#2D2A26] font-medium hover:bg-[#EBE3DA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasAnyData || !editedData.extractedDate}
                  className="flex-1 px-6 py-3 rounded-full bg-[#E07A5F] text-white font-medium hover:bg-[#D36B4F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Saving Step */}
          {step === 'saving' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-[#E07A5F] animate-spin mx-auto mb-4" />
              <p className="text-sm text-[#8A8580]">Saving data...</p>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="font-medium text-[#2D2A26]">Data saved successfully!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
