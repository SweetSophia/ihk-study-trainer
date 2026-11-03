// Local production acceptance. Fixture indices select questions, never derive expected grades.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
const url=process.env.IHK_TEST_URL||'http://127.0.0.1:3144';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Local server required');
const catalogue=await readFile(new URL('../src/app/lib/generators/linux.ts',import.meta.url),'utf8');
const commands=[...catalogue.matchAll(/^    command: '([^']+)'/gm)].map(match=>match[1]);
const out=process.env.IHK_QA_OUTPUT||'/tmp/linux-answer-qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
try{
 for(const width of [320,390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},locale:'de-DE',reducedMotion:'reduce'});
  let blockedRequests=0;await context.route('**/*',route=>{
   if(new URL(route.request().url()).origin===new URL(url).origin&&['GET','HEAD'].includes(route.request().method()))return route.continue();
   blockedRequests++;return route.abort();
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url);await page.getByRole('button',{name:'Schließen',exact:true}).click();
  const nav=page.getByRole('navigation',{name:'Lernmodule',exact:true}),appearance=page.getByRole('combobox',{name:'Darstellung'});
  async function openNav(){if(!await nav.locator('.navigation-panel').isVisible())await nav.getByRole('button',{name:/^Aufgabe wechseln/}).click();}
  async function prepare(command,direction=0){
   const index=commands.indexOf(command);assert.ok(index>=0);
   await page.evaluate(([index,count,direction])=>{let call=0;Math.random=()=>call++===0?index/count:call===2?direction:0.25},[index,commands.length,direction]);
  }
  async function next(command,direction=0){await prepare(command,direction);await page.getByRole('button',{name:/Nächste Frage/}).click();}
  const input=()=>page.getByRole('textbox',{name:'Linux-Befehl eingeben'});
  const result=()=>page.getByRole('status',{name:'Linux-Antwort'});
  async function submit(value){await input().fill(value);await input().press('Enter');}
  async function noOverflow(){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow at ${width}`);}
  await appearance.selectOption('light');await openNav();await nav.getByRole('button',{name:/^Systeme & Sicherheit/}).click();
  await prepare('ls');await nav.getByRole('button',{name:'Linux',exact:true}).click();
  await page.getByText('Listet Dateien und Verzeichnisse in einem Verzeichnis auf',{exact:false}).waitFor();
  await input().fill('dir');await appearance.selectOption('dark');assert.equal(await input().inputValue(),'dir');
  await openNav();if(width<1024)await nav.getByRole('button',{name:/^Aufgabe wechseln/}).click();
  assert.equal(await input().inputValue(),'dir');await input().focus();
  assert.notEqual(await input().evaluate(el=>getComputedStyle(el.closest('.rounded-lg')).boxShadow),'none','terminal focus indicator');
  await appearance.selectOption('light');await input().press('Enter');await result().getByText(/Richtig!/).waitFor();
  assert.equal(await page.getByRole('status').count(),1,'one verdict announcement');
  await result().getByText('vdir',{exact:true}).waitFor();await result().getByText(/Erklärung zum Beispiel ls/).waitFor();
  await page.keyboard.press('Enter');await page.getByRole('button',{name:/Nächste Frage/}).waitFor();
  await appearance.selectOption('dark');await result().getByText(/Richtig!/).waitFor();await noOverflow();
  await next('who');assert.equal(await input().inputValue(),'');assert.equal(await result().textContent(),'');
  await page.getByText('Zeigt die aktuell angemeldeten Benutzer an',{exact:false}).waitFor();await submit('whoami');
  await result().getByText(/nicht akzeptiert/).waitFor();await result().getByText('users',{exact:true}).waitFor();await noOverflow();
  await next('systemctl enable');await submit('systemctl enable --now example.service');
  await result().getByText(/keine vollständigen Kommandozeilen/).waitFor();await result().getByText(/nicht akzeptiert/).waitFor();
  await next('systemctl enable');await appearance.selectOption('light');await submit(' SYSTEMCTL\t enable ');await result().getByText(/Richtig!/).waitFor();
  await next('nslookup');await submit('host');await result().getByText(/Richtig!/).waitFor();await result().getByText(/Vorwärts- und Rückwärtsauflösung/).waitFor();
  await noOverflow();await page.screenshot({path:`${out}/${width}-linux-feedback.png`});
  await next('htop',1);await page.getByText('Was macht der Befehl htop?',{exact:false}).waitFor();
  const descriptions=page.locator('.workspace select').first(),options=await descriptions.locator('option').evaluateAll(elements=>elements.map(el=>el.value).filter(Boolean));
  assert.equal(options.length,5);assert.ok(!options.includes('Zeigt aktive Prozesse und Systemressourcen in Echtzeit an'));
  await descriptions.selectOption(options.find(text=>text.includes('F6-Sortiermenü')));await page.getByRole('button',{name:/Antwort prüfen/}).click();
  await page.getByRole('status').getByText(/Richtig!/).waitFor();assert.equal(await page.getByRole('status').count(),1);await noOverflow();
  assert.deepEqual(errors,[]);assert.equal(blockedRequests,0);assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(key=>key==='ihk_access_hash'||key.startsWith('ihk_progress'))),false);
  console.log(JSON.stringify({width,bothThemes:true,curatedAlternatives:true,wrongToolAndArgumentsRejected:true,requiredSubcommand:true,dropdownOverlapExcluded:true,feedbackReset:true,oneStatus:true,guestNoProgress:true,errors:0}));
  await context.close();
 }
}finally{await browser.close();}
