const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const demoAudit = {
  id: '00000000-0000-0000-0000-000000000000', // Pre-baked UUID
  user_id: 'demo', // Doesn't map to a real user
  repo_full_name: 'facebook/react',
  repo_owner: 'facebook',
  repo_name: 'react',
  status: 'done',
  scores: { security: 85, architecture: 92, performance: 95, overall: 90, isDetailed: true },
  findings: [
    {
      type: 'architecture', severity: 'medium',
      title: 'High complexity in React Fiber reconciliation loop',
      description: 'The ReactFiberWorkLoop module contains extremely dense logic that is difficult for new contributors to parse. While highly optimized, it represents a significant knowledge silo.',
      file: 'packages/react-reconciler/src/ReactFiberWorkLoop.js', line: 1240,
      fix: 'Consider breaking down the work loop into smaller, well-documented helper functions that can be tested independently.',
    },
    {
      type: 'performance', severity: 'low',
      title: 'Potential memory bloat in dev mode error logging',
      description: 'Error logging in development mode aggregates strings in memory without an upper bound, which can cause memory pressure in long-running dev sessions.',
      file: 'packages/shared/consoleWithStackDev.js', line: 55,
      fix: 'Add an LRU cache or ring buffer limit to the captured stack traces.',
    },
    {
      type: 'security', severity: 'medium',
      title: 'dangerouslySetInnerHTML usage requires vigilance',
      description: 'React core itself defines dangerouslySetInnerHTML. While intentional, any internal mismanagement of this prop could expose XSS vulnerabilities in the framework itself.',
      file: 'packages/react-dom-bindings/src/client/ReactDOMComponent.js', line: 1042,
      fix: 'Ensure that all internal tests explicitly verify that innerHTML assignments are never bypassed by user props unexpectedly.',
    }
  ],
  summary: {
    founder: "React is a world-class piece of software. Its architecture is incredibly robust, though highly complex. There are no major concerns for adoption.",
    cto: "The React codebase is a masterclass in performance optimization, but the internal Fiber architecture has a steep learning curve. Maintainability is handled via rigorous testing.",
    developer: "You are looking at one of the most optimized JavaScript codebases in the world. Pay attention to how they handle memory and scheduling.",
    recruiter: "React developers must be capable of understanding complex state machines and high-performance JS."
  },
  repo_meta: {
    name: 'react',
    fullName: 'facebook/react',
    description: 'The library for web and native user interfaces.',
    language: 'JavaScript',
    stars: 220000,
    forks: 45000,
    openIssues: 1200,
    url: 'https://github.com/facebook/react',
    detailed_data: {
      strengths: ['World-class performance optimization', 'Incredible test coverage', 'Highly modular package structure']
    }
  },
  created_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
};

async function seed() {
  console.log('Seeding demo report...');
  
  // Try to delete first in case it exists
  await supabase.from('audits').delete().eq('id', demoAudit.id);
  
  const { data, error } = await supabase.from('audits').insert([demoAudit]);
  
  if (error) {
    console.error('Error seeding demo report:', error.message);
  } else {
    console.log('Successfully seeded demo report for facebook/react!');
    console.log(`Demo UUID: ${demoAudit.id}`);
  }
}

seed();
