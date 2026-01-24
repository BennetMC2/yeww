'use client';

import { FlaskConical, Bell } from 'lucide-react';

interface LabsComingSoonProps {
  onNotify?: () => void;
}

export default function LabsComingSoon({ onNotify }: LabsComingSoonProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
          <FlaskConical className="w-5 h-5 text-purple-500" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="font-medium text-[#2D2A26] mb-1">Labs Import</h3>
          <p className="text-sm text-[#8A8580] leading-snug mb-3">
            Upload your blood work and lab results to get personalized insights and track biomarkers over time.
          </p>

          {/* Coming Soon Badge */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              Coming Soon
            </span>

            {onNotify && (
              <button
                onClick={onNotify}
                className="flex items-center gap-1.5 text-xs font-medium text-[#E07A5F] hover:text-[#D36B4F] transition-colors"
              >
                <Bell className="w-3.5 h-3.5" />
                Notify me
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
