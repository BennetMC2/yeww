import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, TerraWebhookPayload } from '@/lib/terra';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('terra-signature');
    const rawBody = await request.text();

    // Verify signature (skip in development if no secret)
    if (process.env.TERRA_WEBHOOK_SECRET && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.error('Invalid Terra webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const payload: TerraWebhookPayload = JSON.parse(rawBody);
    console.log('Terra webhook received:', payload.type, payload.status);

    const user = payload.user;

    switch (payload.type) {
      case 'auth':
        // New user connected - save to terra_users
        if (user) {
          console.log('New Terra user connected:', user.provider);
          const { error } = await supabase
            .from('terra_users')
            .upsert({
              user_id: user.user_id,
              reference_id: user.reference_id || '',
              provider: user.provider,
              scopes: user.scopes,
              last_webhook_update: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

          if (error) {
            console.error('Error saving Terra user:', error);
          }
        }
        break;

      case 'user_reauth':
        // User needs to re-authenticate
        console.log('Terra user needs reauth:', user?.user_id);
        break;

      case 'access_revoked':
      case 'deauth':
        // User disconnected - remove from terra_users
        const oldUser = payload.old_user;
        if (oldUser) {
          console.log('Terra user disconnected:', oldUser.user_id);
          const { error } = await supabase
            .from('terra_users')
            .delete()
            .eq('user_id', oldUser.user_id);

          if (error) {
            console.error('Error removing Terra user:', error);
          }
        }
        break;

      case 'activity':
      case 'body':
      case 'daily':
      case 'sleep':
      case 'nutrition':
        // Health data events - save each data item to terra_data_payloads
        if (user && payload.data && Array.isArray(payload.data)) {
          console.log(`Terra ${payload.type} data received for:`, user.user_id, `(${payload.data.length} items)`);

          // Insert each data item as a separate row
          for (const dataItem of payload.data) {
            const { error } = await supabase
              .from('terra_data_payloads')
              .insert({
                user_id: user.user_id,
                reference_id: user.reference_id || '',
                type: payload.type,
                data: dataItem,
              });

            if (error) {
              console.error(`Error saving ${payload.type} data:`, error);
            }
          }

          // Update last_webhook_update timestamp on terra_users
          await supabase
            .from('terra_users')
            .update({
              last_webhook_update: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.user_id);
        }
        break;

      default:
        console.log('Unknown Terra event type:', payload.type);
    }

    // Always respond 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Terra webhook error:', error);
    // Still return 200 to prevent retries for parse errors
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}
