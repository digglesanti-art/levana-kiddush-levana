import {put,list} from '@vercel/blob';
const OK=/^[a-z0-9]{8,40}$/;
export default async function handler(req,res){
res.setHeader('Cache-Control','no-store');
try{
const id=String(req.query.id||''),d=String(req.query.d||'');
if(!OK.test(id))return res.status(400).json({error:'bad id'});
if(req.method==='POST'){
if(!OK.test(d))return res.status(400).json({error:'bad device'});
await put('join/'+id+'/'+d,'1',{access:'private',allowOverwrite:true,addRandomSuffix:false,contentType:'text/plain'});
return res.status(200).json({ok:true});
}
let n=0,cursor;
for(let i=0;i<5;i++){const r=await list({prefix:'join/'+id+'/',cursor,limit:1000});n+=r.blobs.length;if(!r.hasMore)break;cursor=r.cursor}
return res.status(200).json({count:n});
}catch(e){return res.status(503).json({error:'unavailable'})}}
