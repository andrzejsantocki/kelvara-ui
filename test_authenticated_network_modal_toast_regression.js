const assert = require('assert');
const fs = require('fs');
const { spawnSync } = require('child_process');
const html = fs.readFileSync('app.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');

class Node {
  constructor(tag, attrs) { this.tag = tag; this.attrs = attrs; this.parent = null; this.children = []; }
  has(name, value) { return Object.prototype.hasOwnProperty.call(this.attrs, name) && (value === undefined || this.attrs[name] === value); }
}
const root = new Node('#document', {});
const stack = [root];
const voidTags = new Set(['area', 'base', 'br', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
for (const token of html.match(/<!--[\s\S]*?-->|<![^>]*>|<[^>]+>/g) || []) {
  if (token.startsWith('<!--') || token.startsWith('<!')) continue;
  if (token.startsWith('</')) {
    const name = token.match(/^<\/\s*([a-zA-Z0-9-]+)/)?.[1]?.toLowerCase();
    while (stack.length > 1 && stack[stack.length - 1].tag !== name) stack.pop();
    if (stack.length > 1) stack.pop();
    continue;
  }
  const match = token.match(/^<\s*([a-zA-Z0-9-]+)/);
  if (!match) continue;
  const attrs = {};
  for (const attr of token.matchAll(/([:\w-]+)(?:\s*=\s*["']([^"']*)["'])?/g)) {
    if (attr[1] !== match[1]) attrs[attr[1]] = attr[2] === undefined ? '' : attr[2];
  }
  const node = new Node(match[1].toLowerCase(), attrs);
  node.parent = stack[stack.length - 1];
  node.parent.children.push(node);
  if (!voidTags.has(node.tag) && !token.endsWith('/>')) stack.push(node);
}
function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.children) { const found = find(child, predicate); if (found) return found; }
  return null;
}
const selector = find(root, node => node.has('id', 'network-selector'));
assert(selector, 'authenticated network selector must exist');
assert(!selector.parent || !selector.parent.has('class', 'topbar'), 'network selector must not be nested in topbar');
for (let ancestor = selector.parent; ancestor; ancestor = ancestor.parent) {
  assert(!ancestor.has('class', 'topbar') && ancestor.tag !== 'header', 'network selector must be outside header/topbar');
}
assert(selector.parent, 'network selector must have a document parent');

const modalRules = [...css.matchAll(/\.modal\s*\{([^}]*)\}/g)].map(match => match[1]);
assert(modalRules.some(rule => /position\s*:\s*fixed/.test(rule) && /inset\s*:\s*0/.test(rule)), 'modal must be viewport-fixed with inset 0');
assert(modalRules.some(rule => /display\s*:\s*flex/.test(rule) && /align-items\s*:\s*center/.test(rule) && /justify-content\s*:\s*center/.test(rule)), 'modal must center card on both axes');
const selectorRules = [...css.matchAll(/\.wallet-selector-modal\s*\{([^}]*)\}/g)].map(match => match[1]);
assert(selectorRules.length > 0, 'wallet selector modal rules must exist');
assert.match(css, /\.wallet-selector-modal\s*\{[^}]*align-items\s*:\s*center\s*!important/,
  'wallet selector must explicitly preserve vertical centering against responsive rules');
assert.doesNotMatch(css, /@media[^}]*\.wallet-selector-modal\s*\{[^}]*align-items\s*:\s*(?:flex-start|start)/,
  'responsive rules must not top-align wallet selector');

const toast = css.match(/#toast\s*\{([^}]*)\}/);
assert(toast, 'toast rule must exist');
assert.match(toast[1], /position\s*:\s*fixed/);
assert.match(toast[1], /left\s*:\s*50%/);
assert.match(toast[1], /bottom\s*:\s*24px/);
assert.match(toast[1], /transform\s*:\s*translateX\(\s*-50%\s*\)/);
assert.doesNotMatch(toast[1], /top\s*:/, 'toast must not use top positioning');
assert.doesNotMatch(toast[1], /translate\(\s*-50%\s*,\s*-50%\s*\)/, 'toast must not use viewport-center transform');

const visibility = spawnSync(process.execPath, ['test_app_network_selector_visibility.js'], { encoding: 'utf8' });
assert.strictEqual(visibility.status, 0, visibility.stderr || visibility.stdout);
console.log('authenticated network modal and toast regression: passed');
