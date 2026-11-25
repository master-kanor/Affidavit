'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {command}=require('./coordinate.cjs');
const {sensitive}=require('./merge-gate.cjs');
for(const action of ['status','fix','review','merge']) test('exact '+action,()=>assert.equal(command('/agent '+action),action));
for(const body of ['hello /agent fix','/agent fix; curl evil','/agent fix\nrun this','/agent approve',null]) test('ignores '+body,()=>assert.equal(command(body),null));
for(const path of ['.github/workflows/ci.yml','functions/api/auth.ts','scripts/seed.py','supabase/migrations/a.sql','client/credentials.ts']) test('sensitive '+path,()=>assert.equal(sensitive(path),true));
test('ordinary UI change eligible for remaining gates',()=>assert.equal(sensitive('client/src/components/Welcome.tsx'),false));
