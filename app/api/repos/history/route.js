import { getAuth } from '../../../../lib/auth-server.js';
import { supabase } from '../../../../lib/supabase.js';

export async function GET(request) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repoFullName = searchParams.get('repo');

    if (!repoFullName) {
      return Response.json({ error: 'Missing repo parameter' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('audits')
      .select('id, created_at, scores')
      .eq('user_id', userId)
      .eq('repo_full_name', repoFullName)
      .eq('status', 'done')
      .order('created_at', { ascending: true })
      .limit(30);

    if (error) throw error;

    return Response.json({ history: data || [] });

  } catch (error) {
    console.error('GET /api/repos/history error:', error.message);
    return Response.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
