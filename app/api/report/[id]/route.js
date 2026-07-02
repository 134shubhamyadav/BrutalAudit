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

    // Reports are public by UUID (unguessable ID)
    // Removed the auth check so reports can be shared via URL
    return Response.json(audit);
  } catch (error) {
    return Response.json({ error: 'Failed to load audit' }, { status: 500 });
  }
}
