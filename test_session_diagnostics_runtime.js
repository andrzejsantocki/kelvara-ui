const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('app.js','utf8'),html=fs.readFileSync('app.html','utf8'),landing=fs.readFileSync('index.html','utf8');
assert(/<script type="module" src="\/app\.js\?v=protection-eligibility-20261010"><\/script>/.test(html),'published module cache-buster URL');
assert(!/<script type="module" src="\/app\.js"><\/script>/.test(html),'stale module URL absent');
assert(landing.includes("location.replace('/app.html?v=session-fix-b933378')"),'landing cache-buster URL');
assert(!landing.includes("location.replace('/app.html?v=workspace-cleanup')"),'stale landing URL absent');
const key='DiagWalletFixture11111111111111111111111111111111',token='DiagBearerTokenFixture',genesis='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG',evidence={position:{name:'Diag Evidence Marker'},authority:{status:'Diag Authority Marker'},nonce:'DiagNonceMarker',signature:'DiagSignatureMarker'};
function store(initial,options={}){return{data:new Map(Object.entries(initial||{})),getItem(k){if(k===options.readFailureKey||options.readFailureKeys?.includes(k))throw Object.assign(new Error('storage read secret marker'),{name:'Error'});return this.data.has(k)?this.data.get(k):null},setItem(k,v){this.data.set(k,String(v));if(options.onSet)options.onSet(k,v)},removeItem(k){if(k===options.removeFailureKey&&options.removeFailures-- > 0)throw Object.assign(new Error('storage cleanup secret marker'),{name:'Error'});this.data.delete(k)}}}
function node(){return{classList:{add(){},remove(){},toggle(){}},style:{setProperty(){}},dataset:{},value:'',checked:false,disabled:false,textContent:'',innerHTML:'',onclick:null,onchange:null,onkeydown:null,addEventListener(){},setAttribute(){},replaceChildren(){},closest(){return this},getBoundingClientRect(){return{left:0,top:0,width:1,height:1}}}}
function run(session,provider){
  const logs=[],sessionStorage=session,nodes=new Map();
  const consoleCapture={log(...args){logs.push(args)},error(...args){logs.push(args)},warn(...args){logs.push(args)}};
  const document={body:node(),querySelector(){return node()},querySelectorAll(){return[]},createElement:node,addEventListener(){}};
  const redirects=[];
  const location={hostname:'localhost',hash:'',replace(url){redirects.push(url)}};
  const context={normalizeNetwork(value){return value==='mainnet-beta'||value==='devnet'?value:null},document,window:{addEventListener(){},scrollTo(){},location,solflare:provider},location,localStorage:store(),sessionStorage,fetch:async()=>({ok:true,text:async()=>JSON.stringify({})}),setTimeout,clearTimeout,setInterval:()=>1,clearInterval,Promise,URLSearchParams,Intl,DOMParser:class{},TextEncoder,atob:()=>'',btoa:()=>'',matchMedia:()=>({matches:false}),console:consoleCapture,animalIdenticonSvg:()=>''};
  const code=source.replace(/^import[^\n]*\n/gm,'').replace(/\ninit\(\);\s*$/,'')+'\nthis.consumeHandoff=consumeHandoff;this.restoreAppSession=restoreAppSession;this.init=init;this.sessionDiag=sessionDiag;this.sessionDiagAttempt=sessionDiagAttempt;';
  vm.runInNewContext(code,context,{filename:'app.js'});
  return{context,logs,redirects,sessionStorage};
}
function records(result){return result.logs.filter(args=>args[0]==='[Kelvara session]').map(args=>args[1]);}
function assertSafeSchema(items){
  const keys=['connected','errorClass','network','ok','provider','publicKeyPresent','reason','reconnect','stage','version','walletMatch'];
  const networks=[null,'mainnet-beta','devnet'],providers=[null,'phantom','solflare','backpack'],reconnects=[null,'not-attempted','attempted','completed','failed'];
  assert(items.length>0,'diagnostic records emitted');
  for(const item of items){
    assert.deepStrictEqual(Object.keys(item).sort(),keys,'fixed diagnostic schema');
    assert.strictEqual(item.version,'session-diag-2');
    assert(networks.includes(item.network),'closed network enum');
    assert(providers.includes(item.provider),'closed provider enum');
    assert.strictEqual(typeof item.ok,'boolean');
    for(const field of ['connected','publicKeyPresent','walletMatch'])assert(item[field]===null||typeof item[field]==='boolean',`${field} boolean or null`);
    assert(reconnects.includes(item.reconnect),'closed reconnect enum');
    assert.strictEqual(typeof item.stage,'string');
    assert.strictEqual(typeof item.reason,'string');
    assert(item.errorClass===null||['Error','TypeError','SyntaxError','ReferenceError','RangeError','DOMException','unknown'].includes(item.errorClass),'closed error class');
  }
}
(async()=>{
  const success=run(store({kelvara_handoff:JSON.stringify({wallet:key,source:'solflare',token,network:'devnet',genesisHash:genesis,evidence})}),{isConnected:true,publicKey:{toString:()=>key},connect:async()=>{throw new Error('must not reconnect')}});
  assert.strictEqual(await success.context.consumeHandoff(),true,'connected Solflare handoff succeeds');
  const successRecords=records(success);assertSafeSchema(successRecords);
  for(const stage of ['handoff_load','handoff_parse','handoff_schema','network_genesis_validation','provider_wait','provider_detection','provider_kind','connected_state','public_key_state','wallet_match','trusted_reconnect','app_session_save','consume_final'])assert(successRecords.some(item=>item.stage===stage),`success stage ${stage}`);
  assert(successRecords.some(item=>item.stage==='provider_kind'&&item.provider==='solflare'),'Solflare provider kind');
  assert(successRecords.some(item=>item.stage==='connected_state'&&item.connected===true),'connected boolean');
  assert(successRecords.some(item=>item.stage==='public_key_state'&&item.publicKeyPresent===true),'public key presence');
  assert(successRecords.some(item=>item.stage==='wallet_match'&&item.walletMatch===true),'exact wallet match');
  assert(successRecords.some(item=>item.stage==='trusted_reconnect'&&item.reconnect==='not-attempted'),'trusted reconnect skipped for current provider');
  const cleanupOptions={removeFailureKey:'kelvara_handoff',removeFailures:1,readFailureKeys:[],onSet(key){}};
  const cleanupProvider={isConnected:true,publicKey:{toString:()=>key},connect:async()=>{throw new Error('must not reconnect')}};
  const cleanupFailure=run(store({kelvara_handoff:JSON.stringify({wallet:key,source:'solflare',token,network:'devnet',genesisHash:genesis,evidence})},cleanupOptions),cleanupProvider);
  assert.strictEqual(await cleanupFailure.context.consumeHandoff(),false,'handoff cleanup failure rejects after session save');
  assert(cleanupFailure.sessionStorage.getItem('kelvara_app_session'),'session save completed before cleanup failure');
  cleanupProvider.isConnected=false;cleanupProvider.publicKey=null;
  await cleanupFailure.context.init();
  assert.deepStrictEqual(cleanupFailure.redirects,['/?wallet_error=session'],'cleanup failure redirects fail-closed');
  const cleanupRecords=records(cleanupFailure);assertSafeSchema(cleanupRecords);assert(cleanupRecords.some(item=>item.stage==='handoff_cleanup'&&item.ok===false),'cleanup failure diagnostic stage');assert(cleanupRecords.filter(item=>item.stage==='handoff_cleanup').length<=2,'cleanup diagnostics bounded');
  const cleanupSerialized=JSON.stringify(cleanupFailure.logs);for(const secret of ['storage cleanup secret marker',key,token,genesis,'Diag Evidence Marker'])assert(!cleanupSerialized.includes(secret),`cleanup diagnostics omit ${secret}`);
  const malformed=run(store({kelvara_handoff:'{malformed Diag Evidence Marker'}),null);
  assert.strictEqual(await malformed.context.consumeHandoff(),false,'malformed handoff rejected');
  assert(records(malformed).some(item=>item.stage==='handoff_parse'&&item.ok===false),'malformed parse stage');
  const rejected=run(store({kelvara_handoff:JSON.stringify({wallet:key,source:'solflare',token,network:'devnet',genesisHash:genesis,evidence})}),{isConnected:false,publicKey:null,connect:async()=>{throw new TypeError('Diag reconnect exception')}});
  assert.strictEqual(await rejected.context.consumeHandoff(),false,'trusted reconnect failure rejected');
  const rejectedRecords=records(rejected);assert(rejectedRecords.some(item=>item.stage==='trusted_reconnect'&&item.reconnect==='failed'),'reconnect failure stage');
  assert(rejectedRecords.some(item=>item.stage==='consume_final'&&item.ok===false),'consume final failure stage');
  assertSafeSchema(successRecords.concat(records(malformed),rejectedRecords));
  const restored=run(store({kelvara_app_session:JSON.stringify({wallet:key,source:'solflare',token,network:'devnet',genesisHash:genesis})}),{isConnected:false,publicKey:null,connect:async()=>{throw new Error('Diag restore exception')}});
  assert.strictEqual(await restored.context.restoreAppSession(),false,'restore reconnect failure rejected');
  const restoredRecords=records(restored);assert(restoredRecords.some(item=>item.stage==='restore_load'&&item.reason==='loaded'),'restore load stage');assert(restoredRecords.some(item=>item.stage==='restore_parse'&&item.ok===true),'restore parse stage');assert(restoredRecords.some(item=>item.stage==='restore_validation'&&item.ok===true),'restore validation stage');assert(restoredRecords.some(item=>item.stage==='restore_final'&&item.ok===false),'restore final failure stage');
  const failedInit=run(store({kelvara_handoff:JSON.stringify({wallet:key,source:'solflare',token,network:'devnet',genesisHash:genesis,evidence})}),{isConnected:false,publicKey:null,connect:async()=>{throw new Error('Diag init reconnect exception')}});await failedInit.context.init();assert.deepStrictEqual(failedInit.redirects,['/?wallet_error=session'],'failed handoff+restore redirects');assert(records(failedInit).some(item=>item.stage==='redirect'&&item.reason==='redirect-session'),'session redirect reason');
  const noNetwork=run(store({kelvara_network_context:'invalid'}),null);await noNetwork.context.init();assert.deepStrictEqual(noNetwork.redirects,['/?wallet_error=session'],'missing network redirects');assert(records(noNetwork).some(item=>item.stage==='redirect'&&item.reason==='redirect-network'),'network redirect reason');
  assertSafeSchema(successRecords.concat(records(malformed),rejectedRecords,restoredRecords,records(failedInit),records(noNetwork)));
  const serialized=JSON.stringify(success.logs.concat(malformed.logs,rejected.logs,restored.logs,failedInit.logs,noNetwork.logs));
  for(const secret of [key,token,genesis,'Diag Evidence Marker','DiagNonceMarker','DiagSignatureMarker'])assert(!serialized.includes(secret),`secret-safe logs omit ${secret}`);
  const adversarial=run(store({}),null),adversarialAttempt=adversarial.context.sessionDiagAttempt('DiagNetworkMarker');adversarial.context.sessionDiag(adversarialAttempt,{stage:'DiagStageMarker',reason:'DiagReasonMarker',network:'DiagNetworkMarker',provider:'DiagProviderMarker',reconnect:'DiagReconnectMarker',connected:'DiagConnectedMarker',publicKeyPresent:'DiagPublicKeyMarker',walletMatch:'DiagWalletMatchMarker',errorClass:'DiagErrorMarker',ok:'DiagOkMarker'});const adversarialRecord=records(adversarial).at(-1);assert.strictEqual(adversarialRecord.stage,'unknown');assert.strictEqual(adversarialRecord.reason,'invalid');assert.strictEqual(adversarialRecord.network,null);assert.strictEqual(adversarialRecord.provider,null);assert.strictEqual(adversarialRecord.reconnect,null);assert.strictEqual(adversarialRecord.connected,null);assert.strictEqual(adversarialRecord.publicKeyPresent,null);assert.strictEqual(adversarialRecord.walletMatch,null);assert.strictEqual(adversarialRecord.errorClass,null);assert(!JSON.stringify(adversarialRecord).includes('Diag'));
  assert(successRecords.length<=30&&records(malformed).length<=30&&rejectedRecords.length<=30,'bounded event count');
  console.log('session diagnostics runtime passed: schema, success, malformed, reconnect failure, secret safety, cap');
})().catch(error=>{console.error(error);process.exitCode=1});
