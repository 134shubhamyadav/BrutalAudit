import { getAuth } from '../../../lib/auth-server.js';
import { getUserRepos } from '../../../lib/github.js';
import { adminAuth } from '../../../lib/firebase-admin.js';

// Rate limit store (in-memory for MVP; use Redis/Upstash in production)
const rateLimitStore = new Map();

function checkRateLimit(userId, maxRequests = 30, windowMs = 60000) {
  const now = Date.now();
  const key = `repos:${userId}`;
  const record = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
  } else {
    record.count++;
  }

  rateLimitStore.set(key, record);
  return record.count <= maxRequests;
}

export async function GET(request) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkRateLimit(userId)) {
      return Response.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
    }

    // Get GitHub token or UID from request headers
    const githubUid = request.headers.get('x-github-uid');
    const githubToken = request.headers.get('x-github-token');
    
    if (!githubUid && !githubToken) {
      return Response.json({ repos: [], authenticated: false });
    }

    let repos = [];
    if (githubToken) {
      // If we have an OAuth token, we can query GitHub's user repos endpoint directly
      repos = await getUserRepos(githubToken, null);
    } else if (githubUid) {
      // Convert their numeric GitHub ID to a GitHub username to fetch public repos
      const fetchHeaders = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'BrutalAudit/1.0' };
      if (process.env.GITHUB_ACCESS_TOKEN) {
        fetchHeaders['Authorization'] = `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`;
      }

      const userRes = await fetch(`https://api.github.com/user/${githubUid}`, {
        headers: fetchHeaders
      });
      
      if (!userRes.ok) {
         console.error(`Failed to fetch github user info for uid ${githubUid}:`, userRes.status, await userRes.text());
         return Response.json({ repos: [], authenticated: true });
      }
      
      const githubUser = await userRes.json();
      const githubUsername = githubUser.login;

      repos = await getUserRepos(null, githubUsername);
    }
    
    return Response.json({ repos, authenticated: true });

  } catch (error) {
    console.error('GET /api/repos error:', error.message);
    return Response.json(
      { error: error.message || 'Failed to fetch repositories' },
      { status: error.message?.includes('not found') ? 404 : 500 }
    );
  }
}
