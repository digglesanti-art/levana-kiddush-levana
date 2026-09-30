/**
 * Kiddush Levana Android preparation (not a signed or tested release).
 * Run: node prepare-android.mjs
 * Needs Node 22+. Native compilation requires a current Android Studio JDK and SDK 36.
 * Provisional package ID: com.davidsinger.levana. Confirm before first Play upload.
 * This script does not register accounts, pay fees, sign releases or submit to Play.
 * It uses bundled web assets; the website remains on Vercel.
 */
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const run=(command,args)=>execFileSync(command,args,{stdio:'inherit'});
if(Number(process.versions.node.split('.')[0])<22)throw Error('Node.js 22+ required');
const packageFile=JSON.parse(readFileSync('package.json','utf8'));
if(packageFile.dependencies?.['@capacitor/core']!=='8.5.2' || packageFile.dependencies?.['@capacitor/android']!=='8.5.2')run('npm',['install','--save-exact','@capacitor/core@8.5.2','@capacitor/android@8.5.2']);
if(packageFile.devDependencies?.['@capacitor/cli']!=='8.4.3')run('npm',['install','--save-dev','--save-exact','@capacitor/cli@8.4.3']);
// CLI 8.4.3 avoids the npm audit issues observed in CLI 8.5.2.
if(!existsSync('capacitor.config.json'))writeFileSync('capacitor.config.json',JSON.stringify({appId:'com.davidsinger.levana',appName:'קידוש לבנה',webDir:'dist',android:{allowMixedContent:false}},null,2)+'\n');
let ignore=existsSync('.gitignore')?readFileSync('.gitignore','utf8'):'';
for(const entry of ['android/','*.jks','*.keystore','local.properties'])if(!ignore.split('\n').includes(entry))ignore+='\n'+entry;
writeFileSync('.gitignore',ignore+'\n');
run('npm',['run','build']);
if(!existsSync('android'))run('npx',['cap','add','android']);
run('npx',['cap','sync','android']);
const file='android/app/src/main/AndroidManifest.xml';
let manifest=readFileSync(file,'utf8');
for(const permission of ['ACCESS_COARSE_LOCATION','ACCESS_FINE_LOCATION'])if(!manifest.includes(`android.permission.${permission}`))manifest=manifest.replace('</manifest>',`    <uses-permission android:name="android.permission.${permission}" />\n</manifest>`);
writeFileSync(file,manifest);
console.log(`Android source prepared. Open with: npx cap open android
Native compilation (requires Android SDK + current JDK): cd android && ./gradlew assembleDebug
Release bundle: ./gradlew bundleRelease (release signing is NOT configured).

Before release:
- Confirm the package ID and publisher account.
- Replace default Capacitor icon/splash with approved artwork.
- Implement native launcher shortcuts; manifest shortcuts do not transfer automatically.
- Test on a real device: location permission, Hebrew/English, moon/time calculations,
  audio, contacts, phone/WhatsApp, offline launch, reminders and flashlight.
- Adapt native APIs and packaged-app service-worker behavior based on testing.
- Confirm audio/artwork rights; prepare privacy policy, support contact, Data Safety,
  content rating, screenshots and closed testing as required by Google Play.
- Generate and securely back up an upload keystore outside this repo, use Play App
  Signing, and build a signed .aab. Never put signing keys or passwords in GitHub.
- Obtain owner approval before fees, account registration, submission or publication.

No APK or AAB has been produced by this script. Preparation is not a finished app.
Docs: https://capacitorjs.com/docs/android
https://capacitorjs.com/docs/getting-started/environment-setup
https://support.google.com/googleplay/android-developer/answer/9842756
https://support.google.com/googleplay/android-developer/answer/14151465`);
