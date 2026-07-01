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
    return { totalAudits: 0, avgScore: 0, avgSecurity: 0, avgArchitecture: 0, avgPerformance: 0, avgSlop: 0, avgDevops: 0, avgReadiness: 0, avgHealth: 0, uniqueRepos: 0 };
  }

  const uniqueRepos = new Set(data.map((a) => a.repo_full_name)).size;
  const count = data.length;

  const avgScore = Math.round(data.reduce((sum, a) => sum + (a.scores?.overall || 0), 0) / count);
  const avgSecurity = Math.round(data.reduce((sum, a) => sum + (a.scores?.security || 0), 0) / count);
  const avgArchitecture = Math.round(data.reduce((sum, a) => sum + (a.scores?.architecture || 0), 0) / count);
  const avgPerformance = Math.round(data.reduce((sum, a) => sum + (a.scores?.performance || 0), 0) / count);
  const avgSlop = Math.round(data.reduce((sum, a) => sum + (a.scores?.slop || 0), 0) / count);
  const avgDevops = Math.round(data.reduce((sum, a) => sum + (a.scores?.devops || 0), 0) / count);
  const avgReadiness = Math.round(data.reduce((sum, a) => sum + (a.scores?.readiness || 0), 0) / count);
  const avgHealth = Math.round(data.reduce((sum, a) => sum + (a.scores?.health || 0), 0) / count);

  return {
    totalAudits: count,
    avgScore,
    avgSecurity,
    avgArchitecture,
    avgPerformance,
    avgSlop,
    avgDevops,
    avgReadiness,
    avgHealth,
    uniqueRepos,
  };
}
