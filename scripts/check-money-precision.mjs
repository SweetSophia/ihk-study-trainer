// Manual LOCAL production guest check: npm run build; npm start -- --port 3144;
// node scripts/check-money-precision.mjs (or set IHK_TEST_URL for another local port)
// Optional CHROMIUM_PATH; otherwise install managed Chromium separately.
// Independent integer/rational oracle reads displayed givens, never app answer keys.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { displayedMoneyCents, classifyRequest } from './lib/money-precision-reference.mjs';
const url=process.env.IHK_TEST_URL||'http://127.0.0.1:3144';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname));
const forwardKeys=['lep','rabatt','zep','skonto','bep','bp','handlungskosten','selbstkosten','gewinn','bvp','kundenskonto','zvp','kundenrabatt','nettovk','ust','bruttovk'];
const backwardKeys=['ust','nettovk','kundenrabatt','zvp','kundenskonto','bvp','gewinn','selbstkosten','handlungskosten','bp','bep','skonto','zep','rabatt','lep'];
const format=cents=>(cents/100).toFixed(2).replace('.',',');
const ratio=(cents,n,d)=>Number((BigInt(cents)*BigInt(n)*2n+BigInt(d))/(2n*BigInt(d)));
function givens(text){
 const read=label=>{const match=text.match(new RegExp('• '+label+': (-?\\d+(?:[.,]\\d+)?)\\s*[€%]'));assert.ok(match,`missing ${label}`);return match[1].replace(',','.');};
 const money=label=>displayedMoneyCents(read(label));
 return {read,money,rebate:Number(read('Lieferantenrabatt')),skonto:Number(read('Lieferskonto')),costs:money('Bezugskosten'),handling:Number(read('Handlungskosten')),profit:Number(read('Gewinnzuschlag')),customerSkonto:Number(read('Kundenskonto')),customerRebate:Number(read('Kundenrabatt')),vat:Number(read('Umsatzsteuer'))};
}
function forward(g,lep){
 const c={lep};c.rabatt=ratio(c.lep,g.rebate,100);c.zep=c.lep-c.rabatt;
 c.skonto=ratio(c.zep,g.skonto,100);c.bep=c.zep-c.skonto;c.bp=c.bep+g.costs;
 c.handlungskosten=ratio(c.bp,g.handling,100);c.selbstkosten=c.bp+c.handlungskosten;
 c.gewinn=ratio(c.selbstkosten,g.profit,100);c.bvp=c.selbstkosten+c.gewinn;
 c.zvp=ratio(c.bvp,100,100-g.customerSkonto);c.kundenskonto=c.zvp-c.bvp;
 c.nettovk=ratio(c.zvp,100,100-g.customerRebate);c.kundenrabatt=c.nettovk-c.zvp;
 c.ust=ratio(c.nettovk,g.vat,100);c.bruttovk=c.nettovk+c.ust;return c;
}
function backward(g,gross){
 const c={};c.nettovk=ratio(gross,100,100+g.vat);c.ust=gross-c.nettovk;
 c.kundenrabatt=ratio(c.nettovk,g.customerRebate,100);c.zvp=c.nettovk-c.kundenrabatt;
 c.kundenskonto=ratio(c.zvp,g.customerSkonto,100);c.bvp=c.zvp-c.kundenskonto;
 c.selbstkosten=ratio(c.bvp,100,100+g.profit);c.gewinn=c.bvp-c.selbstkosten;
 c.bp=ratio(c.selbstkosten,100,100+g.handling);c.handlungskosten=c.selbstkosten-c.bp;
 c.bep=c.bp-g.costs;c.zep=ratio(c.bep,100,100-g.skonto);c.skonto=c.zep-c.bep;
 c.lep=ratio(c.zep,100,100-g.rebate);c.rabatt=c.lep-c.zep;return c;
}
function oracle(mode,text){
 const g=givens(text);
 if(mode==='forward'){const c=forward(g,g.money('Listeneinkaufspreis \\(netto\\)'));return forwardKeys.map(k=>c[k]);}
 if(mode==='backward'){const c=backward(g,g.money('Bruttoverkaufspreis'));return backwardKeys.map(k=>c[k]);}
 const f=forward(g,g.money('Listeneinkaufspreis \\(netto, gegeben\\)')),market=g.money('Marktpreis \\(Brutto-VK\\)'),b=backward(g,market);
 return [...forwardKeys.map(k=>f[k]),...backwardKeys.map(k=>b[k]),market-f.bruttovk];
}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined});
try{for(const width of[320,390,1440]){
 const context=await browser.newContext({viewport:{width,height:900},locale:'de-DE',reducedMotion:'reduce'});
 let writes=0,blockedReads=0;
 await context.route('**/*',route=>{
  const kind=classifyRequest(route.request().url(),route.request().method(),new URL(url).origin);
  if(kind==='local-read')return route.continue();
  if(kind==='blocked-read')blockedReads++;else writes++;
  return route.abort();
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.getByRole('button',{name:'Schließen',exact:true}).click();
 const nav=page.getByRole('navigation',{name:'Lernmodule',exact:true}),appearance=page.getByRole('combobox',{name:'Darstellung'});
 const names={forward:'Vorwärtskalkulation',backward:'Rückwärtskalkulation',differential:'Differenzkalkulation'};
 async function openNav(){if(!await nav.locator('.navigation-panel').isVisible())await nav.getByRole('button',{name:/^Aufgabe wechseln/}).click();}
 async function activate(button,profile='standard'){
  await button.evaluate((element,profile)=>{const original=Math.random;let call=0;Math.random=()=>profile==='negative'?(call++<9?.5:0):profile==='zero'?(call++===0?0:.5):.5;try{element.click();}finally{Math.random=original;}},profile);
 }
 async function clearFeedback(){for(const text of['Richtig! Sehr gut gemacht.','Das ist nicht ganz richtig.'])await page.getByText(text,{exact:true}).waitFor({state:'detached'});}
 async function choose(mode,profile='standard'){
  await openNav();const group=nav.getByRole('button',{name:/^Wirtschaft & Projekt/});if(await group.getAttribute('aria-expanded')!=='true')await group.click();
  await activate(nav.getByRole('button',{name:names[mode],exact:true}),profile);await clearFeedback();
  await page.getByRole('heading',{name:names[mode],exact:true}).waitFor();
 }
 async function next(profile='standard'){await activate(page.getByRole('button',{name:/Nächste Frage/}),profile);await clearFeedback();}
 const inputs=()=>page.locator('.workspace input[type="text"]');
 async function fill(mode){
  const text=await page.getByText(new RegExp(`^Berechne die ${names[mode]}!`)).textContent();
  assert.ok(text.includes('centgenau')&&text.includes('Bruchteile eines Cents'));
  const values=oracle(mode,text);assert.equal(await inputs().count(),values.length);for(let i=0;i<values.length;i++)await inputs().nth(i).fill(format(values[i]));return values;
 }
 async function submit(correct){await page.getByRole('button',{name:/Antwort prüfen/}).click();await page.getByText(correct?'Richtig! Sehr gut gemacht.':'Das ist nicht ganz richtig.',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:/Antwort prüfen/}).count(),0);}
 async function overflow(){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow${width}`);}
 await choose('forward');let values=await fill('forward');const draft=await inputs().first().inputValue();
 await appearance.selectOption('dark');await openNav();if(width<1024)await nav.getByRole('button',{name:/^Aufgabe wechseln/}).click();assert.equal(await inputs().first().inputValue(),draft);
 await inputs().first().fill(format(Math.round(values[0]*104/100)));await submit(false);
 await page.getByRole('region',{name:'Hinweise zur Kalkulation'}).waitFor();
 await page.getByRole('button',{name:'Lösung anzeigen'}).click();await page.getByRole('button',{name:'Lösung ausblenden'}).click();await next();
 assert.equal(await inputs().first().inputValue(),'');assert.equal(await page.getByRole('region',{name:'Hinweise zur Kalkulation'}).count(),0);
 values=await fill('forward');await inputs().first().fill(format(values[0])+ '1');await submit(false);await page.getByRole('region',{name:'Hinweise zur Kalkulation'}).getByText(/Cent/).waitFor();
 await next();await fill('forward');await appearance.selectOption('light');await submit(true);await overflow();
 await choose('backward');await fill('backward');await submit(true);await overflow();
 await choose('differential','negative');values=await fill('differential');assert.ok(values.at(-1)<0,'negative-gap fixture');await submit(true);await overflow();
 await next('zero');values=await fill('differential');assert.equal(values.at(-1),0);await inputs().last().fill('-0,000');await submit(true);await overflow();
 assert.equal(writes,0,'guest must not attempt network writes');
 assert.equal(blockedReads,0,'unexpected external reads invalidate this local-only check');
 assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(k=>k==='ihk_access_hash'||k.startsWith('ihk_progress'))),false);
 console.log(JSON.stringify({width,independentDisplayedValueOracle:true,exactCommaAccepted:true,relativeAndSubcentRejected:true,negativeAndZero:true,freshFeedback:true,themeDraftRetained:true,guestNoWrites:true,blockedExternalReads:blockedReads}));
 await context.close();
}}finally{await browser.close();}
