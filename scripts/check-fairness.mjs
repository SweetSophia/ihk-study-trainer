// Local production guest acceptance: npm run build; npm start -- --port 3144;
// node scripts/check-fairness.mjs. No account or backend writes.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const url = process.env.IHK_TEST_URL || 'http://127.0.0.1:3144';
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname));
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
try {
  for (const width of [320, 390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'de-DE', reducedMotion: 'reduce' });
    let writes = 0;
    await context.route('**/*', route => {
      const request = route.request();
      if (new URL(request.url()).origin === new URL(url).origin && ['GET', 'HEAD'].includes(request.method())) return route.continue();
      writes++;
      return route.abort();
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.getByRole('button', { name: 'Schließen', exact: true }).click();
    const nav = page.getByRole('navigation', { name: 'Lernmodule', exact: true });
    const appearance = page.getByRole('combobox', { name: 'Darstellung' });
    async function choose(group, name, fixture) {
      if (!await nav.locator('.navigation-panel').isVisible()) await nav.getByRole('button', { name: /^Aufgabe wechseln/ }).click();
      const disclosure = nav.getByRole('button', { name: new RegExp(`^${group}`) });
      if (await disclosure.getAttribute('aria-expanded') !== 'true') await disclosure.click();
      await nav.getByRole('button', { name, exact: true }).evaluate((element, fixture) => {
        const original = Math.random;
        Math.random = () => fixture;
        try { element.click(); } finally { Math.random = original; }
      }, fixture);
    }
    async function overflow() { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow ${width}`); }
    await choose('Netzwerke', 'Kabel', 3.1 / 8);
    await page.getByRole('heading', { name: 'Kabel', exact: true }).waitFor();
    await page.getByText(/Entfernung: 40m/).first().waitFor();
    assert.ok((await page.locator('.workspace').textContent()).includes('installationsgeprüft'));
    const cable = page.getByRole('combobox', { name: 'Kabeltyp' });
    const reason = page.getByRole('combobox', { name: 'Vorteil 1' });
    assert.equal(await reason.isDisabled(), true);
    await cable.selectOption('Cat 6a (Twisted Pair)');
    await reason.selectOption('10 Gbit/s bis 100m');
    await cable.selectOption('Cat 6 (Twisted Pair)');
    assert.equal(await reason.inputValue(), '');
    assert.equal(await page.getByRole('button', { name: /Antwort prüfen/ }).isDisabled(), true);
    await reason.selectOption('Geprüfte geschirmte Installation');
    await appearance.selectOption('dark');
    assert.equal(await reason.inputValue(), 'Geprüfte geschirmte Installation');
    await page.getByRole('button', { name: /Antwort prüfen/ }).focus();
    await page.keyboard.press('Enter');
    await page.getByText('Richtig! Sehr gut gemacht.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Lösung anzeigen' }).click();
    await page.getByText('Beispiel einer gültigen Antwort:', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: /Antwort prüfen/ }).count(), 0);
    await overflow();
    await choose('Systeme & Sicherheit', 'RAID-Rechner', .9);
    await page.getByRole('heading', { name: 'RAID-Rechner', exact: true }).waitFor();
    await page.getByText(/Ausfälle vor einem Rebuild/).waitFor();
    await page.getByLabel('Nutzbare Kapazität', { exact: true }).fill('32');
    await page.getByRole('combobox', { name: 'Einheit für Nutzbare Kapazität' }).selectOption('TB');
    await page.getByLabel('Garantiert tolerierte beliebige Ausfälle').selectOption('1');
    await page.getByRole('button', { name: /Antwort prüfen/ }).click();
    await page.getByText('Richtig! Sehr gut gemacht.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Lösung anzeigen' }).click();
    await page.getByRole('button', { name: 'Alle anzeigen', exact: true }).click();
    await page.getByText(/beide Platten desselben Spiegelpaares/).waitFor();
    await page.getByText('Garantierte beliebige Ausfälle', { exact: true }).waitFor();
    await appearance.selectOption('light');
    await overflow();
    assert.equal(writes, 0);
    assert.deepEqual(errors, []);
    assert.equal(await page.evaluate(() => Object.keys(localStorage).some(key => key === 'ihk_access_hash' || key.startsWith('ihk_progress'))), false);
    console.log(JSON.stringify({ width, cableAlternative: true, dependentReset: true, keyboardSubmit: true, raidGuarantee: true, bothThemes: true, guestNoWrites: true }));
    await context.close();
  }
} finally { await browser.close(); }
