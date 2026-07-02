import Stripe from 'stripe';
import { getAuth } from '../../../../lib/auth-server.js';
import { supabase } from '../../../../lib/supabase.js';

// Fallback to empty string to prevent crash if not set yet
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');

export async function POST(request) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, planTier } = await request.json();
    if (!priceId || !planTier) {
      return Response.json({ error: 'Missing priceId or planTier' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json({ error: 'Stripe is not configured yet. Please add STRIPE_SECRET_KEY to your environment variables.' }, { status: 500 });
    }

    let { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { userId },
      });
      customerId = customer.id;

      await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          plan_tier: 'free',
          status: 'active'
        }, { onConflict: 'user_id' });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?upgrade=success`,
      cancel_url: `${appUrl}/`,
      metadata: {
        userId,
        planTier
      }
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
