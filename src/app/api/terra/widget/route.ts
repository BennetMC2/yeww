import { NextRequest, NextResponse } from 'next/server';
import { generateWidgetSession } from '@/lib/terra';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successRedirectUrl = `${appUrl}/profile?terra=connected`;
    const failureRedirectUrl = `${appUrl}/profile?terra=failed`;

    const session = await generateWidgetSession(
      userId,
      successRedirectUrl,
      failureRedirectUrl
    );

    return NextResponse.json({
      url: session.url,
      sessionId: session.session_id,
      expiresAt: session.expires_at,
    });
  } catch (error) {
    console.error('Terra widget session error:', error);
    return NextResponse.json(
      { error: 'Failed to generate widget session' },
      { status: 500 }
    );
  }
}
