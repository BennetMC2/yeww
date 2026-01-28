'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check, Sparkles, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button, Input, ProgressBar, Confetti } from '@/components/ui';
import { useApp } from '@/contexts/AppContext';
import HealthScoreGauge from '@/components/scores/HealthScoreGauge';
import ReputationBadge from '@/components/scores/ReputationBadge';
import PointsDisplay from '@/components/scores/PointsDisplay';
import {
  CoachingStyle,
  ConnectedApp,
  DataSource,
  Priority,
  PastAttempt,
  Barrier,
  DATA_SOURCES,
  PRIORITIES,
  PAST_ATTEMPTS,
  BARRIERS,
} from '@/types';
import { calculateHealthScore, POINTS_CONFIG } from '@/lib/scores';

// Animated message bubble
const Message = ({
  children,
  visible,
  size = 'lg',
}: {
  children: React.ReactNode;
  visible: boolean;
  size?: 'md' | 'lg' | 'xl';
}) => {
  const sizeClasses = {
    md: 'text-[18px]',
    lg: 'text-[24px]',
    xl: 'text-[32px]',
  };

  return (
    <div
      className="transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
      }}
    >
      <p className={`${sizeClasses[size]} font-semibold text-[#2D2A26] leading-snug`}>{children}</p>
    </div>
  );
};

// Fade wrapper
const FadeIn = ({
  children,
  visible,
  delay = 0,
  className = ''
}: {
  children: React.ReactNode;
  visible: boolean;
  delay?: number;
  className?: string;
}) => (
  <div
    className={`transition-all duration-500 ease-out ${className}`}
    style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transitionDelay: `${delay}ms`,
    }}
  >
    {children}
  </div>
);

// Brand colors for data sources
const BRAND_COLORS: Record<string, { gradient: string; iconBg: string }> = {
  'apple-health': {
    gradient: 'from-red-400 to-red-500',
    iconBg: 'bg-gradient-to-br from-red-400 to-red-500',
  },
  'oura': {
    gradient: 'from-gray-300 to-gray-400',
    iconBg: 'bg-gradient-to-br from-gray-300 to-gray-400',
  },
  'whoop': {
    gradient: 'from-blue-400 to-blue-600',
    iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600',
  },
  'garmin': {
    gradient: 'from-blue-300 to-blue-500',
    iconBg: 'bg-gradient-to-br from-blue-300 to-blue-500',
  },
  'fitbit': {
    gradient: 'from-teal-400 to-teal-500',
    iconBg: 'bg-gradient-to-br from-teal-400 to-teal-500',
  },
  'google-fit': {
    gradient: 'from-green-400 to-blue-400',
    iconBg: 'bg-gradient-to-br from-green-400 to-blue-400',
  },
  'strava': {
    gradient: 'from-orange-400 to-orange-500',
    iconBg: 'bg-gradient-to-br from-orange-400 to-orange-500',
  },
  'peloton': {
    gradient: 'from-red-500 to-red-600',
    iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
  },
  'withings': {
    gradient: 'from-blue-400 to-cyan-400',
    iconBg: 'bg-gradient-to-br from-blue-400 to-cyan-400',
  },
};

// Data source card with icon and brand colors
const DataSourceCard = ({
  source,
  selected,
  onClick,
}: {
  source: typeof DATA_SOURCES[number];
  selected: boolean;
  onClick: () => void;
}) => {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[source.icon] || LucideIcons.Circle;
  const brandColor = BRAND_COLORS[source.id];

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-3.5 rounded-[16px] transition-all duration-300 min-h-[88px] hover:-translate-y-0.5 active:scale-[0.97]"
      style={{
        background: selected
          ? 'linear-gradient(135deg, #FFE8DC 0%, #FFD4C4 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
        boxShadow: selected
          ? '0 4px 16px rgba(224, 122, 95, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
          : '0 2px 8px rgba(45, 42, 38, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        border: selected ? '2px solid #E07A5F' : '2px solid transparent',
      }}
    >
      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-2"
        style={{
          background: brandColor
            ? undefined
            : selected
            ? 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)'
            : 'linear-gradient(135deg, #F5EDE4 0%, #EBE3DA 100%)',
        }}
      >
        <IconComponent className={`w-4 h-4 ${brandColor || selected ? 'text-white' : 'text-[#8A8580]'}`} />
      </div>
      <span className={`text-[11px] font-semibold text-center leading-tight ${selected ? 'text-[#2D2A26]' : 'text-[#8A8580]'}`}>
        {source.name}
      </span>
      {selected && (
        <Check className="w-3.5 h-3.5 text-[#E07A5F] mt-1" />
      )}
    </button>
  );
};

// Priority chip
const PriorityChip = ({
  priority,
  selected,
  onClick,
  disabled,
}: {
  priority: typeof PRIORITIES[number];
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-3 rounded-[14px] text-[13px] font-semibold transition-all duration-300 ${
      disabled ? 'cursor-not-allowed opacity-50' : 'hover:-translate-y-0.5 active:scale-[0.97]'
    }`}
    style={{
      background: selected
        ? 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)'
        : 'linear-gradient(135deg, #F5EDE4 0%, #EBE3DA 100%)',
      color: selected ? '#FFFFFF' : disabled ? '#B5AFA8' : '#2D2A26',
      boxShadow: selected ? '0 4px 12px rgba(224, 122, 95, 0.3)' : 'none',
    }}
  >
    {priority.name}
  </button>
);

// Timeline item
const TimelineItem = ({
  label,
  title,
  description,
  visible,
  delay,
}: {
  label: string;
  title: string;
  description: string;
  visible: boolean;
  delay: number;
}) => (
  <div
    className="flex gap-4 transition-all duration-700 ease-out"
    style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : 'translateX(-20px)',
      transitionDelay: `${delay}ms`,
    }}
  >
    <div className="flex flex-col items-center">
      <div
        className="w-4 h-4 rounded-full"
        style={{
          background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)',
          boxShadow: '0 2px 8px rgba(224, 122, 95, 0.4)',
        }}
      />
      <div
        className="w-0.5 flex-1 min-h-[60px]"
        style={{
          background: 'linear-gradient(180deg, #E07A5F 0%, #F5EDE4 100%)',
        }}
      />
    </div>
    <div className="pb-6">
      <p className="text-[11px] font-bold text-[#E07A5F] uppercase tracking-wider">{label}</p>
      <p className="text-[17px] font-bold text-[#2D2A26] mt-1">{title}</p>
      <p className="text-[13px] text-[#8A8580] mt-1 leading-relaxed">{description}</p>
    </div>
  </div>
);

export default function OnboardingPage() {
  const router = useRouter();
  const {
    profile,
    setName,
    setCoachingStyle,
    setConnectedApps,
    setDataSources,
    setPriorities,
    setPastAttempt,
    setBarriers,
    addPoints,
    completeOnboarding,
    recalculateScores,
    isLoading,
  } = useApp();

  const [step, setStep] = useState(1);
  const [messagesVisible, setMessagesVisible] = useState(0);
  const [contentVisible, setContentVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Form state
  const [localName, setLocalName] = useState('');
  const [localDataSources, setLocalDataSources] = useState<DataSource[]>([]);
  const [localPriorities, setLocalPriorities] = useState<Priority[]>([]);
  const [localPastAttempt, setLocalPastAttempt] = useState<PastAttempt | null>(null);
  const [localBarriers, setLocalBarriers] = useState<Barrier[]>([]);
  const [localCoachingStyle, setLocalCoachingStyle] = useState<CoachingStyle | null>(null);
  const [localConnectedApps, setLocalConnectedApps] = useState<ConnectedApp[]>([]);

  // Animation states for specific screens
  const [timelineItemsVisible, setTimelineItemsVisible] = useState(0);
  const [scatteredPhase, setScatteredPhase] = useState(0);
  const [aiMessagesVisible, setAiMessagesVisible] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isConnectingTerra, setIsConnectingTerra] = useState(false);
  const [terraConnectedDevices, setTerraConnectedDevices] = useState<string[]>([]);
  const [animatedPoints, setAnimatedPoints] = useState(0);

  // Total steps (accounting for conditional step 10 - barriers)
  const shouldShowBarriers = localPastAttempt && localPastAttempt !== 'not-really';
  const totalSteps = shouldShowBarriers ? 17 : 16;

  // Get current step index for progress bar
  const getStepIndex = () => {
    if (step <= 9) return step;
    if (step === 10) return shouldShowBarriers ? 10 : 10; // This shouldn't happen if properly skipped
    return shouldShowBarriers ? step : step - 1;
  };

  // Calculate progress
  const progress = (getStepIndex() / totalSteps) * 100;

  // Redirect if already completed onboarding
  useEffect(() => {
    if (!isLoading && profile?.onboardingCompleted) {
      router.replace('/home');
    }
  }, [isLoading, profile, router]);

  // Get message count for each step
  const getMessageCount = (s: number) => {
    switch (s) {
      case 1: return 1; // Welcome
      case 2: return 1; // Name
      case 3: return 2; // Fragmentation
      case 4: return 4; // Scattered (animated sequence)
      case 5: return 4; // Promise
      case 6: return 3; // Privacy & Security
      case 7: return 1; // Timeline
      case 8: return 2; // Priorities
      case 9: return 1; // Past attempts
      case 10: return 2; // Barriers
      case 11: return 1; // Coaching style
      case 12: return 2; // Connect data
      case 13: return 2; // Health score
      case 14: return 2; // Reputation
      case 15: return 2; // Points
      case 16: return 2; // Commitment
      case 17: return 4; // AI intro
      default: return 1;
    }
  };

  // Animate messages in
  useEffect(() => {
    if (!isTransitioning) {
      setMessagesVisible(0);
      setContentVisible(false);
      setTimelineItemsVisible(0);
      setScatteredPhase(0);
      setAiMessagesVisible(0);

      const messageCount = getMessageCount(step);
      let currentMessage = 0;

      const showNextMessage = () => {
        currentMessage++;
        setMessagesVisible(currentMessage);

        if (currentMessage < messageCount) {
          // Longer delays for dramatic screens
          const delay = step === 4 ? 1200 : step === 17 ? 1000 : 800;
          setTimeout(showNextMessage, delay);
        } else {
          setTimeout(() => setContentVisible(true), 500);
        }
      };

      setTimeout(showNextMessage, 400);

      // Special animation for scattered data screen
      if (step === 4) {
        setTimeout(() => setScatteredPhase(1), 500);
        setTimeout(() => setScatteredPhase(2), 2000);
        setTimeout(() => setScatteredPhase(3), 3500);
        setTimeout(() => setScatteredPhase(4), 5000);
      }

      // Special animation for timeline screen
      if (step === 7) {
        for (let i = 1; i <= 5; i++) {
          setTimeout(() => setTimelineItemsVisible(i), 800 + i * 400);
        }
      }

      // Special animation for AI intro
      if (step === 17) {
        for (let i = 1; i <= 4; i++) {
          setTimeout(() => setAiMessagesVisible(i), 500 + i * 1000);
        }
      }

      // Special animation for points screen - tally up to 100
      if (step === 15) {
        setAnimatedPoints(0);
        const targetPoints = 100;
        const duration = 1500; // 1.5 seconds
        const steps = 30;
        const increment = targetPoints / steps;
        const intervalTime = duration / steps;

        let current = 0;
        const startDelay = setTimeout(() => {
          const interval = setInterval(() => {
            current += increment;
            if (current >= targetPoints) {
              setAnimatedPoints(targetPoints);
              clearInterval(interval);
            } else {
              setAnimatedPoints(Math.round(current));
            }
          }, intervalTime);
        }, 1200); // Start after the badge appears

        return () => clearTimeout(startDelay);
      }
    }
  }, [step, isTransitioning]);

  const handleNext = useCallback(async () => {
    // Save data based on step
    switch (step) {
      case 2:
        if (localName.trim()) setName(localName.trim());
        break;
      case 3:
        setDataSources(localDataSources);
        break;
      case 8:
        setPriorities(localPriorities);
        break;
      case 9:
        if (localPastAttempt) setPastAttempt(localPastAttempt);
        break;
      case 10:
        setBarriers(localBarriers);
        break;
      case 11:
        if (localCoachingStyle) setCoachingStyle(localCoachingStyle);
        break;
      case 12:
        setConnectedApps(localConnectedApps);
        // Award points for connecting sources
        localConnectedApps.forEach(() => {
          addPoints('connect-source', POINTS_CONFIG.CONNECT_SOURCE, 'Connected health app');
        });
        break;
      case 17:
        // Complete onboarding - MUST await save before navigating
        if (isSaving) return; // Prevent double-submission
        setIsSaving(true);

        try {
          // These can be fire-and-forget (non-critical for navigation)
          addPoints('complete-onboarding', POINTS_CONFIG.COMPLETE_ONBOARDING, 'Completed onboarding');
          recalculateScores();

          // Trigger confetti celebration
          setShowConfetti(true);

          // MUST await - profile must be saved before navigation
          await completeOnboarding();

          // Small delay to let confetti play before navigation
          setTimeout(() => {
            router.push('/home');
          }, 800);
        } catch (error) {
          console.error('Error completing onboarding:', error);
          setIsSaving(false); // Allow retry
          setShowConfetti(false);
        }
        return;
    }

    // Calculate next step
    let nextStep = step + 1;
    // Skip step 10 (barriers) if user selected "not-really" for past attempts
    if (step === 9 && localPastAttempt === 'not-really') {
      nextStep = 11;
    }

    // Transition
    setIsTransitioning(true);
    setContentVisible(false);
    setMessagesVisible(0);

    setTimeout(() => {
      setStep(nextStep);
      setIsTransitioning(false);
    }, 400);
  }, [
    step, localName, localDataSources, localPriorities, localPastAttempt,
    localBarriers, localCoachingStyle, localConnectedApps,
    setName, setDataSources, setPriorities, setPastAttempt, setBarriers,
    setCoachingStyle, setConnectedApps, addPoints, recalculateScores,
    completeOnboarding, router, isSaving
  ]);

  const handleBack = () => {
    if (step === 1) return;

    let prevStep = step - 1;
    // Skip step 10 (barriers) going back if it was skipped going forward
    if (step === 11 && (!localPastAttempt || localPastAttempt === 'not-really')) {
      prevStep = 9;
    }

    setIsTransitioning(true);
    setContentVisible(false);
    setMessagesVisible(0);

    setTimeout(() => {
      setStep(prevStep);
      setIsTransitioning(false);
    }, 400);
  };

  const toggleDataSource = (source: DataSource) => {
    setLocalDataSources(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const togglePriority = (priority: Priority) => {
    setLocalPriorities(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : prev.length < 3 ? [...prev, priority] : prev
    );
  };

  const toggleBarrier = (barrier: Barrier) => {
    setLocalBarriers(prev =>
      prev.includes(barrier) ? prev.filter(b => b !== barrier) : [...prev, barrier]
    );
  };

  const toggleApp = (app: ConnectedApp) => {
    setLocalConnectedApps(prev =>
      prev.includes(app) ? prev.filter(a => a !== app) : [...prev, app]
    );
  };

  // Handle Terra device connection
  const handleConnectDevice = async () => {
    if (!profile?.id || isConnectingTerra) return;

    setIsConnectingTerra(true);

    try {
      const response = await fetch('/api/terra/widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          // Custom redirect URLs for onboarding flow
          successRedirectUrl: `${window.location.origin}/onboarding?terra=connected&step=12`,
          failureRedirectUrl: `${window.location.origin}/onboarding?terra=failed&step=12`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create connection session');
      }

      const data = await response.json();
      // Redirect to Terra widget
      window.location.href = data.url;
    } catch (err) {
      console.error('Error connecting device:', err);
      setIsConnectingTerra(false);
    }
  };

  // Check for Terra connection status in URL params (after redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const terraStatus = params.get('terra');
    const stepParam = params.get('step');

    if (terraStatus === 'connected' && stepParam === '12') {
      // Successfully connected - could fetch actual connected device
      // For now, just mark as having a connected device
      setTerraConnectedDevices(prev => [...prev, 'device']);
      // Clean up URL params
      window.history.replaceState({}, '', '/onboarding');
      // Navigate to step 12
      setStep(12);
    } else if (terraStatus === 'failed' && stepParam === '12') {
      // Connection failed - clean up URL
      window.history.replaceState({}, '', '/onboarding');
      setStep(12);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF6F1]">
        {/* Header skeleton */}
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10" />
            <div className="skeleton w-12 h-6 rounded-lg" />
            <div className="w-10" />
          </div>
          <div className="skeleton h-1.5 rounded-full" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-4">
          <div className="skeleton w-48 h-8 rounded-lg" />
          <div className="skeleton w-64 h-4 rounded-lg" />
          <div className="skeleton w-56 h-4 rounded-lg" />
        </div>

        {/* Button skeleton */}
        <div className="px-6 pb-8">
          <div className="skeleton h-14 rounded-full" />
        </div>
      </div>
    );
  }

  const userName = localName || profile?.name || 'there';

  // Calculate estimated health score for reveal
  const estimatedHealthScore = profile ? calculateHealthScore({
    ...profile,
    dataSources: localDataSources,
    priorities: localPriorities,
    connectedApps: localConnectedApps,
  }) : 45;

  const appNames: Record<ConnectedApp, string> = {
    'apple-health': 'Apple Health',
    'oura': 'Oura',
    'whoop': 'Whoop',
    'garmin': 'Garmin',
    'fitbit': 'Fitbit',
  };

  // Quick action handlers
  const handleCheckInNow = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setShowConfetti(true);

    try {
      addPoints('complete-onboarding', POINTS_CONFIG.COMPLETE_ONBOARDING, 'Completed onboarding');
      recalculateScores();
      await completeOnboarding();

      setTimeout(() => {
        router.push('/chat');
      }, 800);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsSaving(false);
      setShowConfetti(false);
    }
  };

  const handleExploreApp = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setShowConfetti(true);

    try {
      addPoints('complete-onboarding', POINTS_CONFIG.COMPLETE_ONBOARDING, 'Completed onboarding');
      recalculateScores();
      await completeOnboarding();

      setTimeout(() => {
        router.push('/home');
      }, 800);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsSaving(false);
      setShowConfetti(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1]">
      {/* Confetti celebration */}
      <Confetti active={showConfetti} />

      {/* Header with back button and progress */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-[12px] flex items-center justify-center text-[#8A8580] hover:text-[#2D2A26] transition-all hover:bg-[#F5EDE4] active:scale-[0.95]"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-10" />
          )}
          <span
            className="text-[22px] font-bold"
            style={{
              background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            yeww
          </span>
          <div className="w-10" />
        </div>
        {step > 1 && (
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #F5EDE4 0%, #EBE3DA 100%)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #E07A5F 0%, #F2CC8F 100%)',
                boxShadow: '0 0 8px rgba(224, 122, 95, 0.4)',
              }}
            />
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-6 pb-8 overflow-y-auto">

        {/* Step 1: Welcome */}
        {step === 1 && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <Message visible={messagesVisible >= 1} size="xl">
                Hey.
              </Message>
              <FadeIn visible={messagesVisible >= 1} delay={1800} className="mt-4">
                <p className="text-xl text-[#8A8580]">Let&apos;s build something together.</p>
              </FadeIn>
              <FadeIn visible={messagesVisible >= 1} delay={4000} className="mt-6 max-w-xs">
                <p className="text-base text-[#8A8580] leading-relaxed">
                  I&apos;ll give you one clear picture of your health data and help you make sense of it all. Over time, we&apos;ll grow together.
                </p>
              </FadeIn>
            </div>
            <FadeIn visible={contentVisible}>
              <Button fullWidth size="lg" onClick={handleNext}>
                Let&apos;s go
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 2: Name */}
        {step === 2 && (
          <>
            <div className="pt-4">
              <Message visible={messagesVisible >= 1}>
                First, what should I call you?
              </Message>
              <FadeIn visible={messagesVisible >= 1} delay={600}>
                <p className="text-sm text-[#B5AFA8] mt-2">I&apos;ll use this to personalize your experience.</p>
              </FadeIn>
            </div>
            <FadeIn visible={contentVisible} className="mt-8">
              <Input
                placeholder="First name works great"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                autoFocus
              />
              {localName.trim().length > 1 && (
                <p className="text-center text-[#E07A5F] mt-4 animate-fade-in">
                  Nice to meet you, {localName.trim()}.
                </p>
              )}
            </FadeIn>
            <div className="flex-1" />
            <FadeIn visible={contentVisible && localName.trim().length > 1} delay={100}>
              <Button fullWidth size="lg" onClick={handleNext}>
                Continue
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 3: Fragmentation Reveal */}
        {step === 3 && (
          <>
            <div className="pt-4 space-y-2">
              <Message visible={messagesVisible >= 1}>
                Quick question, {userName}.
              </Message>
              <Message visible={messagesVisible >= 2} size="md">
                Where does your health data live right now?
              </Message>
            </div>
            <FadeIn visible={contentVisible} className="mt-6 flex-1">
              <div className="grid grid-cols-3 gap-2">
                {DATA_SOURCES.map((source) => (
                  <DataSourceCard
                    key={source.id}
                    source={source}
                    selected={localDataSources.includes(source.id)}
                    onClick={() => toggleDataSource(source.id)}
                  />
                ))}
              </div>
              {localDataSources.length > 0 && (
                <p className="text-center text-[#E07A5F] font-medium mt-4">
                  {localDataSources.length} source{localDataSources.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </FadeIn>
            <FadeIn visible={contentVisible} delay={100} className="mt-4">
              <Button fullWidth size="lg" onClick={handleNext}>
                Continue
              </Button>
              <button
                onClick={() => {
                  setLocalDataSources([]);
                  handleNext();
                }}
                className="w-full text-center text-[#8A8580] text-sm mt-3 hover:text-[#2D2A26] transition-colors"
              >
                I don&apos;t track anything yet
              </button>
            </FadeIn>
          </>
        )}

        {/* Step 4: Scattered Data Moment */}
        {step === 4 && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              {localDataSources.length >= 2 ? (
                <>
                  <Message visible={scatteredPhase >= 1} size="xl">
                    {localDataSources.length} sources of health data.
                  </Message>
                  <FadeIn visible={scatteredPhase >= 2} delay={0} className="mt-6">
                    <p className="text-2xl text-[#2D2A26]">But who&apos;s connecting them?</p>
                  </FadeIn>
                  <FadeIn visible={scatteredPhase >= 3} delay={0} className="mt-6 max-w-xs">
                    <p className="text-base text-[#8A8580] leading-relaxed">
                      Who remembers that your sleep got worse when work got stressful? Who notices your energy always dips on Thursdays?
                    </p>
                  </FadeIn>
                  <FadeIn visible={scatteredPhase >= 4} delay={0} className="mt-6">
                    <p className="text-xl text-[#E07A5F] font-semibold">Right now? Nobody.</p>
                  </FadeIn>
                </>
              ) : (
                <>
                  <Message visible={messagesVisible >= 1} size="xl">
                    Starting fresh.
                  </Message>
                  <FadeIn visible={messagesVisible >= 2} delay={400} className="mt-4">
                    <p className="text-xl text-[#8A8580]">That&apos;s okay.</p>
                  </FadeIn>
                  <FadeIn visible={messagesVisible >= 3} delay={800} className="mt-6 max-w-xs">
                    <p className="text-base text-[#8A8580] leading-relaxed">
                      Most health apps fail because they only see one piece of the puzzle. yeww builds a complete picture of you over time.
                    </p>
                  </FadeIn>
                </>
              )}
            </div>
            <FadeIn visible={contentVisible}>
              <Button fullWidth size="lg" onClick={handleNext}>
                {localDataSources.length >= 2 ? 'Change that' : "Let's build your picture"}
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 5: The yeww Promise */}
        {step === 5 && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <FadeIn visible={messagesVisible >= 1} className="mb-6">
                <div className="w-20 h-20 rounded-full bg-[#FFE8DC] flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-[#E07A5F]" />
                </div>
              </FadeIn>
              <Message visible={messagesVisible >= 1} size="xl">
                Meet yeww.
              </Message>
              <FadeIn visible={messagesVisible >= 2} delay={0} className="mt-4 max-w-xs">
                <p className="text-base text-[#8A8580] leading-relaxed">
                  One AI that pulls everything together. Learns your patterns. Remembers your history.
                </p>
              </FadeIn>
              <FadeIn visible={messagesVisible >= 3} delay={0} className="mt-6 space-y-3">
                <p className="text-[#2D2A26]">Gets smarter about you over time</p>
                <p className="text-[#2D2A26]">Connects dots you&apos;d never see yourself</p>
                <p className="text-[#2D2A26]">Always there when you need it</p>
              </FadeIn>
            </div>
            <FadeIn visible={contentVisible}>
              <Button fullWidth size="lg" onClick={handleNext}>
                Tell me more
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 6: Privacy & Security */}
        {step === 6 && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <FadeIn visible={messagesVisible >= 1} className="mb-6">
                <div className="w-20 h-20 rounded-full bg-[#FFE8DC] flex items-center justify-center">
                  <LucideIcons.Shield className="w-10 h-10 text-[#E07A5F]" />
                </div>
              </FadeIn>
              <Message visible={messagesVisible >= 1} size="xl">
                Your data. Your rules.
              </Message>
              <FadeIn visible={messagesVisible >= 2} delay={0} className="mt-4 max-w-xs">
                <p className="text-base text-[#8A8580] leading-relaxed">
                  Everything you share with yeww is encrypted and secure.
                </p>
              </FadeIn>
              <FadeIn visible={messagesVisible >= 3} delay={0} className="mt-8 space-y-4 text-left max-w-xs">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#E07A5F] mt-0.5 flex-shrink-0" />
                  <p className="text-[#2D2A26]">Your raw data is never exposed — even when you share</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#E07A5F] mt-0.5 flex-shrink-0" />
                  <p className="text-[#2D2A26]">You control exactly what gets shared</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#E07A5F] mt-0.5 flex-shrink-0" />
                  <p className="text-[#2D2A26]">Earn Health Points when you contribute</p>
                </div>
              </FadeIn>
            </div>
            <FadeIn visible={contentVisible}>
              <Button fullWidth size="lg" onClick={handleNext}>
                Sounds good
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 7: Timeline Vision */}
        {step === 7 && (
          <>
            <div className="pt-4">
              <Message visible={messagesVisible >= 1}>
                This is a long game.
              </Message>
            </div>
            <FadeIn visible={contentVisible} className="mt-6 flex-1 overflow-y-auto">
              <div className="space-y-0">
                <TimelineItem
                  label="Week 1"
                  title="Learning your basics"
                  description="I'll learn how you sleep, how you move, how you feel day to day."
                  visible={timelineItemsVisible >= 1}
                  delay={0}
                />
                <TimelineItem
                  label="Weeks 2-4"
                  title="Spotting patterns"
                  description="I'll start noticing things. Why Tuesdays are harder. What helps you sleep better."
                  visible={timelineItemsVisible >= 2}
                  delay={0}
                />
                <TimelineItem
                  label="Month 2"
                  title="Connecting the dots"
                  description="I'll understand how everything links — your stress, your sleep, your energy, your habits."
                  visible={timelineItemsVisible >= 3}
                  delay={0}
                />
                <TimelineItem
                  label="Months 3-4"
                  title="Your health story"
                  description="I'll know your rhythms, your triggers, your wins. I'll remind you how far you've come."
                  visible={timelineItemsVisible >= 4}
                  delay={0}
                />
                <TimelineItem
                  label="Month 6"
                  title="Predicting, not just tracking"
                  description="I'll help you catch things early. See trends before they become problems."
                  visible={timelineItemsVisible >= 5}
                  delay={0}
                />
              </div>
            </FadeIn>
            <FadeIn visible={contentVisible && timelineItemsVisible >= 5} delay={500}>
              <Button fullWidth size="lg" onClick={handleNext}>
                I&apos;m in
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 7: Priorities */}
        {step === 8 && (
          <>
            <div className="pt-4 space-y-2">
              <Message visible={messagesVisible >= 1}>
                What matters most to you right now?
              </Message>
              <Message visible={messagesVisible >= 2} size="md">
                Pick your top priorities. We can always adjust later.
              </Message>
            </div>
            <FadeIn visible={contentVisible} className="mt-6 flex-1">
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((priority) => (
                  <PriorityChip
                    key={priority.id}
                    priority={priority}
                    selected={localPriorities.includes(priority.id)}
                    onClick={() => togglePriority(priority.id)}
                    disabled={localPriorities.length >= 3 && !localPriorities.includes(priority.id)}
                  />
                ))}
              </div>
              {localPriorities.length > 0 && (
                <div className="mt-6 animate-fade-in">
                  <p className="text-lg text-[#2D2A26]">
                    <span className="text-[#E07A5F] font-medium">
                      {localPriorities.map((p, i) => {
                        const priority = PRIORITIES.find(pr => pr.id === p);
                        const name = priority?.name || p;
                        if (i === 0) return name;
                        if (i === localPriorities.length - 1) return ` and ${name}`;
                        return `, ${name}`;
                      }).join('')}
                    </span>
                    {` — got it. I'll start here, ${userName}.`}
                  </p>
                  <p className="text-[#B5AFA8] text-xs mt-2">{localPriorities.length}/3 selected</p>
                </div>
              )}
            </FadeIn>
            <FadeIn visible={contentVisible && localPriorities.length > 0} delay={100}>
              <Button fullWidth size="lg" onClick={handleNext}>
                Continue
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 8: Past Attempts */}
        {step === 9 && (
          <>
            <div className="pt-4">
              <Message visible={messagesVisible >= 1}>
                Have you tried to work on this before?
              </Message>
            </div>
            <FadeIn visible={contentVisible} className="mt-6 space-y-3">
              {PAST_ATTEMPTS.map((attempt) => (
                <button
                  key={attempt.id}
                  onClick={() => setLocalPastAttempt(attempt.id)}
                  className="w-full p-4 rounded-[18px] text-left transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
                  style={{
                    background: localPastAttempt === attempt.id
                      ? 'linear-gradient(135deg, #FFE8DC 0%, #FFD4C4 100%)'
                      : 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
                    boxShadow: localPastAttempt === attempt.id
                      ? '0 4px 16px rgba(224, 122, 95, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                      : '0 2px 8px rgba(45, 42, 38, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                    border: localPastAttempt === attempt.id ? '2px solid #E07A5F' : '2px solid transparent',
                  }}
                >
                  <p className={`font-semibold text-[15px] ${localPastAttempt === attempt.id ? 'text-[#E07A5F]' : 'text-[#2D2A26]'}`}>
                    {attempt.label}
                  </p>
                </button>
              ))}
            </FadeIn>
            <div className="flex-1" />
            <FadeIn visible={contentVisible && localPastAttempt !== null} delay={100}>
              <Button fullWidth size="lg" onClick={handleNext}>
                Continue
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 9: Barriers (Conditional) */}
        {step === 10 && (
          <>
            <div className="pt-4 space-y-2">
              <Message visible={messagesVisible >= 1}>
                What usually gets in the way?
              </Message>
              <Message visible={messagesVisible >= 2} size="md">
                No judgment. Just helps me understand.
              </Message>
            </div>
            <FadeIn visible={contentVisible} className="mt-6 flex-1">
              <div className="space-y-2.5">
                {BARRIERS.map((barrier) => (
                  <button
                    key={barrier.id}
                    onClick={() => toggleBarrier(barrier.id)}
                    className="w-full p-3.5 rounded-[16px] text-left transition-all duration-300 flex items-center justify-between hover:-translate-y-0.5 active:scale-[0.98]"
                    style={{
                      background: localBarriers.includes(barrier.id)
                        ? 'linear-gradient(135deg, #FFE8DC 0%, #FFD4C4 100%)'
                        : 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
                      boxShadow: localBarriers.includes(barrier.id)
                        ? '0 4px 16px rgba(224, 122, 95, 0.2)'
                        : '0 2px 8px rgba(45, 42, 38, 0.06)',
                      border: localBarriers.includes(barrier.id) ? '2px solid #E07A5F' : '2px solid transparent',
                    }}
                  >
                    <span className={`font-semibold text-[14px] ${localBarriers.includes(barrier.id) ? 'text-[#E07A5F]' : 'text-[#2D2A26]'}`}>
                      {barrier.label}
                    </span>
                    {localBarriers.includes(barrier.id) && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)' }}
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </FadeIn>
            <FadeIn visible={contentVisible && localBarriers.length > 0} delay={100} className="mt-4">
              <Button fullWidth size="lg" onClick={handleNext}>
                Continue
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 10: Coaching Style */}
        {step === 11 && (
          <>
            <div className="pt-4">
              <Message visible={messagesVisible >= 1}>
                How do you like to be coached?
              </Message>
            </div>
            <FadeIn visible={contentVisible} className="mt-6 space-y-3">
              {[
                { value: 'direct' as CoachingStyle, label: 'Straight talk', desc: "No sugarcoating. Tell me what I need to hear." },
                { value: 'supportive' as CoachingStyle, label: 'Supportive', desc: 'Encouraging and patient. Help me stay positive.' },
                { value: 'balanced' as CoachingStyle, label: 'Balanced', desc: 'A bit of both, depending on the situation.' },
              ].map((style) => (
                <button
                  key={style.value}
                  onClick={() => setLocalCoachingStyle(style.value)}
                  className="w-full p-4 rounded-[18px] text-left transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
                  style={{
                    background: localCoachingStyle === style.value
                      ? 'linear-gradient(135deg, #FFE8DC 0%, #FFD4C4 100%)'
                      : 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
                    boxShadow: localCoachingStyle === style.value
                      ? '0 4px 16px rgba(224, 122, 95, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                      : '0 2px 8px rgba(45, 42, 38, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                    border: localCoachingStyle === style.value ? '2px solid #E07A5F' : '2px solid transparent',
                  }}
                >
                  <p className={`font-semibold text-[15px] ${localCoachingStyle === style.value ? 'text-[#E07A5F]' : 'text-[#2D2A26]'}`}>
                    {style.label}
                  </p>
                  <p className="text-[#8A8580] text-[13px] mt-1">{style.desc}</p>
                </button>
              ))}
            </FadeIn>

            {/* AI voice preview */}
            {localCoachingStyle && (
              <div className="mt-6 animate-fade-in">
                <div className="flex gap-3">
                  <div
                    className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-[#E07A5F]"
                    style={{ background: 'linear-gradient(135deg, #FFE8DC 0%, #FFD4C4 100%)' }}
                  >
                    y
                  </div>
                  <div
                    className="rounded-[16px] rounded-tl-[6px] p-4 max-w-[85%]"
                    style={{
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
                      boxShadow: '0 2px 12px rgba(45, 42, 38, 0.06)',
                    }}
                  >
                    <p className="text-[14px] text-[#2D2A26] leading-relaxed">
                      {localCoachingStyle === 'direct' && "You've got gaps in your routine. Let's fix them."}
                      {localCoachingStyle === 'supportive' && "You're already taking a great step by being here. Let's build on that together."}
                      {localCoachingStyle === 'balanced' && "Good start. I'll push you when needed, support you when it counts."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1" />
            <FadeIn visible={contentVisible && localCoachingStyle !== null} delay={100}>
              <Button fullWidth size="lg" onClick={handleNext}>
                Continue
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 11: Connect Data */}
        {step === 12 && (
          <>
            <div className="pt-4 space-y-2">
              <Message visible={messagesVisible >= 1}>
                Let&apos;s connect your health data.
              </Message>
              <Message visible={messagesVisible >= 2} size="md">
                The more I can see, the better I can help. You control what&apos;s shared.
              </Message>
            </div>
            <FadeIn visible={contentVisible} className="mt-6 flex-1">
              {/* Terra Connected Badge */}
              {terraConnectedDevices.length > 0 && (
                <div
                  className="mb-4 p-4 rounded-[16px] flex items-center gap-3"
                  style={{
                    background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.15)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)' }}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[#2E7D32] font-semibold text-[14px]">Connected successfully!</span>
                </div>
              )}

              {/* Supported sources list */}
              <div className="mb-6">
                <p className="text-[11px] text-[#B5AFA8] uppercase tracking-wider font-semibold mb-3">Supported sources</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'apple-health', name: 'Apple Health' },
                    { id: 'oura', name: 'Oura' },
                    { id: 'whoop', name: 'Whoop' },
                    { id: 'garmin', name: 'Garmin' },
                    { id: 'fitbit', name: 'Fitbit' },
                    { id: 'strava', name: 'Strava' },
                    { id: 'google-fit', name: 'Google Fit' },
                  ].map((source) => (
                    <span
                      key={source.id}
                      className="px-3 py-1.5 rounded-[10px] text-[12px] font-medium text-[#8A8580]"
                      style={{ background: 'linear-gradient(135deg, #F5EDE4 0%, #EBE3DA 100%)' }}
                    >
                      {source.name}
                    </span>
                  ))}
                  <span
                    className="px-3 py-1.5 rounded-[10px] text-[12px] font-medium text-[#8A8580]"
                    style={{ background: 'linear-gradient(135deg, #F5EDE4 0%, #EBE3DA 100%)' }}
                  >
                    + more
                  </span>
                </div>
              </div>

              {/* Connect Button */}
              <button
                onClick={handleConnectDevice}
                disabled={isConnectingTerra}
                className="w-full p-4 rounded-[18px] text-white flex items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)',
                  boxShadow: '0 4px 16px rgba(224, 122, 95, 0.35)',
                }}
              >
                {isConnectingTerra ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-semibold text-[15px]">Connecting...</span>
                  </>
                ) : (
                  <span className="font-semibold text-[15px]">Connect a source</span>
                )}
              </button>

              <p className="text-center text-[11px] text-[#B5AFA8] mt-4">
                Securely connect via Terra • Your data stays private
              </p>
            </FadeIn>
            <FadeIn visible={contentVisible} delay={100} className="mt-4">
              <Button fullWidth size="lg" variant="secondary" onClick={handleNext}>
                {terraConnectedDevices.length > 0 ? 'Continue' : "I'll do this later"}
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 12: Health Score Reveal */}
        {step === 13 && (
          <>
            {terraConnectedDevices.length > 0 ? (
              // Connected: Show actual score
              <>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <Message visible={messagesVisible >= 1}>
                    Here&apos;s where you&apos;re starting.
                  </Message>
                  <FadeIn visible={messagesVisible >= 2} delay={400} className="mt-8">
                    <HealthScoreGauge score={estimatedHealthScore} size="lg" animated />
                  </FadeIn>
                  <FadeIn visible={contentVisible} delay={200} className="mt-4">
                    <p className="text-sm text-[#8A8580]">Your Health Score</p>
                    <p className="text-xs text-[#8A8580] mt-2 max-w-xs">
                      Based on your connected data. This will get more accurate as I learn you.
                    </p>
                  </FadeIn>
                </div>
                <FadeIn visible={contentVisible} delay={300}>
                  <Button fullWidth size="lg" onClick={handleNext}>
                    See how to improve
                  </Button>
                </FadeIn>
              </>
            ) : (
              // Not connected: Show placeholder
              <>
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                  <Message visible={messagesVisible >= 1}>
                    Your Health Score
                  </Message>
                  <FadeIn visible={messagesVisible >= 2} delay={400} className="mt-8">
                    <div className="w-32 h-32 rounded-full border-4 border-dashed border-[#E5DED5] flex items-center justify-center">
                      <span className="text-5xl text-[#B5AFA8]">?</span>
                    </div>
                  </FadeIn>
                  <FadeIn visible={contentVisible} delay={200} className="mt-6">
                    <p className="text-lg text-[#2D2A26]">I don&apos;t have enough data yet.</p>
                    <p className="text-sm text-[#8A8580] mt-2 max-w-xs">
                      Connect a health source to unlock your score. The more I see, the more accurate it gets.
                    </p>
                  </FadeIn>
                </div>
                <FadeIn visible={contentVisible} delay={300} className="space-y-3">
                  <Button fullWidth size="lg" onClick={() => setStep(12)}>
                    Connect now
                  </Button>
                  <Button fullWidth size="lg" variant="secondary" onClick={handleNext}>
                    I&apos;ll do this later
                  </Button>
                </FadeIn>
              </>
            )}
          </>
        )}

        {/* Step 13: Reputation Score */}
        {step === 14 && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <Message visible={messagesVisible >= 1}>
                Everyone starts here.
              </Message>
              <FadeIn visible={messagesVisible >= 2} delay={400} className="mt-6">
                {/* Current level - highlighted */}
                <div className="bg-[#F5EDE4] rounded-2xl p-5 inline-block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#8A8580]/10 flex items-center justify-center">
                      <LucideIcons.Star className="w-5 h-5 text-[#8A8580]" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[#2D2A26]">Starter</p>
                      <p className="text-xs text-[#8A8580]">Your journey begins</p>
                    </div>
                  </div>
                </div>
                {/* Progression path */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#8A8580]" />
                  <div className="w-6 h-px bg-[#E5DED5]" />
                  <div className="w-2 h-2 rounded-full bg-[#E5DED5]" title="Regular" />
                  <div className="w-6 h-px bg-[#E5DED5]" />
                  <div className="w-2 h-2 rounded-full bg-[#E5DED5]" title="Trusted" />
                  <div className="w-6 h-px bg-[#E5DED5]" />
                  <div className="w-2 h-2 rounded-full bg-[#E5DED5]" title="Verified" />
                  <div className="w-6 h-px bg-[#E5DED5]" />
                  <LucideIcons.Crown className="w-4 h-4 text-[#E5DED5]" />
                </div>
              </FadeIn>
              <FadeIn visible={contentVisible} delay={0} className="mt-6">
                <p className="text-lg font-semibold text-[#2D2A26]">This is how well I know you.</p>
                <p className="text-sm text-[#8A8580] mt-2 max-w-xs">
                  The more you share — securely — the better my advice becomes.
                </p>
              </FadeIn>
              <FadeIn visible={contentVisible} delay={200} className="mt-5 space-y-3 text-sm text-left max-w-xs">
                <div className="flex items-start gap-2">
                  <LucideIcons.MessageCircle className="w-4 h-4 text-[#E07A5F] mt-0.5 flex-shrink-0" />
                  <p className="text-[#2D2A26]">Check in regularly for personalized advice</p>
                </div>
                <div className="flex items-start gap-2">
                  <LucideIcons.Link className="w-4 h-4 text-[#E07A5F] mt-0.5 flex-shrink-0" />
                  <p className="text-[#2D2A26]">Connect data sources for a clearer picture</p>
                </div>
                <div className="flex items-start gap-2">
                  <LucideIcons.TrendingUp className="w-4 h-4 text-[#E07A5F] mt-0.5 flex-shrink-0" />
                  <p className="text-[#2D2A26]">Stay consistent to unlock smarter insights</p>
                </div>
              </FadeIn>
            </div>
            <FadeIn visible={contentVisible} delay={300}>
              <Button fullWidth size="lg" onClick={handleNext}>
                Let&apos;s grow it
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 14: Points Preview */}
        {step === 15 && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <Message visible={messagesVisible >= 1}>
                Meet Health Points.
              </Message>
              <FadeIn visible={messagesVisible >= 2} delay={400} className="mt-6">
                <div className="bg-[#F5EDE4] rounded-2xl p-6 inline-block relative">
                  {/* Animated points display */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E07A5F] to-[#D36B4F] flex items-center justify-center">
                      <LucideIcons.Coins className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-3xl font-bold text-[#2D2A26] tabular-nums">{animatedPoints}</p>
                      <p className="text-xs text-[#8A8580]">Health Points</p>
                    </div>
                  </div>
                  {/* Welcome bonus badge */}
                  {animatedPoints >= 100 && (
                    <div className="absolute -top-2 -right-2 bg-[#4ADE80] text-white text-xs font-medium px-2 py-0.5 rounded-full animate-fade-in">
                      Welcome bonus!
                    </div>
                  )}
                </div>
              </FadeIn>
              <FadeIn visible={contentVisible} delay={0} className="mt-5">
                <p className="text-lg font-semibold text-[#2D2A26]">Earn points. Unlock real rewards.</p>
              </FadeIn>
              <FadeIn visible={contentVisible} delay={200} className="mt-5 space-y-3 text-sm text-left max-w-xs">
                <div className="flex items-start gap-2">
                  <LucideIcons.CalendarCheck className="w-4 h-4 text-[#E07A5F] mt-0.5 flex-shrink-0" />
                  <p className="text-[#2D2A26]">Check in daily: <span className="font-medium">+{POINTS_CONFIG.CHECK_IN} pts</span></p>
                </div>
                <div className="flex items-start gap-2">
                  <LucideIcons.Activity className="w-4 h-4 text-[#E07A5F] mt-0.5 flex-shrink-0" />
                  <p className="text-[#2D2A26]">Connect health data: <span className="font-medium">+{POINTS_CONFIG.CONNECT_SOURCE} pts</span></p>
                </div>
                <div className="flex items-start gap-2">
                  <LucideIcons.Flame className="w-4 h-4 text-[#E07A5F] mt-0.5 flex-shrink-0" />
                  <p className="text-[#2D2A26]">Build streaks: <span className="font-medium">bonus pts</span></p>
                </div>
              </FadeIn>
              <FadeIn visible={contentVisible} delay={400} className="mt-5">
                <div className="bg-[#FAF6F1] border border-[#F5EDE4] rounded-xl p-4 max-w-xs">
                  <p className="text-sm text-[#2D2A26] font-medium">Redeem for real rewards</p>
                  <p className="text-xs text-[#8A8580] mt-1">
                    Airline miles, hotel stays, wellness products, and exclusive offers — all from taking care of yourself.
                  </p>
                </div>
              </FadeIn>
            </div>
            <FadeIn visible={contentVisible} delay={500}>
              <Button fullWidth size="lg" onClick={handleNext}>
                Love it
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 15: Commitment Moment */}
        {step === 16 && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <Message visible={messagesVisible >= 1} size="xl">
                Ready, {userName}?
              </Message>
              <FadeIn visible={messagesVisible >= 2} delay={400} className="mt-6 max-w-xs">
                <p className="text-base text-[#8A8580]">
                  This works best if you&apos;re in it for the long haul. I&apos;ll show up every day. Will you?
                </p>
              </FadeIn>
            </div>
            <FadeIn visible={contentVisible}>
              <Button fullWidth size="lg" onClick={handleNext} glow>
                I&apos;m in
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 16: AI Introduction */}
        {step === 17 && (
          <>
            <div className="flex-1 flex flex-col pt-8">
              <div className="space-y-4">
                {/* AI message 1 */}
                <div
                  className="transition-all duration-700 ease-out"
                  style={{
                    opacity: aiMessagesVisible >= 1 ? 1 : 0,
                    transform: aiMessagesVisible >= 1 ? 'translateY(0)' : 'translateY(16px)',
                  }}
                >
                  <div className="flex gap-3">
                    <div
                      className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-[#E07A5F]"
                      style={{ background: 'linear-gradient(135deg, #FFE8DC 0%, #FFD4C4 100%)' }}
                    >
                      y
                    </div>
                    <div
                      className="rounded-[16px] rounded-tl-[6px] p-4 max-w-[85%]"
                      style={{
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
                        boxShadow: '0 2px 12px rgba(45, 42, 38, 0.06)',
                      }}
                    >
                      <p className="text-[15px] text-[#2D2A26] leading-relaxed">Hey {userName}. I&apos;m yeww.</p>
                    </div>
                  </div>
                </div>

                {/* AI message 2 */}
                <div
                  className="transition-all duration-700 ease-out"
                  style={{
                    opacity: aiMessagesVisible >= 2 ? 1 : 0,
                    transform: aiMessagesVisible >= 2 ? 'translateY(0)' : 'translateY(16px)',
                  }}
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 flex-shrink-0" />
                    <div
                      className="rounded-[16px] rounded-tl-[6px] p-4 max-w-[85%]"
                      style={{
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
                        boxShadow: '0 2px 12px rgba(45, 42, 38, 0.06)',
                      }}
                    >
                      <p className="text-[15px] text-[#2D2A26] leading-relaxed">
                        Based on what you&apos;ve told me, you want to{' '}
                        {localPriorities.map((p, i) => {
                          const priority = PRIORITIES.find(pr => pr.id === p);
                          const name = priority?.name.toLowerCase() || p;
                          if (i === 0) return name;
                          if (i === localPriorities.length - 1) return ` and ${name}`;
                          return `, ${name}`;
                        }).join('')}.
                        {localPastAttempt && localPastAttempt !== 'not-really' && (
                          <> I know it hasn&apos;t stuck before. That&apos;s okay.</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI message 3 */}
                <div
                  className="transition-all duration-700 ease-out"
                  style={{
                    opacity: aiMessagesVisible >= 3 ? 1 : 0,
                    transform: aiMessagesVisible >= 3 ? 'translateY(0)' : 'translateY(16px)',
                  }}
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 flex-shrink-0" />
                    <div
                      className="rounded-[16px] rounded-tl-[6px] p-4 max-w-[85%]"
                      style={{
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
                        boxShadow: '0 2px 12px rgba(45, 42, 38, 0.06)',
                      }}
                    >
                      <p className="text-[15px] text-[#2D2A26] leading-relaxed">I don&apos;t know everything yet. But I will.</p>
                    </div>
                  </div>
                </div>

                {/* AI message 4 */}
                <div
                  className="transition-all duration-700 ease-out"
                  style={{
                    opacity: aiMessagesVisible >= 4 ? 1 : 0,
                    transform: aiMessagesVisible >= 4 ? 'translateY(0)' : 'translateY(16px)',
                  }}
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 flex-shrink-0" />
                    <div
                      className="rounded-[16px] rounded-tl-[6px] p-4 max-w-[85%]"
                      style={{
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
                        boxShadow: '0 2px 12px rgba(45, 42, 38, 0.06)',
                      }}
                    >
                      <p className="text-[15px] text-[#2D2A26] leading-relaxed font-medium">Ready when you are.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Single action button */}
            <FadeIn visible={aiMessagesVisible >= 4} delay={500}>
              <Button fullWidth size="lg" onClick={handleNext} disabled={isSaving} glow>
                {isSaving ? 'Setting up...' : "Let's go"}
              </Button>
            </FadeIn>
          </>
        )}

      </div>
    </div>
  );
}
