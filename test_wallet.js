const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('index.deployed.html', 'utf8');
assert.match(html, /id="wallet-selector"/);
for (const wallet of ['phantom', 'solflare', 'backpack']) assert.match(html, new RegExp(`data-wallet="${wallet}"[\\s\\S]*?assets/wallets/${wallet}\\.svg`));
assert.doesNotMatch(html, /localStorage/);
const script = html.match(/<script data-wallet-module>([\s\S]*?)<\/script>/)[1];
const makeStore = () => { const data = new Map(); return {data, getItem:k=>data.has(k)?data.get(k):null, setItem:(k,v)=>data.set(k,String(v)), removeItem:k=>data.delete(k)}; };
const wait = ms => new Promise(r => setTimeout(r, ms));
async function scenario({verifyOk=true, inspectOk=true}={}) {
  const sessionStorage = makeStore(), localStorage = makeStore(), calls=[];
  const nodes = new Map();
  for (const id of ['wallet-selector','wallet-selector-message','wallet-chip','wallet-chip-address','wallet-disconnect','wallet-selector-close']) nodes.set(id,{hidden:id==='wallet-selector',textContent:'',classList:{toggle(){}}});
  const buttons = [{dataset:{wallet:'phantom'},disabled:false,addEventListener(type,fn){this.onclick=fn;}}];
  const key='11111111111111111111111111111111', provider={isPhantom:true,isConnected:true,publicKey:{toString:()=>key},connect:async()=>({publicKey:provider.publicKey}),signMessage:async()=>({signature:new Uint8Array([1,2,3])}),on(){}};
  const response=(ok,body)=>({ok,json:async()=>body});
  const context={window:{phantom:{solana:provider}},document:{getElementById:id=>nodes.get(id),querySelector:s=>nodes.get(s.slice(1))||null,querySelectorAll:()=>buttons,addEventListener(){}},sessionStorage,localStorage,location:{replace(url){context.redirect=url}},fetch:async(url,opts)=>{calls.push([url,opts]);if(url.includes('/challenge'))return response(true,{message:'challenge'});if(url.includes('/verify'))return response(verifyOk,verifyOk?{token:'token'}:{error:'verify failed'});if(url.includes('/inspect/'))return response(inspectOk,inspectOk?{position:{underlyingAmount:1},authority:{status:'ok'}}:{error:'inspect failed'});throw Error('unexpected fetch '+url)},console,setTimeout,Promise,TextEncoder,btoa:s=>Buffer.from(s,'binary').toString('base64')};
  vm.runInNewContext(script, context); await nodes.get('wallet-chip').onclick(); await buttons[0].onclick(); await wait(0);
  return {context,sessionStorage,localStorage,nodes,calls};
}
(async()=>{
  let r=await scenario(); assert.strictEqual(r.context.redirect,'/app.html'); assert.deepStrictEqual([...r.sessionStorage.data.keys()],['kelvara_handoff']); assert.strictEqual(r.sessionStorage.getItem('kelvara_auth_token'),null); assert.strictEqual(r.localStorage.data.size,0); assert.strictEqual(r.calls.length,3);
  r=await scenario({verifyOk:false}); assert.strictEqual(r.context.redirect,undefined); assert.strictEqual(r.sessionStorage.data.size,0); assert.match(r.nodes.get('wallet-selector-message').textContent,/verify failed/i);
  r=await scenario({inspectOk:false}); assert.strictEqual(r.context.redirect,undefined); assert.strictEqual(r.sessionStorage.data.size,0); assert.match(r.nodes.get('wallet-selector-message').textContent,/inspect failed/i);
  console.log('wallet flow tests passed: success gating, session-only handoff, verify/inspect failures');
})();
