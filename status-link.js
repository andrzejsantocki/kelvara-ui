export function resolveStatusUrl(locationLike=location){
  if(['127.0.0.1','localhost'].includes(locationLike.hostname)){
    const applicationPort=Number(locationLike.port);
    if(Number.isInteger(applicationPort)&&applicationPort>0&&applicationPort<=65482)return `${locationLike.protocol}//${locationLike.hostname}:${applicationPort+53}/`;
  }
  return 'https://status.kelvara.xyz/';
}

export function bindStatusLink({documentLike=document,locationLike=location}={}){
  const link=documentLike.querySelector('[data-status-link]');
  if(link)link.href=resolveStatusUrl(locationLike);
  return link;
}
