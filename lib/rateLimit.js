import { supabase } from './supabase.js';

export async function checkAuditLimit(userId) {
  // Check subscription tier
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_tier, status')
    .eq('user_id', userId)
    .single();

  const isPremium = sub && ['pro', 'elite'].includes(sub.plan_tier) && sub.status === 'active';

  if (isPremium) {
    return { allowed: true, remaining: 9999 }; // Unlimited for premium
  }

  // Free tier logic: 3 per month
  const limit = 3;
  
  // Get current rate limit record
  let { data, error } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is not found
    console.error('Rate limit fetch error:', error.message);
    // Fail open if database errors
    return { allowed: true, remaining: limit };
  }

  // If no record or past reset_at, create/reset it
  if (!data || new Date() > new Date(data.reset_at)) {
    // Set reset_at to 30 days from now
    const resetDate = new Date();
    resetDate.setDate(resetDate.getDate() + 30);
    
    const { data: upsertedData, error: upsertError } = await supabase
      .from('rate_limits')
      .upsert({ 
        user_id: userId,
        count: 1,
        reset_at: resetDate.toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (upsertError) {
       console.error('Rate limit upsert error:', upsertError.message);
       return { allowed: true, remaining: limit };
    }
    
    return { allowed: true, remaining: Math.max(0, limit - upsertedData.count) };
  }

  // If we have a record and it's not past reset time, increment count
  if (data.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  const { data: updatedData, error: updateError } = await supabase
    .from('rate_limits')
    .update({ count: data.count + 1 })
    .eq('user_id', userId)
    .select()
    .single();

  if (updateError) {
    console.error('Rate limit update error:', updateError.message);
    return { allowed: true, remaining: limit };
  }

  return { allowed: true, remaining: Math.max(0, limit - updatedData.count) };
}
