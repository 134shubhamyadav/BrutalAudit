import { getAuth } from '../../../lib/auth-server.js';
import { supabase } from '../../../lib/supabase.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: audits, error } = await supabase
      .from('audits')
      .select('id, repo_name, repo_owner, repo_full_name, scores, status, completed_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch reports:', error);
      return Response.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    return Response.json({ audits });
  } catch (error) {
    console.error('Reports endpoint error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
