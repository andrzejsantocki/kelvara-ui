const assert = require('assert');
const fs = require('fs');
const cp = require('child_process');

const html = fs.readFileSync('app.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const headCss = cp.execFileSync('git', ['show', 'HEAD:styles.css'], { encoding: 'utf8' });

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function parseRules(source) {
  const rules = [];
  const text = stripComments(source);
  let media = 'all';
  let order = 0;
  const stack = [];
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '{') {
      const header = text.slice(start, i).trim();
      stack.push({ header, start: i + 1, media: header.startsWith('@media') ? header : media });
      if (header.startsWith('@media')) media = header;
      start = i + 1;
    } else if (text[i] === '}') {
      const entry = stack.pop();
      if (!entry) continue;
      const body = text.slice(entry.start, i).trim();
      if (!entry.header.startsWith('@')) {
        for (const selector of entry.header.split(',')) {
          rules.push({ selector: selector.trim(), body, media: entry.media, order: order++ });
        }
      }
      const mediaEntry = [...stack].reverse().find((item) => item.header.startsWith('@media'));
      media = mediaEntry ? mediaEntry.header : 'all';
      start = i + 1;
    }
  }
  return rules;
}

function declarations(body) {
  return Object.fromEntries(body.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const colon = part.indexOf(':');
    return colon < 0 ? [part, ''] : [part.slice(0, colon).trim(), part.slice(colon + 1).trim()];
  }));
}

function specificity(selector) {
  return [
    (selector.match(/#[\w-]+/g) || []).length,
    (selector.match(/[.:][\w-]+|\[[^\]]+\]/g) || []).length,
    (selector.match(/(?:^|[ >+~])[a-z][\w-]*/gi) || []).length,
  ];
}

function matches(selector, element) {
  if (/[,:]/.test(selector.replace(/:[a-z-]+/gi, ''))) return false;
  const clean = selector.replace(/:(?:hover|focus-visible|focus|active|disabled)\b/g, '').trim();
  const tokens = clean.split(/\s+/);
  const target = tokens[tokens.length - 1];
  if (!target.includes('.')) return false;
  const classes = [...target.matchAll(/\.([\w-]+)/g)].map((match) => match[1]);
  return classes.every((name) => element.classes.includes(name));
}

function effective(source, element, viewport) {
  const result = {};
  for (const rule of parseRules(source)) {
    if (rule.media !== 'all') {
      const max = rule.media.match(/max-width\s*:\s*(\d+)px/);
      if (max && viewport > Number(max[1])) continue;
    }
    if (!matches(rule.selector, element)) continue;
    const rank = specificity(rule.selector);
    for (const [property, value] of Object.entries(declarations(rule.body))) {
      const previous = result[property];
      if (!previous || rank[0] > previous.rank[0] ||
          (rank[0] === previous.rank[0] && rank[1] > previous.rank[1]) ||
          (rank[0] === previous.rank[0] && rank[1] === previous.rank[1] &&
           (rank[2] > previous.rank[2] || (rank[2] === previous.rank[2] && rule.order > previous.order)))) {
        result[property] = { value, rank, order: rule.order };
      }
    }
  }
  return Object.fromEntries(Object.entries(result).map(([key, value]) => [key, value.value]));
}

function ruleSnapshot(source, predicate, properties) {
  return parseRules(source).filter((rule) => predicate(rule.selector)).map((rule) => {
    const selected = declarations(rule.body);
    return [rule.selector, rule.media, properties.map((property) => [property, selected[property] || null])];
  });
}

const header = html.match(/<header class="topbar">([\s\S]*?)<\/header>/)?.[1] || '';
assert.match(header, /<div class="header-actions">[\s\S]*<div id="network-control" class="network-button">[\s\S]*<div id="header-connect" class="wallet-button">/, 'logged-out controls must share the header actions row');

const shared = effective(css, { classes: ['header-actions'] }, 1024);
assert.strictEqual(shared.display, 'flex', 'shared header row must use flex layout');
assert.strictEqual(shared['align-items'], 'center', 'shared header row must center controls');

const network = effective(css, { classes: ['network-button'] }, 1024);
const wallet = effective(css, { classes: ['wallet-button'] }, 1024);
assert.strictEqual(network.height, '40px', 'network container height must remain 40px');
assert.strictEqual(network.display, 'inline-flex', 'network container must remain inline-flex');
assert.strictEqual(network['align-items'], 'center', 'network container must center');
assert.strictEqual(wallet.height, '40px', 'wallet container height must remain 40px');
assert.strictEqual(wallet.display, 'inline-flex', 'wallet container must remain inline-flex');
assert.strictEqual(wallet['align-items'], 'center', 'wallet container must center');
assert.doesNotMatch(JSON.stringify(network), /margin-top|top|transform/, 'network alignment must not use per-element nudges');
assert.doesNotMatch(JSON.stringify(wallet), /margin-top|top|transform/, 'wallet alignment must not use per-element nudges');
assert.match(css, /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.header-actions\s*\{[^}]*gap\s*:\s*8px/, 'mobile shared header row must retain compact alignment gap');
assert.match(css, /@media\s*\(max-width:\s*430px\)[\s\S]*?\.wallet-chip\s*\{[^}]*min-height\s*:\s*38px[^}]*padding-inline\s*:\s*11px/, 'mobile wallet control sizing must remain explicit');
assert.match(css, /\.wallet-button \.wallet-chip\s*\{[^}]*height\s*:\s*40px[^}]*min-height\s*:\s*40px[^}]*display\s*:\s*inline-flex[^}]*align-items\s*:\s*center[^}]*transform\s*:\s*none/, 'wallet chip must preserve effective shared alignment declarations');


const normal = effective(css, { classes: ['wallet-chip', 'header-connect'] }, 1024);
assert.strictEqual(normal.background, 'var(--surface)', 'logged-out wallet must use the logged-in light surface');
assert.strictEqual(normal['border-color'], 'var(--line-strong)', 'logged-out wallet must retain a visible logged-in-style border');
assert.strictEqual(normal.color, 'var(--ink)', 'logged-out wallet text must use readable dark ink');

const unchangedProperties = ['height', 'min-height', 'padding', 'padding-inline', 'border', 'border-color', 'border-radius', 'margin', 'margin-top', 'margin-bottom', 'top', 'right', 'bottom', 'left', 'position', 'transform'];
const relevantSelector = (selector) => /(?:wallet-chip|header-connect|wallet-button|network-button)/.test(selector);
const taskDiff = cp.execFileSync('git', ['diff', '--cached', '--', 'styles.css'], { encoding: 'utf8' });
const addedCss = taskDiff.split('\n').filter((line) => line.startsWith('+') && !line.startsWith('+++')).join('\n');
assert.doesNotMatch(addedCss, /(?:height|min-height|padding|padding-inline|border-radius|margin|top|right|bottom|left|position|transform)\s*:/, 'task diff must not change control size, padding, radius, or position declarations');
assert.match(addedCss, /\.wallet-chip\.header-connect\s*\{[^}]*background\s*:\s*var\(--surface\)[^}]*border-color\s*:\s*var\(--line-strong\)[^}]*color\s*:\s*var\(--ink\)/, 'task diff must add only logged-out normal-state contrast');
assert.doesNotMatch(addedCss, /:(?:hover|focus-visible|focus|active|disabled)\b/, 'task diff must not add or alter existing interactive state declarations');
assert.match(headCss, /\.wallet-button \.wallet-chip:hover,.wallet-button \.wallet-chip:focus-visible\{transform:none\}/, 'HEAD must retain the pre-existing hover/focus transform override');
assert.deepStrictEqual(
  ruleSnapshot(css, (selector) => selector === '.wallet-button .wallet-chip:hover' || selector === '.wallet-button .wallet-chip:focus-visible', ['transform']),
  ruleSnapshot(headCss, (selector) => selector === '.wallet-button .wallet-chip:hover' || selector === '.wallet-button .wallet-chip:focus-visible', ['transform']),
  'existing hover/focus transform declarations must remain unchanged',
);

console.log('logged-out header CSS contract: passed');
