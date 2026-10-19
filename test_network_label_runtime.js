const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('app.html','utf8');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
const nodes=Object.fromEntries(ids.map(id=>[id,{id,textContent:'',innerHTML:'',className:'',classList:{toggle(){},add(){},remove(){}},setAttribute(){},replaceChildren(){}}]));
const storage={data:new Map([['kelvara_network_context','mainnet-beta']]),getItem(k){return this.data.get(k)||null},setItem(k,v){this.data.set(k,String(v))},removeItem(k){this.data.delete(k)}};
const $=selector=>nodes[selector.slice(1)];
const ctx={document:{querySelector:$,querySelectorAll:()=>[]},window:{},sessionStorage:storage,localStorage:storage,console,$,short:v=>v?`${v.slice(0,4)}…${v.slice(-4)}`:'—',setText(selector,value){const node=$(selector);if(node)node.textContent=value},normalizeNetwork:v=>v==='mainnet-beta'||v==='devnet'?v:null,walletAddress:null,walletSource:null};
const start=source.indexOf('let walletState');
const end=source.indexOf('function clearNetworkScopedState',start);
vm.runInNewContext(`${source.slice(start,end)};this.setWalletState=setWalletState;this.renderNetworkLabel=renderNetworkLabel`,ctx);
ctx.renderNetworkLabel();
for(const state of ['disconnected','connecting','connected','error']){
  ctx.setWalletState(state);
  for(const id of ['network-context-label','workspace-network','account-network']) assert.strictEqual(nodes[id].textContent,'Mainnet',`${state} overwrote #${id}`);
}
ctx.walletAddress='So1flareEmptyWallet';ctx.walletSource='solflare';ctx.setWalletState('connected');
for(const id of ['network-context-label','workspace-network','account-network']) assert.strictEqual(nodes[id].textContent,'Mainnet',`Solflare handoff overwrote #${id}`);
console.log('network label runtime passed: boot, disconnected, connecting, connected, error, Solflare empty-wallet handoff');
