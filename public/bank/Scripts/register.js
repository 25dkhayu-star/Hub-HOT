import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const generateCardNumber = () => {
    const randomPart = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
    return '88888888' + randomPart;
  };

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const cardNumber = generateCardNumber();

    await setDoc(doc(db, "users", user.uid), {
      username,
      balance: 0,
      cardNumber
    });

    window.location.href = "login.html";
  } catch (error) {
    alert(error.message);
  }
});