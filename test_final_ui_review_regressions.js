const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('app.html','utf8');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
const nodes=Object.fromEntries(ids.map(id=>[id,{id,textContent:'',innerHTML:'',className:'',classList:{toggle(){},add(){},remove(){}},setAttribute(){},replaceChildren(){}}]));
const storage={data:new Map([['kelvara_network_context','devnet']]),getItem(k){return this.data.get(k)||null},setItem(k,v){this.data.set(k,String(v))},removeItem(k){this.data.delete(k)}};
const $=selector=>nodes[selector.slice(1)];
const wallet={isConnected:true,publicKey:{toString:()=> 'So1flareEmptyWallet'}};
const walletContext={document:{querySelector:$,querySelectorAll:()=>[]},window:{},sessionStorage:storage,localStorage:storage,console,$,short:v=>v?`${v.slice(0,4)}…${v.slice(-4)}`:'—',setText(selector,value){const node=$(selector);if(node)node.textContent=value},normalizeNetwork:v=>v==='mainnet-beta'||v==='devnet'?v:null,walletAddress:'So1flareEmptyWallet',walletSource:'solflare'};
const start=source.indexOf('let walletState');
const end=source.indexOf('function clearNetworkScopedState',start);
vm.runInNewContext(`${source.slice(start,end)};this.setWalletState=setWalletState`,walletContext);
walletContext.setWalletState('connected');
assert.strictEqual(nodes['account-session'].textContent,'Authenticated session on Devnet (read-only).');

assert.match(source,/CURRENT_NETWORK==='mainnet-beta'\?'Mainnet live':'Devnet available \(read-only\)'/);
console.log('final UI review regressions passed');
