const assert = require('assert');
const fs = require('fs');
const html = fs.readFileSync('app.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');

const header = html.match(/<header class="topbar">([\s\S]*?)<\/header>/)?.[1] || '';
assert.match(header, /<div class="header-actions">[\s\S]*<button[^>]*id="network-context-label"[\s\S]*<button[^>]*id="wallet-chip"/, 'network and wallet controls must share one actions container');
const networkStart = header.indexOf('id="network-control"');
const walletStart = header.indexOf('id="header-connect"');
assert(networkStart >= 0 && walletStart > networkStart, 'network and wallet controls must both exist');
assert(header.indexOf('</div>', networkStart) < walletStart, 'wallet control must not be nested under network control');
assert.match(css, /\.header-actions\s*\{[^}]*display\s*:\s*flex[^}]*align-items\s*:\s*center[^}]*gap\s*:\s*12px/s);
for (const selector of ['.network-button', '.wallet-button']) {
  const rule = css.match(new RegExp('\\' + selector + '\\s*\\{([^}]*)\\}'))?.[1] || '';
  assert.match(rule, /height\s*:\s*40px/);
  assert.match(rule, /display\s*:\s*inline-flex/);
  assert.match(rule, /align-items\s*:\s*center/);
}
const controls = css.match(/\.network-button\s+#network-context-label\s*\{([^}]*)\}/)?.[1] + css.match(/\.wallet-button\s+\.wallet-chip\s*\{([^}]*)\}/)?.[1];
assert.match(controls, /height\s*:\s*40px/g);
assert(!/\.network-button[^}]*\b(?:margin-top|top|translateY)\s*:/s.test(css));
assert(!/\.wallet-button[^}]*\b(?:margin-top|top|translateY)\s*:/s.test(css));
assert(!/\.wallet-button[^}]*transform\s*:\s*translateY/s.test(css));
assert.match(html, /styles\.css\?v=20261009-auth-header-align/);
console.log('authenticated header alignment contract: passed');
