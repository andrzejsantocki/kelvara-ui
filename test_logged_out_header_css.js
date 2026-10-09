const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const style = html.match(/<style>([\s\S]*?)<\/style>/);
assert(style, 'root entrypoint must contain inline CSS');
const css = style[1];

const header = html.match(/<header class="topbar wrap">([\s\S]*?)<\/header>/)?.[1] || '';
assert.match(header, /<nav class="nav">[\s\S]*<button id="realm-label" class="tag"[\s\S]*<div class="wallet-control">[\s\S]*<button class="wallet-chip" id="wallet-chip"/, 'root header controls must share the nav parent');
assert.doesNotMatch(html, /<link[^>]+href=["'][^"']*styles\.css/, 'root entrypoint must not depend on styles.css');
assert.doesNotMatch(html, /<header class="topbar">/, 'regression must target the root header markup');

function declarations(selector) {
  const match = css.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`));
  assert(match, `inline CSS must define ${selector}`);
  return Object.fromEntries(match[1].split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const colon = part.indexOf(':');
    return [part.slice(0, colon).trim(), part.slice(colon + 1).trim()];
  }));
}

const nav = declarations('\\.nav');
const control = declarations('\\.wallet-control');
const chip = declarations('\\.wallet-chip');
assert.strictEqual(nav.display, 'flex', 'network and wallet controls need one shared flex parent');
assert.strictEqual(nav['align-items'], 'center', 'shared parent must center both controls equally');
assert.strictEqual(control.display, 'flex', 'wallet control must remain a flex item');
assert.strictEqual(control['align-items'], 'center', 'wallet control must center its button');
assert.strictEqual(chip.color, 'var(--ink)', 'normal Connect wallet text must use strong dark ink');
assert.strictEqual(chip.border, '1px solid var(--line-strong)', 'normal Connect wallet must have visible logged-in-weight border');
assert.strictEqual(chip.background, 'var(--surface)', 'normal Connect wallet must retain the logged-in light surface');
for (const property of ['margin', 'margin-top', 'top', 'transform']) {
  assert(!(property in nav), `shared nav must not use ${property} alignment nudges`);
  assert(!(property in control), `wallet control must not use ${property} alignment nudges`);
  assert(!(property in chip), `wallet chip must not use ${property} alignment nudges`);
}

for (const property of ['border-radius', 'padding', 'font-size']) {
  assert(property in chip, `Connect wallet ${property} must remain explicit`);
}
assert.strictEqual(chip['border-radius'], '999px', 'Connect wallet radius must remain unchanged');
assert.strictEqual(chip.padding, '9px 15px', 'Connect wallet padding must remain unchanged');
assert.strictEqual(chip['font-size'], '12px', 'Connect wallet size must remain unchanged');
console.log('root index.html inline logged-out header contract: passed');
