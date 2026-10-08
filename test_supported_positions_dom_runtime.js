const assert=require('assert'),fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('index.html','utf8'),script=html.match(/<script data-positions-module>([\s\S]*?)<\/script>/)[1];
function node(tag='div'){return {tagName:tag.toUpperCase(),textContent:'',hidden:false,dataset:{},value:'',children:[],attributes:{},appendChild(n){this.children.push(n);return n},replaceChildren(...n){this.children=n},setAttribute(k,v){this.attributes[k]=v},addEventListener(k,f){this['on'+k]=f}}}
const address='B5pjfZAiKjyUEuqB2694NHrsjcaM67uuJaWqjzTVtzR6',mint='EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',shareMint='2bnxGUrAevL2i9zYtJWwPnAE2RmiPpRxjYnwv886DGCC';
const base={targetId:`solana:mainnet-beta:kamino:vault:${address}`,chain:'solana',network:'mainnet-beta',protocolId:'kamino',resourceType:'vault',address,displayName:'Alpha',token:{mint,symbol:'USDG'},shareMint,metricsAdapter:{id:'m',version:1},monitoring:{state:'ready',activeRuleCount:2},tvl:{state:'current',value:'12',currency:'USD',observedAt:'2026-01-01T00:00:00.000Z',source:'x'}};
function harness(fetchImpl,selected='mainnet-beta'){const ids={};['asset-list','no-results','asset-search','type-filter','protocol-filter','vault-count','vault-protocol-summary','catalog-status'].forEach(id=>ids[id]=node());let events={};const ctx={window:{addEventListener:(k,f)=>events[k]=f},document:{querySelector:s=>ids[s.slice(1)],createElement:t=>node(t),addEventListener(){}},sessionStorage:{getItem:()=>selected},fetch:fetchImpl,console};vm.runInNewContext(script,ctx);return {ids,events,validate:ctx.window.KelvaraPositions.validateCatalog}}
(async()=>{
 let h=harness(async()=>({ok:true,json:async()=>({network:'mainnet-beta',positions:[base]})}));await new Promise(setImmediate);assert.equal(h.ids['vault-count'].textContent,'1');
 for(const state of ['unknown','unavailable','stale','current']){const p={...base,tvl:{...base.tvl,state,value:state==='unknown'||state==='unavailable'?null:'9',observedAt:state==='unknown'||state==='unavailable'?null:base.tvl.observedAt}};h=harness(async()=>({ok:true,json:async()=>({network:'mainnet-beta',positions:[p]})}));await new Promise(setImmediate);assert(h.ids['asset-list'].children[0].children.some(x=>x.textContent.includes(state==='current'?'9':state==='unknown'?'TVL unknown':state==='unavailable'?'TVL unavailable':'TVL stale')))}
 for(const p of [
  {...base,monitoring:{...base.monitoring,activeRuleCount:0}},
  {...base,tvl:{...base.tvl,state:'unknown',value:'9',observedAt:null}},
  {...base,tvl:{...base.tvl,state:'current',value:null}},
  {...base,tvl:{...base.tvl,state:'current',value:'9',observedAt:'2026-01-01'}},
  {...base,targetId:'wrong'},
  {...base,address:'bad'},
  {...base,token:{...base.token,mint:'bad'}},
  {...base,shareMint:'bad'},
 ]) { assert.throws(()=>h.validate({network:'mainnet-beta',positions:[p]},'mainnet-beta'),/Supported positions unavailable/); }
 h=harness(async()=>({ok:true,json:async()=>({network:'mainnet-beta',positions:[base,{...base,displayName:'Duplicate'}]})}));await new Promise(setImmediate);assert.equal(h.ids['vault-count'].textContent,'0');
 h=harness(async()=>({ok:true,json:async()=>({network:'mainnet-beta',positions:[{...base,metricsAdapter:{id:'m',version:'1'}}]})}));await new Promise(setImmediate);assert.equal(h.ids['vault-count'].textContent,'0');
 h=harness(async()=>({ok:true,json:async()=>({network:'mainnet-beta',positions:Array.from({length:101},()=>base)})}));await new Promise(setImmediate);assert.equal(h.ids['vault-count'].textContent,'0');
 let mainResolve,devResolve;h=harness(url=>url.endsWith('mainnet-beta')?new Promise(r=>mainResolve=r):new Promise(r=>devResolve=r));await new Promise(setImmediate);h.events['kelvara-network-selected']({detail:'devnet'});devResolve({ok:true,json:async()=>({network:'devnet',positions:[]})});await new Promise(setImmediate);mainResolve({ok:true,json:async()=>({network:'mainnet-beta',positions:[base]})});await new Promise(setImmediate);assert.equal(h.ids['vault-count'].textContent,'0');assert(h.ids['catalog-status'].textContent.includes('No supported'));
 console.log('supported positions DOM/runtime passed')})();
