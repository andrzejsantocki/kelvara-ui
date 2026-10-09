const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = __dirname;
const app = fs.readFileSync(path.join(root, 'app.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

assert.match(app, /<link[^>]+href=["'][^"']*styles\.css(?:\?[^"']*)?["']/, 'app.html must load styles.css');
assert.match(app, /id=["']network-selector["'][^>]*\bhidden(?:[=\s>])/, 'network selector must start hidden');
const modalRule = css.match(/\.modal\s*\{[\s\S]*?\}/);
const hiddenRule = css.match(/\.modal\[hidden\]\s*\{[^}]*display\s*:\s*none\s*!important[^}]*\}/);
assert(modalRule && hiddenRule && hiddenRule.index > modalRule.index, 'post-.modal hidden rule must win the cascade');
assert.match(appJs, /label\.onclick\s*=\s*\(\)\s*=>\s*\{\s*selector\.hidden\s*=\s*false/, 'network label click must remove hidden');
assert.match(appJs, /selector\.hidden\s*=\s*true/, 'network selector close/reload state must restore hidden');

const runtime = spawnSync(process.execPath, [path.join(root, 'test_network_selector_runtime.js')], {
  cwd: root,
  encoding: 'utf8'
});
assert.strictEqual(runtime.status, 0, runtime.stderr || runtime.stdout);
console.log('app.html network selector visibility passed');
