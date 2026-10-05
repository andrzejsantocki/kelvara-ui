const assert=require('assert'),fs=require('fs'),html=fs.readFileSync('app.html','utf8'),js=fs.readFileSync('app.js','utf8');
const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
const counts=ids.reduce((m,id)=>(m[id]=(m[id]||0)+1,m),{});
assert.deepStrictEqual(Object.entries(counts).filter(([,n])=>n>1),[],'duplicate DOM IDs');
for(const id of ['prepare-evacuation','evacuation-modal','evacuation-shares','evacuation-output','evacuation-destination','evacuation-token-account','evacuation-fee','priority-fee','evacuation-simulation','simulate-evacuation','sign-evacuation','evacuation-close'])assert(ids.includes(id),`missing #${id}`);
for(const name of ['toggleEvacuation','openEvacuation','simulateEvacuation','signEvacuation'])assert(js.includes(`function ${name}`),`${name} missing`);
assert(js.includes('evacuationDraft=null;$("#sign-evacuation").disabled=true'),'close resets sign');
assert(js.includes('evacuationDraft=await post("/api/evacuation/prepare"'),'simulation uses prepare');
assert(js.includes('disabled=!evacuationDraft.simulation.ok'),'failed simulation blocks sign');
assert(js.includes('Run simulation again'),'priority fee invalidates simulation');
assert(js.includes('post("/api/evacuation/submit"'),'submit endpoint present');
class E{constructor(){this.hidden=true;this.disabled=false;this.textContent='';this.classList={toggle:(c,v)=>{if(c==='hidden')this.hidden=v}}}}
const el={}; for(const id of ['evacuation-modal','sign-evacuation','evacuation-shares','evacuation-output','evacuation-destination','evacuation-token-account','evacuation-fee','evacuation-simulation','evacuation-message'])el[id]=new E();
el['sign-evacuation'].disabled=true;
const $=s=>el[s.slice(1)]; let evacuationDraft=null; function toggle(show){$('#evacuation-modal').classList.toggle('hidden',!show);if(!show){evacuationDraft=null;$('#sign-evacuation').disabled=true}}
function open(evidence,wallet){$('#evacuation-shares').textContent=String(evidence.position.totalShares);$('#evacuation-output').textContent=`About ${evidence.position.underlyingAmount} USDG`;$('#evacuation-destination').textContent=wallet;$('#evacuation-token-account').textContent='Prepared after simulation';$('#evacuation-fee').textContent='Prepared after simulation';$('#evacuation-simulation').textContent='Not run';$('#evacuation-message').textContent='';toggle(true)}
open({position:{totalShares:42,underlyingAmount:10.5}},'Wallet111');assert.strictEqual($('#evacuation-modal').hidden,false);assert.strictEqual($('#evacuation-shares').textContent,'42');assert.strictEqual($('#evacuation-output').textContent,'About 10.5 USDG');assert.strictEqual($('#evacuation-destination').textContent,'Wallet111');assert.strictEqual($('#sign-evacuation').disabled,true);evacuationDraft={simulation:{ok:true}};$('#sign-evacuation').disabled=false;toggle(false);assert.strictEqual($('#evacuation-modal').hidden,true);assert.strictEqual($('#sign-evacuation').disabled,true);assert.strictEqual(evacuationDraft,null);
console.log('protection runtime contract: passed');
