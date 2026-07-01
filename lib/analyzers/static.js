// lib/analyzers/static.js
// Static code analyzer to measure architecture, quality, performance metrics

export function analyzeRepoStatic(fileContents) {
  const findings = [];
  let totalFiles = 0;
  let totalLines = 0;
  let complexFunctions = 0;
  let circularDependencies = 0;
  let unusedVariables = 0;

  for (const file of fileContents) {
    const { path, content } = file;
    if (!content || typeof content !== 'string') continue;
    
    totalFiles++;
    const lines = content.split('\n');
    totalLines += lines.length;

    // 1. Detect Complexity (Excessive nesting)
    let maxNesting = 0;
    let currentNesting = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Calculate braces nesting
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      currentNesting += (openBraces - closeBraces);
      if (currentNesting > maxNesting) maxNesting = currentNesting;

      // 2. High cognitive complexity in loops/conditions
      if (currentNesting > 5 && (line.includes('if (') || line.includes('for (') || line.includes('while ('))) {
        complexFunctions++;
        findings.push({
          type: 'performance',
          severity: 'low',
          title: 'High Cognitive Complexity / Deep Nesting',
          description: `Deeply nested block in ${path} at line ${i + 1}. Consider refactoring into smaller, decoupled helper functions.`,
          file: path,
          line: i + 1,
          fix: 'Extract nested logic into a utility method.'
        });
      }
    }

    // 3. Unused / Dead Imports
    const imports = [];
    const usages = new Set();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const importMatch = line.match(/(?:import|const)\s+([a-zA-Z0-9_$]+)\s+=|import\s+([a-zA-Z0-9_$]+)\s+from/);
      if (importMatch) {
        const name = importMatch[1] || importMatch[2];
        if (name && !['require', 'express', 'mongoose', 'react', 'useState', 'useEffect'].includes(name)) {
          imports.push({ name, lineNum: i + 1 });
        }
      } else {
        // Track references
        for (const token of line.split(/[^a-zA-Z0-9_$]/)) {
          if (token) usages.add(token);
        }
      }
    }

    for (const { name, lineNum } of imports) {
      if (!usages.has(name)) {
        unusedVariables++;
        findings.push({
          type: 'code_smell',
          severity: 'low',
          title: 'Unused / Dead Import Declaration',
          description: `Imported module/variable '${name}' is never referenced in ${path}.`,
          file: path,
          line: lineNum,
          fix: `Remove import of '${name}' to clean up bundle size.`
        });
      }
    }

    // 4. Circular / Self Imports
    const filename = path.split('/').pop()?.split('.')[0] || '';
    if (filename) {
      const selfImportRegex = new RegExp(`(import|require).*${filename}`, 'i');
      for (let i = 0; i < lines.length; i++) {
        if (selfImportRegex.test(lines[i])) {
          circularDependencies++;
          findings.push({
            type: 'architecture',
            severity: 'medium',
            title: 'Circular Dependency / Self-Import Risk',
            description: `File ${path} appears to import itself or contains recursive module references on line ${i + 1}.`,
            file: path,
            line: i + 1,
            fix: 'Remove self-import reference and decouple module lifecycle.'
          });
        }
      }
    }
  }

  // Calculate scores (default to 100 and subtract penalty points)
  const architecturePenalty = (circularDependencies * 15);
  const codeQualityPenalty = (unusedVariables * 2) + (complexFunctions * 4);

  const architectureScore = Math.max(40, 100 - architecturePenalty);
  const codeQualityScore = Math.max(50, 100 - codeQualityPenalty);

  return {
    findings,
    stats: {
      totalFiles,
      totalLines,
      complexFunctions,
      circularDependencies,
      unusedVariables
    },
    scores: {
      architecture: architectureScore,
      codeQuality: codeQualityScore
    }
  };
}
