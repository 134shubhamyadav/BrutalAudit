export function getTitlesFromScore(scores) {
  if (!scores) return [];

  const titles = [];

  if (scores.overall === 100) titles.push({ id: 'god', label: 'God Tier 👑', color: '#F59E0B' });
  else if (scores.overall < 50) titles.push({ id: 'spaghetti', label: 'Spaghetti Chef 🍝', color: '#EF4444' });

  if (scores.security === 100) titles.push({ id: 'fortknox', label: 'Fort Knox 🛡️', color: '#10B981' });
  
  if (scores.slop < 40) titles.push({ id: 'slop', label: 'Slop King 🗑️', color: '#a1a1aa' });
  
  if (scores.architecture >= 90) titles.push({ id: 'architect', label: 'Architect 🏗️', color: '#3B82F6' });
  
  if (scores.performance >= 95) titles.push({ id: 'speed', label: 'Speed Demon ⚡', color: '#8B5CF6' });

  return titles;
}
