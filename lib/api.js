import { auth } from './firebase';

const API_BASE = '/api';

async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
      
      const githubProvider = auth.currentUser.providerData.find(p => p.providerId === 'github.com');
      if (githubProvider) {
        headers['x-github-uid'] = githubProvider.uid;
      }
      
      if (typeof window !== 'undefined') {
        const storedGithubToken = localStorage.getItem('githubToken');
        if (storedGithubToken) {
          headers['x-github-token'] = storedGithubToken;
        }
      }
    } catch (e) {
      console.warn('Failed to get Firebase token', e);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
  return data;
}

export const api = {
  repos: {
    list: () => apiRequest('/repos'),
  },
  audits: {
    create: (owner, repo, isDetailed, customPrompt) =>
      apiRequest('/audit', { method: 'POST', body: JSON.stringify({ owner, repo, isDetailed, customPrompt }) }),
    get: (id) => apiRequest(`/report/${id}`),
    list: () => apiRequest('/reports'),
    status: (id) => apiRequest(`/audit/status/${id}`),
  },
  dashboard: {
    get: () => apiRequest('/dashboard'),
  },
  stats: {
    public: () => apiRequest('/stats'),
  },
};
