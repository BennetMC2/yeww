'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Activity, Apple, Brain, Zap, Scale, Heart, Eye, Sparkles, Droplet, Check, X } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useApp } from '@/contexts/AppContext';
import { HEALTH_AREAS } from '@/types';

// Map icon strings to components
const iconMap: Record<string, React.ElementType> = {
  Moon, Activity, Apple, Brain, Zap, Scale,
  Heart, Eye, Sparkles, Droplet,
};

export default function HealthPage() {
  const router = useRouter();
  const { profile, addHealthArea, removeHealthArea, isLoading } = useApp();
  const [confirmAdd, setConfirmAdd] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!isLoading && !profile?.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [isLoading, profile, router]);

  if (isLoading || !profile?.onboardingCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6F1]">
        <p className="text-[#B5AFA8]">Loading...</p>
      </div>
    );
  }

  const activeAreas = profile.healthAreas.filter(a => a.active);
  const activeAreaIds = activeAreas.map(a => a.id);
  const availableAreas = HEALTH_AREAS.filter(a => !activeAreaIds.includes(a.id));

  const handleAdd = (areaId: string, areaName: string) => {
    addHealthArea(areaId, areaName);
    setConfirmAdd(null);
  };

  const handleRemove = (areaId: string) => {
    removeHealthArea(areaId);
    setConfirmRemove(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1] pb-20">
      <Header />

      <main className="flex-1 px-6 py-4">
        <h1 className="text-2xl font-semibold text-[#2D2A26] mb-6">Health Areas</h1>

        {/* Active Areas */}
        {activeAreas.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-medium text-[#8A8580] uppercase tracking-wider mb-3">
              Tracking
            </h2>
            <div className="space-y-3">
              {activeAreas.map((area) => {
                const definition = HEALTH_AREAS.find(d => d.id === area.id);
                const Icon = definition ? iconMap[definition.icon] : Activity;

                return (
                  <div key={area.id} className="bg-white rounded-2xl p-4">
                    {confirmRemove === area.id ? (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[#2D2A26]">Stop tracking {area.name}?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmRemove(null)}
                            className="p-2 rounded-full bg-[#F5EDE4] text-[#8A8580] hover:bg-[#EBE3DA] transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemove(area.id)}
                            className="p-2 rounded-full bg-[#E07A5F] text-white hover:bg-[#D36B4F] transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-4 cursor-pointer"
                        onClick={() => setConfirmRemove(area.id)}
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#FFE8DC] flex items-center justify-center">
                          <Icon className="w-6 h-6 text-[#E07A5F]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#2D2A26]">{area.name}</h3>
                          <p className="text-sm text-[#8A8580]">
                            Tracking since {formatDate(area.addedAt)}
                          </p>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-[#E07A5F]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty State */}
        {activeAreas.length === 0 && (
          <div className="text-center py-8 mb-8">
            <p className="text-[#8A8580] mb-2">You&apos;re not tracking any health areas yet.</p>
            <p className="text-[#8A8580]">Add one to get started.</p>
          </div>
        )}

        {/* Available Areas */}
        {availableAreas.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-[#8A8580] uppercase tracking-wider mb-3">
              Available
            </h2>
            <div className="space-y-3">
              {availableAreas.map((area) => {
                const Icon = iconMap[area.icon];

                return (
                  <div key={area.id} className="bg-[#F5EDE4] hover:bg-[#EBE3DA] rounded-2xl p-4 transition-colors">
                    {confirmAdd === area.id ? (
                      <div className="space-y-3">
                        <p className="text-sm text-[#2D2A26]">Start tracking {area.name}?</p>
                        <p className="text-sm text-[#8A8580]">{area.description}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmAdd(null)}
                            className="flex-1 px-4 py-2 rounded-full bg-white text-[#2D2A26] text-sm font-medium hover:bg-[#FAF6F1] transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAdd(area.id, area.name)}
                            className="flex-1 px-4 py-2 rounded-full bg-[#E07A5F] text-white text-sm font-medium hover:bg-[#D36B4F] transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-4 cursor-pointer"
                        onClick={() => setConfirmAdd(area.id)}
                      >
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                          <Icon className="w-6 h-6 text-[#8A8580]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-[#2D2A26]">{area.name}</h3>
                          <p className="text-sm text-[#8A8580]">{area.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
