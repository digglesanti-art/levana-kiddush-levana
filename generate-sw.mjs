import {readdir,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
async function paths(dir='dist',relative=''){
 let out=[];
 for(const item of await readdir(dir,{withFileTypes:true})){
  const name=join(relative,item.name);
  if(item.isDirectory())out.push(...await paths(join(dir,item.name),name));
  else if(item.isFile()&&item.name!=='sw.js')out.push('/'+name.replaceAll('\\','/'));
 }
 return out;
}
const assets=['/',...(await paths()).filter(p=>!p.startsWith('/ublic/'))];
// Optional recordings are cached on use, never allowed to delay a core update.
const core=assets.filter(p=>! /\.(mp3|m4a|wav|ogg)$/i.test(p));
const hash=createHash('sha256').update(JSON.stringify(assets));
for(const asset of assets.filter(p=>p!=='/')) hash.update(await readFile(join('dist',asset.slice(1))));
const version=hash.digest('hex').slice(0,12);
const code=`const CACHE='levana-${version}';const ASSETS=${JSON.stringify(core)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith('levana-')&&n!==CACHE).map(n=>caches.delete(n)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
 if(e.request.headers.has('range')){e.respondWith(caches.match(u.pathname).then(async hit=>{if(!hit)return fetch(e.request);const data=await hit.arrayBuffer(),range=/^bytes=(\\d*)-(\\d*)$/.exec(e.request.headers.get('range'));if(!range)return fetch(e.request);let start=range[1]?Number(range[1]):Math.max(0,data.byteLength-Number(range[2])),end=range[1]?(range[2]?Number(range[2]):data.byteLength-1):data.byteLength-1;end=Math.min(end,data.byteLength-1);if(start>end||start>=data.byteLength)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+data.byteLength}});return new Response(data.slice(start,end+1),{status:206,headers:{'Content-Type':hit.headers.get('content-type')||'audio/mpeg','Content-Range':'bytes '+start+'-'+end+'/'+data.byteLength,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}})}));return}
 if(u.pathname==='/manifest.webmanifest'){e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request)));return}
 if(e.request.mode==='navigate'){e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put('/',copy)))}return r}).catch(()=>caches.match('/')));return}
 e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)))}return r})))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{for(const c of clients)if(c.url.startsWith(self.location.origin)){await c.focus();return}return self.clients.openWindow('/') }))});`;
await writeFile('dist/sw.js',code);
console.log('Offline shell: '+assets.length+' assets, '+version);
