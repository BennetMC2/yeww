'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';

export default function RootPage() {
  const router = useRouter();
  const { profile, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading) {
      if (profile?.onboardingCompleted) {
        router.replace('/v2');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [isLoading, profile, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-semibold text-[#7FB685] mb-4">yeww</h1>
        <div className="w-8 h-8 border-2 border-[#7FB685] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}
