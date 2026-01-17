import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import {
  CoachingStyle,
  Priority,
  PastAttempt,
  Barrier,
  DataSource,
  ReputationLevel,
} from '@/types';
import { buildSystemPromptFromProfile } from '@/lib/promptBuilder';

const anthropic = new Anthropic();

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: Message[];
  userProfile: {
    name: string;
    coachingStyle: CoachingStyle;
    healthAreas: { name: string }[];
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
}

export async function POST(request: NextRequest) {
  try {
    const { messages, userProfile }: ChatRequest = await request.json();

    // Calculate conversation turn (number of user messages)
    const conversationTurn = messages.filter(m => m.role === 'user').length;

    // Build comprehensive system prompt using the new prompt builder
    const systemPrompt = buildSystemPromptFromProfile(userProfile, conversationTurn);

    // Format messages for Claude API
    const formattedMessages = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

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
