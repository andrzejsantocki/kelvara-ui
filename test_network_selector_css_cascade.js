const assert = require('assert');
const fs = require('fs');
const css = fs.readFileSync('styles.css', 'utf8');

function declarations(selector, media = null) {
  const chunks = [];
  const source = media ? (css.match(new RegExp('@media\\s*\\(' + media + '\\)\\s*\\{([\\s\\S]*?)\\}\\s*(?=@media|$)')) || [,''])[1] : css;
  const re = new RegExp('(?:^|})\\s*' + selector.replace(/[.#]/g, '\\$&') + '\\s*\\{([^}]*)\\}', 'g');
  let m; while ((m = re.exec(source))) m[1].split(';').forEach(d => { const i=d.indexOf(':'); if(i>=0) chunks.push([d.slice(0,i).trim(),d.slice(i+1).trim()]); });
  return Object.fromEntries(chunks);
}
function effective(width) {
  const base = declarations('.wallet-selector-modal');
  const mobile = width <= 720 ? declarations('.wallet-selector-modal', 'max-width\\:720px') : {};
  return {...base, ...mobile};
}
for (const width of [1440, 1024, 720, 390]) {
  const d = effective(width);
  assert.equal(d['align-items'], 'center!important', `network modal vertical centering at ${width}px`);
  assert.equal(d['justify-content'], 'center!important', `network modal horizontal centering at ${width}px`);
}
assert.doesNotMatch(css, /@media\\s*\\(max-width:720px\\)[\\s\\S]*?\\.modal\\s*\\{[^}]*align-items\\s*:\s*end/, 'responsive .modal rule must not override network centering');
const modal = declarations('.modal');
assert.equal(modal.position, 'fixed');
assert.match(css, /\.modal\[hidden\]\s*\{[^}]*display\s*:\s*none\s*!important/);
console.log('network selector CSS cascade regression: ok');
