const assert=require('node:assert/strict');const fs=require('node:fs');const css=fs.readFileSync('styles.css','utf8');
const history=css.match(/\.safeguard-history\{([^}]*)\}/)?.[1]||'';
const segment=css.match(/\.safeguard-history i\{([^}]*)\}/)?.[1]||'';
assert.match(history,/height:(?:8|9|10)px/,'history strip is 8–10px tall');
assert.match(history,/gap:(?:2|3|4)px/,'history cells remain distinguishable');
assert.match(segment,/min-width:(?:4|5|6)px/,'history cells are not hairlines');
for(const state of ['intact','approved_change','action_window','breached'])assert.match(css,new RegExp(`\\.safeguard-history \\.status-${state}\\{background:#[0-9a-f]{6}`),`${state} has an opaque high-contrast color`);
assert.match(segment,/background:#[0-9a-f]{6}/,'unknown has an opaque gray color');
console.log('safeguards history readability passed');
