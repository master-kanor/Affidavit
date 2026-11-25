'use strict';
const REQUIRED_JOBS = ['test', 'Main Chromium validation'];
function validateRun(run, repository, sha, jobs) {
  if (!run || run.event !== 'push' || run.head_branch !== 'main' ||
      run.head_sha !== sha || run.conclusion !== 'success' ||
      run.repository?.full_name !== repository || run.head_repository?.full_name !== repository) {
    throw new Error('No successful same-repository main push validation for the exact current commit');
  }
  for (const name of REQUIRED_JOBS) {
    const matches = jobs.filter(job => job.name === name);
    if (matches.length !== 1 || matches[0].conclusion !== 'success') {
      throw new Error('Required successful validation job missing: ' + name);
    }
  }
  return sha;
}
async function gate({github, context, core}) {
  const repo = context.repo;
  if (!['workflow_run', 'workflow_dispatch'].includes(context.eventName)) throw new Error('Unsupported trigger');
  if (context.eventName === 'workflow_dispatch' && context.ref !== 'refs/heads/main') throw new Error('Dispatch must target main');
  const {data: branch} = await github.rest.repos.getBranch({...repo, branch: 'main'});
  const sha = branch.commit.sha;
  const {data: workflow} = await github.rest.actions.getWorkflow({...repo, workflow_id: 'ci.yml'});
  let run;
  if (context.eventName === 'workflow_run') {
    const {data} = await github.rest.actions.getWorkflowRun({...repo, run_id: context.payload.workflow_run.id});
    run = data;
  } else {
    const {data} = await github.rest.actions.listWorkflowRuns({...repo, workflow_id: 'ci.yml', event: 'push', branch: 'main', head_sha: sha, status: 'success', per_page: 100});
    run = data.workflow_runs.find(candidate => candidate.head_sha === sha);
  }
  if (!run || run.workflow_id !== workflow.id) throw new Error('Run is not the repository CI workflow');
  const jobs = await github.paginate(github.rest.actions.listJobsForWorkflowRun, {...repo, run_id: run.id, filter: 'latest', per_page: 100});
  core.setOutput('sha', validateRun(run, repo.owner + '/' + repo.repo, sha, jobs));
}
module.exports = gate;
module.exports.validateRun = validateRun;
