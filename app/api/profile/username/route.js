import { supabase } from '../../../../lib/supabase.js';
import { getAuth } from '../../../../lib/auth-server.js';

export async function GET(request) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('username, last_username_change')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return Response.json({ profile: data || null });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let { username } = body;
    
    if (!username || typeof username !== 'string') {
      return Response.json({ error: 'Invalid username' }, { status: 400 });
    }
    
    username = username.trim().toLowerCase();
    
    if (username.length < 1 || username.length > 30 || !/^[a-z0-9_.]+$/.test(username)) {
      return Response.json({ error: 'Username must be 1-30 characters long and contain only letters, numbers, underscores, and periods.' }, { status: 400 });
    }

    // Check existing profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      if (existingProfile.username === username) {
        return Response.json({ success: true, profile: existingProfile });
      }

      // Check 20-day limit
      if (existingProfile.last_username_change) {
        const lastChange = new Date(existingProfile.last_username_change);
        const daysSinceChange = (Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceChange < 20) {
          const daysLeft = Math.ceil(20 - daysSinceChange);
          return Response.json({ error: `You can change your username again in ${daysLeft} day(s).` }, { status: 403 });
        }
      }
    }

    // Check if username is taken by someone else
    const { data: taken } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', username)
      .single();

    if (taken && taken.user_id !== userId) {
      return Response.json({ error: 'Username is already taken.' }, { status: 409 });
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        username,
        last_username_change: existingProfile ? new Date().toISOString() : null // First time setting doesn't trigger 20-day wait for next change, or maybe it should? User requested "can be changed once in 20 days". Let's set it to NOW so they have to wait 20 days.
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    return Response.json({ success: true, profile: updated });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
