import { supabase } from '../../../lib/supabase.js';

export async function GET() {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: audits, error } = await supabase
      .from('audits')
      .select('id, user_id, scores, created_at')
      .eq('status', 'done')
      .gte('created_at', startOfMonth.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;

    const valid = audits.filter(d => d.scores && typeof d.scores.overall === 'number');
    
    // Sort by overall score descending
    const sorted = valid.sort((a, b) => b.scores.overall - a.scores.overall);

    // Dedup by user_id to show only the best score per user
    const uniqueUsers = [];
    const seenUsers = new Set();
    for (const item of sorted) {
      if (!seenUsers.has(item.user_id)) {
        uniqueUsers.push({
          user_id: item.user_id,
          score: item.scores.overall,
          scores: item.scores,
          created_at: item.created_at
        });
        seenUsers.add(item.user_id);
      }
    }

    const top50 = uniqueUsers.slice(0, 50);

    // Fetch usernames for these top 50 users
    if (top50.length > 0) {
      const userIds = top50.map(u => u.user_id);
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);
      
      if (!profError && profiles) {
        const profileMap = {};
        profiles.forEach(p => profileMap[p.user_id] = p.username);
        
        top50.forEach(u => {
          u.username = profileMap[u.user_id] || 'Anonymous Hacker';
        });
      } else {
        top50.forEach(u => u.username = 'Anonymous Hacker');
      }
    }

    // Add 5-minute cache header (CDN level + Browser level)
    return Response.json(
      { leaderboard: top50 },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return Response.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  }
}
