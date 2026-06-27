import { supabase } from './supabase.js';

export async function checkAuditLimit(userId) {
  const now = new Date().toISOString();
  
  // Get current rate limit record
  let { data, error } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is not found
    console.error('Rate limit fetch error:', error.message);
    // Fail open if database errors
    return { allowed: true, remaining: 5 };
  }

  // If no record or past reset_at, create/reset it
  if (!data || new Date() > new Date(data.reset_at)) {
    const { data: upsertedData, error: upsertError } = await supabase
      .from('rate_limits')
      .upsert({ 
        user_id: userId,
        count: 1,
        reset_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (upsertError) {
       console.error('Rate limit upsert error:', upsertError.message);
       return { allowed: true, remaining: 5 };
    }
    
    return { allowed: true, remaining: Math.max(0, 5 - upsertedData.count) };
  }

  // If we have a record and it's not past reset time, increment count
  if (data.count >= 5) {
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
    return { allowed: true, remaining: 5 };
  }

  return { allowed: true, remaining: Math.max(0, 5 - updatedData.count) };
}
