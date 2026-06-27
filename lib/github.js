// GitHub API wrapper - uses the OAuth token from Clerk session

const GITHUB_API = 'https://api.github.com';

// Priority file extensions to audit (skip binary, generated, lock files)
const AUDIT_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java', '.rb',
  '.php', '.cs', '.cpp', '.c', '.swift', '.kt', '.scala', '.vue',
  '.svelte', '.astro', '.sh', '.yml', '.yaml', '.json', '.toml', '.env.example',
];

// Paths to always skip
const SKIP_PATHS = [
  'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
  'vendor', 'coverage', '.nyc_output', 'package-lock.json',
  'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', '.DS_Store',
];

async function githubFetch(path, token) {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'BrutalAudit/1.0',
  };
  const activeToken = token || process.env.GITHUB_ACCESS_TOKEN;
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  const res = await fetch(`${GITHUB_API}${path}`, { headers });

  if (res.status === 404) throw new Error('Repository not found or private');
  if (res.status === 403) throw new Error('GitHub API rate limit exceeded. Try again later.');
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);

  return res.json();
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getUserRepos(token, username = null) {
  // If we have a token, we can fetch all repos (including private)
  // If no token but we have a username, fetch public repos for that username
  const endpointBase = token ? '/user/repos' : `/users/${username}/repos`;
  
  // Fetch first 2 pages of repos (100 max)
  const [page1, page2] = await Promise.allSettled([
    githubFetch(`${endpointBase}?sort=updated&per_page=50&page=1`, token),
    githubFetch(`${endpointBase}?sort=updated&per_page=50&page=2`, token),
  ]);

  const repos1 = page1.status === 'fulfilled' ? page1.value : [];
  const repos2 = page2.status === 'fulfilled' ? page2.value : [];
  const allRepos = [...repos1, ...repos2];

  return allRepos.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner.login,
    description: repo.description || '',
    language: repo.language || 'Unknown',
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    isPrivate: repo.private,
    updatedAt: repo.updated_at,
    defaultBranch: repo.default_branch,
    url: repo.html_url,
    openIssues: repo.open_issues_count,
  }));
}

export async function getRepoMeta(owner, repo, token) {
  const data = await githubFetch(`/repos/${owner}/${repo}`, token);
  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description || '',
    language: data.language || 'Unknown',
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    defaultBranch: data.default_branch,
    url: data.html_url,
    updatedAt: data.updated_at,
  };
}

export async function getRepoLanguages(owner, repo, token) {
  try {
    return await githubFetch(`/repos/${owner}/${repo}/languages`, token);
  } catch {
    return {};
  }
}

export async function getLatestCommitSha(owner, repo, branch = 'main', token) {
  try {
    const data = await githubFetch(`/repos/${owner}/${repo}/commits/${branch}`, token);
    return data.sha;
  } catch {
    // Fallback to master
    try {
      const data = await githubFetch(`/repos/${owner}/${repo}/commits/master`, token);
      return data.sha;
    } catch {
      return null;
    }
  }
}

export async function getRepoFileTree(owner, repo, branch = 'main', token) {
  try {
    const data = await githubFetch(
      `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      token
    );

    return (data.tree || [])
      .filter((file) => {
        if (file.type !== 'blob') return false;
        const path = file.path;
        // Skip excluded paths
        if (SKIP_PATHS.some((skip) => path.includes(skip))) return false;
        // Only include auditable extensions
        const ext = '.' + path.split('.').pop();
        return AUDIT_EXTENSIONS.includes(ext);
      })
      .sort((a, b) => {
        // Prioritize source files over config/docs
        const aScore = getPriorityScore(a.path);
        const bScore = getPriorityScore(b.path);
        return bScore - aScore;
      })
      .slice(0, 150); // Increased limit for detailed audits
  } catch {
    // Fallback: try 'master' branch
    try {
      const data = await githubFetch(
        `/repos/${owner}/${repo}/git/trees/master?recursive=1`,
        token
      );
      return (data.tree || [])
        .filter((f) => f.type === 'blob' && AUDIT_EXTENSIONS.includes('.' + f.path.split('.').pop()))
        .filter((f) => !SKIP_PATHS.some((skip) => f.path.includes(skip)))
        .slice(0, 150);
    } catch {
      return [];
    }
  }
}

export async function getFileContent(owner, repo, path, token) {
  try {
    const data = await githubFetch(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
      token
    );
    if (data.encoding === 'base64' && data.content) {
      return Buffer.from(data.content, 'base64').toString('utf-8').slice(0, 8000); // Cap at 8k chars per file
    }
    return '';
  } catch {
    return '';
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPriorityScore(path) {
  let score = 0;
  // Source files are highest priority
  if (path.match(/\.(ts|tsx|js|jsx|py|go|rs)$/)) score += 10;
  // Config files with secrets potential
  if (path.match(/\.(env|config|yaml|yml)$/)) score += 8;
  // Entry points
  if (path.match(/^(index|main|app|server)\./)) score += 5;
  // API routes
  if (path.includes('/api/') || path.includes('/routes/')) score += 4;
  // Auth related
  if (path.toLowerCase().includes('auth')) score += 3;
  // Core business logic
  if (path.includes('services/') || path.includes('lib/')) score += 4;
  // Test files are lower priority
  if (path.includes('.test.') || path.includes('.spec.')) score -= 3;
  // Deeply nested files are lower priority
  score -= (path.split('/').length - 1);
  return score;
}
