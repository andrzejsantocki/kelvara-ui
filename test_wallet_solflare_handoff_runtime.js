const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('async function waitForWalletProvider');
const end=source.indexOf('\nasync function init',start);
assert(start>=0&&end>start,'handoff runtime present');
const handoffCode=source.slice(start,end);
const key='7sXHKv8RJG4ENmiDSpBEgiEnktJXPaVEmq2a8QBsvEgJ';
const genesisHash='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
const evidence={position:{name:'Devnet position'},authority:{status:'ok'}};
function store(initial){return{data:new Map(Object.entries(initial||{})),getItem(k){return this.data.has(k)?this.data.get(k):null},setItem(k,v){this.data.set(k,String(v))},removeItem(k){this.data.delete(k)}}}
const sessionStorage=store({kelvara_handoff:JSON.stringify({wallet:key,source:'solflare',token:'handoff-token',network:'devnet',genesisHash,evidence})});
let connectCalls=0;
const provider={isConnected:true,publicKey:{toString:()=>key},connect:async()=>{connectCalls++;throw new Error('Solflare must not reconnect an already-connected wallet')}};
const context={
  APP_SESSION_KEY:'kelvara_app_session',
  sessionStorage,
  validNetworkRecord(record){return record?.network==='devnet'&&record.genesisHash===genesisHash},
  validWalletSession(record){return record?.network==='devnet'&&record.wallet===key&&record.source==='solflare'&&record.token==='handoff-token'&&record.genesisHash===genesisHash},
  removeAppSession(){sessionStorage.removeItem('kelvara_app_session')},
  walletProvider(source){assert.strictEqual(source,'solflare');return provider},
  withTimeout(p){return p},
  saveAppSession(wallet,source,token){sessionStorage.setItem('kelvara_app_session',JSON.stringify({wallet,source,token,network:'devnet',genesisHash}))},
  rememberWallet(){}, bindWalletEvents(){}, renderPosition(){}, renderAuthority(){},
  document:{querySelector(selector){assert.strictEqual(selector,'main');return{classList:{remove(){}}}}},
  Promise,setTimeout
};
vm.runInNewContext(`${handoffCode};this.consumeHandoff=consumeHandoff`,context,{filename:'app.js'});
(async()=>{
  const result=await context.consumeHandoff();
  assert.strictEqual(result,true,'connected Solflare handoff succeeds without reconnect');
  assert.strictEqual(connectCalls,0,'already-connected exact Solflare provider is reused');
  assert.strictEqual(sessionStorage.getItem('kelvara_handoff'),null,'handoff consumed');
  assert.deepStrictEqual(JSON.parse(sessionStorage.getItem('kelvara_app_session')),{wallet:key,source:'solflare',token:'handoff-token',network:'devnet',genesisHash});
  delete provider.connect;
  sessionStorage.setItem('kelvara_handoff',JSON.stringify({wallet:key,source:'solflare',token:'handoff-token',network:'devnet',genesisHash,evidence}));
  const rehandoff=await context.consumeHandoff();
  assert.strictEqual(rehandoff,true,'already-connected exact Solflare handoff succeeds without connect method');
  assert.strictEqual(connectCalls,0,'handoff reuse does not reconnect');
  const restored=await context.restoreAppSession();
  assert.strictEqual(restored,true,'already-connected exact Solflare session restores without connect method');
  assert.strictEqual(connectCalls,0,'same-tab session restore does not reconnect');
  console.log('Solflare connected handoff runtime passed: handoff and session reuse without reconnect');
})().catch(error=>{console.error(error);process.exitCode=1});
