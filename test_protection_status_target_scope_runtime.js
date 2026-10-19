const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('app.js','utf8');
const initStart=source.indexOf('async function init()'),initEnd=source.indexOf('window.kelvaraRefreshWalletSession',initStart),initSource=source.slice(initStart,initEnd);
assert(initSource.includes('const inspection=await inspect()'),'startup must inspect canonical portfolio before protection status');
assert(initSource.includes('await loadProtection(inspection.portfolio)'),'startup must pass the discovered portfolio into protection status loading');
assert(initSource.indexOf('await inspect()')<initSource.indexOf('await loadProtection(inspection.portfolio)'),'portfolio inspection must precede protection status reads');
const connectStart=source.indexOf('async function connectWallet('),connectEnd=source.indexOf('async function viewAddress(',connectStart),connectSource=source.slice(connectStart,connectEnd);
assert(connectSource.includes('const inspection=await inspect()'),'manual wallet authorization must retain discovered portfolio');
assert(connectSource.includes('await loadProtection(inspection.portfolio)'),'manual wallet authorization must scope status reads to discovered targets');
assert(!source.includes('protectionRequest("/api/protection/status")'),'all protection status reads must include an exact targetId');
const modelStart=source.indexOf('function protectionPositionModel('),modelEnd=source.indexOf('function primaryProtectionAction(',modelStart),modelSource=source.slice(modelStart,modelEnd);
assert(modelSource.includes('protectionStatuses.get(position.targetId)'),'each protection row must use only its own target status');
assert(modelSource.includes('known=Boolean(status&&status.targetId===position.targetId)'),'missing target status must remain unknown');
const primaryStart=source.indexOf('function primaryProtectionAction('),primaryEnd=source.indexOf('function protectionStatusCopy(',primaryStart),primarySource=source.slice(primaryStart,primaryEnd);
assert(primarySource.includes("if(!position.protection.known)return'checking'"),'unknown target status must not offer enrollment');
const copyStart=source.indexOf('function protectionStatusCopy('),copyEnd=source.indexOf('function selectProtectionPosition(',copyStart),copySource=source.slice(copyStart,copyEnd);
assert(copySource.includes("if(!p.known)return{title:'Checking'"),'unknown target status must render Checking');
assert(source.includes("if(!['unsupported','checking'].includes(kind))"),'unknown target status must not render an action button');
const clearStart=source.indexOf('function clearLocalState('),clearEnd=source.indexOf('function endWalletSession(',clearStart),clearSource=source.slice(clearStart,clearEnd);
assert(clearSource.includes('protectionStatuses.clear()'),'session clear must remove every target status');
const start=source.indexOf('async function loadProtection('),end=source.indexOf('async function armProtection(',start);
assert(start>=0&&end>start,'loadProtection source missing');
const loadSource=source.slice(start,end);
assert(loadSource.indexOf('protectionStatuses.clear()')<loadSource.indexOf('Promise.all'),'refresh must clear stale statuses before requests start');
const calls=[],rendered=[];
const context={
  CURRENT_NETWORK:'mainnet-beta',sessionGeneration:1,selectedPortfolioTarget:null,protectionStatus:null,
  sessionContinuationCurrent:()=>true,setText(){},
  authenticateProtection:async()=>{},
  protectionRequest:async path=>{
    calls.push(path);
    const targetId=new URL(`https://kelvara.invalid${path}`).searchParams.get('targetId');
    return {targetId,armed:targetId==='target-a',armedCount:targetId==='target-a'?3:0};
  },
  renderProtection:status=>rendered.push(status),renderProtectionDashboard(){},markServiceState(){},
  protectionStatuses:new Map(),URL,URLSearchParams,encodeURIComponent,console
};
vm.runInNewContext(`${loadSource}\nthis.run=loadProtection;`,context,{filename:'app.js#loadProtection'});
(async()=>{
  const portfolio={positions:[{targetId:'target-a'},{targetId:'target-b'},{targetId:'target-a'}]};
  await context.run(portfolio);
  assert.deepStrictEqual(calls,[
    '/api/protection/status?targetId=target-a',
    '/api/protection/status?targetId=target-b'
  ],'each unique canonical target must receive one target-scoped status request');
  assert.strictEqual(context.protectionStatuses.get('target-a').armed,true);
  assert.strictEqual(context.protectionStatuses.get('target-b').armed,false);
  assert(rendered.some(status=>status.targetId==='target-a'),'selected status must render');
  console.log('protection target-scoped status runtime: passed');
})().catch(error=>{console.error(error);process.exitCode=1});
