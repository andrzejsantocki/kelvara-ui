export function shouldInvalidateWalletSession(status,errorCode){
 return status===401||status===403&&errorCode==='network_mismatch';
}

export function protectionUnavailableStatus(targetId,errorCode){
 const states={
  mainnet_protection_gate_identity_mismatch:['missing','Protection is not authorized for this position.'],
  protection_authorization_missing:['missing','Protection is not authorized for this position.'],
  protection_authorization_expired:['expired','Protection authorization expired for this position.'],
  protection_authorization_unavailable:['unavailable','Protection authorization is temporarily unavailable.'],
  protection_authorization_malformed:['unavailable','Protection authorization is temporarily unavailable.'],
 };
 const state=states[errorCode];
 return state?{targetId,authorizationState:state[0],unavailable:true,unavailableReason:state[1]}:null;
}

export function protectionAuthorizationDisplay(status={}){
 if(status.armed)return null;
 const authorized=status.authorizationState==='active'||status.authorizationState==='legacy';
 return authorized
  ?{authorized:true,title:'Setup incomplete',detail:'Protection is approved for this position, but no emergency exit has been pre-signed.',tone:'warning'}
  :{authorized:false};
}

export function exitRailProgress(status={}){
 const authorized=status.authorizationState==='active'||status.authorizationState==='legacy',enable=authorized?{state:'complete',label:'Enabled'}:status.authorizationState==='missing'?{state:'incomplete',label:'Not enabled'}:status.authorizationState==='expired'?{state:'incomplete',label:'Authorization expired'}:{state:'unknown',label:'Unknown'},stored=status.recordPresent===true&&status.armed===true&&status.armedCount===3,absent=authorized&&status.recordPresent===false,sign=stored?{state:'complete',label:'Verified and stored'}:absent?{state:'incomplete',label:'Not prepared'}:{state:'unknown',label:'Unknown'},arm=stored&&!status.completedAt?{state:'complete',label:'Armed'}:status.completedAt?{state:'incomplete',label:'Used by completed exit'}:absent?{state:'incomplete',label:'Not armed'}:{state:'unknown',label:'Unknown'},ready=status.completedAt?{state:'incomplete',label:'Exit completed'}:{state:'unknown',label:status.authorizationCapability==='manualExecution'?'Unknown · manual readiness unavailable':'Unknown'};
 return{enable,sign,arm,ready};
}
