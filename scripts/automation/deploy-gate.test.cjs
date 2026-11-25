'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {validateRun} = require('./deploy-gate.cjs');
const repo = 'master-kanor/Affidavit';
const run = {event:'push', head_branch:'main', head_sha:'abc', conclusion:'success', repository:{full_name:repo}, head_repository:{full_name:repo}};
const jobs = [{name:'test',conclusion:'success'},{name:'Main Chromium validation',conclusion:'success'}];
test('accepts exact successful main push with both executed gates',()=>assert.equal(validateRun(run,repo,'abc',jobs),'abc'));
for (const [key,value] of Object.entries({event:'pull_request',head_branch:'feature',head_sha:'stale',conclusion:'failure',repository:{full_name:'fork/repo'},head_repository:{full_name:'fork/repo'}})) {
  test('rejects invalid '+key,()=>assert.throws(()=>validateRun({...run,[key]:value},repo,'abc',jobs)));
}
for (const conclusion of ['skipped','failure','cancelled',null]) {
 test('rejects browser job '+conclusion,()=>assert.throws(()=>validateRun(run,repo,'abc',[jobs[0],{...jobs[1],conclusion}])));
}
test('rejects absent run',()=>assert.throws(()=>validateRun(null,repo,'abc',jobs)));
test('rejects missing test job',()=>assert.throws(()=>validateRun(run,repo,'abc',[jobs[1]])));
test('rejects duplicate job names',()=>assert.throws(()=>validateRun(run,repo,'abc',[...jobs,jobs[0]])));
