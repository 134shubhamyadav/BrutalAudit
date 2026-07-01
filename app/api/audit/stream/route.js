import { getAuth } from '../../../../lib/auth-server.js';
import { getRepoFileTree, getFileContent, getRepoMeta, getLatestCommitSha } from '../../../../lib/github.js';
import { runAudit, runDetailedAudit } from '../../../../lib/groq.js';
import { createAudit, updateAudit, supabase } from '../../../../lib/supabase.js';
import { checkAuditLimit } from '../../../../lib/rateLimit.js';

export const maxDuration = 300; // Vercel Pro: up to 300s
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const isDetailed = searchParams.get('detailed') === 'true';
  const customPrompt = searchParams.get('customPrompt') || '';
  
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event, data) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          console.warn('Failed to send SSE:', e.message);
        }
      };
      
      let auditId = null;
      try {
        const { userId } = await getAuth(request);
        if (!userId) throw new Error('Unauthorized');

        const repoNameRegex = /^[a-zA-Z0-9._-]+$/;
        if (!owner || !repo) throw new Error('Owner and repo name are required');
        if (!repoNameRegex.test(owner)) throw new Error('Invalid owner name');
        if (!repoNameRegex.test(repo)) throw new Error('Invalid repository name');

        // Rate limit check
        const { allowed, remaining } = await checkAuditLimit(userId);
        if (!allowed) {
          throw new Error('Audit limit reached. You can run 5 audits per hour.');
        }
        
        let githubToken = searchParams.get('githubToken') || null;

        const auditRecord = await createAudit({
          userId,
          repoFullName: `${owner}/${repo}`,
          repoOwner: owner,
          repoName: repo,
        });
        auditId = auditRecord.id;

        await updateAudit(auditId, { status: 'running' });
        
        send('progress', { step: 'fetching', message: 'Fetching repository files…' });

        // Fetch repo metadata first to resolve default branch dynamically
        const repoMeta = await getRepoMeta(owner, repo, githubToken);
        const defaultBranch = repoMeta.defaultBranch || 'main';

        const [fileTree, commitSha] = await Promise.all([
          getRepoFileTree(owner, repo, defaultBranch, githubToken),
          getLatestCommitSha(owner, repo, defaultBranch, githubToken),
        ]);

        if (commitSha && !customPrompt) {
          const { data: cached } = await supabase
            .from('audit_cache')
            .select('audit_id')
            .eq('repo_full_name', `${owner}/${repo}`)
            .eq('commit_sha', commitSha)
            .eq('is_detailed', isDetailed)
            .single();

          if (cached) {
            const { data: cachedAudit } = await supabase
              .from('audits')
              .select('*')
              .eq('id', cached.audit_id)
              .single();

            if (cachedAudit) {
              send('progress', { step: 'analyzing', message: 'Loaded from cache…' });
              await updateAudit(auditId, {
                status: 'done',
                findings: cachedAudit.findings,
                scores: cachedAudit.scores,
                summary: cachedAudit.summary,
                repo_meta: cachedAudit.repo_meta,
                completed_at: new Date().toISOString(),
              });
              send('complete', { auditId, scores: cachedAudit.scores, remaining });
              return;
            }
          }
        }

        if (fileTree.length === 0) {
          await updateAudit(auditId, { status: 'failed' });
          throw new Error('No auditable files found in this repository.');
        }

        const fileContents = [];
        const batches = [];
        for (let i = 0; i < fileTree.length; i += 10) {
          batches.push(fileTree.slice(i, i + 10));
        }

        for (const batch of batches) {
          const results = await Promise.allSettled(
            batch.map(async (file) => ({
              path: file.path,
              content: await getFileContent(owner, repo, file.path, githubToken),
            }))
          );
          results.forEach((r) => {
            if (r.status === 'fulfilled' && r.value.content) {
              fileContents.push(r.value);
            }
          });
        }
        
        send('progress', { step: 'analyzing', message: 'Running AI analysis…' });

        const auditResult = isDetailed 
          ? await runDetailedAudit(`${owner}/${repo}`, fileTree, fileContents, customPrompt)
          : await runAudit(`${owner}/${repo}`, fileTree, fileContents);

        send('progress', { step: 'saving', message: 'Generating report…' });

        let summaryToSave = auditResult.summary;
        if (typeof summaryToSave === 'object') {
          summaryToSave = JSON.stringify(summaryToSave);
        }

        let repoMetaToSave = repoMeta;
        if (auditResult.detailed_data) {
           repoMetaToSave = { ...repoMeta, detailed_data: auditResult.detailed_data };
        }

        await updateAudit(auditId, {
          status: 'done',
          findings: auditResult.findings,
          scores: { ...auditResult.scores, isDetailed: !!isDetailed },
          security_score: auditResult.scores.security,
          architecture_score: auditResult.scores.architecture,
          performance_score: auditResult.scores.performance,
          slop_score: auditResult.scores.slop,
          devops_score: auditResult.scores.devops,
          readiness_score: auditResult.scores.readiness,
          health_score: auditResult.scores.health,
          summary: summaryToSave,
          repo_meta: repoMetaToSave,
          completed_at: new Date().toISOString(),
        });

        if (commitSha && !customPrompt) {
          await supabase.from('audit_cache').insert({
            repo_full_name: `${owner}/${repo}`,
            commit_sha: commitSha,
            is_detailed: isDetailed,
            audit_id: auditId
          });
        }

        send('complete', { auditId, scores: auditResult.scores, remaining });
      } catch (err) {
        if (auditId) {
          try { await updateAudit(auditId, { status: 'failed' }); } catch {}
        }
        send('error', { message: err.message });
      } finally {
        try { controller.close(); } catch {}
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    }
  });
}
