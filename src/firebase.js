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

const firebaseConfig = {
  apiKey: "AIzaSyC7vZnBCG-jrb2QVQ8FjIisifyts_T_ccQ",
  authDomain: "kaamoo-3bb17.firebaseapp.com",
  projectId: "kaamoo-3bb17",
  storageBucket: "kaamoo-3bb17.firebasestorage.app",
  messagingSenderId: "571491086753",
  appId: "1:571491086753:web:bc2849884f9ae1fcbfdbe0"
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
