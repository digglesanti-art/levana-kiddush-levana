import {list} from '@vercel/blob';
const OK=/^[a-z0-9]{8,40}$/;
async function cmd(a){const r=await fetch(process.env.UPSTASH_REDIS_REST_URL,{method:'POST',headers:{Authorization:'Bearer '+process.env.UPSTASH_REDIS_REST_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(a),signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Storage unavailable');const j=await r.json();if(j.error)throw new Error('Storage unavailable');return j.result}
export default async function handler(req,res){
res.setHeader('Cache-Control','no-store');
try{
const id=String(req.query.id||''),d=String(req.query.d||'');
if(!OK.test(id))return res.status(400).json({error:'bad id'});
if(req.method!=='GET'&&req.method!=='POST')return res.status(405).end();
if(req.method==='POST'&&!OK.test(d))return res.status(400).json({error:'bad device'});
const key='levana:joins:'+id,marker=key+':imported';
// Import a group's existing members once. Keep old Blob data untouched.
// If legacy data cannot be read, do not silently replace its count with zero.
if(!await cmd(['GET',marker])){
const seen=new Map();let cursor;
do{const r=await list({prefix:'join/'+id+'/',cursor,limit:1000});for(const b of r.blobs){const rest=b.pathname.slice(('join/'+id+'/').length),k=rest.split('~')[0];let name='';try{name=decodeURIComponent(rest.split('~')[1]||'')}catch{}if(OK.test(k)&&(!seen.has(k)||name))seen.set(k,name)}cursor=r.hasMore?r.cursor:null}while(cursor);
for(const [device,name] of seen)await cmd(['HSETNX',key,device,name]);
await cmd(['SET',marker,'1']);
}
if(req.method==='POST'){
const name=String(req.query.n||'').replace(/[^\p{L}\p{N} ]/gu,'').trim().slice(0,20);
await cmd([name?'HSET':'HSETNX',key,d,name]);
return res.status(200).json({ok:true});
}
const raw=await cmd(['HGETALL',key]);const members=[];
for(let i=0;i<(raw||[]).length;i+=2)members.push({d:raw[i],name:raw[i+1]||''});
return res.status(200).json({count:members.length,members});
}catch(e){return res.status(503).json({error:'unavailable'})}}
