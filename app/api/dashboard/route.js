import { getAuth } from '../../../lib/auth-server.js';
import { getUserAudits, getUserStats } from '../../../lib/supabase.js';

export async function GET(request) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [recentAudits, stats] = await Promise.all([
      getUserAudits(userId, 10),
      getUserStats(userId),
    ]);

    return Response.json({ recentAudits, stats });
  } catch (error) {
    console.error('GET /api/dashboard error:', error.message);
    return Response.json({ recentAudits: [], stats: null });
  }
}
