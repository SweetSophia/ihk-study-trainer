// Local production acceptance only; blocks account/progress/API writes.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { opaqueContrastRatio } from './lib/contrast.mjs';
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
   const style=getComputedStyle(element);return {foreground:style.borderTopColor,background:style.backgroundColor,width:parseFloat(style.borderTopWidth),style:style.borderTopStyle};
  });
  assert.ok(boundary.width>=1&&boundary.style!=='none','input boundary must be painted');
  requireOpaqueContrast(boundary.foreground,boundary.background,3,'input boundary');
  for(const theme of ['dark','light']) {
   await appearance.selectOption(theme);if(width===320) await checkPalette(page);assert.equal(await input.inputValue(),'0,75');
   await choose('Bildgröße');assert.equal(await input.inputValue(),'0,75');
   if(width<1024) {await openNav();await nav.getByRole('button',{name:/^Netzwerke/}).click();await page.keyboard.press('Escape');assert.equal(await nav.getByRole('button',{name:/^Aufgabe wechseln/}).evaluate(element=>element===document.activeElement),true);}
   await noOverflow();
   if([390,1440].includes(width)) await page.screenshot({path:`${out}/${width}-${theme}.png`});
  }
  await page.locator('.workspace select').first().selectOption({index:1});
  const accountTrigger=page.getByRole('button',{name:'Anmelden',exact:true});
  await accountTrigger.click();
  const dismiss=page.getByRole('button',{name:'Schließen',exact:true});
  assert.equal(await dismiss.evaluate(element=>element===document.activeElement),true,'initial account focus');
  await page.keyboard.press('Escape');await dismiss.waitFor({state:'hidden'});
  assert.equal(await accountTrigger.evaluate(element=>element===document.activeElement),true,'account trigger focus restored');
  await accountTrigger.click();await page.keyboard.press('Shift+Tab');
  const existingCode=page.getByRole('button',{name:/Ich habe einen Code/});
  assert.equal(await existingCode.evaluate(element=>element===document.activeElement),true,'backward focus wraps within dialog');
  await page.keyboard.press('Tab');assert.equal(await dismiss.evaluate(element=>element===document.activeElement),true,'forward focus wraps within dialog');
  await existingCode.click();
  assert.equal(await page.getByLabel(/^Zugangscode/).evaluate(element=>element===document.activeElement),true,'login view focus');
  await page.getByLabel(/^Zugangscode/).fill('test');await page.getByLabel(/^Zugangscode/).press('Enter');
  await page.getByLabel(/^Zugangscode/).press('Escape');
  await page.getByRole('button',{name:'Schließen',exact:true}).waitFor({state:'hidden'});
  assert.equal(await input.isDisabled(),false,'account Enter must not check the hidden exercise');
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
  if(width<1024) {await choose('Subnetting');assert.equal(await page.getByRole('button',{name:'Weiterarbeiten',exact:true}).evaluate(element=>element===document.activeElement),true);}
  if(width>=1024) await nav.getByRole('button',{name:/^Netzwerke/}).click();
  await page.getByRole('button',{name:'Weiterarbeiten',exact:true}).click();assert.equal(await runInput.inputValue(),'123');
  assert.equal(await nav.getByRole('button',{name:width>=1024?/^AP2-Trainingslauf/:/^Aufgabe wechseln/}).evaluate(element=>element===document.activeElement),true);
  if(width<1024) {
   await choose('Subnetting');await openNav();await nav.getByRole('button',{name:/^Aufgabe wechseln/}).click();
   assert.equal(await confirmation.count(),0);assert.equal(await runInput.inputValue(),'123');
  }
  await choose('Subnetting');await page.getByRole('button',{name:'Trainingslauf verlassen',exact:true}).click();await page.getByRole('heading',{name:'Subnetting',exact:true}).waitFor();
  await page.evaluate(()=>{Math.random=()=>0.25});await choose('Linux');
  const caret=page.locator('.workspace .animate-pulse');await caret.waitFor();
  for(const theme of ['light','dark']) {
   await appearance.selectOption(theme);
   await page.waitForFunction(expected=>document.documentElement.dataset.theme===expected,theme);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const colors=await caret.evaluate(element=>({foreground:getComputedStyle(element).backgroundColor,background:getComputedStyle(element.closest('.bg-canvas')).backgroundColor}));
   requireOpaqueContrast(colors.foreground,colors.background,3,`terminal caret ${theme}`);
  }
  await page.evaluate(()=>{Math.random=()=>0.75});await choose('OSI-Modell');
  const drag=page.getByTestId('drag-order-handle-0');await drag.waitFor();
  assert.equal(await drag.evaluate(element=>getComputedStyle(element).cursor),'grab');
  await drag.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');
  assert.notEqual(await drag.evaluate(element=>getComputedStyle(element).boxShadow),'none','keyboard drag focus remains visible');
  await choose('Subnetting');await page.getByRole('button',{name:'Lösung anzeigen',exact:true}).click();
  const bits=page.getByRole('img',{name:/^32-Bit-Aufteilung/}).locator('rect[width="9"]');
  assert.equal(await bits.count(),32);
  for(const theme of ['light','dark']) {
   await appearance.selectOption(theme);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const markers=await bits.evaluateAll(elements=>elements.map(element=>{
    let parent=element.parentElement;let background='';
    while(parent){background=getComputedStyle(parent).backgroundColor;if(background!=='rgba(0, 0, 0, 0)')break;parent=parent.parentElement}
    return {foreground:getComputedStyle(element).fill,background,opacity:Number(getComputedStyle(element).fillOpacity)};
   }));
   for(const marker of markers){assert.equal(marker.opacity,1);requireOpaqueContrast(marker.foreground,marker.background,3,'bit-cell marker');}
  }
  // Every guest module must fit and use the same palettes, including disclosures/examples.
  if([390,1440].includes(width)) {
   for(const name of Object.values(groups).flat()) {
    await choose(name);
    const example=page.locator('.workspace').getByRole('button',{name:/^(Beispiel anzeigen|Lösung anzeigen)/}).first();if(await example.count()&&await example.isVisible()) await example.click();
    for(const theme of ['light','dark']) {await appearance.selectOption(theme);await noOverflow();assert.equal(await page.locator('html').getAttribute('data-theme'),theme);}
   }
   await openNav();const data=nav.getByRole('button',{name:/^Daten & Algorithmen/});if(await data.getAttribute('aria-expanded')!=='true') await data.click();assert.equal(await nav.getByRole('button',{name:'SQL',exact:true}).count(),0);
   // Breakpoint focus survives removal of either responsive control.
   await page.setViewportSize({width:1024,height:900});
   await choose('Subnetting');await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   await nav.getByRole('button',{name:'Subnetting',exact:true}).focus();await page.setViewportSize({width:1023,height:900});
   await page.waitForFunction(()=>document.activeElement?.textContent?.includes('Aufgabe wechseln'));
   await page.setViewportSize({width:1024,height:900});await page.waitForFunction(()=>document.activeElement?.textContent?.trim()==='Subnetting');
   await page.getByRole('button',{name:/^Daten & Algorithmen/}).focus();await page.setViewportSize({width:1023,height:900});
   await page.waitForFunction(()=>document.activeElement?.textContent?.includes('Aufgabe wechseln'));
   await choose('AP2 Projektplanung');await openNav();const business=nav.getByRole('button',{name:/^Wirtschaft & Projekt/});
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
 const loading=initial.getByRole('status',{name:'Lernumgebung wird geladen'});
 assert.equal(await loading.evaluate(element=>getComputedStyle(element).animationName),'spin');
 await initial.emulateMedia({reducedMotion:'reduce'});
 await initial.waitForFunction(()=>getComputedStyle(document.querySelector('[role="status"]')).animationName==='none');
 await beforeHydration.close();console.log(JSON.stringify({savedDarkBeforeHydration:true,loadingRespectsReducedMotion:true}));
} finally {await browser.close();}

async function checkPalette(page) {
 const palette=await page.evaluate(()=>{
  const css=getComputedStyle(document.documentElement);return Object.fromEntries(['ink','muted','surface','subtle','subtle-hover','onaction','action','action-hover','accent','accent-soft','accent-soft-hover','danger','danger-soft','danger-soft-hover','warning','warning-soft','success','success-soft','info','info-soft','control','canvas'].map(role=>[role,css.getPropertyValue(`--ui-${role}`).trim()]));
 });
 const pairs=[['ink','surface',4.5],['muted','surface',4.5],['muted','subtle',4.5],['muted','subtle-hover',4.5],['onaction','action',4.5],['onaction','action-hover',4.5],['accent','accent-soft',4.5],['accent','accent-soft-hover',4.5],['danger','danger-soft',4.5],['danger','danger-soft-hover',4.5],['warning','warning-soft',4.5],['success','success-soft',4.5],['info','info-soft',4.5],['control','canvas',3],['accent','canvas',3]];
 for(const [a,b,minimum] of pairs)requireOpaqueContrast(palette[a],palette[b],minimum,`${a}/${b}`);
}
async function assertShortcutContrast(locator) {
 if(!await locator.isVisible())return;
 const colors=await locator.evaluate(element=>({foreground:getComputedStyle(element).color,background:getComputedStyle(element).backgroundColor}));
 requireOpaqueContrast(colors.foreground,colors.background,4.5,'keyboard hint');
}
function requireOpaqueContrast(foreground,background,minimum,label) {
 const ratio=opaqueContrastRatio(foreground,background);
 assert.notEqual(ratio,null,`${label}: transparent/unsupported pair is not verified`);
 assert.ok(ratio>=minimum,`${label}: contrast ${ratio?.toFixed(2)} is below ${minimum}`);
}
