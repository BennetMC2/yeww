'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Watch, Apple, FlaskConical, Camera, ChevronRight, Lightbulb } from 'lucide-react';
import { DataSource } from '@/types';

interface AddDataCTAProps {
  dataSources: DataSource[];
  hasWearable: boolean;
}

interface CTASuggestion {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  bgColor: string;
}

const WEARABLE_SOURCES: DataSource[] = ['apple-health', 'google-fit', 'oura', 'whoop', 'garmin', 'fitbit'];

function getSuggestions(dataSources: DataSource[], hasWearable: boolean): CTASuggestion[] {
  const suggestions: CTASuggestion[] = [];

  // No wearable connected
  if (!hasWearable) {
    suggestions.push({
      id: 'connect-wearable',
      icon: <Watch className="w-5 h-5 text-blue-500" />,
      title: 'Connect your wearable',
      description: 'Sync Garmin, Oura, or Apple Watch for real-time insights',
      href: '/profile',
      bgColor: 'bg-blue-50',
    });
  }

  // No nutrition tracking
  if (!dataSources.includes('myfitnesspal')) {
    suggestions.push({
      id: 'log-nutrition',
      icon: <Apple className="w-5 h-5 text-green-500" />,
      title: 'Track your nutrition',
      description: 'Log what you eat to see how diet affects your recovery',
      href: '/chat?context=I want to start tracking my nutrition',
      bgColor: 'bg-green-50',
    });
  }

  // No labs
  if (!dataSources.includes('medical-records')) {
    suggestions.push({
      id: 'add-labs',
      icon: <FlaskConical className="w-5 h-5 text-purple-500" />,
      title: 'Add your bloodwork',
      description: 'Upload lab results for deeper health analysis',
      href: '/chat?context=I want to add my bloodwork results',
      bgColor: 'bg-purple-50',
    });
  }

  // No photos
  if (!dataSources.includes('photos')) {
    suggestions.push({
      id: 'progress-photo',
      icon: <Camera className="w-5 h-5 text-amber-500" />,
      title: 'Take a progress photo',
      description: 'Track visible changes over time',
      href: '/progress',
      bgColor: 'bg-amber-50',
    });
  }

  // Engagement tips if all data is connected
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'engagement-tip',
      icon: <Lightbulb className="w-5 h-5 text-[#E07A5F]" />,
      title: 'Optimize your routine',
      description: 'Ask me for personalized recommendations based on your data',
      href: '/chat?context=Based on my health data, what should I focus on?',
      bgColor: 'bg-[#FFE8DC]',
    });
  }

  return suggestions;
}

const STORAGE_KEY = 'addDataCTA_lastShown';

export default function AddDataCTA({ dataSources, hasWearable }: AddDataCTAProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const suggestions = getSuggestions(dataSources, hasWearable);

  useEffect(() => {
    // Rotate through suggestions
    try {
      const lastShown = localStorage.getItem(STORAGE_KEY);
      if (lastShown) {
        const index = parseInt(lastShown, 10);
        if (!isNaN(index) && index < suggestions.length - 1) {
          setCurrentIndex(index + 1);
        } else {
          setCurrentIndex(0);
        }
      }
    } catch (e) {
      // localStorage might not be available
    }
  }, [suggestions.length]);

  useEffect(() => {
    // Save current index for rotation
    try {
      localStorage.setItem(STORAGE_KEY, currentIndex.toString());
    } catch (e) {
      // localStorage might not be available
    }
  }, [currentIndex]);

  if (suggestions.length === 0) {
    return null;
  }

  const suggestion = suggestions[currentIndex % suggestions.length];

  return (
    <Link href={suggestion.href}>
      <div className={`${suggestion.bgColor} rounded-2xl p-4 transition-all hover:shadow-md cursor-pointer`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            {suggestion.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[#2D2A26]">{suggestion.title}</p>
            <p className="text-sm text-[#8A8580] truncate">{suggestion.description}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#B5AFA8] flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}
