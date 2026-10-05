const assert=require('assert'),fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('app.html','utf8'),src=fs.readFileSync('app.js','utf8');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
const els=Object.fromEntries(ids.map(id=>[id,{id,textContent:'',innerHTML:'',className:'',classList:{toggle(c,v){this[c]=v},add(c){this[c]=true},remove(c){this[c]=false}},setAttribute(){},onclick:null}]));
const q=s=>s.startsWith('#')?els[s.slice(1)]:null; const all=()=>[];
const ctx={document:{querySelector:q,querySelectorAll:all},window:{},Intl,Date,console,$:q,short:v=>v?`${v.slice(0,4)}…${v.slice(-4)}`:'—',format:String,setInterval:()=>1,clearInterval(){},walletAddress:null,walletSource:null,walletState:'disconnected',updateWalletAvatar(){}};
const authority=src.slice(src.indexOf('function renderAuthority'),src.indexOf('async function inspect'))+';this.renderAuthority=renderAuthority';
vm.runInNewContext(authority,ctx);
const data={observedAt:'2026-01-01T00:00:00Z',authority:{status:'ok',current:'C',expected:'E',program:'P',programData:'PD',meaning:'Meaning'}};
ctx.renderAuthority(data); assert.equal(els['authority-badge'].textContent,'MATCHED'); assert.equal(els['authority-badge'].className,'status-pill ok'); assert.equal(els.authority.textContent,'C'); assert.equal(els.expected.textContent,'E');
for(const [status,label,klass] of [['breach','CHANGED','status-pill breach'],['pending','UNKNOWN','status-pill neutral']]){ctx.renderAuthority({...data,authority:{...data.authority,status}});assert.equal(els['authority-badge'].textContent,label);assert.equal(els['authority-badge'].className,klass)}
const wallet=src.slice(src.indexOf('let walletState'),src.indexOf('function rememberWallet'))+';this.setWalletState=setWalletState;this.updateWalletControl=updateWalletControl';
vm.runInNewContext(wallet,ctx); ctx.setWalletState('connecting');assert.equal(els['chip-address'].textContent,'Connecting…');assert.equal(els['workspace-network'].textContent,'Connecting…');ctx.setWalletState('error');assert.equal(els['health'].innerHTML.includes('Connection failed'),true);ctx.walletAddress='Abcd1234';ctx.walletSource='phantom';ctx.updateWalletControl();assert.equal(els['chip-address'].textContent,'Abcd…1234');assert.equal(els['workspace-wallet'].textContent,'Abcd…1234');assert.equal(els['account-address'].textContent,'Abcd1234');
assert.equal(new Set(ids).size,ids.length);console.log('safeguards wallet runtime passed');
