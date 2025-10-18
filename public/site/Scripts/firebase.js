
// Firebase config and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyAcahouN8q43rf7AWFXftLPqLjyGe-KC3s",
  authDomain: "primebank-c7f22.firebaseapp.com",
  databaseURL: "https://primebank-c7f22-default-rtdb.firebaseio.com",
  projectId: "primebank-c7f22",
  storageBucket: "primebank-c7f22.firebasestorage.app",
  messagingSenderId: "625363108611",
  appId: "1:625363108611:web:5f3c65a950bd97532bdf36",
  measurementId: "G-5KDYLJ8J2J"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
