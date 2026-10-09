const assert=require('assert'),fs=require('fs'),vm=require('vm');
const app=fs.readFileSync('app.js','utf8');
const source=app.replace(/^import[^\n]*\n/gm,'').replace(/\ninit\(\);\s*$/,'')+'\nthis.test={renderGovernance};';
function node(tag='div'){const n={tagName:tag,textContent:'',innerHTML:'',children:[],dataset:{},className:'',classList:{add(){},remove(){},toggle(){}},appendChild(c){n.children.push(c);return c},append(...c){c.forEach(n.appendChild)},replaceChildren(...c){n.children=[];n.append(...c)},setAttribute(k,v){n[k]=v},addEventListener(){}};return n}
const nodes=new Map();const document={querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)},querySelectorAll(){return[]},createElement:t=>node(t),addEventListener(){}};
const context={document,window:{addEventListener(){},scrollTo(){}},location:{hostname:'localhost',hash:''},sessionStorage:{getItem(){return 'mainnet-beta'}},localStorage:{},normalizeNetwork:v=>v,animalIdenticonSvg:()=>'',Intl,Date,fetch:async()=>({}),setInterval(){return 1},clearInterval(){},setTimeout,clearTimeout,matchMedia:()=>({matches:false}),console};
vm.runInNewContext(source,context);
const A='11111111111111111111111111111111';
const action={id:'active-1',status:'active',decodedIntent:{summary:'Transfer 1 USDG',kind:'transfer'},approvalProgress:{approved:1,rejected:0,threshold:2},userStatus:'approval_required',proposer:A,createdSlot:100,finalizedSlot:null,sourceSignature:'',instructions:[{index:0,programId:A,accounts:[A],intent:'unresolved raw instruction',decoder:'unknown',unresolved:true}],provenance:{decoderFamily:'unknown',decoderVersion:'0',artifactHash:''},unresolvedInstructionCount:1};
const executed={...action,id:'executed-1',status:'executed',decodedIntent:{summary:'Threshold changed',kind:'config'},finalizedSlot:101,sourceSignature:A,unresolvedInstructionCount:0};
const fixture={schemaVersion:'observation-hub-governance/v1',network:'mainnet-beta',freshness:{state:'fresh',observedAt:'2026-10-09T10:00:00.000Z',finalizedSlot:123},wallets:[{address:A,vaults:[{identity:{provider:'squads',generation:'v4',multisigAddress:A,vaultIndex:0,vaultAddress:A},display:{name:'Canonical vault'},membership:{role:'member',permissions:['vote'],threshold:2,memberCount:3},requiresAttention:[action],currentActions:[action],recentChanges:[executed],nextHistoryCursor:null}]}],warnings:[]};
function text(n){return `${n.textContent||''}${(n.children||[]).map(text).join('')}`}
context.test.renderGovernance(fixture);const rendered=text(nodes.get('#governance-content'));
assert(rendered.includes('Canonical vault'),'production entrypoint renders canonical vault');
assert(rendered.includes('Threshold: 2 of 3'),'members and threshold rendered');
assert(rendered.includes('Transfer 1 USDG'),'active action rendered');
assert(rendered.includes('Unresolved instruction: intent not fully decoded.'),'unresolved instruction state rendered');
assert(rendered.includes('programId'),'raw instruction evidence rendered');
assert(rendered.includes('Threshold changed'),'latest terminal change rendered');
assert(rendered.includes('Status: executed'),'terminal status rendered');
assert(rendered.includes('Finalized slot: 100'),'nullable finalized slot falls back to created slot safely');
assert(rendered.includes('Signature: Unknown'),'empty source signature is safe');
assert(!rendered.includes('undefined')&&!rendered.includes('null'),'nullable fields never leak as strings');
console.log('canonical governance acceptance red');
