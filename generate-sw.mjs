import {readdir,writeFile} from 'node:fs/promises';
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
const assets=['/',...await paths()];
const version=createHash('sha256').update(JSON.stringify(assets)).digest('hex').slice(0,12);
const code=`const CACHE='levana-${version}';const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith('levana-')&&n!==CACHE).map(n=>caches.delete(n)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
 if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put('/',copy))}return r}).catch(()=>caches.match('/')));return}
 e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{for(const c of clients)if(c.url.startsWith(self.location.origin)){await c.focus();return}return self.clients.openWindow('/') }))});`;
await writeFile('dist/sw.js',code);
console.log('Offline shell: '+assets.length+' assets, '+version);
