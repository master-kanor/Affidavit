'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const coordinate=require('./coordinate.cjs');
const mergeGate=require('./merge-gate.cjs');
const deployGate=require('./deploy-gate.cjs');
function fixture() {
 const state={merged:[],comments:[],updates:[],failed:[],permissions:'write',paths:[{filename:'client/src/Welcome.tsx'}],reviews:[{state:'APPROVED',commit_id:'head',user:{login:'reviewer',type:'User'}}],checks:['test','TypeScript and source checks','Integration tests','Chromium end-to-end tests'].map(name=>({name,status:'completed',conclusion:'success',app:{slug:'github-actions'}})),existing:[]};
 state.pr={state:'open',draft:false,base:{ref:'main'},head:{sha:'head',repo:{full_name:'master-kanor/Affidavit'}},labels:[{name:'agent:auto-merge'}],mergeable_state:'clean',user:{login:'author'}};
 state.protection={enforce_admins:{enabled:true},required_status_checks:{strict:true},required_pull_request_reviews:{dismiss_stale_reviews:true,required_approving_review_count:1}};
 const listFiles=()=>{}; const listReviews=()=>{}; const listChecks=()=>{}; const listComments=()=>{};
 const github={rest:{repos:{getCollaboratorPermissionLevel:async()=>({data:{permission:state.permissions}}),getBranchProtection:async()=>{if(state.apiError)throw new Error('403 forbidden');return {data:state.protection};}},pulls:{get:async()=>({data:state.pr}),listFiles,listReviews,merge:async args=>{state.merged.push(args);return {data:{merged:true}};}},checks:{listForRef:listChecks},issues:{listComments,createComment:async args=>state.comments.push(args),updateComment:async args=>state.updates.push(args)}},paginate:async method=>{if(method===listFiles)return state.paths;if(method===listReviews)return state.reviews;if(method===listChecks)return state.checks;if(method===listComments)return state.existing;throw new Error('Unexpected API');}};
 const context={repo:{owner:'master-kanor',repo:'Affidavit'},eventName:'issue_comment',payload:{issue:{number:12,pull_request:{}},comment:{id:42,body:'/agent merge',user:{id:1,login:'maintainer',type:'User'}}}};
 const core={warning:()=>{},notice:()=>{},setFailed:message=>state.failed.push(message)};
 return {github,context,core,state};
}
test('merge sends exact reviewed SHA only after all gates',async()=>{const f=fixture();await mergeGate(f);assert.equal(f.state.merged.length,1);assert.equal(f.state.merged[0].sha,'head');});
for(const scenario of ['fork','draft','unlabeled','unprotected','stale-approval','self-approval','bot-approval','changes-requested','sensitive','renamed-sensitive','failed-check','pending-check','missing-check','permission-error','reader-command','bot-command']) {
 test('merge blocks '+scenario,async()=>{
  const f=fixture();const s=f.state;
  if(scenario==='fork')s.pr.head.repo.full_name='fork/Affidavit';
  if(scenario==='draft')s.pr.draft=true;
  if(scenario==='unlabeled')s.pr.labels=[];
  if(scenario==='unprotected')s.protection.enforce_admins.enabled=false;
  if(scenario==='stale-approval')s.reviews[0].commit_id='old';
  if(scenario==='self-approval')s.reviews[0].user.login='author';
  if(scenario==='bot-approval')s.reviews[0].user.type='Bot';
  if(scenario==='changes-requested')s.reviews.push({state:'CHANGES_REQUESTED',user:{login:'other'}});
  if(scenario==='sensitive')s.paths=[{filename:'.github/workflows/a.yml'}];
  if(scenario==='renamed-sensitive')s.paths=[{filename:'client/a.ts',previous_filename:'functions/auth.ts'}];
  if(scenario==='failed-check')s.checks[0].conclusion='failure';
  if(scenario==='pending-check')s.checks[0].status='in_progress';
  if(scenario==='missing-check')s.checks=[];
  if(scenario==='permission-error')s.apiError=true;
  if(scenario==='reader-command')s.permissions='read';
  if(scenario==='bot-command')f.context.payload.comment.user.type='Bot';
  await mergeGate(f);assert.equal(s.merged.length,0);
  if(scenario==='permission-error')assert.match(s.failed[0],/403/);
 });
}
test('fix reports blocked instead of invoking unconfigured agent',async()=>{const f=fixture();f.context.payload.comment.body='/agent fix';await coordinate(f);assert.match(f.state.comments[0].body,/BLOCKED/);assert.equal(f.state.merged.length,0);});
test('untrusted comments cannot create tasks',async()=>{const f=fixture();f.state.permissions='read';await coordinate(f);assert.equal(f.state.comments.length,0);});
test('other bot cannot suppress coordinator response',async()=>{const f=fixture();f.context.payload.comment.body='/agent status';f.state.existing=[{user:{login:'other[bot]',type:'Bot'},body:'<!-- agent-coordination:task-42 -->\nspoof'}];await coordinate(f);assert.equal(f.state.comments.length,1);});
test('own marker updates result without duplicate',async()=>{const f=fixture();f.context.payload.comment.body='/agent status';f.state.existing=[{id:5,user:{login:'github-actions[bot]',type:'Bot'},body:'<!-- agent-coordination:task-42 -->\nold'}];await coordinate(f);assert.equal(f.state.comments.length,0);assert.equal(f.state.updates.length,1);});
test('unknown bot is denied',async()=>{const f=fixture();f.context.payload.comment.user.type='Bot';f.context.payload.comment.body='/agent status';await coordinate(f);assert.equal(f.state.comments.length,0);});
test('dispatch on nonmain fails before API access',async()=>{await assert.rejects(()=>deployGate({context:{eventName:'workflow_dispatch',ref:'refs/heads/feature',repo:{}},github:{},core:{}}),/must target main/);});
test('deploy uses verified workflow and emits exact SHA',async()=>{
 const outputs=[];const listJobs=()=>{};
 const run={id:4,workflow_id:10,event:'push',head_branch:'main',head_sha:'abc',conclusion:'success',repository:{full_name:'master-kanor/Affidavit'},head_repository:{full_name:'master-kanor/Affidavit'}};
 const github={rest:{repos:{getBranch:async()=>({data:{commit:{sha:'abc'}}})},actions:{getWorkflow:async()=>({data:{id:10}}),getWorkflowRun:async()=>({data:run}),listJobsForWorkflowRun:listJobs}},paginate:async()=>[{name:'test',conclusion:'success'},{name:'Main Chromium validation',conclusion:'success'}]};
 const context={eventName:'workflow_run',repo:{owner:'master-kanor',repo:'Affidavit'},payload:{workflow_run:{id:4}}};
 await deployGate({github,context,core:{setOutput:(key,value)=>outputs.push([key,value])}});assert.deepEqual(outputs,[['sha','abc']]);
 run.workflow_id=11;await assert.rejects(()=>deployGate({github,context,core:{}}),/not the repository CI/);
});
