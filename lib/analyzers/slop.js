// lib/analyzers/slop.js
// AI Slop detection engine to identify low-effort, Copilot/ChatGPT generated code signatures

const SLOP_PATTERNS = [
  {
    regex: /\/\/\s*this\s+(?:function|method|class|component)\s+(?:does|is\s+responsible\s+for|handles)/i,
    weight: 15,
    title: 'Generic Copilot Inline Commentary',
    description: 'Verbose, obvious inline comments describing what a single line or standard function does. Typically added by Copilot or ChatGPT when editing simple code Blocks.',
    fix: 'Remove redundant, self-explanatory comments.'
  },
  {
    regex: /\/\/\s*(?:setup|initialize|vars|variables|logic|functions)\b/i,
    weight: 10,
    title: 'Boilerplate Structural Divider Comments',
    description: 'Obvious separator comments partitioning basic files into trivial sections (e.g. "// variables", "// functions"). Typical of early tutorial templates or AI-generated structures.',
    fix: 'Structure code modularly using helper files instead of commented segments.'
  },
  {
    regex: /console\.log\((['"`])here\b|console\.log\((['"`])test\d*\b/i,
    weight: 20,
    title: 'Leftover AI Debug Logs',
    description: 'Generic debug logs (e.g., "here", "test1") frequently outputted by code generators during draft runs that are left uncleaned.',
    fix: 'Remove dev logs or replace with a proper logging suite.'
  },
  {
    regex: /const\s+[a-zA-Z0-9_$]+\s*=\s*async\s*\(\)\s*=>\s*\{\s*try\s*\{\s*\}\s*catch\s*\(e\)\s*\{\s*\}\s*\}/,
    weight: 25,
    title: 'Empty Try-Catch Abstraction',
    description: 'Empty async function placeholders wrapped in default try-catch clauses. Faked modularity that does not execute or handle errors properly.',
    fix: 'Remove empty mocks and implement active query layers.'
  },
  {
    regex: /dummy|placeholder|mockData|sampleData/i,
    weight: 8,
    title: 'Placeholder / Mock Data Signatures',
    description: 'Hardcoded arrays or mock objects (e.g. mockUsers, dummyProducts) that indicate tutorial-grade architecture or incomplete logic layers.',
    fix: 'Move configurations and fixtures to a mock server or dynamic API response.'
  }
];

export function detectSlop(fileContents) {
  const findings = [];
  let slopScore = 100;
  let totalMatches = 0;

  for (const file of fileContents) {
    const { path, content } = file;
    if (!content || typeof content !== 'string') continue;
    
    // Skip third-party folders or lockfiles
    if (/node_modules|\.lock|dist|build/.test(path)) continue;

    const lines = content.split('\n');

    for (const pattern of SLOP_PATTERNS) {
      for (let i = 0; i < lines.length; i++) {
        if (pattern.regex.test(lines[i])) {
          totalMatches++;
          slopScore -= pattern.weight;

          findings.push({
            type: 'code_smell',
            severity: pattern.weight >= 20 ? 'medium' : 'low',
            title: `AI Slop: ${pattern.title}`,
            description: `${pattern.description} Found in ${path} at line ${i + 1}: "${lines[i].trim().slice(0, 100)}"`,
            file: path,
            line: i + 1,
            fix: pattern.fix
          });
          break; // Avoid flooding the report with duplicate pattern hits per file
        }
      }
    }
  }

  // Constrain slop score
  slopScore = Math.max(10, Math.min(100, slopScore));

  return {
    findings,
    slopScore,
    totalMatches
  };
}
