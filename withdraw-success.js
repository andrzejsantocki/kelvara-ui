export function withdrawSuccessViewModel(result){
 const number=result?.transactionNumber,total=result?.transactionCount,priority=result?.priorityMicroLamports,duration=result?.verificationMs,valid=result?.verified===true&&typeof result.completedAt==='string'&&result.completedAt&&typeof result.signature==='string'&&result.signature&&Number.isInteger(number)&&number>=1&&Number.isInteger(total)&&total>=number&&typeof priority==='number'&&Number.isFinite(priority)&&priority>=0&&typeof duration==='number'&&Number.isFinite(duration)&&duration>=0&&Array.isArray(result.revocationRequired);
 if(!valid)throw new Error('verified_withdrawal_required');
 const count=result.revocationRequired.length,elapsed=Math.round(duration);
 return{
  elapsed:`${new Intl.NumberFormat('en-US').format(elapsed)} ms`,
  variant:Number.isInteger(number)&&Number.isInteger(total)?`Transaction ${number} of ${total}`:'Winning signed transaction',
  priority:Number.isFinite(priority)?`${new Intl.NumberFormat('en-US').format(priority)} µ-lamports/CU priority tier`:'Priority tier unavailable',
  signature:result.signature,
  explorerUrl:`https://explorer.solana.com/tx/${encodeURIComponent(result.signature)}`,
  cleanup:count?`${count} unused durable-nonce ${count===1?'authorization':'authorizations'} ready for cleanup`:'No unused durable-nonce authorizations',
  verification:'Finalized transaction matched the exact stored signed variant.',
 };
}
