import { supabase } from '../../../../../lib/supabase.js';

export async function GET(request, { params }) {
  const { owner, repo } = await params;
  
  const { data } = await supabase
    .from('audits')
    .select('scores')
    .eq('repo_full_name', `${owner}/${repo}`)
    .eq('status', 'done')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();
  
  const score = data?.scores?.overall || null;
  const color = !score ? '#555555' : score >= 85 ? '#10B981' : score >= 70 ? '#F59E0B' : '#EF4444';
  const label = score ? `${score}/100` : 'not audited';
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="20">
    <linearGradient id="s" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r">
      <rect width="160" height="20" rx="3" fill="#fff"/>
    </clipPath>
    <g clip-path="url(#r)">
      <rect width="85" height="20" fill="#222"/>
      <rect x="85" width="75" height="20" fill="${color}"/>
      <rect width="160" height="20" fill="url(#s)"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
      <text x="425" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="750">BrutalAudit</text>
      <text x="425" y="140" transform="scale(.1)" textLength="750">BrutalAudit</text>
      <text x="1215" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="650">${label}</text>
      <text x="1215" y="140" transform="scale(.1)" textLength="650">${label}</text>
    </g>
  </svg>`;
  
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}
