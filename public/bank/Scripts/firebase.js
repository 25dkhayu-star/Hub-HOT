
// Firebase config and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyB4CZaN--bpjLcVRfmJhpTIpspr8eVZS3E",
  authDomain: "lyceumbankdataba.firebaseapp.com",
  projectId: "lyceumbankdataba",
  storageBucket: "lyceumbankdataba.firebasestorage.app",
  messagingSenderId: "829599602812",
  appId: "1:829599602812:web:96664af9817ce9b92491f9",
  measurementId: "G-W6LPMFS345"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
