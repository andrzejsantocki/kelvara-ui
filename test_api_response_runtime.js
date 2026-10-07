const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('app.js','utf8');
const node={textContent:'',classList:{toggle(){},add(){},remove(){}},setAttribute(){},addEventListener(){},closest(){return null}};
const calls=[];
const context={location:{hostname:'localhost',hash:''},document:{querySelector(){return node},querySelectorAll(){return []},addEventListener(){}},window:{addEventListener(){},scrollTo(){}},matchMedia:()=>({matches:false}),fetch:async(url,options)=>{calls.push([url,options]);return {ok:false,status:502,headers:{get:()=> 'text/html'},text:async()=>'<html><h1>502</h1></html>'}},Promise,console};
const code=source.replace(/^import[^\n]*\n/gm,'').replace(/\ninit\(\);\s*$/,'')+'\nthis.apiRequest=request;this.apiPost=post;this.apiProtectionRequest=protectionRequest;this.setProtectionToken=value=>protectionToken=value;';
vm.runInNewContext(code,context,{filename:'app.js'});
context.setProtectionToken('handoff-token');
(async()=>{
  await assert.rejects(()=>context.apiProtectionRequest('/api/protection/status'),error=>error.message==='HTTP 502');
  assert.strictEqual(calls[0][1].headers.authorization,'Bearer handoff-token');
  console.log('API response runtime passed');
})().catch(error=>{console.error(error);process.exitCode=1});
