const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('<script data-wallet-module>'),end=html.indexOf('</script>',start)+9;
const walletModule=html.slice(start,end).replace(/^<script[^>]*>|<\/script>$/g,'');
const ALLOWED='185.78.133.77';
function store(seed={}){const data=new Map(Object.entries(seed));return{getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)}}
function run({ip,lookupError=false,cachedIp,connectResult}={}){
  const sessionStorage=store({kelvara_network_context:'mainnet-beta'}),localStorage=store(cachedIp?{kelvara_wallet_gate_ip:JSON.stringify({ip:cachedIp,expiresAt:Date.now()+60000})}:{});
  const nodes=new Map(['wallet-selector','network-selector','wallet-selector-message','wallet-chip','wallet-chip-address','wallet-disconnect','wallet-selector-close','network-selector-close','realm-label','network-selector-status'].map(id=>[id,{hidden:true,textContent:'',onclick:null,querySelectorAll:()=>[]} ]));
  const walletButton={dataset:{wallet:'phantom'},onclick:null};nodes.get('wallet-selector').querySelectorAll=()=>[walletButton];
  let connectCalls=0,fetchCalls=[];
  const provider={isConnected:true,publicKey:{toString:()=> '11111111111111111111111111111111'},connect:async()=>{connectCalls++;return connectResult||{publicKey:provider.publicKey}},signMessage:async()=>({signature:new Uint8Array([1])}),on(){},disconnect:async()=>{}};
  const context={window:{phantom:{solana:provider},dispatchEvent(){}},sessionStorage,localStorage,CustomEvent:function(type,init){return{type,...init}},document:{querySelector:selector=>nodes.get(selector.slice(1))||{querySelectorAll:()=>[]},querySelectorAll:selector=>selector==='[data-wallet]'?[walletButton]:[],addEventListener(){}},TextEncoder,fetch:async(url)=>{fetchCalls.push(url);if(lookupError)throw Error('lookup failed');return{ok:true,json:async()=>({ip})}}};
  vm.runInNewContext(walletModule,context);
  return {click:async()=>{await walletButton.onclick()},get message(){return nodes.get('wallet-selector-message').textContent},get connectCalls(){return connectCalls},fetchCalls,provider};
}
(async()=>{
  let r=run({ip:ALLOWED});await r.click();assert.strictEqual(r.connectCalls,1,`allowed IP preserves provider connect: ${r.message} ${r.fetchCalls.join(',')}`);
  r=run({ip:'8.8.8.8'});await r.click();assert.strictEqual(r.message,'The app is currently under scheduled maintenance. Contact help@kelvara.xyz.','denied IP shows exact maintenance message');assert.strictEqual(r.connectCalls,0,'denied IP makes zero provider connect calls');
  r=run({lookupError:true});await r.click();assert.strictEqual(r.message,'The app is currently under scheduled maintenance. Contact help@kelvara.xyz.','lookup failure fails closed');assert.strictEqual(r.connectCalls,0,'lookup failure makes zero provider connect calls');
  r=run({cachedIp:ALLOWED,ip:'8.8.8.8'});await r.click();assert.strictEqual(r.message,'The app is currently under scheduled maintenance. Contact help@kelvara.xyz.','stale allowed-IP cache cannot bypass fresh lookup');assert.strictEqual(r.connectCalls,0,'stale allowed-IP cache makes zero provider connect calls');assert.strictEqual(r.fetchCalls.length,1,'every connect attempt performs a fresh lookup');
  console.log('wallet IP gate runtime passed: allowed, denied, lookup failure, stale-cache denial, zero provider connect');
})().catch(error=>{console.error(error);process.exitCode=1});
