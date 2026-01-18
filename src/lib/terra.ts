/**
 * Terra Health API client
 * https://docs.tryterra.co
 */

import crypto from 'crypto';

const TERRA_API_URL = 'https://api.tryterra.co/v2';

// Supported wearable providers
export const TERRA_PROVIDERS = [
  { id: 'OURA', name: 'Oura', icon: 'Circle' },
  { id: 'GARMIN', name: 'Garmin', icon: 'Watch' },
  { id: 'FITBIT', name: 'Fitbit', icon: 'Heart' },
  { id: 'WHOOP', name: 'Whoop', icon: 'Activity' },
  { id: 'GOOGLE', name: 'Google Fit', icon: 'Activity' },
  { id: 'APPLE', name: 'Apple Health', icon: 'Apple' },
] as const;

export type TerraProvider = typeof TERRA_PROVIDERS[number]['id'];

interface TerraWidgetSession {
  status: string;
  session_id: string;
  url: string;
  expires_at: string;
}

interface TerraUser {
  user_id: string;
  provider: string;
  last_webhook_update: string | null;
  scopes: string | null;
  reference_id: string | null;
}

interface TerraApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
}

/**
 * Generate a Terra widget session for user authentication
 */
export async function generateWidgetSession(
  referenceId: string,
  successRedirectUrl: string,
  failureRedirectUrl?: string
): Promise<TerraWidgetSession> {
  const response = await fetch(`${TERRA_API_URL}/auth/generateWidgetSession`, {
    method: 'POST',
    headers: {
      'dev-id': process.env.TERRA_DEV_ID!,
      'x-api-key': process.env.TERRA_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reference_id: referenceId,
      providers: TERRA_PROVIDERS.map(p => p.id).join(','),
      language: 'en',
      auth_success_redirect_url: successRedirectUrl,
      auth_failure_redirect_url: failureRedirectUrl || successRedirectUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Terra API error: ${error}`);
  }

  return response.json();
}

/**
 * Get all Terra users for a reference ID (our user ID)
 */
export async function getTerraUsers(referenceId: string): Promise<TerraUser[]> {
  const response = await fetch(
    `${TERRA_API_URL}/userInfo?reference_id=${encodeURIComponent(referenceId)}`,
    {
      method: 'GET',
      headers: {
        'dev-id': process.env.TERRA_DEV_ID!,
        'x-api-key': process.env.TERRA_API_KEY!,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Terra API error: ${error}`);
  }

  const data: TerraApiResponse<{ users: TerraUser[] }> = await response.json();
  return data.data?.users || [];
}

/**
 * Deauthenticate a Terra user (disconnect wearable)
 */
export async function deauthenticateTerraUser(terraUserId: string): Promise<void> {
  const response = await fetch(`${TERRA_API_URL}/auth/deauthenticateUser`, {
    method: 'DELETE',
    headers: {
      'dev-id': process.env.TERRA_DEV_ID!,
      'x-api-key': process.env.TERRA_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: terraUserId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Terra API error: ${error}`);
  }
}

/**
 * Verify Terra webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.TERRA_WEBHOOK_SECRET;
  if (!secret) return false;

  // Parse signature header: t=timestamp,v1=signature
  const parts = signature.split(',');
  const timestampPart = parts.find(p => p.startsWith('t='));
  const signaturePart = parts.find(p => p.startsWith('v1='));

  if (!timestampPart || !signaturePart) return false;

  const timestamp = timestampPart.substring(2);
  const providedSignature = signaturePart.substring(3);

  // Create expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(providedSignature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Terra webhook event types
 */
export type TerraEventType =
  | 'auth'
  | 'user_reauth'
  | 'access_revoked'
  | 'deauth'
  | 'activity'
  | 'body'
  | 'daily'
  | 'sleep'
  | 'nutrition'
  | 'menstruation'
  | 'athlete';

export interface TerraWebhookPayload {
  status: string;
  type: TerraEventType;
  user?: TerraUser;
  data?: unknown[];
  old_user?: TerraUser;
  new_user?: TerraUser;
  message?: string;
}

/**
 * Get provider display info
 */
export function getProviderInfo(providerId: string) {
  return TERRA_PROVIDERS.find(p => p.id === providerId.toUpperCase()) || {
    id: providerId,
    name: providerId,
    icon: 'Activity',
  };
}
