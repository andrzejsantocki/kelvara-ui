const assert = require('assert');
const fs = require('fs');
const landing = fs.readFileSync('index.deployed.html','utf8');
const app = fs.readFileSync('app.html','utf8');
const css = landing.match(/<style>([\s\S]*?)<\/style>/)[1];
assert.match(css, /\.scope::before[\s\S]*radial-gradient\(circle/);
assert.doesNotMatch(landing, /<link[^>]+styles\.css/);
assert.match(app, /id="stage-position"/);
assert.match(app, /<link rel="stylesheet" href="\/styles\.css/);
assert.match(app, /<script[^>]+src="\/app\.js"/);
assert.match(landing, /localStorage\.setItem\(['"]kelvara_prod_wallet['"]/);
assert.match(landing, /localStorage\.setItem\(['"]kelvara_prod_wallet_source['"]/);
assert.match(landing, /window\.location(?:\.href)?\s*=\s*['"]\/app\.html/);
assert.match(fs.readFileSync('app.js','utf8'), /onlyIfTrusted/);
for (const [kind, asset] of [['phantom','phantom.svg'],['solflare','solflare.svg'],['backpack','backpack.svg']]) {
  assert.match(landing, new RegExp(`data-wallet="${kind}"[\\s\\S]*?assets/wallets/${asset}`));
}
assert.match(landing, /if\(!p\.isConnected.*?throw Error/);
console.log('wallet handoff tests passed');
