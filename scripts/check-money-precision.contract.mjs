// Run with: node --test scripts/check-money-precision.contract.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { displayedMoneyCents, classifyRequest } from './lib/money-precision-reference.mjs';

for(const [raw,expected] of [['-12,34',-1234],['-0,50',-50],['-12.34',-1234],['12,34',1234],['0,50',50],['-0,00',0],['12',1200]]) {
 test(`reads displayed money ${raw} as ${expected} cents`,()=>assert.equal(displayedMoneyCents(raw),expected));
}
for(const [url,method,expected] of [
 ['http://127.0.0.1:3144/path','GET','local-read'],
 ['http://127.0.0.1:3144/path','HEAD','local-read'],
 ['https://example.invalid/font','GET','blocked-read'],
 ['https://example.invalid/probe','HEAD','blocked-read'],
 ['http://127.0.0.1:3144/action','POST','write'],
 ['https://example.invalid/progress','POST','write'],
 ['http://127.0.0.1:3144/action','DELETE','write'],
]) {
 test(`classifies ${method} ${url} as ${expected}`,()=>assert.equal(classifyRequest(url,method,'http://127.0.0.1:3144'),expected));
}
