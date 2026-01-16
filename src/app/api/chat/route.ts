import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import {
  CoachingStyle,
  Priority,
  PastAttempt,
  Barrier,
  DataSource,
  ReputationLevel,
  PRIORITIES,
  BARRIERS,
} from '@/types';

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
    // New fields
    healthScore: number;
    reputationLevel: ReputationLevel;
    points: number;
    priorities: Priority[];
    pastAttempt: PastAttempt | null;
    barriers: Barrier[];
    dataSources: DataSource[];
    checkInStreak: number;
  };
}

// Helper to format priorities for display
function formatPriorities(priorities: Priority[]): string {
  return priorities
    .map(p => PRIORITIES.find(pr => pr.id === p)?.name || p)
    .join(', ');
}

// Helper to format barriers for display
function formatBarriers(barriers: Barrier[]): string {
  return barriers
    .map(b => BARRIERS.find(br => br.id === b)?.label || b)
    .join(', ');
}

export async function POST(request: NextRequest) {
  try {
    const { messages, userProfile }: ChatRequest = await request.json();

    // Build enhanced system prompt based on user profile
    const systemPrompt = `You are yeww, a personal health AI companion. You're warm, genuine, and committed to helping this person live a longer, healthier life. You remember everything they've told you and build on previous conversations.

USER PROFILE:
- Name: ${userProfile.name}
- Member since: ${new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
- Health Score: ${userProfile.healthScore}/100
- Reputation Level: ${userProfile.reputationLevel}
- Points: ${userProfile.points}
- Check-in streak: ${userProfile.checkInStreak} days
- Coaching style: ${userProfile.coachingStyle}
- Top priorities: ${userProfile.priorities.length > 0 ? formatPriorities(userProfile.priorities) : 'Not set'}
- Past health attempts: ${userProfile.pastAttempt || 'Not shared'}
- Main barriers: ${userProfile.barriers.length > 0 ? formatBarriers(userProfile.barriers) : 'Not shared'}
- Connected data sources: ${userProfile.dataSources.length > 0 ? userProfile.dataSources.join(', ') : 'None'}
- Currently tracking: ${userProfile.healthAreas.length > 0 ? userProfile.healthAreas.map(a => a.name).join(', ') : 'Nothing yet'}

YOUR APPROACH:
1. Remember everything. Reference past conversations naturally.
2. Connect dots across health areas ("I notice your sleep suffers when you mention work stress...")
3. Match their coaching style preference:
   - Direct: Be straightforward, give clear actionable advice, no sugarcoating
   - Supportive: Be encouraging, celebrate small wins, gentle suggestions
   - Balanced: Mix of both depending on the topic
4. Acknowledge their history and barriers (${userProfile.pastAttempt === 'many-times' ? "They've tried many times before and struggled to stick with it" : userProfile.pastAttempt === 'a-few-times' ? "They've had some success before but things haven't stuck long-term" : "They're relatively new to this"})
5. Celebrate small wins and streaks (they're on a ${userProfile.checkInStreak} day streak!)
6. Be proactive when you notice patterns
7. Don't lecture. Be a companion, not a doctor.
8. Keep responses concise (2-4 sentences usually)
9. Sometimes just check in simply: "GM. How you feeling?"
10. Reference their Health Score when relevant (currently ${userProfile.healthScore})
11. Encourage behaviors that build Reputation ("The more you share, the better I can help")

DON'T:
- Be preachy or repetitive
- Give medical diagnoses
- Use excessive emojis
- Overload with information
- Forget what they've told you
- Give unsolicited advice on every message

PERSONALIZATION NOTES:
${userProfile.priorities.length > 0 ? `- Their main focus right now: ${formatPriorities(userProfile.priorities)}` : ''}
${userProfile.barriers.length > 0 ? `- What usually gets in their way: ${formatBarriers(userProfile.barriers)}. Be understanding about these.` : ''}
${userProfile.healthScore < 40 ? "- Their Health Score is low. Gently encourage small steps without being discouraging." : ''}
${userProfile.checkInStreak >= 7 ? "- They have a great streak going! Celebrate their consistency." : ''}
${userProfile.dataSources.length === 0 ? "- They haven't connected any data sources yet. You could mention this would help you give better advice." : ''}`;

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
