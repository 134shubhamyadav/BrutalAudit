import { getAuth } from '../../../lib/auth-server.js';
import { getRepoFileTree, getFileContent, getRepoMeta } from '../../../lib/github.js';
import { runAudit, runDetailedAudit } from '../../../lib/groq.js';
import { createAudit, updateAudit } from '../../../lib/supabase.js';
import { checkAuditLimit } from '../../../lib/rateLimit.js';

function validateRepoInput(owner, repo) {
  const repoNameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!owner || !repo) return 'Owner and repo name are required';
  if (!repoNameRegex.test(owner)) return 'Invalid owner name';
  if (!repoNameRegex.test(repo)) return 'Invalid repository name';
  if (owner.length > 100 || repo.length > 100) return 'Name too long';
  return null;
}

export async function POST(request) {
  let auditId = null;

  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { owner, repo, isDetailed, customPrompt } = body;
    const validationError = validateRepoInput(owner, repo);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    // Rate limit check
    const { allowed, remaining } = await checkAuditLimit(userId);
    if (!allowed) {
      return Response.json(
        { error: 'Audit limit reached. You can run 3 audits per month on the Free plan. Upgrade to Pro for unlimited audits.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
      );
    }

    // GitHub token from frontend localStorage to bypass unauthenticated rate limits.
    let githubToken = request.headers.get('x-github-token');

    // Create pending audit record
    const auditRecord = await createAudit({
      userId,
      repoFullName: `${owner}/${repo}`,
      repoOwner: owner,
      repoName: repo,
    });
    auditId = auditRecord.id;

    // Mark as running
    await updateAudit(auditId, { status: 'running' });

    // Fetch repo metadata first to resolve default branch dynamically
    const repoMeta = await getRepoMeta(owner, repo, githubToken);
    const defaultBranch = repoMeta.defaultBranch || 'main';

    const fileTree = await getRepoFileTree(owner, repo, defaultBranch, githubToken);

    if (fileTree.length === 0) {
      await updateAudit(auditId, { status: 'failed' });
      return Response.json({ error: 'No auditable files found in this repository.' }, { status: 422 });
    }

    // Fetch file contents in parallel (batches of 10)
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

    // Run AI audit
    const auditResult = isDetailed 
      ? await runDetailedAudit(`${owner}/${repo}`, fileTree, fileContents, customPrompt)
      : await runAudit(`${owner}/${repo}`, fileTree, fileContents);

    let summaryToSave = auditResult.summary;
    if (typeof summaryToSave === 'object') {
      summaryToSave = JSON.stringify(summaryToSave);
    }

    let repoMetaToSave = repoMeta;
    if (auditResult.detailed_data) {
       repoMetaToSave = { ...repoMeta, detailed_data: auditResult.detailed_data };
    }

    // Save results
    const completed = await updateAudit(auditId, {
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

    return Response.json({
      id: auditId,
      scores: auditResult.scores,
      findingsCount: auditResult.findings.length,
      remaining,
    });

  } catch (error) {
    console.error('POST /api/audit error:', error.message);

    // Mark audit as failed if we created one
    if (auditId) {
      try {
        await updateAudit(auditId, { status: 'failed' });
      } catch {}
    }

    return Response.json(
      { error: error.message || 'Audit failed. Please try again.' },
      { status: 500 }
    );
  }
}
