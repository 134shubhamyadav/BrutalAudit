import Stripe from 'stripe';
import { getAuth } from '../../../../lib/auth-server.js';
import { supabase } from '../../../../lib/supabase.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');

export async function POST(request) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json({ error: 'Stripe is not configured yet. Please add STRIPE_SECRET_KEY to your environment variables.' }, { status: 500 });
    }

    let { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!sub || !sub.stripe_customer_id) {
      return Response.json({ error: 'No billing account found. Please upgrade first.' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${appUrl}/settings`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
