const assert=require('assert'),fs=require('fs'),vm=require('vm');
const src=fs.readFileSync('app.js','utf8');
const start=src.indexOf('function protectionPositionModel');
const end=src.indexOf('function primaryProtectionAction',start);
const context={overviewPositionData:()=>({name:'Vault',amount:'0.100098310199648980177053',symbol:'USDG',brand:'kamino'}),protectionStatus:null,selectedPortfolioTarget:null,evidence:null,protocolIconFor:()=>'',CURRENT_NETWORK:'mainnet-beta',networkLabel:()=> 'Mainnet',networkIconFor:()=>'',formatPortfolioAmount:v=>Number(v).toFixed(4)};
vm.runInNewContext(src.slice(start,end)+';this.model=protectionPositionModel',context);
const result=context.model({targetId:'vault',protocol:'kamino',network:'mainnet-beta'});
assert.strictEqual(result.tokenBalance,'0.1001');
console.log('protection portfolio quantity runtime passed');
