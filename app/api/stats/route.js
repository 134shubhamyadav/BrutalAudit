import { supabase } from '../../../lib/supabase.js';

export async function GET() {
  try {
    const { count, error } = await supabase
      .from('audits')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'done');

    if (error) throw error;

    // We can also fetch the average score from the most recent 100 audits
    const { data: recent } = await supabase
      .from('audits')
      .select('scores, created_at, completed_at')
      .eq('status', 'done')
      .order('completed_at', { ascending: false })
      .limit(100);
      
    let avgScore = 85;
    let avgTime = 3.2;

    if (recent && recent.length > 0) {
      const sum = recent.reduce((acc, row) => acc + (row.scores?.overall || 0), 0);
      avgScore = Math.round(sum / recent.length);
      
      const validTimes = recent
        .filter(row => row.created_at && row.completed_at)
        .map(row => new Date(row.completed_at).getTime() - new Date(row.created_at).getTime())
        .filter(t => t > 0 && t < 300000);
        
      if (validTimes.length > 0) {
        const totalTime = validTimes.reduce((acc, t) => acc + t, 0);
        avgTime = (totalTime / validTimes.length / 1000).toFixed(1);
      }
    }

    return Response.json({
      totalAudits: count || 0,
      avgScore,
      avgTime: parseFloat(avgTime)
    });
  } catch (error) {
    console.error('Failed to fetch public stats:', error);
    // Fallback to reasonable defaults
    return Response.json({ totalAudits: 0, avgScore: 85, avgTime: 3.2 }, { status: 500 });
  }
}
