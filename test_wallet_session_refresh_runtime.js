const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('app.js','utf8');
const key='11111111111111111111111111111111',token='trusted-session-token',evidence={position:{name:'Kamino USDG',protocol:'Kamino',underlyingAmount:123.45,totalShares:99},authority:{status:'ok'}};
const ids=new Set([...fs.readFileSync('app.html','utf8').matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
function store(initial){return{data:new Map(Object.entries(initial||{})),getItem(k){return this.data.has(k)?this.data.get(k):null},setItem(k,v){this.data.set(k,String(v))},removeItem(k){this.data.delete(k)}}}
function node(){return{classList:{add(){},remove(){},toggle(){}},style:{setProperty(){}},dataset:{},value:'',checked:false,disabled:false,textContent:'',innerHTML:'',onclick:null,onchange:null,onkeydown:null,addEventListener(){},setAttribute(){},replaceChildren(){},closest(){return this},getBoundingClientRect(){return{left:0,top:0,width:1,height:1}}}}
function boot(sessionStorage,provider,legacy={kelvara_prod_wallet:key,kelvara_prod_wallet_source:'phantom'},inspectFailure=false){
  const nodes=new Map([...ids].map(id=>[id,node()])),calls=[],redirects=[];
  const document={body:node(),querySelector(selector){if(selector.startsWith('#'))return nodes.get(selector.slice(1))||node();if(selector==='main')return nodes.get('main')||node();return node()},querySelectorAll(){return[]},createElement:node,addEventListener(){}};
  const location={hostname:'localhost',hash:'#positions',replace(url){redirects.push(url)}};
  const localStorage=store(legacy);
  const context={normalizeNetwork(value){return value==='mainnet-beta'||value==='devnet'?value:null},validNetworkRecord(record){return record?.network==='mainnet-beta'},document,window:{addEventListener(){},scrollTo(){},location,phantom:{solana:provider}},location,localStorage,sessionStorage,fetch:async(url,options)=>{calls.push([url,options||{}]);let body={};if(url==='/healthz')body={status:'ok'};else if(url.includes('/api/portfolio/'))return{ok:false,status:404,text:async()=>JSON.stringify({error:'not found'})};else if(url.includes('/api/inspect/')){if(inspectFailure)return{ok:false,status:503,text:async()=>JSON.stringify({error:'unavailable'})};body=evidence}else if(url==='/api/protection/status')body={armed:false};return{ok:true,status:200,text:async()=>JSON.stringify(body)}} ,setTimeout,clearTimeout,setInterval:()=>1,clearInterval,Promise,URLSearchParams,Intl,DOMParser:class{},TextEncoder,atob:()=>'',btoa:()=>'',matchMedia:()=>({matches:false}),console,animalIdenticonSvg:()=>'',provider,location};
  const code=source.replace(/^import[^\n]*\n/gm,'').replace(/\ninit\(\);\s*$/,'')+'\nthis.boot=init;this.clearForTest=clearLocalState;';
  vm.runInNewContext(code,context,{filename:'app.js'});
  return{context,calls,redirects,nodes};
}
function trustedProvider({reject=false,mismatch=false}={}){let connects=0,signs=0,events={};const publicKey={toString:()=>mismatch?'bad':key};return{isConnected:true,publicKey,connect:async options=>{assert.strictEqual(options.onlyIfTrusted,true);connects++;if(reject)throw new Error('rejected');return{publicKey}},signMessage:async()=>{signs++;throw new Error('unexpected auth challenge')},on(name,handler){events[name]=handler},emit(name,value){events[name]?.(value)},get connects(){return connects},get signs(){return signs}}}
async function assertRejectedSession(session,provider){const result=boot(session,provider);await result.context.boot();assert.deepStrictEqual(result.redirects,['/?wallet_error=session']);assert.strictEqual(session.getItem('kelvara_app_session'),null)}
(async()=>{
  const handoff={wallet:key,source:'phantom',token,network:'mainnet-beta',evidence},session=store({kelvara_handoff:JSON.stringify(handoff)}),provider=trustedProvider();
  let first=boot(session,provider);await first.context.boot();
  assert.strictEqual(session.getItem('kelvara_handoff'),null,'handoff consumed');
  assert.strictEqual(first.context.localStorage.getItem('kelvara_prod_wallet'),null,'legacy wallet key removed');
  assert.strictEqual(first.context.localStorage.getItem('kelvara_prod_wallet_source'),null,'legacy source key removed');
  assert.deepStrictEqual(JSON.parse(session.getItem('kelvara_app_session')),{wallet:key,source:'phantom',token,network:'mainnet-beta'});
  assert.strictEqual(provider.signs,0,'handoff token avoids signing');
  assert.strictEqual(first.redirects.length,0,'initial boot stays in app');
  first.context.clearForTest();
  assert.strictEqual(session.getItem('kelvara_app_session'),null,'clear state removes app session');
  session.setItem('kelvara_app_session',JSON.stringify({wallet:key,source:'phantom',token,network:'mainnet-beta'}));
  const second=boot(session,provider);await second.context.boot();
  assert.strictEqual(provider.signs,0,'refresh avoids signMessage');
  assert.strictEqual(second.redirects.length,0,'refresh stays in app');
  assert(second.calls.some(([url])=>url.includes('/api/inspect/')),'refresh inspects evidence');
  assert(second.calls.some(([url,options])=>url==='/api/protection/status'&&options.headers.authorization===`Bearer ${token}`),'refresh loads protection with restored token');
  const outageSession=store({kelvara_app_session:JSON.stringify({wallet:key,source:'phantom',token,network:'mainnet-beta'})}),outage=boot(outageSession,trustedProvider(),{},true);await outage.context.boot();
  assert.strictEqual(outage.redirects.length,0,'inspection outage does not redirect');
  assert.strictEqual(outageSession.getItem('kelvara_app_session')!==null,true,'inspection outage preserves app session');
  provider.emit('accountChanged',{toString:()=> 'different-wallet'});
  assert.strictEqual(session.getItem('kelvara_app_session'),null,'account change clears app session');
  const secondSession=store({kelvara_app_session:JSON.stringify({wallet:key,source:'phantom',token,network:'mainnet-beta'})}),secondProvider=trustedProvider();
  const third=boot(secondSession,secondProvider);await third.context.boot();
  assert.strictEqual(secondProvider.signs,0,'refresh avoids signMessage');
  assert.strictEqual(third.context.localStorage.getItem('kelvara_prod_wallet'),null,'refresh removes legacy wallet key');
  assert.strictEqual(third.redirects.length,0,'refresh stays in app');
  assert(third.calls.some(([url])=>url.includes('/api/inspect/')),'refresh inspects evidence');
  assert(third.calls.some(([url,options])=>url==='/api/protection/status'&&options.headers.authorization===`Bearer ${token}`),'refresh loads protection with restored token');
  await assertRejectedSession(store({kelvara_app_session:'malformed'}),trustedProvider());
  await assertRejectedSession(store({kelvara_app_session:JSON.stringify({wallet:key,source:'phantom',token})}),trustedProvider());
  await assertRejectedSession(store({kelvara_app_session:JSON.stringify({wallet:key,source:'phantom',token,network:'devnet'})}),trustedProvider());
  await assertRejectedSession(store({kelvara_app_session:JSON.stringify({wallet:key,source:'phantom',token,network:'mainnet-beta'})}),trustedProvider({mismatch:true}));
  await assertRejectedSession(store({kelvara_app_session:JSON.stringify({wallet:key,source:'phantom',token,network:'mainnet-beta'})}),trustedProvider({reject:true}));
  await assertRejectedSession(store(),trustedProvider());
  console.log('wallet session refresh runtime passed: handoff, same-tab reload, trusted restore, inspect, protection, rejection, mismatch, malformed, absent, account-change');
})();
