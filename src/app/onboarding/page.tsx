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
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div
      className="transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
      }}
    >
      <p className={`${sizeClasses[size]} text-[#2D2A26] leading-relaxed`}>{children}</p>
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
      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300 min-h-[80px] active:scale-[0.97] ${
        selected
          ? 'border-[#E07A5F] bg-[#FFE8DC] shadow-md'
          : 'border-[#F5EDE4] bg-white hover:border-[#E07A5F]/50 hover:shadow-sm'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 ${
        brandColor ? brandColor.iconBg : 'bg-[#F5EDE4]'
      }`}>
        <IconComponent className={`w-4 h-4 ${brandColor ? 'text-white' : selected ? 'text-[#E07A5F]' : 'text-[#8A8580]'}`} />
      </div>
      <span className={`text-xs font-medium text-center leading-tight ${selected ? 'text-[#2D2A26]' : 'text-[#8A8580]'}`}>
        {source.name}
      </span>
      {selected && (
        <Check className="w-3 h-3 text-[#E07A5F] mt-1" />
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
    className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
      selected
        ? 'bg-[#E07A5F] text-white'
        : disabled
          ? 'bg-[#F5EDE4] text-[#B5AFA8] cursor-not-allowed'
          : 'bg-[#F5EDE4] text-[#2D2A26] hover:bg-[#EBE3DA]'
    }`}
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
      <div className="w-3 h-3 rounded-full bg-[#E07A5F]" />
      <div className="w-0.5 flex-1 bg-[#F5EDE4] min-h-[60px]" />
    </div>
    <div className="pb-6">
      <p className="text-xs font-semibold text-[#E07A5F] uppercase tracking-wide">{label}</p>
      <p className="text-lg font-semibold text-[#2D2A26] mt-1">{title}</p>
      <p className="text-sm text-[#8A8580] mt-1">{description}</p>
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

  // Total steps (accounting for conditional step 9)
  const shouldShowBarriers = localPastAttempt && localPastAttempt !== 'not-really';
  const totalSteps = shouldShowBarriers ? 16 : 15;

  // Get current step index for progress bar
  const getStepIndex = () => {
    if (step <= 8) return step;
    if (step === 9) return shouldShowBarriers ? 9 : 9; // This shouldn't happen if properly skipped
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
      case 6: return 1; // Timeline
      case 7: return 2; // Priorities
      case 8: return 1; // Past attempts
      case 9: return 2; // Barriers
      case 10: return 1; // Coaching style
      case 11: return 2; // Connect data
      case 12: return 2; // Health score
      case 13: return 2; // Reputation
      case 14: return 2; // Points
      case 15: return 2; // Commitment
      case 16: return 4; // AI intro
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
          const delay = step === 4 ? 1200 : step === 16 ? 1000 : 800;
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
      if (step === 6) {
        for (let i = 1; i <= 5; i++) {
          setTimeout(() => setTimelineItemsVisible(i), 800 + i * 400);
        }
      }

      // Special animation for AI intro
      if (step === 16) {
        for (let i = 1; i <= 4; i++) {
          setTimeout(() => setAiMessagesVisible(i), 500 + i * 1000);
        }
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
      case 7:
        setPriorities(localPriorities);
        break;
      case 8:
        if (localPastAttempt) setPastAttempt(localPastAttempt);
        break;
      case 9:
        setBarriers(localBarriers);
        break;
      case 10:
        if (localCoachingStyle) setCoachingStyle(localCoachingStyle);
        break;
      case 11:
        setConnectedApps(localConnectedApps);
        // Award points for connecting sources
        localConnectedApps.forEach(() => {
          addPoints('connect-source', POINTS_CONFIG.CONNECT_SOURCE, 'Connected health app');
        });
        break;
      case 16:
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
    // Skip step 9 if user selected "not-really" for past attempts
    if (step === 8 && localPastAttempt === 'not-really') {
      nextStep = 10;
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
    // Skip step 9 going back if it was skipped going forward
    if (step === 10 && (!localPastAttempt || localPastAttempt === 'not-really')) {
      prevStep = 8;
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
          successRedirectUrl: `${window.location.origin}/onboarding?terra=connected&step=11`,
          failureRedirectUrl: `${window.location.origin}/onboarding?terra=failed&step=11`,
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

    if (terraStatus === 'connected' && stepParam === '11') {
      // Successfully connected - could fetch actual connected device
      // For now, just mark as having a connected device
      setTerraConnectedDevices(prev => [...prev, 'device']);
      // Clean up URL params
      window.history.replaceState({}, '', '/onboarding');
      // Navigate to step 11
      setStep(11);
    } else if (terraStatus === 'failed' && stepParam === '11') {
      // Connection failed - clean up URL
      window.history.replaceState({}, '', '/onboarding');
      setStep(11);
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
            <button onClick={handleBack} className="p-2 -ml-2 text-[#8A8580] hover:text-[#2D2A26] transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-10" />
          )}
          <span className="text-[#E07A5F] text-xl font-semibold">yeww</span>
          <div className="w-10" />
        </div>
        {step > 1 && (
          <ProgressBar progress={progress} />
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-6 pb-8 overflow-y-auto">

        {/* Step 1: Welcome */}
        {step === 1 && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <Message visible={messagesVisible >= 1} size="xl">
                Hey.
              </Message>
              <FadeIn visible={messagesVisible >= 1} delay={400} className="mt-4">
                <p className="text-xl text-[#8A8580]">Let&apos;s build something together.</p>
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
            </div>
            <FadeIn visible={contentVisible} className="mt-8">
              <Input
                placeholder="Your name"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                autoFocus
              />
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
              {localDataSources.length >= 3 ? (
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
                {localDataSources.length >= 3 ? 'Change that' : "Let's build your picture"}
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

        {/* Step 6: Timeline Vision */}
        {step === 6 && (
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
                  title="Getting to know you"
                  description="I'll learn your basics — how you sleep, how you move, how you feel day to day."
                  visible={timelineItemsVisible >= 1}
                  delay={0}
                />
                <TimelineItem
                  label="Month 1"
                  title="Spotting patterns"
                  description="I'll start noticing things. Why Tuesdays are harder. What helps you sleep better."
                  visible={timelineItemsVisible >= 2}
                  delay={0}
                />
                <TimelineItem
                  label="Month 6"
                  title="Connecting the dots"
                  description="I'll understand how everything links — your stress, your sleep, your energy, your habits."
                  visible={timelineItemsVisible >= 3}
                  delay={0}
                />
                <TimelineItem
                  label="Year 1"
                  title="Your health story"
                  description="I'll know your rhythms, your triggers, your wins. I'll remind you how far you've come."
                  visible={timelineItemsVisible >= 4}
                  delay={0}
                />
                <TimelineItem
                  label="Year 5+"
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
        {step === 7 && (
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
                <p className="text-[#8A8580] text-sm mt-4">
                  {localPriorities.length}/3 selected
                </p>
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
        {step === 8 && (
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
                  className={`w-full p-4 rounded-2xl text-left transition-all duration-300 ${
                    localPastAttempt === attempt.id
                      ? 'bg-[#FFE8DC] border-2 border-[#E07A5F]'
                      : 'bg-[#F5EDE4] border-2 border-transparent hover:bg-[#EBE3DA]'
                  }`}
                >
                  <p className={`font-medium ${localPastAttempt === attempt.id ? 'text-[#E07A5F]' : 'text-[#2D2A26]'}`}>
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
        {step === 9 && (
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
              <div className="space-y-2">
                {BARRIERS.map((barrier) => (
                  <button
                    key={barrier.id}
                    onClick={() => toggleBarrier(barrier.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all duration-300 flex items-center justify-between ${
                      localBarriers.includes(barrier.id)
                        ? 'bg-[#FFE8DC] border-2 border-[#E07A5F]'
                        : 'bg-[#F5EDE4] border-2 border-transparent hover:bg-[#EBE3DA]'
                    }`}
                  >
                    <span className={`font-medium ${localBarriers.includes(barrier.id) ? 'text-[#E07A5F]' : 'text-[#2D2A26]'}`}>
                      {barrier.label}
                    </span>
                    {localBarriers.includes(barrier.id) && (
                      <Check className="w-5 h-5 text-[#E07A5F]" />
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
        {step === 10 && (
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
                  className={`w-full p-4 rounded-2xl text-left transition-all duration-300 ${
                    localCoachingStyle === style.value
                      ? 'bg-[#FFE8DC] border-2 border-[#E07A5F]'
                      : 'bg-[#F5EDE4] border-2 border-transparent hover:bg-[#EBE3DA]'
                  }`}
                >
                  <p className={`font-medium ${localCoachingStyle === style.value ? 'text-[#E07A5F]' : 'text-[#2D2A26]'}`}>
                    {style.label}
                  </p>
                  <p className="text-[#8A8580] text-sm mt-0.5">{style.desc}</p>
                </button>
              ))}
            </FadeIn>
            <div className="flex-1" />
            <FadeIn visible={contentVisible && localCoachingStyle !== null} delay={100}>
              <Button fullWidth size="lg" onClick={handleNext}>
                Continue
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 11: Connect Data */}
        {step === 11 && (
          <>
            <div className="pt-4 space-y-2">
              <Message visible={messagesVisible >= 1}>
                Let&apos;s connect your wearables.
              </Message>
              <Message visible={messagesVisible >= 2} size="md">
                The more I can see, the better I can help. You control what&apos;s shared.
              </Message>
            </div>
            <FadeIn visible={contentVisible} className="mt-6 flex-1">
              {/* Terra Connected Badge */}
              {terraConnectedDevices.length > 0 && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">Device connected successfully!</span>
                </div>
              )}

              {/* Supported devices preview with brand colors */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { id: 'oura', name: 'Oura', emoji: '💍' },
                  { id: 'whoop', name: 'Whoop', emoji: '⌚' },
                  { id: 'garmin', name: 'Garmin', emoji: '⌚' },
                  { id: 'fitbit', name: 'Fitbit', emoji: '📊' },
                  { id: 'apple-health', name: 'Apple', emoji: '🍎' },
                  { id: 'google-fit', name: 'Google', emoji: '📱' },
                ].map((device) => {
                  const brandColor = BRAND_COLORS[device.id];
                  return (
                    <div
                      key={device.id}
                      className="flex flex-col items-center p-3 rounded-xl bg-[#F5EDE4] border-2 border-transparent"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                        brandColor ? brandColor.iconBg : 'bg-gray-200'
                      }`}>
                        <span className="text-lg">{device.emoji}</span>
                      </div>
                      <span className="text-xs text-[#8A8580] font-medium">{device.name}</span>
                    </div>
                  );
                })}
              </div>

              {/* Connect Device Button */}
              <button
                onClick={handleConnectDevice}
                disabled={isConnectingTerra}
                className="w-full p-4 rounded-2xl bg-white border-2 border-dashed border-[#E07A5F] flex items-center justify-center gap-3 transition-all duration-300 hover:bg-[#FFF5F2] active:scale-[0.98] disabled:opacity-50"
              >
                {isConnectingTerra ? (
                  <>
                    <Loader2 className="w-5 h-5 text-[#E07A5F] animate-spin" />
                    <span className="font-medium text-[#E07A5F]">Connecting...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">+</span>
                    <span className="font-medium text-[#E07A5F]">Connect a Device</span>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[#B5AFA8] mt-4">
                Securely connect via Terra • Your data stays private
              </p>
            </FadeIn>
            <FadeIn visible={contentVisible} delay={100} className="mt-4">
              <Button fullWidth size="lg" onClick={handleNext}>
                {terraConnectedDevices.length > 0 ? 'Continue' : "I'll do this later"}
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 12: Health Score Reveal */}
        {step === 12 && (
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
                  One number that captures the full picture. This will get more accurate as I learn you.
                </p>
              </FadeIn>
            </div>
            <FadeIn visible={contentVisible} delay={300}>
              <Button fullWidth size="lg" onClick={handleNext}>
                See how to improve
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 13: Reputation Score */}
        {step === 13 && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <Message visible={messagesVisible >= 1}>
                One more thing.
              </Message>
              <FadeIn visible={messagesVisible >= 2} delay={400} className="mt-6">
                <div className="bg-[#F5EDE4] rounded-2xl p-6 inline-block">
                  <ReputationBadge level="starter" size="lg" />
                </div>
              </FadeIn>
              <FadeIn visible={contentVisible} delay={0} className="mt-4">
                <p className="text-lg font-semibold text-[#2D2A26]">Your Reputation Score</p>
                <p className="text-sm text-[#8A8580] mt-2 max-w-xs">
                  This measures how well I know you. The more you share, the more accurate my advice gets.
                </p>
              </FadeIn>
              <FadeIn visible={contentVisible} delay={200} className="mt-6 space-y-2 text-sm text-left max-w-xs">
                <p className="text-[#2D2A26]">Check in regularly = better advice</p>
                <p className="text-[#2D2A26]">Connect more data = clearer picture</p>
                <p className="text-[#2D2A26]">Be consistent = smarter insights</p>
              </FadeIn>
            </div>
            <FadeIn visible={contentVisible} delay={300}>
              <Button fullWidth size="lg" onClick={handleNext}>
                Got it
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 14: Points Preview */}
        {step === 14 && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <Message visible={messagesVisible >= 1}>
                One more thing — Health Points.
              </Message>
              <FadeIn visible={messagesVisible >= 2} delay={400} className="mt-6">
                <div className="bg-[#F5EDE4] rounded-2xl p-6 inline-block">
                  <PointsDisplay points={0} size="lg" showLabel />
                </div>
              </FadeIn>
              <FadeIn visible={contentVisible} delay={0} className="mt-4">
                <p className="text-lg font-semibold text-[#2D2A26]">Simple rewards for showing up.</p>
              </FadeIn>
              <FadeIn visible={contentVisible} delay={200} className="mt-6 space-y-2 text-sm text-left max-w-xs">
                <p className="text-[#2D2A26]">Check in daily: +{POINTS_CONFIG.CHECK_IN} points</p>
                <p className="text-[#2D2A26]">Connect health apps: +{POINTS_CONFIG.CONNECT_SOURCE} points</p>
                <p className="text-[#2D2A26]">Build streaks: bonus points</p>
              </FadeIn>
              <FadeIn visible={contentVisible} delay={400} className="mt-4">
                <p className="text-xs text-[#8A8580] max-w-xs">
                  Points will unlock rewards as yeww grows. For now, just watch them stack up.
                </p>
              </FadeIn>
            </div>
            <FadeIn visible={contentVisible} delay={500}>
              <Button fullWidth size="lg" onClick={handleNext}>
                Nice
              </Button>
            </FadeIn>
          </>
        )}

        {/* Step 15: Commitment Moment */}
        {step === 15 && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <Message visible={messagesVisible >= 1} size="xl">
                Ready to start?
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
        {step === 16 && (
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
                  <div className="bg-[#F5EDE4] rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
                    <p className="text-[#2D2A26]">Hey {userName}. I&apos;m yeww.</p>
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
                  <div className="bg-[#F5EDE4] rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
                    <p className="text-[#2D2A26]">
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

                {/* AI message 3 */}
                <div
                  className="transition-all duration-700 ease-out"
                  style={{
                    opacity: aiMessagesVisible >= 3 ? 1 : 0,
                    transform: aiMessagesVisible >= 3 ? 'translateY(0)' : 'translateY(16px)',
                  }}
                >
                  <div className="bg-[#F5EDE4] rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
                    <p className="text-[#2D2A26]">I don&apos;t know everything yet. But I will.</p>
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
                  <div className="bg-[#F5EDE4] rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
                    <p className="text-[#2D2A26]">Ready when you are.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <FadeIn visible={aiMessagesVisible >= 4} delay={500} className="space-y-3">
              <Button fullWidth size="lg" onClick={handleCheckInNow} disabled={isSaving} glow>
                {isSaving ? 'Setting up...' : 'Check in now'}
              </Button>
              <Button fullWidth size="lg" variant="secondary" onClick={handleExploreApp} disabled={isSaving}>
                Explore the app
              </Button>
            </FadeIn>
          </>
        )}

      </div>
    </div>
  );
}
