import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import {
  CoachingStyle,
  Priority,
  PastAttempt,
  Barrier,
  DataSource,
  ReputationLevel,
  HealthArea,
  HealthMetrics,
  DetectedPattern,
} from '@/types';
import { buildSystemPromptFromProfile } from '@/lib/promptBuilder';
import { getLatestHealthMetrics } from '@/lib/healthData';
import { getActivePatterns } from '@/lib/correlationEngine';

const anthropic = new Anthropic();

interface MessageImage {
  data: string;  // base64 data URL
  mediaType: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: MessageImage[];
}

interface ChatRequest {
  messages: Message[];
  userProfile: {
    id?: string;
    name: string;
    coachingStyle: CoachingStyle;
    healthAreas: HealthArea[];
    createdAt: string;
    healthScore: number;
    reputationLevel: ReputationLevel;
    points: number;
    priorities: Priority[];
    pastAttempt: PastAttempt | null;
    barriers: Barrier[];
    dataSources: DataSource[];
    checkInStreak: number;
    lastCheckIn?: string | null;
  };
  healthMetrics?: HealthMetrics;
}

// Helper to format messages for Claude API (with vision support)
function formatMessagesForClaude(messages: Message[]): Anthropic.MessageParam[] {
  return messages.map((msg) => {
    // If message has images, create content blocks
    if (msg.images && msg.images.length > 0) {
      const contentBlocks: Anthropic.ContentBlockParam[] = [];

      // Add images first
      for (const img of msg.images) {
        // Strip the data URL prefix to get raw base64
        const base64Data = img.data.replace(/^data:image\/\w+;base64,/, '');

        contentBlocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: base64Data,
          },
        });
      }

      // Add text content if present
      if (msg.content) {
        contentBlocks.push({
          type: 'text',
          text: msg.content,
        });
      } else {
        // Default prompt if no text with image
        contentBlocks.push({
          type: 'text',
          text: 'What do you see in this image? If it\'s food, estimate the calories and nutritional content. If it\'s health data, extract and summarize the key metrics.',
        });
      }

      return {
        role: msg.role,
        content: contentBlocks,
      };
    }

    // Text-only message
    return {
      role: msg.role,
      content: msg.content,
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const { messages, userProfile, healthMetrics: clientMetrics }: ChatRequest = await request.json();

    // Calculate conversation turn (number of user messages)
    const conversationTurn = messages.filter(m => m.role === 'user').length;

    // Use client-provided metrics first, then try to fetch from Terra
    let healthMetrics: HealthMetrics | undefined = clientMetrics;
    let patterns: DetectedPattern[] = [];

    if (userProfile.id) {
      // Fetch health metrics and patterns in parallel
      const [metricsResult, patternsResult] = await Promise.allSettled([
        !healthMetrics ? getLatestHealthMetrics(userProfile.id) : Promise.resolve(null),
        getActivePatterns(userProfile.id),
      ]);

      if (metricsResult.status === 'fulfilled' && metricsResult.value) {
        healthMetrics = metricsResult.value;
      }

      if (patternsResult.status === 'fulfilled' && patternsResult.value) {
        patterns = patternsResult.value.map(p => ({
          id: p.id || '',
          description: p.description,
          confidence: p.confidence,
          lastTriggered: p.lastObserved,
          metricA: p.metricA,
          metricB: p.metricB,
          correlationStrength: p.correlationStrength ?? undefined,
          direction: p.direction ?? undefined,
          sampleSize: p.sampleSize,
        }));
      }
    }

    // Build comprehensive system prompt using the new prompt builder
    const systemPrompt = buildSystemPromptFromProfile(userProfile, conversationTurn, healthMetrics, patterns);

    // Format messages for Claude API (with vision support)
    const formattedMessages = formatMessagesForClaude(messages);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: formattedMessages,
    });

    // Extract text from response
    const textContent = response.content.find(block => block.type === 'text');
    const assistantMessage = textContent && textContent.type === 'text' ? textContent.text : '';

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response' },
      { status: 500 }
    );
  }
}
