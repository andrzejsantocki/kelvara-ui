const assert=require('assert'),fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('index.html','utf8');
const moduleSource=html.match(/<script data-wallet-module>([\s\S]*?)<\/script>/)[1];
const MAIN='5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',DEV='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG',WALLET='BoundWallet111111111111111111111111111111111111';
function deferred(){let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j});return{promise,resolve,reject}}
function element(attrs={}){return{hidden:false,textContent:'',onclick:null,dataset:{},setAttribute(name,value){this[name]=value},...attrs}}
function responseFor(network){return network==='devnet'?{network:'devnet',genesisHash:DEV,sourceStatus:'canonical_devnet_empty_read_only',positions:[],safeguards:[],protocolStatuses:[]}:{network:'mainnet-beta',genesisHash:MAIN,wallet:WALLET,position:null,authority:null,sourceStatus:'dust_filtered'}}
function rootHarness({record,stage}={}){
 const ss=new Map([['kelvara_network_context','mainnet-beta']]),ls=new Map(),nodes=new Map();
 if(record)ss.set('kelvara_app_session',JSON.stringify(record));
 for(const id of ['wallet-selector','wallet-selector-message','wallet-selector-status','wallet-chip','wallet-chip-address','wallet-disconnect','wallet-selector-close','network-selector','network-selector-close','network-selector-status','realm-label'])nodes.set(id,element());
 const walletButton=element({dataset:{wallet:'phantom'}}),networkButtons=['mainnet-beta','devnet'].map(network=>element({dataset:{network}}));
 nodes.get('wallet-selector').querySelectorAll=()=>[walletButton];nodes.get('network-selector').querySelectorAll=()=>networkButtons;
 const gates={connect:deferred(),challenge:deferred(),signature:deferred(),verify:deferred(),inspect:deferred()};let calls={connect:0,challenge:0,signature:0,verify:0,inspect:0},disconnects=0,redirect;
 const provider={isConnected:true,publicKey:{toString:()=>WALLET},async connect(){calls.connect++;return stage==='connect'?gates.connect.promise:{publicKey:this.publicKey}},async signMessage(){calls.signature++;return stage==='signature'?gates.signature.promise:{signature:Uint8Array.of(1)}},async disconnect(){disconnects++}};
 const context={window:{phantom:{solana:provider},dispatchEvent(){}},document:{querySelector:s=>nodes.get(s.slice(1))||element(),querySelectorAll:s=>s==='[data-wallet]'?[walletButton]:[],addEventListener(){}},sessionStorage:{getItem:k=>ss.get(k)||null,setItem:(k,v)=>ss.set(k,String(v)),removeItem:k=>ss.delete(k)},localStorage:{getItem:k=>ls.get(k)||null,removeItem:k=>ls.delete(k)},location:{replace:url=>{redirect=url}},fetch:async(url)=>{if(url.startsWith('https://api.ipify.org'))return{ok:true,json:async()=>({ip:'185.78.133.77'})};const phase=url.endsWith('/challenge')?'challenge':url.endsWith('/verify')?'verify':'inspect';calls[phase]++;if(stage===phase)return gates[phase].promise;return{ok:true,json:async()=>phase==='challenge'?{message:'challenge',network:ss.get('kelvara_network_context'),genesisHash:ss.get('kelvara_network_context')==='devnet'?DEV:MAIN}:phase==='verify'?{token:'token',network:ss.get('kelvara_network_context'),genesisHash:ss.get('kelvara_network_context')==='devnet'?DEV:MAIN}:responseFor(ss.get('kelvara_network_context'))}},TextEncoder,btoa:s=>Buffer.from(s,'binary').toString('base64'),CustomEvent:function(type,init){this.type=type;this.detail=init.detail},setTimeout};
 vm.runInNewContext(moduleSource,context,{filename:'index.html'});
 return{ss,ls,nodes,walletButton,networkButtons,gates,calls,provider,disconnects:()=>disconnects,redirect};
}
async function flush(){for(let i=0;i<4;i++)await new Promise(resolve=>setImmediate(resolve))}
async function switchToDevnet(h){h.nodes.get('realm-label').onclick();h.networkButtons[1].onclick();await flush()}
async function assertStaleConnectCannotCommit(stage){
 const h=rootHarness({stage}),pending=h.walletButton.onclick();
 for(let i=0;i<100&&!(stage==='connect'?h.calls.connect:h.calls[stage]);i++)await flush();assert(h.calls[stage],`${stage}: connect reached expected await`);
 if(stage==='connect')h.gates.connect.resolve({publicKey:h.provider.publicKey});
 await switchToDevnet(h);
 if(stage!=='connect')h.gates[stage].resolve(stage==='signature'?{signature:Uint8Array.of(1)}:stage==='verify'?{ok:true,json:async()=>({token:'token',network:'devnet',genesisHash:DEV})}:{ok:true,json:async()=>responseFor('devnet')});
 await pending;await flush();
 assert.strictEqual(h.ss.get('kelvara_network_context'),'devnet',`${stage}: selected network survives switch`);
 assert.strictEqual(h.ss.get('kelvara_app_session'),undefined,`${stage}: stale continuation does not persist session`);
 assert.strictEqual(h.ss.get('kelvara_handoff'),undefined,`${stage}: stale continuation does not persist handoff`);
 assert.strictEqual(h.redirect,undefined,`${stage}: stale continuation does not redirect`);
}
(async()=>{
 for(const bad of [
  {network:'mainnet-beta',genesisHash:DEV,wallet:WALLET,source:'phantom',token:'t'},
  {network:'mainnet-beta',genesisHash:'wrong',wallet:WALLET,source:'phantom',token:'t'},
  {network:'mainnet-beta',genesisHash:MAIN,wallet:'OtherWallet111111111111111111111111111111111111',source:'phantom',token:'t'},
  {network:'mainnet-beta',genesisHash:MAIN,wallet:WALLET,source:'solflare',token:'t'}
 ]){
  const h=rootHarness({record:bad});h.nodes.get('realm-label').onclick();h.networkButtons[1].onclick();await flush();
  assert.strictEqual(h.disconnects(),0,'mismatched persisted record never disconnects injected provider');
  assert.strictEqual(h.ss.get('kelvara_network_context'),'devnet','network switch still completes');
 }
 for(const stage of ['connect','challenge','signature','verify','inspect'])await assertStaleConnectCannotCommit(stage)
 console.log('root network binding and generation-fence regressions passed');
})().catch(error=>{console.error(error);process.exitCode=1});
