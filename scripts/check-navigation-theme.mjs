// Local production acceptance only; blocks account/progress/API writes.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const url=process.env.IHK_TEST_URL||'http://127.0.0.1:3133';
assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(url).hostname),'Local server required');
const out=process.env.IHK_QA_OUTPUT||'/tmp/trainer-navigation-qa';await mkdir(out,{recursive:true});
const groups={
 'Rechnen & Zahlensysteme':['Übertragungszeit','Bildgröße','Bild-Transfer','Overhead','Einheiten','Binär','Hexadezimal','Hex/Binär'],
 Netzwerke:['Subnetting','Subnetzmaske','Aggregation','Ports','OSI-Modell','Kabel','AP2 Netzwerkplanung','AP2 Fehlersuche'],
 'Systeme & Sicherheit':['Linux','Cloud','RAID-Rechner','AP2 Berechtigungen','AP2 Datensicherung'],
 'Daten & Algorithmen':['AP2 Datenbankentwurf & SQL','AP2 Algorithmen'],
 'Wirtschaft & Projekt':['Vorwärtskalkulation','Rückwärtskalkulation','Differenzkalkulation','AP2 Wirtschaftlichkeit','AP2 Projektplanung'],
};
const escape=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
try {
 for(const width of (process.env.IHK_QA_WIDTHS?.split(',').map(Number)||[320,390,768,1023,1024,1440])) {
  const context=await browser.newContext({viewport:{width,height:900},locale:'de-DE',colorScheme:'light',reducedMotion:'reduce'});
  await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(url).origin&&['GET','HEAD'].includes(route.request().method())?route.continue():route.abort());
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url);await page.getByRole('button',{name:'Schließen',exact:true}).click();
  if(width<=390) {
   await page.evaluate(()=>document.documentElement.style.fontSize='200%');
   const login=await page.getByRole('button',{name:'Anmelden',exact:true}).boundingBox();
   assert.ok(login.x>=0&&login.x+login.width<=width,`enlarged login control outside viewport: ${login.x+login.width}`);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'200% text reflow');
   await page.evaluate(()=>document.documentElement.style.fontSize='100%');
  }
  const nav=page.getByRole('navigation',{name:'Lernmodule',exact:true});
  async function openNav() {if(!await nav.locator('.navigation-panel').isVisible()) await nav.getByRole('button',{name:/^Aufgabe wechseln/}).click();}
  async function choose(name) {
   await openNav();
   const group=Object.entries(groups).find(([,names])=>names.includes(name))?.[0];
   if(group) {const button=nav.getByRole('button',{name:new RegExp(`^${escape(group)}`)});if(await button.getAttribute('aria-expanded')!=='true') await button.click();}
   await nav.getByRole('button',{name:name==='AP2-Trainingslauf'?/^AP2-Trainingslauf/:name,exact:name!=='AP2-Trainingslauf'}).click();
  }
  async function noOverflow() {assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`page overflow at ${width}`);}
  const appearance=page.getByRole('combobox',{name:'Darstellung'});
  await choose('Bildgröße');const input=page.locator('.workspace input').first();await input.fill('0,75');await input.blur();
  // Computed boundary contrast: catches a faint decorative border reused for inputs.
  const boundary=await input.evaluate(element=>{
   const style=getComputedStyle(element);
   const lum=color=>{const channels=color.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722};
   const a=lum(style.borderTopColor),b=lum(style.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  });
  assert.ok(boundary>=3,`input boundary contrast ${boundary.toFixed(2)} at ${width}`);
  for(const theme of ['dark','light']) {
   await appearance.selectOption(theme);if(width===320) await checkPalette(page);assert.equal(await input.inputValue(),'0,75');
   await choose('Bildgröße');assert.equal(await input.inputValue(),'0,75');
   if(width<1024) {await openNav();await nav.getByRole('button',{name:/^Netzwerke/}).click();await page.keyboard.press('Escape');assert.equal(await nav.getByRole('button',{name:/^Aufgabe wechseln/}).evaluate(element=>element===document.activeElement),true);}
   await noOverflow();
   if([390,1440].includes(width)) await page.screenshot({path:`${out}/${width}-${theme}.png`});
  }
  await page.locator('.workspace select').first().selectOption({index:1});
  await assertShortcutContrast(page.getByRole('button',{name:/Antwort prüfen/}).locator('kbd'));
  await page.getByRole('button',{name:/Antwort prüfen/}).click();
  await assertShortcutContrast(page.getByRole('button',{name:/Nächste Frage/}).locator('kbd'));
  await appearance.focus();await page.keyboard.press('n');
  await page.getByRole('button',{name:/Nächste Frage/}).waitFor();
  await choose('Bildgröße');await page.getByRole('button',{name:/Nächste Frage/}).waitFor();
  assert.equal(await page.getByRole('heading',{name:'Bildgröße',exact:true}).evaluate(element=>element===document.activeElement),true);
  await appearance.selectOption('system');await page.emulateMedia({colorScheme:'dark'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');assert.equal(await input.inputValue(),'0,75');
  await appearance.selectOption('light');await page.reload();await page.getByRole('button',{name:'Schließen',exact:true}).click();await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
  // Reload loses exercise drafts as documented; appearance alone persists.
  assert.equal(await page.locator('.workspace input').count(),0);
  await choose('AP2-Trainingslauf');const runInput=page.locator('.workspace input').first();await runInput.fill('123');
  await page.getByRole('button',{name:'Kostenvergleich prüfen',exact:true}).click();
  await page.getByRole('button',{name:'2. Fehlersuche',exact:true}).click();await page.getByRole('button',{name:'1. Wirtschaftlichkeit',exact:true}).click();assert.equal(await runInput.inputValue(),'123');
  await appearance.selectOption('dark');await choose('AP2-Trainingslauf');assert.equal(await runInput.inputValue(),'123');
  await choose('Subnetting');const confirmation=page.getByRole('group',{name:'Trainingslauf verlassen',exact:true});await confirmation.waitFor();
  assert.equal(await page.getByRole('button',{name:'Weiterarbeiten',exact:true}).evaluate(element=>element===document.activeElement),true);
  if(width>=1024) await nav.getByRole('button',{name:/^Netzwerke/}).click();
  await page.getByRole('button',{name:'Weiterarbeiten',exact:true}).click();assert.equal(await runInput.inputValue(),'123');
  assert.equal(await nav.getByRole('button',{name:width>=1024?/^AP2-Trainingslauf/:/^Aufgabe wechseln/}).evaluate(element=>element===document.activeElement),true);
  if(width<1024) {
   await choose('Subnetting');await openNav();await nav.getByRole('button',{name:/^Aufgabe wechseln/}).click();
   assert.equal(await confirmation.count(),0);assert.equal(await runInput.inputValue(),'123');
  }
  await choose('Subnetting');await page.getByRole('button',{name:'Trainingslauf verlassen',exact:true}).click();await page.getByRole('heading',{name:'Subnetting',exact:true}).waitFor();
  // Every guest module must fit and use the same palettes, including disclosures/examples.
  if([390,1440].includes(width)) {
   for(const name of Object.values(groups).flat()) {
    await choose(name);
    const example=page.locator('.workspace').getByRole('button',{name:/^(Beispiel anzeigen|Lösung anzeigen)/}).first();if(await example.count()&&await example.isVisible()) await example.click();
    for(const theme of ['light','dark']) {await appearance.selectOption(theme);await noOverflow();assert.equal(await page.locator('html').getAttribute('data-theme'),theme);}
   }
   await openNav();const data=nav.getByRole('button',{name:/^Daten & Algorithmen/});if(await data.getAttribute('aria-expanded')!=='true') await data.click();assert.equal(await nav.getByRole('button',{name:'SQL',exact:true}).count(),0);
   // Breakpoint focus survives removal of either responsive control.
   await page.setViewportSize({width:1024,height:900});await page.getByRole('button',{name:/^Daten & Algorithmen/}).focus();await page.setViewportSize({width:1023,height:900});
   await page.waitForFunction(()=>document.activeElement?.textContent?.includes('Aufgabe wechseln'));
   await openNav();const business=nav.getByRole('button',{name:/^Wirtschaft & Projekt/});
   if(await business.getAttribute('aria-expanded')==='true') await business.click();
   await nav.getByRole('button',{name:/^Aufgabe wechseln/}).click();
   await page.setViewportSize({width:1024,height:900});
   await page.waitForFunction(()=>document.activeElement?.textContent?.startsWith('Wirtschaft & Projekt'));

  }
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(key=>key.startsWith('ihk_progress_v2:'))),false);
  console.log(JSON.stringify({width,bothThemes:true,systemChange:true,runRetainedAndProtected:true,noOverflow:true,guestNoProgressKeys:true,errors:0}));await context.close();
 }
 // The inline preference bootstrap must work before React/application scripts.
 const beforeHydration=await browser.newContext({colorScheme:'light'});
 await beforeHydration.addInitScript(()=>localStorage.setItem('ihk_theme_preference','dark'));
 await beforeHydration.route('**/*',route=>route.request().resourceType()==='script'?route.abort():route.continue());
 const initial=await beforeHydration.newPage();await initial.goto(url,{waitUntil:'domcontentloaded'});
 assert.equal(await initial.locator('html').getAttribute('data-theme'),'dark');
 assert.equal(await initial.locator('html').getAttribute('lang'),'de');
 assert.equal(await initial.locator('body').evaluate(element=>getComputedStyle(element).backgroundColor),'rgb(16, 26, 36)');
 await beforeHydration.close();console.log(JSON.stringify({savedDarkBeforeHydration:true,productionCspUnchanged:true}));
} finally {await browser.close();}

async function checkPalette(page) {
 const failures=await page.evaluate(()=>{
  const css=getComputedStyle(document.documentElement);
  function luminance(role) {
   const value=css.getPropertyValue(`--ui-${role}`).trim().slice(1);
   const channels=[0,2,4].map(index=>parseInt(value.slice(index,index+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
   return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
  }
  const pairs=[['ink','surface',4.5],['muted','surface',4.5],['muted','subtle',4.5],['onaction','action',4.5],['onaction','action-hover',4.5],['accent','accent-soft',4.5],['danger','danger-soft',4.5],['warning','warning-soft',4.5],['success','success-soft',4.5],['info','info-soft',4.5],['control','canvas',3],['accent','canvas',3]];
  return pairs.map(([a,b,minimum])=>{const first=luminance(a),second=luminance(b);return {a,b,minimum,ratio:(Math.max(first,second)+.05)/(Math.min(first,second)+.05)}}).filter(pair=>pair.ratio<pair.minimum);
 });
 assert.deepEqual(failures,[],'resolved semantic palette contrast');
}


async function assertShortcutContrast(locator) {
 if(!await locator.isVisible()) return;
 const ratio=await locator.evaluate(element=>{
  const css=getComputedStyle(element);
  const lum=color=>{const c=color.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return c[0]*.2126+c[1]*.7152+c[2]*.0722};
  const a=lum(css.color),b=lum(css.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
 });
 assert.ok(ratio>=4.5,`keyboard hint contrast ${ratio.toFixed(2)}`);
}
