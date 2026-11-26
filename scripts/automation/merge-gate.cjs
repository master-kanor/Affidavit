'use strict';
const {command,authorized}=require('./coordinate.cjs');
const REQUIRED=['test','TypeScript and source checks','Integration tests','Chromium end-to-end tests'];
const sensitive = path => ['.github/', 'scripts/', 'supabase/', 'migrations/', 'functions/'].some(prefix => path.startsWith(prefix)) || ['auth', 'credential', 'secret', 'permission'].some(term => path.toLowerCase().includes(term));
async function mergeGate({github,context,core}) {
 const p=context.payload;
 let numbers=[];
 if(context.eventName==='issue_comment') {
  if(p.comment.user.type==='Bot' || command(p.comment.body)!=='merge' || !p.issue.pull_request || !await authorized(github,context.repo,p.comment.user.login)) return;
  numbers=[p.issue.number];
 } else if(context.eventName==='pull_request_review') numbers=[p.pull_request.number];
 else if(context.eventName==='workflow_run') numbers=(p.workflow_run.pull_requests||[]).map(pr=>pr.number);
 for(const number of numbers) {
  try { await evaluate(number); } catch(error) { core.setFailed('Merge blocked for #'+number+': '+error.message); }
 }
 async function evaluate(number) {
  const repo=context.repo;
  const {data:pr}=await github.rest.pulls.get({...repo,pull_number:number});
  const full=repo.owner+'/'+repo.repo;
  if(pr.state!=='open'||pr.draft||pr.base.ref!=='main'||pr.head.repo?.full_name!==full||!pr.labels.some(l=>l.name==='agent:auto-merge')) return;
  if(pr.mergeable_state!=='clean') throw new Error('PR is not currently clean and mergeable');
  const {data:protection}=await github.rest.repos.getBranchProtection({...repo,branch:'main'});
  const rules=protection.required_pull_request_reviews;
  if(!protection.enforce_admins?.enabled||!protection.required_status_checks?.strict||!rules?.dismiss_stale_reviews||rules.required_approving_review_count<1) throw new Error('Strict branch protection with enforced current approvals is required');
  const paths=await github.paginate(github.rest.pulls.listFiles,{...repo,pull_number:number,per_page:100});
  if(paths.length>=3000 || paths.some(f=>sensitive(f.filename)||sensitive(f.previous_filename||''))) throw new Error('Sensitive changes require manual merge');
  const reviews=await github.paginate(github.rest.pulls.listReviews,{...repo,pull_number:number,per_page:100});
  const latest={};
  for(const review of reviews) if(['APPROVED','CHANGES_REQUESTED','DISMISSED'].includes(review.state)) latest[review.user.login]=review;
  if(Object.values(latest).some(r=>r.state==='CHANGES_REQUESTED')) throw new Error('Unresolved change request');
  let approvals=0;
  for(const review of Object.values(latest)) if(review.state==='APPROVED'&&review.commit_id===pr.head.sha&&review.user.type!=='Bot'&&review.user.login!==pr.user.login&&await authorized(github,repo,review.user.login)) approvals++;
  if(approvals<rules.required_approving_review_count) throw new Error('Insufficient independent current-head approvals');
  const checks=await github.paginate(github.rest.checks.listForRef,{...repo,ref:pr.head.sha,filter:'latest',per_page:100});
  for(const name of REQUIRED) if(!checks.some(c=>c.name===name&&c.app?.slug==='github-actions'&&c.status==='completed'&&c.conclusion==='success')) throw new Error('Missing successful gate: '+name);
  if(checks.some(c=>c.status!=='completed'||!['success','neutral','skipped'].includes(c.conclusion))) throw new Error('Other checks are pending or failing');
  // Do not emulate arbitrary protection contexts or App identities: GitHub enforces them.
  const {data:result}=await github.rest.pulls.merge({...repo,pull_number:number,sha:pr.head.sha,merge_method:'squash'});
  if(!result.merged) throw new Error(result.message||'GitHub did not merge');
  core.notice('Merged #'+number+' at verified head '+pr.head.sha);
 }
}
module.exports=mergeGate;
module.exports.sensitive=sensitive;
