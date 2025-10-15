import { auth, db } from './firebase.js';
import { doc, getDoc, collection, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const data = userSnap.data();


  document.getElementById('welcomeMessage').innerText = `${data.username}`;
  document.getElementById('balance').innerText = `$${data.balance.toFixed(2)}`;
  document.getElementById('cardNumber').innerText = data.cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ");


  document.getElementById('transferForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const targetCard = document.getElementById('targetCard').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);

    if (targetCard.length !== 16 || isNaN(amount) || amount <= 0) {
      alert('Invalid input');
      return;
    }

    const usersSnap = await getDocs(collection(db, "users"));

    let recipientId = null;
    let recipientBalance = 0;

    usersSnap.forEach(docSnap => {
      const userData = docSnap.data();
      if (userData.cardNumber === targetCard) {
        recipientId = docSnap.id;
        recipientBalance = userData.balance;
      }
    });

    if (!recipientId) {
      alert("Card not found!");
      return;
    }

    if (data.balance < amount) {
      alert("Insufficient funds!");
      return;
    }


    await updateDoc(doc(db, "users", user.uid), {
      balance: data.balance - amount
    });

    await updateDoc(doc(db, "users", recipientId), {
      balance: recipientBalance + amount
    });

    alert("Transfer successful!");
    location.reload();
  });
});
