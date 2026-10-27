
// ========================================================
// ① Firebase
// ========================================================
const firebaseConfig = {
  apiKey: "AIzaSyDLH7pGNXYELET_MTW5EQRJr1XJNE5HZR8",
  authDomain: "stick-fight-bac45.firebaseapp.com",
  databaseURL: "https://stick-fight-bac45-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "stick-fight-bac45",
  storageBucket: "stick-fight-bac45.firebasestorage.app",
  messagingSenderId: "464565244587",
  appId: "1:464565244587:web:1c671b1e1bf47888ebddee"
};
let db = null;
let firebaseInitPromise = null;
let firebaseLastError = '';
// FirebaseのCDNが一時的に利用できない場合にも、別の正規配信元から再試行する。
// 既存のRealtime Database・部屋・ランキングのデータ形式は変えない。
const FIREBASE_SDK_VERSION = '10.12.2';
const FIREBASE_CDN_MIRRORS = [
  'https://cdnjs.cloudflare.com/ajax/libs/firebase/'+FIREBASE_SDK_VERSION+'/',
  'https://cdn.jsdelivr.net/npm/firebase@'+FIREBASE_SDK_VERSION+'/',
  'https://www.gstatic.com/firebasejs/'+FIREBASE_SDK_VERSION+'/'
];
function firebaseSDKReady(){
  return !!(window.firebase && typeof window.firebase.initializeApp==='function' && typeof window.firebase.database==='function');
}
function loadFirebaseScript(url,ready){
  if(ready())return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.async=true;script.src=url;
    let completed=false;
    const finish=(error)=>{
      if(completed)return;completed=true;
      clearTimeout(timer);
      script.onload=null;script.onerror=null;
      if(error){script.remove();reject(error);}else resolve();
    };
    const timer=setTimeout(()=>finish(new Error('CDN応答タイムアウト')),6500);
    script.onload=()=>finish(ready()?null:new Error('Firebaseライブラリが未初期化'));
    script.onerror=()=>finish(new Error('CDNに接続できません'));
    document.head.appendChild(script);
  });
}
async function ensureFirebaseSDK(){
  if(firebaseSDKReady())return;
  const hasApp=()=>!!(window.firebase&&typeof window.firebase.initializeApp==='function');
  const hasDatabase=()=>!!(window.firebase&&typeof window.firebase.database==='function');
  let lastFailure=null;
  for(const base of FIREBASE_CDN_MIRRORS){
    try{
      if(!hasApp())await loadFirebaseScript(base+'firebase-app-compat'+(base.includes('cdnjs')?'.min':'')+'.js',hasApp);
      if(!hasDatabase())await loadFirebaseScript(base+'firebase-database-compat'+(base.includes('cdnjs')?'.min':'')+'.js',hasDatabase);
      if(firebaseSDKReady())return;
    }catch(err){lastFailure=err;console.warn('Firebase SDKの読み込み元を切り替えます:',base,err?.message||err);}
  }
  throw new Error('Firebaseのプログラムを読み込めませんでした。ネット接続・広告ブロッカー・学校や職場のネットワーク制限をご確認ください。'+(lastFailure?'（'+lastFailure.message+'）':''));
}
async function initFirebase(){
  if(db)return true;
  if(firebaseInitPromise)return firebaseInitPromise;
  firebaseInitPromise=(async()=>{
    try{
      await ensureFirebaseSDK();
      // 同じページですでにFirebaseが初期化されていても二重初期化しない。
      const app=window.firebase.apps?.length?window.firebase.app():window.firebase.initializeApp(firebaseConfig);
      db=app.database();
      firebaseLastError='';
      return true;
    }catch(e){
      firebaseLastError=e?.message||String(e);
      console.error('Firebaseの初期化に失敗:',e);
      return false;
    }
  })();
  try{return await firebaseInitPromise;}
  finally{firebaseInitPromise=null;}
}

