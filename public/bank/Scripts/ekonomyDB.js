import { auth, db } from './firebase.js';
import {
  collection, getDocs, addDoc, doc, updateDoc, getDoc, setDoc,
  query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";


async function sendDiscordNotification({ type, username, product, amount, quantity }) {
  const color = type === "income" ? 0x2ecc71 : 0xe74c3c;
  const titleMap = {
    income: "💰 Поповнення казни",
    expense: "➖ Витрата",
    purchase: "📦 Закупка"
  };

  let description = "";
  if (type === "income") {
    description = `**Користувач:** ${username}\n**Сума:** +${amount} ₴`;
  } else if (type === "expense") {
    description = `**Покупець:** ${username}\n**Товар:** ${product}\n**Сума:** -${amount} ₴`;
  } else if (type === "purchase") {
    description = `**Товар:** ${product}\n**Кількість:** ${quantity}\n**Сума:** -${amount} ₴\n**Ціна за шт:** ${(amount / quantity).toFixed(2)} ₴`;
  }

  const payload = {
    embeds: [
      {
        title: titleMap[type],
        description: description,
        color: color,
        timestamp: new Date().toISOString(),
        footer: { text: "Economy Panel" }
      }
    ]
  };

  try {
    await fetch("https://discord.com/api/webhooks/1418539876873146509/pxSkJb5SX43mkoMJQPudKP7i31bbmFwBe8jsxuBNCoDRwmAkdKKSNnOhV5QxCFZPlf0R", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("Не вдалося надіслати повідомлення в Discord:", err);
  }
}


async function loadTreasury() {
  const treasuryRef = doc(db, "treasury", "main");
  const snap = await getDoc(treasuryRef);
  if (snap.exists()) {
    document.getElementById("treasuryBalance").innerText = snap.data().balance + " ₴";
  } else {
    await setDoc(treasuryRef, { balance: 0 });
    document.getElementById("treasuryBalance").innerText = "0 ₴";
  }
}


async function loadIncomes() {
  const table = document.getElementById("incomesTable");
  table.innerHTML = "";
  const q = query(collection(db, "incomes"), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${d.username}</td><td>+${d.amount} ₴</td><td>${d.timestamp?.toDate().toLocaleString()}</td>`;
    table.appendChild(tr);
  });
}


async function loadExpenses() {
  const table = document.getElementById("expensesTable");
  table.innerHTML = "";
  const q = query(collection(db, "expenses"), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${d.username}</td><td>${d.product}</td><td>- ${d.amount} ₴</td><td>${d.timestamp?.toDate().toLocaleString()}</td>`;
    table.appendChild(tr);
  });
}


async function loadPurchases() {
  const table = document.getElementById("purchasesTable");
  table.innerHTML = "";
  const q = query(collection(db, "purchases"), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    const pricePerItem = d.quantity > 0 ? (d.amount / d.quantity).toFixed(2) : "-";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${d.product}</td><td>${d.quantity}</td><td>- ${d.amount} ₴</td><td>${pricePerItem} ₴/шт</td><td>${d.timestamp?.toDate().toLocaleString()}</td>`;
    table.appendChild(tr);
  });
}


window.openIncomeModal = () => document.getElementById("incomeModal").style.display = "flex";
window.openExpenseModal = () => document.getElementById("expenseModal").style.display = "flex";
window.openPurchaseModal = () => document.getElementById("purchaseModal").style.display = "flex";
window.closeModal = (id) => document.getElementById(id).style.display = "none";


window.confirmIncome = async function() {
  const amount = document.getElementById("incomeAmount").value;
  if (!amount || isNaN(amount) || amount <= 0) return alert("Некоректна сума.");

  const user = auth.currentUser;
  const userSnap = await getDoc(doc(db, "users", user.uid));
  const username = userSnap.data().username || "Неизвестный";

  await addDoc(collection(db, "incomes"), {
    username,
    amount: parseFloat(amount),
    timestamp: serverTimestamp()
  });

  const treasuryRef = doc(db, "treasury", "main");
  const treasurySnap = await getDoc(treasuryRef);
  let balance = treasurySnap.exists() ? treasurySnap.data().balance : 0;
  await updateDoc(treasuryRef, { balance: balance + parseFloat(amount) });

  sendDiscordNotification({ type: "income", username, amount: parseFloat(amount) });

  document.getElementById("incomeAmount").value = "";
  closeModal("incomeModal");
  loadTreasury();
  loadIncomes();
};


window.confirmExpense = async function() {
  const product = document.getElementById("expenseProduct").value;
  const amount = document.getElementById("expenseAmount").value;
  const buyer = document.getElementById("expenseBuyer").value;

  if (!product) return alert("Введіть назву товару.");
  if (!amount || isNaN(amount) || amount <= 0) return alert("Некоректна сума.");
  if (!buyer) return alert("Введіть ім'я покупця.");

  await addDoc(collection(db, "expenses"), {
    username: buyer,
    product,
    amount: parseFloat(amount),
    timestamp: serverTimestamp()
  });

  const treasuryRef = doc(db, "treasury", "main");
  const treasurySnap = await getDoc(treasuryRef);
  let balance = treasurySnap.exists() ? treasurySnap.data().balance : 0;
  await updateDoc(treasuryRef, { balance: balance - parseFloat(amount) });

  sendDiscordNotification({ type: "expense", username: buyer, product, amount: parseFloat(amount) });

  document.getElementById("expenseProduct").value = "";
  document.getElementById("expenseAmount").value = "";
  document.getElementById("expenseBuyer").value = "";
  closeModal("expenseModal");
  loadTreasury();
  loadExpenses();
};


window.confirmPurchase = async function() {
  const product = document.getElementById("purchaseProduct").value;
  const quantity = document.getElementById("purchaseQuantity").value;
  const amount = document.getElementById("purchaseAmount").value;

  if (!quantity || isNaN(quantity) || quantity <= 0) return alert("Некоректна кількість.");
  if (!amount || isNaN(amount) || amount <= 0) return alert("Некоректна сума.");

  await addDoc(collection(db, "purchases"), {
    product,
    quantity: parseInt(quantity),
    amount: parseFloat(amount),
    timestamp: serverTimestamp()
  });

  const treasuryRef = doc(db, "treasury", "main");
  const treasurySnap = await getDoc(treasuryRef);
  let balance = treasurySnap.exists() ? treasurySnap.data().balance : 0;
  await updateDoc(treasuryRef, { balance: balance - parseFloat(amount) });

  sendDiscordNotification({ type: "purchase", product, quantity: parseInt(quantity), amount: parseFloat(amount) });

  document.getElementById("purchaseQuantity").value = "";
  document.getElementById("purchaseAmount").value = "";
  closeModal("purchaseModal");
  loadTreasury();
  loadPurchases();
};


onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists() && ["admin", "economy"].includes(userSnap.data().role)) {
      loadTreasury();
      loadIncomes();
      loadExpenses();
      loadPurchases();
    } else {
      document.body.innerHTML = "<h2 style='color: red;'>Доступ заборонений</h2>";
    }
  } else {
    window.location.href = "login.html";
  }
});
