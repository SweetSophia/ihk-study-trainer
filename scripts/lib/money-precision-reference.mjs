// Independent QA helpers only. Never imported by the application grader.
import assert from 'node:assert/strict';

export function displayedMoneyCents(raw) {
 assert.match(raw,/^-?\d+(?:[.,]\d{1,2})?$/);
 const [whole, fraction='']=raw.replace(',','.').split('.');
 const magnitude=Math.abs(Number(whole))*100+Number(fraction.padEnd(2,'0'));
 assert.ok(Number.isSafeInteger(magnitude));
 return magnitude===0 ? 0 : (whole.startsWith('-') ? -magnitude : magnitude);
}

export function classifyRequest(requestUrl, method, localOrigin) {
 if(!['GET','HEAD'].includes(method)) return 'write';
 return new URL(requestUrl).origin===localOrigin ? 'local-read' : 'blocked-read';
}
