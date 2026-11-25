'use strict';
function command(body) {
  const match = new RegExp('^/agent (status|review|fix|merge)$').exec((body || '').trim());
  return match?.[1] || null;
}
async function authorized(github, repo, login) {
  const {data} = await github.rest.repos.getCollaboratorPermissionLevel({...repo, username:login});
  return ['admin','maintain','write'].includes(data.permission);
}
async function coordinate({github, context, core}) {
  const p = context.payload;
  if (context.eventName === 'workflow_run') {
    // Only report actual hosted results, never fabricate a code review.
    for (const pr of p.workflow_run.pull_requests || []) {
      const {data: current} = await github.rest.pulls.get({...context.repo,pull_number:pr.number});
      if (current.state !== 'open' || current.head.sha !== p.workflow_run.head_sha) continue;
      await upsert(pr.number, 'validation-' + p.workflow_run.head_sha, 'Hosted validation: ' + p.workflow_run.conclusion + '. Run: ' + p.workflow_run.html_url + '\nThis is test evidence, not an independent AI or human review.');
    }
    return;
  }
  if (context.eventName === 'issues') {
    if (p.issue.user.type === 'Bot') return;
    await upsert(p.issue.number,'intake','Issue received. Maintainers can use /agent status, /agent review, /agent fix, or /agent merge. No untrusted issue text is executed.');
    return;
  }
  if (context.eventName !== 'issue_comment' || p.comment.user.type === 'Bot') return;
  const action = command(p.comment.body);
  if (!action || !await authorized(github,context.repo,p.comment.user.login)) return;
  const task = {version:1,repository:context.repo.owner+'/'+context.repo.repo,number:p.issue.number,action,event_id:p.comment.id};
  let result;
  if (action === 'fix' || action === 'review') {
    result = 'BLOCKED: no verified AI coding/review executor is configured. No paid API or agent was invoked, no code was changed, and no approval was submitted.';
  } else if (action === 'merge') {
    result = 'Merge evaluation requested. Requires AGENT_AUTO_MERGE_ENABLED=true, agent:auto-merge label, protected main, successful checks and current independent approval. This comment is not approval.';
  } else {
    result = 'Issue intake and validation reporting are available. AI fix/review executor remains unconfigured; production deployment and auto-merge retain their separate safety gates.';
  }
  await upsert(p.issue.number,'task-'+p.comment.id,JSON.stringify(task)+'\n\n'+result);
  async function upsert(number,key,body) {
    const marker = '<!-- agent-coordination:'+key+' -->';
    const comments = await github.paginate(github.rest.issues.listComments,{...context.repo,issue_number:number,per_page:100});
    const old = comments.find(c=>c.user.type==='Bot' && c.body?.includes(marker));
    if (!old) await github.rest.issues.createComment({...context.repo,issue_number:number,body:marker+'\n'+body});
  }
}
module.exports=coordinate;
module.exports.command=command;
module.exports.authorized=authorized;
