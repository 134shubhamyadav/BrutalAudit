import { supabase } from '../../../lib/supabase.js';

export async function GET() {
  try {
    const { count, error } = await supabase
      .from('audits')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'done');

    if (error) throw error;

    // We can also fetch the average score from the most recent 100 audits
    const { data: recent } = await supabase
      .from('audits')
      .select('scores')
      .eq('status', 'done')
      .order('completed_at', { ascending: false })
      .limit(100);
      
    let avgScore = 85;
    if (recent && recent.length > 0) {
      const sum = recent.reduce((acc, row) => acc + (row.scores?.overall || 0), 0);
      avgScore = Math.round(sum / recent.length);
    }

    return Response.json({
      totalAudits: count || 0,
      avgScore
    });
  } catch (error) {
    console.error('Failed to fetch public stats:', error);
    // Fallback to reasonable defaults instead of fake 2.4M
    return Response.json({ totalAudits: 0, avgScore: 85 }, { status: 500 });
  }
}
