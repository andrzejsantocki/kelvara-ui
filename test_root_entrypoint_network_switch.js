const assert=require('assert'),fs=require('fs'),vm=require('vm');
const index=fs.readFileSync('index.html','utf8');
assert(index.includes('<script data-wallet-module>'),'root entrypoint owns wallet/network module');
assert(index.includes('id="network-selector"'),'root entrypoint exposes network chooser');
const inline=index.match(/<script data-wallet-module>([\s\S]*?)<\/script>/)[1];
const MAIN='5eykt4UsvFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',DEV='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
function node(id,attrs={}){return Object.assign({id,textContent:'',hidden:false,onclick:null,dataset:{},setAttribute(n,v){this[n]=v},addEventListener(){},querySelectorAll(){return[]}},attrs)}
function harness(){
 const ss=new Map(),ls=new Map(),nodes=new Map();
 for(const id of ['network-selector','network-selector-close','network-selector-status','wallet-selector','wallet-selector-message','wallet-selector-close','wallet-chip','wallet-chip-address','wallet-disconnect','realm-label'])nodes.set(id,node(id));
 const buttons=['mainnet-beta','devnet'].map(network=>node('',{dataset:{network}}));nodes.get('network-selector').querySelectorAll=()=>buttons;
 let disconnects=0;
 const provider={isConnected:true,publicKey:{toString:()=> 'StaleConnectedWallet11111111111111111111111111111111111'},disconnect(){disconnects++;return Promise.resolve()}};
 const listeners={};
 const context={document:{querySelector:s=>nodes.get(s.slice(1)),querySelectorAll:s=>s==='[data-wallet]'?[]:[],addEventListener(n,f){(listeners[n]??=[]).push(f)},},window:{phantom:{solana:provider},dispatchEvent(){}},sessionStorage:{getItem:k=>ss.get(k)||null,setItem(k,v){ss.set(k,String(v))},removeItem(k){ss.delete(k)}},localStorage:{getItem:k=>ls.get(k)||null,setItem(k,v){ls.set(k,String(v))},removeItem(k){ls.delete(k)}},location:{replace(){throw Error('auth navigation must not occur during selection')}},CustomEvent:function(type,init){this.type=type;this.detail=init.detail},setTimeout,Promise,TextEncoder,btoa:s=>Buffer.from(s,'binary').toString('base64')};
 vm.runInNewContext(inline,context,{filename:'index.html'});
 return {ss,ls,nodes,provider,counts:()=>({disconnects}),settle:()=>new Promise(r=>setImmediate(r))};
}
(async()=>{
 for(const selected of ['mainnet-beta','devnet']){
  const h=harness();
  h.nodes.get('network-selector').querySelectorAll().find(b=>b.dataset.network===selected).onclick();
  assert.strictEqual(h.counts().disconnects,0,`${selected}: no app-owned session means initial selection does not disconnect`);
  await h.settle();
  assert.strictEqual(h.ss.get('kelvara_network_context'),selected,`${selected}: persist exact selected enum at root`);
  for(const key of ['kelvara_handoff','kelvara_app_session','kelvara_auth_token'])assert.strictEqual(h.ss.get(key),undefined,`${selected}: clear ${key}`);
  assert.strictEqual(h.ls.get('kelvara_pending_nonce_accounts'),undefined,`${selected}: clear pending nonce state`);
 }
 const h=harness();h.ss.set('kelvara_network_context','devnet');h.ss.set('kelvara_app_session',JSON.stringify({source:'phantom',network:'devnet',wallet:'StaleConnectedWallet11111111111111111111111111111111111'}));h.nodes.get('realm-label').onclick();
 h.nodes.get('network-selector').querySelectorAll()[0].onclick();await h.settle();
 assert.strictEqual(h.ss.get('kelvara_network_context'),'mainnet-beta','switch back persists Mainnet enum at root');
 assert.strictEqual(h.counts().disconnects,1,'switch back tears down stale connected provider');
 console.log('root entrypoint network selection and fresh-auth regressions passed');
})().catch(error=>{console.error(error);process.exitCode=1});
