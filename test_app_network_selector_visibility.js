const assert = require('assert');
const { firefox } = require('playwright-core');

(async () => {
  const browser = await firefox.launch({ executablePath: '/usr/bin/firefox', headless: true });
  const page = await browser.newPage();
  await page.goto('file:///home/andy/COLLOSEUM%20KELVARA%20V2/kelvara-ui/app.html');
  const selector = page.locator('#network-selector');
  assert.strictEqual(await selector.getAttribute('hidden'), '');
  assert.strictEqual(await selector.evaluate(el => getComputedStyle(el).display), 'none', 'hidden network selector must not render');
  await page.locator('#network-context-label').click();
  assert.strictEqual(await selector.evaluate(el => getComputedStyle(el).display), 'grid', 'explicit click opens selector');
  await page.reload();
  assert.strictEqual(await selector.evaluate(el => getComputedStyle(el).display), 'none', 'reload keeps selector hidden');
  console.log('app.html network selector visibility passed');
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
