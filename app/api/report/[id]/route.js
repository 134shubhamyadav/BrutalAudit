import { getAuditById } from '../../../../lib/supabase.js';
import { getAuth } from '../../../../lib/auth-server.js';

export async function GET(request, { params }) {
  const { id } = await params;

  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    return Response.json({ error: 'Invalid audit ID' }, { status: 400 });
  }

  try {
    const audit = await getAuditById(id);
    if (!audit) {
      return Response.json({ error: 'Audit not found' }, { status: 404 });
    }

    const { userId } = await getAuth(request);
    if (!userId || audit.user_id !== userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Reports are now restricted to the owner
    return Response.json(audit);
  } catch (error) {
    return Response.json({ error: 'Failed to load audit' }, { status: 500 });
  }
}
