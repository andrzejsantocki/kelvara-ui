import json, time, urllib.request, base64, pathlib
import websocket

def req(url): return json.load(urllib.request.urlopen(url))
new_req=urllib.request.Request('http://127.0.0.1:9223/json/new?about:blank',method='PUT')
wsurl=json.load(urllib.request.urlopen(new_req))['webSocketDebuggerUrl']
ws=websocket.create_connection(wsurl); seq=0
def cdp(method,params=None):
 global seq
 seq+=1; ws.send(json.dumps({'id':seq,'method':method,'params':params or {}}))
 while True:
  m=json.loads(ws.recv())
  if m.get('id')==seq:return m
fixture={"schemaVersion":"customer-governance/v1","network":"mainnet-beta","freshness":{"state":"fresh","observedAt":"2026-10-09T10:00:00Z","finalizedSlot":123},"wallets":[{"address":"Wallet-<unsafe>-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","vaults":[{"identity":{"provider":"squads","generation":"v4","multisigAddress":"Vault-IDENTIFIER-1234567890-ABCDEFGHIJKLMNOP","vaultIndex":0,"vaultAddress":"Vault-IDENTIFIER-1234567890-ABCDEFGHIJKLMNOP"},"display":{"name":"Canonical vault"},"membership":{"role":"member","permissions":["vote"],"threshold":2,"memberCount":3},"requiresAttention":[{"id":"active-1","status":"active","decodedIntent":{"summary":"Transfer 1 USDG"},"approvalProgress":{"approved":1,"threshold":2},"userStatus":"approval_required","proposer":"Prop-IDENTIFIER-1234567890-ABCDEFGHIJKLMNOP","createdSlot":100,"finalizedSlot":None,"sourceSignature":"","instructions":[{"index":0,"programId":"Prog-UNKNOWN-1234567890-ABCDEFGHIJKLMNOP","accounts":["Acct-UNKNOWN-1234567890-ABCDEFGHIJKLMNOP"],"intent":{"kind":"transfer","summary":"unresolved raw instruction"},"unresolved":True}],"provenance":{"decoderFamily":"unknown","decoderVersion":"0","artifactHash":""},"unresolvedInstructionCount":1}],"currentActions":[],"recentChanges":[{"id":f"executed-{i}","status":"executed","decodedIntent":{"summary":f"Executed change {i}"},"proposer":"Prop","approvalProgress":{"approved":2,"threshold":2},"userStatus":"approved","createdSlot":200+i,"finalizedSlot":201+i,"sourceSignature":"Sig-123"} for i in range(12)],"nextHistoryCursor":"cursor-page-2"}]}],"warnings":[]}
page2={"schemaVersion":"customer-governance/v1","network":"mainnet-beta","freshness":{"state":"fresh","observedAt":"2026-10-09T10:01:00Z","finalizedSlot":124},"wallets":[{"address":fixture['wallets'][0]['address'],"vaults":[{"identity":fixture['wallets'][0]['vaults'][0]['identity'],"display":{"name":"Canonical vault"},"membership":fixture['wallets'][0]['vaults'][0]['membership'],"requiresAttention":[],"currentActions":[],"recentChanges":[{"id":"older-13","status":"executed","decodedIntent":{"summary":"Older executed change"},"createdSlot":180}],"nextHistoryCursor":None}]}],"warnings":[]}
source="""(() => {const fixture=%s,page2=%s,wallet='Wallet-<unsafe>-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',token='controlled-proof-token'; try{history.replaceState({},'',location.pathname)}catch{}; location.replace=()=>{}; sessionStorage.setItem('kelvara_network_context','mainnet-beta');sessionStorage.setItem('kelvara_app_session',JSON.stringify({wallet,source:'phantom',token,network:'mainnet-beta',genesisHash:'5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d'}));window.phantom={solana:{isConnected:true,publicKey:{toString:()=>wallet},connect:async()=>({publicKey:{toString:()=>wallet}}),disconnect:async()=>{}}}; const realFetch=window.fetch;window.fetch=async(input,init)=>{const u=String(input);if(u.includes('/api/governance'))return new Response(JSON.stringify(u.includes('cursor=')?page2:fixture),{status:200,headers:{'Content-Type':'application/json'}});if(u.includes('/healthz'))return new Response('{}',{status:200,headers:{'Content-Type':'application/json'}});if(u.includes('/api/portfolio'))return new Response(JSON.stringify({positions:[],safeguards:[],protocolStatuses:[],coverage:{}}),{status:200,headers:{'Content-Type':'application/json'}});if(u.includes('/api/protection'))return new Response(JSON.stringify({armed:false}),{status:200,headers:{'Content-Type':'application/json'}});return realFetch(input,init)}})()"""%(json.dumps(fixture),json.dumps(page2))
cdp('Page.addScriptToEvaluateOnNewDocument',{'source':source})
cdp('Emulation.setDeviceMetricsOverride',{'width':1440,'height':1000,'deviceScaleFactor':1,'mobile':False})
cdp('Page.navigate',{'url':'http://127.0.0.1:7780/app.html'})
time.sleep(5)
cdp('Runtime.evaluate',{'expression':'location.hash="#governance"'})
time.sleep(1)
expr="""(() => {const h=document.querySelector('#connected-workspace');const host=document.querySelector('#governance-content');const nav=[...document.querySelectorAll('.workspace-nav a')];return {title:document.title,workspaceHidden:h?.hidden,hash:location.hash,nav:nav.map(a=>({text:a.textContent,active:a.classList.contains('active')})),text:host?.innerText||'',html:host?.innerHTML||'',scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,buttons:host?[...host.querySelectorAll('button')].map(b=>b.textContent):[]}})()"""
ev=cdp('Runtime.evaluate',{'expression':"({url:location.href,body:document.body?.innerHTML?.slice(0,300),ready:document.readyState})",'returnByValue':True}); print('PAGE',ev); ev=cdp('Runtime.evaluate',{'expression':expr,'returnByValue':True}); evidence=ev['result']['result'].get('value',{})
pathlib.Path('artifacts').mkdir(exist_ok=True)
pathlib.Path('artifacts/governance-desktop-dom.json').write_text(json.dumps(evidence,indent=2))
shot=cdp('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['result']['data'];pathlib.Path('artifacts/governance-desktop.png').write_bytes(base64.b64decode(shot))
# click older activity and capture
cdp('Runtime.evaluate',{'expression':"document.querySelector('#governance-content button')?.click()"});time.sleep(1)
evidence2=cdp('Runtime.evaluate',{'expression':expr,'returnByValue':True})['result']['result'].get('value',{});pathlib.Path('artifacts/governance-pagination-dom.json').write_text(json.dumps(evidence2,indent=2))
# mobile
cdp('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True});time.sleep(.5)
shot=cdp('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['result']['data'];pathlib.Path('artifacts/governance-mobile.png').write_bytes(base64.b64decode(shot))
evidence3=cdp('Runtime.evaluate',{'expression':expr,'returnByValue':True})['result']['result'].get('value',{});pathlib.Path('artifacts/governance-mobile-dom.json').write_text(json.dumps(evidence3,indent=2))
print(json.dumps({'desktop':evidence,'pagination':evidence2,'mobile':evidence3},indent=2))
