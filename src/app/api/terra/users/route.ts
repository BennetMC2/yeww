import { NextRequest, NextResponse } from 'next/server';
import { getTerraUsers, deauthenticateTerraUser, getProviderInfo } from '@/lib/terra';

// GET - Get connected wearables for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const terraUsers = await getTerraUsers(userId);

    // Transform to friendly format
    const connectedDevices = terraUsers.map(user => ({
      terraUserId: user.user_id,
      provider: user.provider,
      providerInfo: getProviderInfo(user.provider),
      lastSync: user.last_webhook_update,
    }));

    return NextResponse.json({ devices: connectedDevices });
  } catch (error) {
    console.error('Terra get users error:', error);
    return NextResponse.json(
      { error: 'Failed to get connected devices' },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect a wearable
export async function DELETE(request: NextRequest) {
  try {
    const { terraUserId } = await request.json();

    if (!terraUserId) {
      return NextResponse.json(
        { error: 'terraUserId is required' },
        { status: 400 }
      );
    }

    await deauthenticateTerraUser(terraUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Terra disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect device' },
      { status: 500 }
    );
  }
}
