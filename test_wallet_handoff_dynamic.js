const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('async function consumeHandoff');
const end=source.indexOf('\nasync function init',start);
const consumeSource=source.slice(start,end);
const consume=source.slice(start,end).replace(/^async function consumeHandoff/, 'async function consumeHandoff');
const stageStart=source.indexOf('const stages=');
const stageEnd=source.indexOf('\nasync function request',stageStart);
const stageCode=source.slice(stageStart,stageEnd);
const renderStart=source.indexOf('function renderPosition');
const renderEnd=source.indexOf('\nfunction renderAuthority',renderStart);
const renderCode=source.slice(renderStart,renderEnd);
const key='11111111111111111111111111111111', evidence={position:{underlyingAmount:1},authority:{status:'ok'}};
const store=initial=>({data:new Map(Object.entries(initial||{})),getItem(k){return this.data.get(k)||null},removeItem(k){this.data.delete(k)}});
async function run({providerAt=0,publicAt=0,connectReject=false,mismatch=false}={}){
  const handoff={wallet:key,source:'phantom',token:'handoff-token',evidence}; const sessionStorage=store({kelvara_handoff:JSON.stringify(handoff)}); let provider=null,rendered=false;
  const context={sessionStorage,window:{},walletAddress:null,walletSource:null,activeProvider:null,protectionToken:null,evidence:null, walletProvider(){return provider}, withTimeout(p){return p}, bindWalletEvents(){},renderPosition(){rendered=true},renderAuthority(){},document:{querySelector(){return {classList:{remove(){}}}}},setTimeout,Promise};
  setTimeout(()=>{provider={isConnected:true,publicKey:publicAt?null:{toString:()=>mismatch?'bad':key},connect:async()=>{if(connectReject)throw Error('rejected');await new Promise(r=>setTimeout(r,publicAt));provider.publicKey={toString:()=>mismatch?'bad':key};return {publicKey:provider.publicKey}}}},providerAt);
  vm.runInNewContext(`${consume}; this.consumeHandoff=consumeHandoff`,context); const promise=context.consumeHandoff();
  await new Promise(r=>setTimeout(r,Math.max(10,providerAt+10))); if(providerAt||publicAt)assert(sessionStorage.getItem('kelvara_handoff'),'handoff retained while restoration pending');
  const result=await promise; return {result,sessionStorage,rendered};
}
(async()=>{
 let r=await run({providerAt:120}); assert.strictEqual(r.result,true); assert.strictEqual(r.sessionStorage.getItem('kelvara_handoff'),null); assert(r.rendered);
 r=await run({publicAt:120}); assert.strictEqual(r.result,true); assert.strictEqual(r.sessionStorage.getItem('kelvara_handoff'),null);
 r=await run({mismatch:true}); assert.strictEqual(r.result,false); assert.strictEqual(r.sessionStorage.getItem('kelvara_handoff'),null);
 r=await run({connectReject:true}); assert.strictEqual(r.result,false); assert.strictEqual(r.sessionStorage.getItem('kelvara_handoff'),null);
 console.log('wallet handoff dynamic tests passed: delayed injection, delayed publicKey, mismatch, rejection');
})();
