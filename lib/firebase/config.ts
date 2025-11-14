import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC__8ijj4C-KzQxXXX9zbcQ_6ShuKHsG9Q",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "deluxe-53602.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "deluxe-53602",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "deluxe-53602.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "341648523589",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:341648523589:web:614262af23d77502a9be2c",
  databaseURL: "https://deluxe-53602-default-rtdb.firebaseio.com",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-5WDVE1XGDG",
}

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
const auth: Auth = getAuth(app)
const db: Firestore = getFirestore(app)
const storage: FirebaseStorage = getStorage(app)

export const getFirebaseAuth = () => auth
export const getFirebaseDb = () => db
export const getFirebaseStorage = () => storage
export const getFirebaseApp = () => app

export { app, auth, db, storage }
export default app
