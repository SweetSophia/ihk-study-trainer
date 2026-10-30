/* Blocked-submission mutation probe: add IHK_TEST_BLOCK_SUBMISSION=1; a nonzero exit is required.
 * Normal run against a local production server: IHK_TEST_URL=http://127.0.0.1:3133 node scripts/check-decimal-input.mjs */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const url = process.env.IHK_TEST_URL || 'http://127.0.0.1:3000';
const blockSubmission = process.env.IHK_TEST_BLOCK_SUBMISSION === '1';
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname), 'Use an isolated local server; no live account writes.');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
  try {
    for (const width of blockSubmission ? [390] : [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'de-DE' });
      await context.route('**/*', route => new URL(route.request().url()).origin === new URL(url).origin && ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url);
      await page.getByRole('button', { name: 'Schließen', exact: true }).click();
      const cases = [
        ['0,75', true], ['0.75', true], ['7.5e-1', true], ['7,5e-1', true],
        ['0,75xyz', false], ['0.75xyz', false], ['0,75.0', false], ['0.75,0', false],
        ['1 000', false], ['0,7,5', false], ['1e309', false],
      ];
      for (const [value, correct] of blockSubmission ? cases.slice(0, 6) : cases) {
        // Seed and dispatch together so asynchronous animation draws cannot consume the fixture first.
        await page.getByText('Bildgröße', { exact: true }).filter({ visible: true }).evaluate(button => {
          const draws = [0.7, 0.01, 0.5];
          Math.random = () => draws.shift() ?? 0.5;
          button.click();
        });
        await page.locator('p').filter({ hasText: /1024.*768.*8 Bit/ }).waitFor();
        const input = page.getByPlaceholder('Wert eingeben...', { exact: true });
        const status = page.getByRole('status');
        await page.getByRole('button', { name: /Antwort prüfen/ }).waitFor();
        await status.filter({ hasText: /Richtig!|nicht ganz richtig/ }).waitFor({ state: 'hidden' });
        await input.pressSequentially(value);
        assert.equal(await input.inputValue(), value, `Input must preserve ${value}`);
        await page.locator('select:visible').selectOption('MiB');
        assert.equal(await input.getAttribute('inputmode'), null);
        await input.focus();
        if (blockSubmission && value === '0.75xyz') {
          await input.evaluate(element => element.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); event.stopImmediatePropagation(); } }, { capture: true, once: true }));
        }
        await page.keyboard.press('Enter');
        // A verdict is fresh only after THIS question became checked, not merely while an old verdict exits.
        await page.waitForFunction(element => element.disabled, await input.elementHandle(), { timeout: 3000 });
        assert.equal(await page.getByRole('button', { name: /Antwort prüfen/ }).count(), 0);
        await status.filter({ hasText: correct ? 'Richtig!' : 'nicht ganz richtig' }).waitFor();
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith('ihk_progress_v2:'))), false);
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ width, commaAndPoint: true, exponent: true, malformedRejected: true, inputFocusedEnter: true, freshCheckedState: true, observedGuestProgressKeysAbsent: true, realSoftKeyboardTested: false }));
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
