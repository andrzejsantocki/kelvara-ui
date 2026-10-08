const assert=require('assert'),fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('<script data-wallet-module>'),end=html.indexOf('</script>',start)+9;
const walletModule=html.slice(start,end).replace(/^<script[^>]*>|<\/script>$/g,'');
const MAIN='5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',DEV='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
function deferred(){let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j});return{promise,resolve,reject}}
function element(attrs={}){return{hidden:false,textContent:'',onclick:null,dataset:{},setAttribute(name,value){this[name]=value},...attrs}}
function scenario({rejectDisconnect=false,initialNetwork='mainnet-beta'}={}){
 const ss=new Map([['kelvara_network_context',initialNetwork]]),ls=new Map(),nodes=new Map();
 for(const id of ['wallet-selector','wallet-selector-message','wallet-selector-status','wallet-chip','wallet-chip-address','wallet-disconnect','wallet-selector-close','network-selector','network-selector-close','network-selector-status','realm-label'])nodes.set(id,element());
 const walletButton=element({dataset:{wallet:'phantom'}}),networkButtons=['mainnet-beta','devnet'].map(network=>element({dataset:{network}}));
 nodes.get('wallet-selector').querySelectorAll=()=>[walletButton];nodes.get('network-selector').querySelectorAll=()=>networkButtons;
 let connectCalls=0,signCalls=0,disconnectCalls=0,fetchCalls=0,disconnectGate=deferred(),disconnectError=null;
 const key='WalletRace111111111111111111111111111111111111',provider={isConnected:true,publicKey:{toString:()=>key},async connect(){connectCalls++;return{publicKey:this.publicKey}},async signMessage(){signCalls++;return{signature:Uint8Array.of(1,2,3)}},async disconnect(){disconnectCalls++;return disconnectGate.promise}};
 const response=body=>({ok:true,json:async()=>body});
 const context={window:{phantom:{solana:provider},dispatchEvent(){}},document:{querySelector:s=>nodes.get(s.slice(1))||element(),querySelectorAll:s=>s==='[data-wallet]'?[walletButton]:[],addEventListener(){}},sessionStorage:{getItem:k=>ss.get(k)||null,setItem:(k,v)=>ss.set(k,String(v)),removeItem:k=>ss.delete(k)},localStorage:{getItem:k=>ls.get(k)||null,setItem:(k,v)=>ls.set(k,String(v)),removeItem:k=>ls.delete(k)},location:{replace(){}},fetch:async(url)=>{fetchCalls++;if(url.endsWith('/challenge'))return response({message:'challenge',network:ss.get('kelvara_network_context'),genesisHash:ss.get('kelvara_network_context')==='devnet'?DEV:MAIN});if(url.endsWith('/verify'))return response({token:'token',network:ss.get('kelvara_network_context'),genesisHash:ss.get('kelvara_network_context')==='devnet'?DEV:MAIN});return response({network:ss.get('kelvara_network_context'),genesisHash:ss.get('kelvara_network_context')==='devnet'?DEV:MAIN,wallet:key,position:null,authority:null,sourceStatus:'canonical_devnet_empty_read_only'})},TextEncoder,btoa:s=>Buffer.from(s,'binary').toString('base64'),CustomEvent:function(type,init){this.type=type;this.detail=init.detail}};
 vm.runInNewContext(walletModule,context,{filename:'index.html'});
 return{ss,ls,nodes,walletButton,networkButtons,provider,disconnectGate,counts:()=>({connectCalls,signCalls,disconnectCalls,fetchCalls}),resolveDisconnect(){disconnectGate.resolve()},rejectDisconnect(error=Error('disconnect failed')){disconnectError=error;disconnectGate.reject(error)}};
}
async function settle(){await new Promise(resolve=>setImmediate(resolve))}
async function connectInitially(h){await h.walletButton.onclick();await settle()}
(async()=>{
 let h=scenario();assert.strictEqual(h.nodes.get('realm-label')['aria-expanded'],'false','network modal starts collapsed');assert.strictEqual(h.counts().disconnectCalls,0,'initial boot does not disconnect');
 await connectInitially(h);const before=h.counts();h.nodes.get('realm-label').onclick();assert.strictEqual(h.nodes.get('realm-label')['aria-expanded'],'true');h.networkButtons[1].onclick();
 assert.strictEqual(h.ss.get('kelvara_network_context'),'devnet','switch stores selected network synchronously');assert.strictEqual(h.ss.get('kelvara_app_session'),undefined,'switch clears session synchronously');assert.strictEqual(h.ls.get('kelvara_prod_monitor_wallet'),undefined,'switch clears local wallet synchronously');assert.strictEqual(h.nodes.get('wallet-chip').textContent,'Connect wallet','switch clears wallet UI synchronously');assert.strictEqual(h.nodes.get('realm-label')['aria-expanded'],'false','switch closes modal');assert.strictEqual(h.counts().disconnectCalls,1,'switch starts one provider disconnect');
 await h.walletButton.onclick();await settle();assert.deepStrictEqual(h.counts(),{...before,disconnectCalls:1},'connect/auth/API stay gated while disconnect is pending');
 h.resolveDisconnect();await settle();await h.walletButton.onclick();await settle();assert(h.counts().connectCalls>before.connectCalls,'explicit connect starts after successful disconnect');assert(h.counts().signCalls>before.signCalls,'auth starts after successful disconnect');
 h=scenario({initialNetwork:'devnet'});await connectInitially(h);const rejectedBefore=h.counts();h.networkButtons[0].onclick();h.rejectDisconnect();await settle();await h.walletButton.onclick();await settle();assert.deepStrictEqual(h.counts(),{...rejectedBefore,disconnectCalls:1},'rejected disconnect remains fail-closed');
 h=scenario();await connectInitially(h);const sameBefore=h.counts();h.networkButtons[0].onclick();assert.deepStrictEqual(h.counts(),sameBefore,'same-network selection does not disconnect');
 console.log('wallet disconnect race regressions passed');
})().catch(error=>{console.error(error);process.exitCode=1});
