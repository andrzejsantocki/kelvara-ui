function variantDetails(status,signature){
 const variants=Array.isArray(status?.variants)?[...status.variants]:[],matches=variants.map((item,index)=>({item,index})).filter(({item})=>item?.signature===signature);
 if(matches.length!==1)return null;
 const {item:variant,index}=matches[0];
 return typeof variant.priorityMicroLamports==='number'&&Number.isFinite(variant.priorityMicroLamports)&&variant.priorityMicroLamports>=0?{priorityMicroLamports:variant.priorityMicroLamports,transactionNumber:index+1,transactionCount:variants.length}:null;
}
function verifiedResult(status,startedAt,now){
 const signature=status?.winner,variant=variantDetails(status,signature);
 if(typeof status?.completedAt!=='string'||!status.completedAt||typeof signature!=='string'||!signature||!variant||!Array.isArray(status.revocationRequired))return null;
 return{verified:true,signature,...variant,completedAt:status.completedAt,completionMode:status.completionMode||null,revocationRequired:[...status.revocationRequired],verificationMs:Math.max(0,Math.round(now()-startedAt))};
}
async function finalized(loadTransactionStatus,signature){
 try{const state=await loadTransactionStatus(signature);return state?.confirmationStatus==='finalized'&&state?.err===null}catch{return false}
}
export async function executeProtectedWithdraw({targetId,loadStatus,submit,loadTransactionStatus,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),now=()=>performance.now(),pollIntervalMs=1000,timeoutMs=null}){
 if(!targetId)throw new Error('protection_target_required');
 const startedAt=now(),status=await loadStatus(targetId);
 if(!status?.armed||status.completedAt)throw new Error('Protection must be armed before Withdraw Now can use the prepared evacuation.');
 if(typeof loadTransactionStatus!=='function')throw new Error('transaction_status_loader_required');
 let submissionError;
 try{await submit('/api/protection/fast-close',{targetId})}catch(error){submissionError=error}
 const deadline=Number.isFinite(timeoutMs)?startedAt+timeoutMs:null;
 while(deadline===null||now()<deadline){
  await sleep(deadline===null?pollIntervalMs:Math.min(pollIntervalMs,Math.max(0,deadline-now())));
  try{const current=await loadStatus(targetId),verified=verifiedResult(current,startedAt,now);if(verified&&await finalized(loadTransactionStatus,verified.signature))return{...verified,verificationMs:Math.max(0,Math.round(now()-startedAt))}}catch{}
 }
 const error=new Error('Withdrawal submitted, but verified completion is still pending. Do not retry.');
 error.cause=submissionError;
 throw error;
}