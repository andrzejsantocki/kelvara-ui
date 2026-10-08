const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('async function waitForWalletProvider');
const end=source.indexOf('\nasync function init',start);
const consume=source.slice(start,end).replace(/^async function consumeHandoff/, 'async function consumeHandoff');
const key='11111111111111111111111111111111', evidence={position:{name:'Kamino USDG',protocol:'Kamino',underlyingAmount:123.45,totalShares:99,stakedShares:60,unstakedShares:39},authority:{status:'ok'}};
const html=fs.readFileSync('app.html','utf8'); for(const id of ['chip-address','wallet-state','wallet-full-address','wallet-connect-action','wallet-disconnect-action','workspace-wallet','overview-position','position-card','position-name','amount']) assert(html.includes(`id="${id}"`),`current app.html missing #${id}`);
const store=initial=>({data:new Map(Object.entries(initial||{})),getItem(k){return this.data.get(k)||null},setItem(k,v){this.data.set(k,String(v))},removeItem(k){this.data.delete(k)}});
function dom(){const nodes={main:{classList:{remove(){}}}}; for(const id of ['chip-address','wallet-state','wallet-full-address','wallet-connect-action','wallet-clear-action','wallet-disconnect-action','wallet-avatar'])nodes[id]={textContent:'',classList:{remove(){},toggle(c,v){this.hidden=v}},setAttribute(){}}; return {querySelector(s){return nodes[s[0]==='#'?s.slice(1):s]},nodes}}
async function run({providerAt=0,publicAt=0,connectReject=false,mismatch=false}={}){
  const handoff={wallet:key,source:'phantom',token:'handoff-token',network:'mainnet-beta',genesisHash:'5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',evidence}; const sessionStorage=store({kelvara_handoff:JSON.stringify(handoff)}); let provider=null,rendered=false,ui=dom();
  const context={sessionStorage,validNetworkRecord(record){return record?.network==='mainnet-beta'},window:{},animalIdenticonSvg(){return ''},walletAddress:null,walletSource:null,activeProvider:null,protectionToken:null,evidence:null, walletProvider(){return provider}, waitForWalletProvider:async()=>provider, withTimeout(p){return p}, saveAppSession(address,source,token){sessionStorage.setItem('kelvara_app_session',JSON.stringify({wallet:address,source,token,network:'mainnet-beta',genesisHash:'5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d'}))}, rememberWallet(){context.updateWalletControl()}, bindWalletEvents(){},renderPosition(){rendered=true},renderAuthority(){},updateWalletControl(){context.uiUpdated=true;ui.nodes['chip-address'].textContent=`${handoff.wallet.slice(0,4)}…${handoff.wallet.slice(-4)}`;ui.nodes['wallet-state'].textContent='Phantom connected';ui.nodes['wallet-full-address'].textContent=handoff.wallet;ui.nodes['wallet-connect-action'].hidden=true;ui.nodes['wallet-disconnect-action'].hidden=false},document:ui,setTimeout,Promise,uiUpdated:false};
  const install=()=>{provider={isConnected:true,publicKey:publicAt?null:{toString:()=>mismatch?'bad':key},connect:async()=>{if(connectReject)throw Error('rejected');await new Promise(r=>setTimeout(r,publicAt));provider.publicKey={toString:()=>mismatch?'bad':key};return {publicKey:provider.publicKey}}}}; if(providerAt) setTimeout(install,providerAt); else install();
  vm.runInNewContext(`${consume}; this.consumeHandoff=consumeHandoff`,context); await new Promise(r=>setTimeout(r,Math.max(5,providerAt+5))); const promise=context.consumeHandoff();
  const result=await promise; return {result,sessionStorage,rendered,context,ui};
}
(async()=>{
 let r=await run(); assert.strictEqual(r.result,true); assert(r.rendered); assert(r.context.uiUpdated); assert.strictEqual(r.ui.nodes['chip-address'].textContent,'1111…1111'); assert.strictEqual(r.ui.nodes['wallet-state'].textContent,'Phantom connected'); assert.strictEqual(r.ui.nodes['wallet-full-address'].textContent,key); assert.strictEqual(r.ui.nodes['wallet-connect-action'].hidden,true); assert.strictEqual(r.ui.nodes['wallet-disconnect-action'].hidden,false); assert.strictEqual(evidence.position.name,'Kamino USDG'); assert.strictEqual(evidence.position.underlyingAmount,123.45);
 r=await run({providerAt:120}); assert.strictEqual(r.result,true); assert.strictEqual(r.sessionStorage.getItem('kelvara_handoff'),null);
 r=await run({publicAt:120}); assert.strictEqual(r.result,true);
 r=await run({mismatch:true}); assert.strictEqual(r.result,false); assert.strictEqual(r.sessionStorage.getItem('kelvara_handoff'),null);
 r=await run({connectReject:true}); assert.strictEqual(r.result,false); assert.strictEqual(r.sessionStorage.getItem('kelvara_handoff'),null);
 console.log('wallet handoff dynamic tests passed: connected header, delayed injection, delayed publicKey, mismatch, rejection');
})();
