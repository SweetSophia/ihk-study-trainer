/* Run against a local production server: IHK_TEST_URL=http://127.0.0.1:3133 node scripts/check-decimal-input.mjs */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const url = process.env.IHK_TEST_URL || 'http://127.0.0.1:3000';
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname), 'Use an isolated local server; no live account writes.');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'de-DE' });
      await context.route('**/*', route => new URL(route.request().url()).origin === new URL(url).origin && ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url);
      await page.getByRole('button', { name: 'Schließen', exact: true }).click();
      for (const [value, correct] of [
        ['0,75', true], ['0.75', true], ['7.5e-1', true], ['7,5e-1', true],
        ['0,75xyz', false], ['0.75xyz', false], ['0,75.0', false], ['0.75,0', false],
        ['1 000', false], ['0,7,5', false], ['1e309', false],
      ]) {
        await page.evaluate(() => { const draws = [0.7, 0.01, 0.5]; Math.random = () => draws.shift() ?? 0.5; });
        await page.getByText('Bildgröße', { exact: true }).filter({ visible: true }).click();
        await page.locator('p').filter({ hasText: /1024.*768.*8 Bit/ }).waitFor();
        const input = page.getByPlaceholder('Wert eingeben...', { exact: true });
        await input.pressSequentially(value);
        assert.equal(await input.inputValue(), value, `Input must preserve ${value}`);
        await page.locator('select:visible').selectOption('MiB');
        await page.getByRole('button', { name: /Antwort prüfen/ }).focus();
        await page.keyboard.press('Enter');
        await page.getByRole('status').filter({ hasText: correct ? 'Richtig!' : 'nicht ganz richtig' }).waitFor();
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith('ihk_progress_v2:'))), false);
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ width, commaAndPoint: true, exponent: true, malformedRejected: true, noProgressWrites: true }));
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
