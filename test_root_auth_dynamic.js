import assert from 'node:assert';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('<script data-wallet-module>'),end=html.indexOf('</script>',start)+9;
const module=html.slice(start,end).replace(/^<script[^>]*>|<\/script>$/g,'');
const MAIN='5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d', DEV='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG', key='11111111111111111111111111111111';
const GENESIS=MAIN;
function store(){const data=new Map();return{data,getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)}}
function el(){return{hidden:false,textContent:'',onclick:null,querySelectorAll:s=>s==='[data-network]'?[{dataset:{network:'mainnet-beta'},onclick:null},{dataset:{network:'devnet'},onclick:null}]:s==='[data-wallet]'?[{dataset:{wallet:'phantom'},onclick:null}]:[]}}
async function run({network='mainnet-beta',challenge={},session={},devnet=false}={}){
 const sessionStorage=store(),localStorage=store(),walletButton={dataset:{wallet:'phantom'},onclick:null},nodes=new Map(['wallet-selector','network-selector','network-selector-status','wallet-selector-message','wallet-chip','wallet-chip-address','wallet-disconnect','wallet-selector-close','realm-label'].map(id=>[id,el()]));
 nodes.get('wallet-selector').querySelectorAll=()=>[walletButton];
 nodes.get('network-selector').querySelectorAll=()=>[];
 sessionStorage.setItem('kelvara_network_context',network);const calls=[],events={};let signs=0,redirect;
 const provider={isConnected:true,publicKey:{toString:()=>key},connect:async()=>({publicKey:provider.publicKey}),signMessage:async()=>{signs++;return{signature:new Uint8Array([1,2,3])}},on(){},disconnect:async()=>{}};
 const response=(ok,json)=>({ok,json:async()=>json});
 const context={window:{phantom:{solana:provider}},sessionStorage,localStorage,location:{replace:u=>redirect=u},document:{querySelector:s=>nodes.get(s.slice(1))||{querySelectorAll:()=>[],addEventListener(){}},querySelectorAll:s=>s==='[data-network]'?[]:s==='[data-wallet]'?[walletButton]:[],addEventListener(){}},fetch:async(url,opts)=>{calls.push([url,opts]);if(url.endsWith('/challenge'))return response(true,{message:'challenge',network,genesisHash:MAIN});if(url.endsWith('/verify'))return response(true,{token:'token',network,genesisHash:MAIN});if(url.includes('/inspect/'))return response(true,{position:{}});throw Error('unexpected fetch')},TextEncoder,btoa:s=>Buffer.from(s,'binary').toString('base64'),console};
 if(devnet) sessionStorage.setItem('kelvara_network_context','devnet');
 if(challenge||session) { context.fetch=async(url,opts)=>{calls.push([url,opts]);if(url.endsWith('/challenge'))return response(true,challenge);if(url.endsWith('/verify'))return response(true,session);if(url.includes('/inspect/'))return response(true,{position:{}});throw Error('unexpected fetch')}}
 vm.runInNewContext(module,context);const wallet=nodes.get('wallet-selector').querySelectorAll?null:null;
 const button=context.document.querySelectorAll('[data-wallet]')[0];await button.onclick();await new Promise(r=>setImmediate(r));return{calls,signs,redirect,sessionStorage,localStorage};
}
(async()=>{
 let r=await run({challenge:{message:'challenge',network:'mainnet-beta',genesisHash:MAIN},session:{token:'token',network:'mainnet-beta',genesisHash:MAIN}});assert.strictEqual(r.signs,1);assert.strictEqual(r.calls[0][1].headers['x-kelvara-network'],'mainnet-beta');assert.deepStrictEqual(JSON.parse(r.calls[0][1].body),{wallet:key,network:'mainnet-beta'});assert.strictEqual(r.calls[1][1].headers['x-kelvara-network'],'mainnet-beta');assert.strictEqual(JSON.parse(r.sessionStorage.getItem('kelvara_handoff')).genesisHash,MAIN);
 for(const bad of [{message:'challenge',network:'devnet',genesisHash:MAIN},{message:'challenge',network:'mainnet-beta'},{message:'challenge',network:'mainnet-beta',genesisHash:'wrong'}]){r=await run({challenge:bad,session:{token:'token',network:'mainnet-beta',genesisHash:MAIN}});assert.strictEqual(r.signs,0);assert.strictEqual(r.calls.length,1);assert.strictEqual(r.sessionStorage.getItem('kelvara_handoff'),null)}
 for(const bad of [{token:'token',network:'devnet',genesisHash:MAIN},{token:'token',network:'mainnet-beta'},{token:'token',network:'mainnet-beta',genesisHash:'wrong'}]){r=await run({challenge:{message:'challenge',network:'mainnet-beta',genesisHash:MAIN},session:bad});assert.strictEqual(r.signs,1);assert.strictEqual(r.calls.length,2);assert.strictEqual(r.sessionStorage.getItem('kelvara_handoff'),null)}
 r=await run({devnet:true,challenge:{},session:{}});assert.strictEqual(r.signs,0);assert.strictEqual(r.calls.length,0);console.log('root auth dynamic binding passed');
})().catch(error=>{console.error(error);process.exitCode=1});
