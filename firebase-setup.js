// Seed script to populate mock database collections in Firestore
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Paste your Firebase Config here:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const bookings = [
  { ref: "KMO-1001", name: "Ramesh Sharma", mobile: "9876543210", address: "Ward 5, Deoghar", service: "Plumber", reqDate: "2026-07-18", time: "Morning 7–10am", details: "Bathroom pipe leak", payment: "UPI", status: "Pending", createdAt: new Date().toISOString() },
  { ref: "KMO-1002", name: "Sunita Agarwal", mobile: "9876543211", address: "Naya Tola, Deoghar", service: "Cook", reqDate: "2026-07-19", time: "Flexible", details: "Need cook for lunch event", payment: "Cash", status: "Pending", createdAt: new Date().toISOString() }
];

const workers = [
  { id: "DSW-101", name: "Amit Kumar", mobile: "8987661330", skill: "Plumber", area: "Deoghar, Jasidih", rate: "300", aadhar: "1234 5678 9012", joinDate: new Date().toISOString(), status: "Active" },
  { id: "DSW-102", name: "Sita Devi", mobile: "8987661331", skill: "Cook", area: "Deoghar", rate: "250", aadhar: "5678 1234 9012", joinDate: new Date().toISOString(), status: "Active" }
];

const contacts = [
  { name: "Rajesh Gupta", mobile: "9876543212", email: "rajesh@gmail.com", subject: "Partnership", message: "I want to register 5 plumbers from my agency.", createdAt: new Date().toISOString() }
];

async function seed() {
  console.log("Seeding started...");
  for (const b of bookings) {
    await addDoc(collection(db, "bookings"), b);
  }
  for (const w of workers) {
    await addDoc(collection(db, "workers"), w);
  }
  for (const c of contacts) {
    await addDoc(collection(db, "contacts"), c);
  }
  console.log("Seeding complete! Mock data added to your Firestore database ✅");
}

seed().catch(console.error);
