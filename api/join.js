import {put,list} from '@vercel/blob';
const OK=/^[a-z0-9]{8,40}$/;
export default async function handler(req,res){
res.setHeader('Cache-Control','no-store');
try{
const id=String(req.query.id||''),d=String(req.query.d||'');
if(!OK.test(id))return res.status(400).json({error:'bad id'});
if(req.method==='POST'){
if(!OK.test(d))return res.status(400).json({error:'bad device'});
const name=String(req.query.n||'').replace(/[^\p{L}\p{N} ]/gu,'').trim().slice(0,20);
await put('join/'+id+'/'+d+(name?'~'+encodeURIComponent(name):''),'1',{access:'private',allowOverwrite:true,addRandomSuffix:false,contentType:'text/plain'});
return res.status(200).json({ok:true});
}
const seen=new Map();let cursor;
for(let i=0;i<5;i++){const r=await list({prefix:'join/'+id+'/',cursor,limit:1000});for(const b of r.blobs){const rest=b.pathname.slice(('join/'+id+'/').length),k=rest.split('~')[0];let nm='';try{nm=decodeURIComponent(rest.split('~')[1]||'')}catch{}if(!seen.has(k)||nm)seen.set(k,{d:k,name:nm})}if(!r.hasMore)break;cursor=r.cursor}
const members=[...seen.values()];
return res.status(200).json({count:members.length,members});
}catch(e){return res.status(503).json({error:'unavailable'})}}
