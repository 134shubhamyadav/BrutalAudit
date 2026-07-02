import { supabase } from '../../../lib/supabase.js';
import { getAuth } from '../../../lib/auth-server.js';

export async function GET(request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'live';

  try {
    let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });

    if (type === 'live') {
      // Only fetch 4 and 5 star reviews for the landing page
      query = query.gte('rating', 4).limit(10);
    }

    const { data, error } = await query;

    if (error) throw error;

    return Response.json({ reviews: data || [] });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, email } = await getAuth(request);
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rating, text } = await request.json();

    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
      return Response.json({ error: 'Valid rating (1-5) is required' }, { status: 400 });
    }
    
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return Response.json({ error: 'Review text is required' }, { status: 400 });
    }

    // Hard cap: max 1000 characters
    if (text.trim().length > 1000) {
      return Response.json({ error: 'Review text must be 1000 characters or less' }, { status: 400 });
    }

    // One review per user — prevent spam
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return Response.json({ error: 'You have already submitted a review. Thank you!' }, { status: 409 });
    }

    // Sanitize text before saving
    const safeText = text.trim().slice(0, 1000);

    // Default email if not found in token for some reason
    const userEmail = email || `user_${userId.substring(0,6)}@unknown.com`;

    const { data, error } = await supabase
      .from('reviews')
      .insert([
        { user_id: userId, email: userEmail, rating: Number(rating), text: safeText }
      ])
      .select()
      .single();

    if (error) throw error;

    return Response.json({ review: data });
  } catch (error) {
    console.error('Error submitting review:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
