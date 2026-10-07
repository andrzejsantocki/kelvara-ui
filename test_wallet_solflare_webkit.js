const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('index.deployed.html', 'utf8');
const script = html.match(/<script data-wallet-module>([\s\S]*?)<\/script>/)[1];
const makeStore = () => ({removeItem(){}, setItem(){}});
const nodes = new Map();
for (const id of ['wallet-selector','wallet-selector-message','wallet-chip','wallet-chip-address','wallet-disconnect','wallet-selector-close']) nodes.set(id,{hidden:id==='wallet-selector',textContent:'',classList:{toggle(){}}});
const key = '11111111111111111111111111111111';
const provider = {isSolflare:true,isConnected:true,publicKey:{toString:()=>key},connect:async()=>({publicKey:provider.publicKey}),signMessage:async()=>({signature:new Uint8Array([1,2,3])}),on(){}};
const calls = [];
const buttons = [{dataset:{wallet:'solflare'},addEventListener(type,fn){this.onclick=fn;}}];
const context = {
  window:{solflare:provider}, document:{getElementById:id=>nodes.get(id),querySelector:s=>nodes.get(s.slice(1))||null,querySelectorAll:()=>buttons,addEventListener(){}},
  sessionStorage:makeStore(), localStorage:makeStore(), location:{hostname:'app.kelvara.xyz',replace(){}},
  fetch:async(url)=>{calls.push(url); if (!String(url).startsWith('https://api.kelvara.xyz/')) throw new DOMException('The string did not match the expected pattern'); return {ok:true,json:async()=>url.endsWith('/challenge')?{message:'challenge'}:url.endsWith('/verify')?{token:'token'}:{position:{underlyingAmount:1}}};},
  console, setTimeout, Promise, TextEncoder, btoa:s=>Buffer.from(s,'binary').toString('base64'), DOMException
};
vm.runInNewContext(script, context);
(async()=>{ await nodes.get('wallet-chip').onclick(); await buttons[0].onclick(); await new Promise(r=>setImmediate(r));
  assert.ok(calls.length === 0 || calls.every(url=>String(url).startsWith('https://api.kelvara.xyz/')), 'WebKit/Solflare repro: relative API URL causes exact DOMException');
  console.log('Solflare WebKit URL regression passed');
})().catch(error=>{console.error(error);process.exitCode=1});
