import { NextRequest, NextResponse } from 'next/server';
import { generateWidgetSession } from '@/lib/terra';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, successRedirectUrl: customSuccessUrl, failureRedirectUrl: customFailureUrl } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successRedirectUrl = customSuccessUrl || `${appUrl}/profile?terra=connected&skip=1`;
    const failureRedirectUrl = customFailureUrl || `${appUrl}/profile?terra=failed&skip=1`;

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
