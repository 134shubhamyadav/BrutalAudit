import Groq from 'groq-sdk';
import { preAnalyze, formatConfirmedFindings } from './preprocess.js';
import { checkCVEs } from './deps.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Prompt Engineering ───────────────────────────────────────────────────────

function buildAuditPrompt(repoName, fileTree, codeChunks, cveFindings = []) {
  const fileList = fileTree.map((f) => f.path).join('\n');
  const codeContent = codeChunks
    .map(({ path, content }) => `\n=== FILE: ${sanitizePath(path)} ===\n${sanitizeContent(content)}`)
    .join('\n');

  const confirmedFindings = [...preAnalyze(codeChunks), ...cveFindings];
  const confirmedSection = formatConfirmedFindings(confirmedFindings);

  return `You are a senior security engineer and code architect performing a code audit.

REPOSITORY: ${sanitizePath(repoName)}

FILE TREE (all files in this repo):
${fileList}

CODE TO AUDIT:
${codeContent}
${confirmedSection}
INSTRUCTIONS:
- Analyze the code above for security vulnerabilities, architectural issues, performance problems, and code quality issues.
- Every finding MUST reference a real file from the FILE TREE above. Do NOT invent file names.
- Every finding MUST have a line number estimate based on the code shown.
- CRITICAL ANTI-HALLUCINATION RULE: Before claiming "missing error handling" or "unhandled promise", you MUST verify that the code is not wrapped in an outer try-catch block. Do not report missing error handling if a parent block catches the error. Read the whole file context.
- Be specific. Generic advice like "use environment variables" is not acceptable unless you cite the exact file and variable name.
- Fix suggestions must be concrete code changes, not general advice.
- Scores: 100 = perfect, 0 = catastrophically bad. Be harsh but fair.

RETURN ONLY valid JSON in this exact schema (no markdown, no explanation, just JSON):
{
  "findings": [
    {
      "type": "security",
      "severity": "critical",
      "title": "Hardcoded Stripe secret key in config.ts",
      "description": "A live Stripe secret key sk_live_... is exposed in plaintext on line 14 of config.ts. Anyone with repository read access can use this key to make unauthorized Stripe API calls.",
      "file": "src/config.ts",
      "line": 14,
      "fix": "Remove the hardcoded key and replace with: const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY"
    }
  ],
  "scores": {
    "security": 72,
    "architecture": 65,
    "performance": 80,
    "overall": 72
  },
  "summary": "The codebase has 2 critical security issues including an exposed API key. Architecture is generally sound but has high coupling in the service layer. Performance is acceptable with minor optimization opportunities in database query patterns."
}

Finding types: "security" | "architecture" | "performance" | "code_smell"
Severity levels: "critical" | "high" | "medium" | "low"

Generate between 3 and 15 findings. Do not pad with trivial findings.`;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

async function filterFilesPrePass(repoName, fileTree) {
  if (fileTree.length <= 10) return fileTree; // Too small to need filtering

  try {
    const fileList = fileTree.map(f => f.path).join('\n');
    const prompt = `You are a fast pre-processor.
Identify source code files relevant for a security and architecture audit.
Exclude: lockfiles, minified files, binaries, images, third-party vendor folders, and auto-generated output.

REPOSITORY: ${repoName}
FILES:
${fileList}

Return ONLY valid JSON in this exact schema:
{ "relevant_files": ["path/to/file1.js", "path/to/file2.py"] }`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.0,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.relevant_files) && parsed.relevant_files.length > 0) {
        const allowed = new Set(parsed.relevant_files);
        return fileTree.filter(f => allowed.has(f.path));
      }
    }
  } catch (err) {
    console.warn('File pre-pass failed, falling back to all files:', err.message);
  }
  return fileTree; // Fallback
}

export async function runAudit(repoName, fileTree, fileContents) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  // Pre-filter files to save tokens
  const filteredTree = await filterFilesPrePass(repoName, fileTree);
  const filteredPaths = new Set(filteredTree.map(f => f.path));
  const filteredContents = fileContents.filter(f => filteredPaths.has(f.path));

  // Chunk files to stay under Groq's 12,000 Tokens Per Minute (TPM) limit.
  // 25,000 chars is roughly 6,000 tokens, well under the 12k limit.
  const chunks = chunkFiles(filteredContents, 25000);
  const allFindings = [];
  let aggregatedScores = { security: [], architecture: [], performance: [] };

  const cveFindings = await checkCVEs(fileContents);

  // To strictly respect the free tier 12k TPM limit, we only process the first 
  // chunk (most relevant files). In a paid tier, we could process all chunks.
  const chunksToProcess = chunks.slice(0, 1);

  const chunkPromises = chunksToProcess.map(async (chunk) => {
    const prompt = buildAuditPrompt(repoName, fileTree, chunk, cveFindings);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.0, // Absolute zero for strictly factual output
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      console.error('Groq returned invalid JSON:', raw.slice(0, 200));
      return null;
    }
    return result;
  });

  const results = await Promise.allSettled(chunkPromises);

  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value) {
      const result = r.value;
      // Validate and collect findings
      if (Array.isArray(result.findings)) {
        const validFindings = result.findings.filter(validateFinding);
        allFindings.push(...validFindings);
      }

      // Collect scores from each chunk
      if (result.scores) {
        if (result.scores.security) aggregatedScores.security.push(result.scores.security);
        if (result.scores.architecture) aggregatedScores.architecture.push(result.scores.architecture);
        if (result.scores.performance) aggregatedScores.performance.push(result.scores.performance);
      }
    } else if (r.status === 'rejected') {
      console.error('Groq chunk error:', r.reason.message);
    }
  });

  // If no findings at all, return a minimal result
  if (allFindings.length === 0 && chunksToProcess.length > 0) {
    return getFallbackResult(repoName);
  }

  // Aggregate scores across chunks (weighted average)
  const scores = {
    security: avg(aggregatedScores.security) || 75,
    architecture: avg(aggregatedScores.architecture) || 75,
    performance: avg(aggregatedScores.performance) || 75,
  };
  scores.overall = Math.round((scores.security * 0.4 + scores.architecture * 0.35 + scores.performance * 0.25));

  // Deduplicate findings by title similarity
  const deduped = deduplicateFindings(allFindings);

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  deduped.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

  // Generate summary
  const criticalCount = deduped.filter((f) => f.severity === 'critical').length;
  const highCount = deduped.filter((f) => f.severity === 'high').length;
  const summary = generateSummary(repoName, deduped, scores, criticalCount, highCount);

  return {
    findings: deduped.slice(0, 30), // Max 30 findings
    scores,
    summary,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateFinding(f) {
  if (!f) return false;
  
  // Normalize AI outputs that might be capitalized
  if (typeof f.type === 'string') f.type = f.type.toLowerCase();
  if (typeof f.severity === 'string') f.severity = f.severity.toLowerCase();

  return (
    typeof f.type === 'string' &&
    typeof f.severity === 'string' &&
    typeof f.title === 'string' &&
    typeof f.description === 'string' &&
    typeof f.file === 'string' &&
    f.file.length > 0 &&
    ['security', 'architecture', 'performance', 'code_smell'].includes(f.type) &&
    ['critical', 'high', 'medium', 'low'].includes(f.severity)
  );
}

function chunkFiles(fileContents, maxChars) {
  const chunks = [];
  let currentChunk = [];
  let currentSize = 0;

  for (const file of fileContents) {
    const fileSize = (file.content || '').length;
    if (currentSize + fileSize > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [file];
      currentSize = fileSize;
    } else {
      currentChunk.push(file);
      currentSize += fileSize;
    }
  }

  if (currentChunk.length > 0) chunks.push(currentChunk);
  return chunks.length > 0 ? chunks : [[]];
}

function deduplicateFindings(findings) {
  const seen = new Set();
  return findings.filter((f) => {
    const key = `${f.file}:${f.title.toLowerCase().slice(0, 40)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function avg(arr) {
  if (!arr || arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function sanitizePath(path) {
  // Remove potential prompt injection from file paths
  return String(path).replace(/[^\w\-./]/g, '').slice(0, 200);
}

function sanitizeContent(content) {
  // Remove null bytes and extremely long lines that could be injections
  return String(content)
    .replace(/\0/g, '')
    .split('\n')
    .map((line) => line.slice(0, 500)) // Cap line length
    .slice(0, 300) // Max 300 lines per file
    .map((line, idx) => `${idx + 1}: ${line}`) // Add line numbers
    .join('\n');
}

function generateSummary(repoName, findings, scores, criticalCount, highCount) {
  const grade = scores.overall >= 90 ? 'A' : scores.overall >= 75 ? 'B' : scores.overall >= 60 ? 'C' : 'D';
  const issueText = criticalCount > 0
    ? `${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} require${criticalCount === 1 ? 's' : ''} immediate attention.`
    : highCount > 0
    ? `${highCount} high-severity issue${highCount > 1 ? 's' : ''} should be addressed soon.`
    : 'No critical issues found.';

  const secText = scores.security >= 85 ? 'Security posture is strong.' : scores.security >= 70 ? 'Security has some gaps that need attention.' : 'Security requires significant improvement.';

  return `${repoName} received an overall grade of ${grade} (${scores.overall}/100). ${issueText} ${secText} Architecture scored ${scores.architecture}/100 and performance scored ${scores.performance}/100.`;
}

function getFallbackResult(repoName) {
  throw new Error(
    `Audit of ${repoName} returned no findings. This may be due to a rate limit, ` +
    `model timeout, or files that are too short to analyze. Please try again.`
  );
}

export async function runDetailedAudit(repoName, fileTree, fileContents, customPrompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  // Pre-filter files to save tokens
  const filteredTree = await filterFilesPrePass(repoName, fileTree);
  const filteredPaths = new Set(filteredTree.map(f => f.path));
  const filteredContents = fileContents.filter(f => filteredPaths.has(f.path));

  // Use the detailed system prompt provided by the user
  let basePrompt = `# BrutalAudit System Prompt

You are **BrutalAudit**, an elite AI software auditor.

Your personality is brutally honest, technically precise, and evidence-driven.

Never flatter the user.
Never invent issues.
Never hallucinate files.
Every finding MUST be backed by actual evidence from the repository.

You are reviewing an entire GitHub repository.

You have access to:
* Repository metadata
* Folder structure
* File tree
* File contents
* README
* Package files
* Commit metadata (if available)

Your objective is to perform the same review expected from a Senior Staff Engineer during a production code review.

---
# STRICT RULES
Never invent:
* files
* functions
* variables
* dependencies
* vulnerabilities

CRITICAL ANTI-HALLUCINATION RULE: Before claiming "missing error handling" or "unhandled promise", you MUST verify that the code is not wrapped in an outer try-catch block. Do not report missing error handling if a parent block catches the error. Read the whole file context.

If evidence is insufficient, say: "Not enough evidence."
Never guess. Never assume.
Only report findings that are directly supported by repository contents.

---
# AUDIT CATEGORIES
Review every repository for:
## Security
Hardcoded secrets, API keys, JWT misuse, Authentication, Authorization, SQL Injection, XSS, CSRF, Command Injection, SSRF, Open redirects, Sensitive logging, Insecure file uploads, Broken access control, Environment variable misuse, Dependency vulnerabilities, Unsafe packages, Token exposure, Improper session handling, Rate limiting, Password storage, CORS configuration

## Architecture
Folder structure, Layer separation, Coupling, Cohesion, Circular dependencies, Scalability, Feature isolation, Domain boundaries, Project organization, Dependency injection, Code ownership, Modularity

## Code Quality
Duplicate code, Long methods, Dead code, Unused variables, Unused imports, Magic numbers, Bad naming, Poor abstraction, Complex logic, Nested conditions, Missing comments, Maintainability, Readability, SOLID violations, Clean Code principles

## Performance
Expensive loops, Repeated rendering, Memory leaks, Large bundle size, Blocking operations, Unnecessary API calls, Database inefficiencies, Caching, Lazy loading, Pagination, Image optimization, Render optimization, Algorithm complexity

## Testing
Unit tests, Integration tests, Coverage estimation, Missing test cases, Edge cases, Error handling, Mock quality

## Documentation
README quality, Installation guide, Contribution guide, API documentation, Inline comments, Architecture documentation, Environment setup, Deployment instructions

## DevOps
Docker, CI/CD, GitHub Actions, Environment configuration, Deployment readiness, Monitoring, Logging, Error tracking, Secrets management

## Dependencies
Outdated packages, Deprecated packages, Unused dependencies, Version conflicts, Known vulnerabilities, Package bloat

## Accessibility
Semantic HTML, ARIA labels, Keyboard navigation, Contrast, Focus states, Screen readers, Responsive behavior

## Frontend
Component reuse, State management, Accessibility, Responsive layout, Animations, UX, Loading states, Empty states, Error states

## Backend
API design, Validation, Authentication, Authorization, Database, Caching, Rate limiting, Logging, Scalability, Security

## AI
If AI is used: Prompt quality, Prompt injection, Hallucination risk, Context management, Chunking, Output validation, Cost optimization

---
# FOR EVERY FINDING
Return:
Severity (Critical, High, Medium, Low)
Category
Title
Description
Evidence
Exact file path
Line number
Why it matters
Business impact
Technical impact
Suggested fix
Example implementation
Estimated effort
Confidence score

---
# SCORING
Generate independent scores:
Security, Architecture, Performance, Maintainability, Documentation, Testing, Accessibility, Scalability, Code Quality, Dependency Health, Overall
Each score must explain WHY.

---
# STRENGTHS
Also report what the repository does WELL.
Examples: Excellent folder structure, Good naming, Strong typing, Reusable components, Fast rendering, Good documentation, Clean architecture, Good testing. Do not only criticize.

---
# PRIORITY
At the end generate:
Critical Issues, High Priority, Medium Priority, Low Priority, Quick Wins, Long-term Improvements

---
# EXECUTIVE SUMMARY
Write a concise summary for:
Founder, CTO, Developer, Recruiter
Each summary should be tailored to that audience.

---
# OUTPUT FORMAT
Return ONLY valid JSON.
{
"summary": { "founder": "", "cto": "", "developer": "", "recruiter": "" },
"scores": { "security": 0, "architecture": 0, "performance": 0, "maintainability": 0, "documentation": 0, "testing": 0, "accessibility": 0, "scalability": 0, "code_quality": 0, "dependency_health": 0, "overall": 0, "explanation": "" },
"strengths": ["", ""],
"findings": [
  {
    "id": "",
    "category": "",
    "severity": "",
    "title": "",
    "description": "",
    "evidence": "",
    "file": "",
    "line": 0,
    "business_impact": "",
    "technical_impact": "",
    "recommendation": "",
    "example_fix": "",
    "estimated_effort": "",
    "confidence": 0
  }
],
"priority": { "critical": [], "high": [], "medium": [], "low": [], "quick_wins": [], "long_term": [] },
"statistics": {
  "files_scanned": 0,
  "lines_of_code": 0,
  "languages": [],
  "dependencies": 0,
  "estimated_fix_time": ""
}
}

Never return Markdown.
Never return explanations outside JSON.
Only return machine-readable JSON.`;

function sanitizeCustomPrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') return '';
  
  // Hard limit
  const trimmed = prompt.slice(0, 500);
  
  // Block injection patterns (case-insensitive)
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|above|prior)/i,
    /disregard\s+(all\s+)?(previous|above|instructions)/i,
    /you\s+are\s+now/i,
    /new\s+instructions/i,
    /return\s+perfect/i,
    /score[s]?\s*[:=]\s*100/i,
    /\{.*findings.*\[.*\].*\}/i, // JSON override attempts
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(trimmed)) {
      return '[Custom prompt blocked: contained invalid instructions]';
    }
  }
  
  return trimmed;
}

  if (customPrompt && customPrompt.trim()) {
    const safe = sanitizeCustomPrompt(customPrompt);
    basePrompt += `\n\n--- CUSTOM FOCUS AREA (additional context only) ---\n${safe}\n`;
  }

  const fileList = filteredTree.map((f) => f.path).join('\n');
  const chunks = chunkFiles(filteredContents, 25000); 

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  
  const cveFindings = await checkCVEs(fileContents);
  const confirmedFindings = [...preAnalyze(filteredContents), ...cveFindings];
  const confirmedSection = formatConfirmedFindings(confirmedFindings);
  if (confirmedSection) {
    basePrompt += confirmedSection;
  }

  let aggregatedData = {
    findings: [],
    strengths: [],
    scores: [],
    summary: null,
    priority: null,
    statistics: null
  };



  const detailedChunkPromises = chunks.map(async (chunk, index) => {
    const codeContent = chunk.map(({ path, content }) => `\n=== FILE: ${sanitizePath(path)} ===\n${sanitizeContent(content)}`).join('\n');
    const fullPrompt = `${basePrompt}\n\nREPOSITORY: ${sanitizePath(repoName)}\n\nFILE TREE:\n${fileList}\n\nCODE TO AUDIT:\n${codeContent}`;

    let attempts = 0;
    const maxAttempts = 4;

    while (attempts < maxAttempts) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: fullPrompt }],
          temperature: 0.0, 
          max_tokens: 6000,
          response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0]?.message?.content;
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (err) {
        if (err?.error?.code === 'rate_limit_exceeded' || err.message.toLowerCase().includes('rate limit') || err.message.includes('429')) {
          attempts++;
          console.warn(`Rate limit hit in detailed chunk ${index}. Waiting 30s before retry ${attempts}/${maxAttempts}...`);
          await sleep(30000 + (index * 5000)); // Stagger retries to avoid thunder herd
        } else {
          console.error('Detailed audit chunk error:', err.message);
          return null;
        }
      }
    }
    return null;
  });

  const detailedResults = await Promise.allSettled(detailedChunkPromises);

  detailedResults.forEach(r => {
    if (r.status === 'fulfilled' && r.value) {
      const result = r.value;
      if (Array.isArray(result.findings)) aggregatedData.findings.push(...result.findings);
      if (Array.isArray(result.strengths)) aggregatedData.strengths.push(...result.strengths);
      if (result.scores && typeof result.scores === 'object') aggregatedData.scores.push(result.scores);
      
      if (result.summary) aggregatedData.summary = result.summary;
      if (result.priority) aggregatedData.priority = result.priority;
      if (result.statistics) aggregatedData.statistics = result.statistics;
    }
  });

  // Deduplicate detailed findings
  const seen = new Set();
  aggregatedData.findings = aggregatedData.findings.filter((f) => {
    if (!f.title || !f.file) return false;
    const key = `${f.file}:${f.title.toLowerCase().slice(0, 40)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const finalScores = { overall: 75, security: 75, architecture: 75, performance: 75 };
  if (aggregatedData.scores.length > 0) {
    const keys = Object.keys(aggregatedData.scores[0]).filter(k => typeof aggregatedData.scores[0][k] === 'number');
    keys.forEach(k => {
      finalScores[k] = Math.round(aggregatedData.scores.reduce((sum, s) => sum + (s[k] || 0), 0) / aggregatedData.scores.length);
    });
  }

  return {
    isDetailed: true,
    findings: aggregatedData.findings.slice(0, 50),
    strengths: [...new Set(aggregatedData.strengths)],
    scores: finalScores,
    summary: aggregatedData.summary || { founder: "Audit complete" },
    priority: aggregatedData.priority || {},
    detailed_data: { priority: aggregatedData.priority, statistics: aggregatedData.statistics, strengths: [...new Set(aggregatedData.strengths)] }
  };
}
