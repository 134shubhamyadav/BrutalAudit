import Stripe from 'stripe';
import { supabase } from '../../../../lib/supabase.js';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return Response.json({ error: 'Stripe webhook not configured' }, { status: 500 });
  }

  const payload = await request.text();
  const signature = headers().get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planTier = session.metadata?.planTier || 'pro'; // default

        if (userId && session.subscription) {
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan_tier: planTier,
            status: 'active',
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        }
        break;
      }
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const status = subscription.status; // 'active', 'canceled', 'past_due', etc.
        const customerId = subscription.customer;

        await supabase.from('subscriptions').update({
          status: status,
          updated_at: new Date().toISOString()
        }).eq('stripe_customer_id', customerId);
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook handling error:', error);
    return Response.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
