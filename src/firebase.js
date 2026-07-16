import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp, 
  onSnapshot 
} from "firebase/firestore";

// ── REPLACE THESE WITH YOUR FIREBASE CONFIG ──────────────────
// Step: Firebase console → Project settings → Your apps → Web app
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
// ─────────────────────────────────────────────────────────────

let db = null;
let fbReady = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    fbReady = true;
    console.log("Firebase connected ✅");
  } else {
    console.warn("Firebase config not set — using local storage fallback");
  }
} catch (e) {
  console.warn("Firebase initialization failed — using local storage fallback", e);
}

export { db, fbReady, collection, addDoc, getDocs, query, orderBy, where, doc, updateDoc, deleteDoc, serverTimestamp, onSnapshot };
