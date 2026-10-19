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
  ?{authorized:true,title:'Authorized, not armed',detail:'Protection is authorized. Pre-sign evacuation to arm this position.',tone:'warning'}
  :{authorized:false};
}
