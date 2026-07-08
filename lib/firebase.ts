import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeFirestore solo puede llamarse una vez; en HMR de desarrollo caemos a getFirestore.
let _db: Firestore;
try {
  _db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true, // compatibilidad Safari/redes corporativas
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }), // offline-friendly
  });
} catch {
  _db = getFirestore(app);
}

export const db = _db;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
