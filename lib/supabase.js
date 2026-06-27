import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Audit Queries ────────────────────────────────────────────────────────────

export async function createAudit({ userId, repoFullName, repoOwner, repoName }) {
  const { data, error } = await supabase
    .from('audits')
    .insert({
      user_id: userId,
      repo_full_name: repoFullName,
      repo_owner: repoOwner,
      repo_name: repoName,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create audit: ${error.message}`);
  return data;
}

export async function updateAudit(id, updates) {
  const { data, error } = await supabase
    .from('audits')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update audit: ${error.message}`);
  return data;
}

export async function getAuditById(id) {
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function getUserAudits(userId, limit = 10) {
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'done')
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch audits: ${error.message}`);
  return data || [];
}

export async function getAuditsByRepo(userId, repoFullName) {
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('user_id', userId)
    .eq('repo_full_name', repoFullName)
    .eq('status', 'done')
    .order('completed_at', { ascending: false })
    .limit(5);

  if (error) return [];
  return data || [];
}

export async function getUserStats(userId) {
  const { data, error } = await supabase
    .from('audits')
    .select('scores, repo_full_name, status')
    .eq('user_id', userId)
    .eq('status', 'done');

  if (error || !data || data.length === 0) {
    return { totalAudits: 0, avgScore: 0, criticalIssues: 0, uniqueRepos: 0 };
  }

  const uniqueRepos = new Set(data.map((a) => a.repo_full_name)).size;
  const avgScore = Math.round(
    data.reduce((sum, a) => sum + (a.scores?.overall || 0), 0) / data.length
  );

  return {
    totalAudits: data.length,
    avgScore,
    uniqueRepos,
  };
}
