import { auth, db } from './firebase.js';
import { 
  collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, addDoc, increment 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

let allUsers = [];


async function loadUsers() {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    allUsers = []; 
    usersSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      allUsers.push({ id: docSnap.id, ...data });
    });
    displayUsers(allUsers);
  } catch (error) {
    console.error("Помилка завантаження користувачів:", error);
  }
}


function displayUsers(users) {
  const table = document.getElementById('usersTable');
  table.innerHTML = ""; 

  if (users.length === 0) {
    table.innerHTML = `<tr><td colspan="5" style="text-align: center;">Немає користувачів.</td></tr>`;
    return;
  }

  users.forEach((user) => {
    const tr = document.createElement('tr');
    const balance = user.balance !== undefined ? user.balance : 'Немає балансу';
    const cardNumber = user.cardNumber || 'Немає номера картки';

    tr.innerHTML = `
      <td>${user.username || 'Немає імені'}</td>
      <td>
        ${balance}
        <button onclick="addBalance('${user.id}')">+</button>
        <button onclick="subtractBalance('${user.id}')">-</button>
      </td>
      <td>${cardNumber}</td>
    `;
    table.appendChild(tr);
  });
}


function searchUsers(queryText) {
  const lowerQuery = queryText.toLowerCase();
  const filtered = allUsers.filter(user => {
    const username = (user.username || "").toLowerCase();
    const cardNumber = (user.cardNumber || "").toLowerCase();
    const uid = (user.id || "").toLowerCase();
    return username.includes(lowerQuery) || cardNumber.includes(lowerQuery) || uid.includes(lowerQuery);
  });
  displayUsers(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('userSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      searchUsers(event.target.value);
    });
  }
});


async function loadTransfers() {
  const table = document.getElementById('transfersTable');
  table.innerHTML = ""; 

  try {
    const q = query(collection(db, "transfers"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const from = data.from || "—";
      const to = data.to || "—";
      const amount = data.amount || 0;
      const timestamp = data.timestamp?.toDate().toLocaleString() || "Немає дати";

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${from}</td>
        <td>${to}</td>
        <td>${amount} грн</td>
        <td>${timestamp}</td>
        <td><button class="delete-btn" onclick="deleteTransaction('${docSnap.id}')">Видалити</button></td>
      `;
      table.appendChild(tr);
    });
  } catch (error) {
    console.error("Помилка завантаження транзакцій:", error);
  }
}


window.showUsers = () => {
  document.getElementById('usersTableContainer').style.display = 'table';
  document.getElementById('transfersTableContainer').style.display = 'none';
  document.getElementById('searchContainer').style.display = 'block';
  loadUsers();
}

window.showTransfers = () => {
  document.getElementById('usersTableContainer').style.display = 'none';
  document.getElementById('transfersTableContainer').style.display = 'table';
  document.getElementById('searchContainer').style.display = 'none';
  loadTransfers();
}


window.addBalance = async function(userId) {
  const amount = prompt("Введіть суму для поповнення:");
  if (amount !== null && !isNaN(amount) && parseFloat(amount) > 0) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        balance: increment(parseFloat(amount))
      });
      alert("Баланс поповнено!");
      loadUsers();
    } catch (error) {
      console.error("Помилка при поповненні балансу:", error);
      alert("Помилка при поповненні балансу.");
    }
  } else {
    alert("Введіть коректне додатнє число.");
  }
}

window.subtractBalance = async function(userId) {
  const amount = prompt("Введіть суму для зняття:");
  if (amount !== null && !isNaN(amount) && parseFloat(amount) > 0) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        balance: increment(-parseFloat(amount))
      });
      alert("Баланс зменшено!");
      loadUsers();
    } catch (error) {
      console.error("Помилка при зменшенні балансу:", error);
      alert("Помилка при зменшенні балансу.");
    }
  } else {
    alert("Введіть коректне додатнє число.");
  }
}


window.editUsername = async function(userId) {
  const newUsername = prompt("Введіть нове ім’я користувача:");
  if (newUsername !== null && newUsername.trim() !== "") {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { username: newUsername });
      loadUsers();
      alert("Ім’я оновлено!");
    } catch (error) {
      console.error("Помилка при оновленні імені:", error);
      alert("Помилка при оновленні імені.");
    }
  } else {
    alert("Будь ласка, введіть коректне ім’я.");
  }
}

window.editCardNumber = async function(userId) {
  const newCardNumber = prompt("Введіть новий номер картки:");
  if (newCardNumber !== null && newCardNumber.trim() !== "") {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { cardNumber: newCardNumber });
      alert("Номер картки оновлено!");
      loadUsers();
    } catch (error) {
      console.error("Помилка при оновленні номера картки:", error);
      alert("Помилка при оновленні номера картки.");
    }
  } else {
    alert("Будь ласка, введіть коректний номер картки.");
  }
}


window.deleteTransaction = async function(transactionId) {
  const confirmDelete = confirm("Ви впевнені, що хочете видалити цю транзакцію?");
  if (confirmDelete) {
    try {
      const transactionRef = doc(db, "transfers", transactionId);
      await deleteDoc(transactionRef);
      alert("Транзакцію успішно видалено!");
      loadTransfers();
    } catch (error) {
      console.error("Помилка при видаленні транзакції:", error);
      alert("Помилка при видаленні транзакції.");
    }
  }
}

window.deleteUser = async function(userId) {
  const confirmDelete = confirm("Ви впевнені, що хочете видалити цього користувача?");
  if (confirmDelete) {
    try {
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);
      alert("Користувача успішно видалено!");
      loadUsers();
    } catch (error) {
      console.error("Помилка при видаленні користувача:", error);
      alert("Помилка при видаленні користувача.");
    }
  }
}


window.addUser = async function() {
  const username = prompt("Введіть ім’я користувача:");
  if (!username || username.trim() === "") {
    return alert("Ім’я користувача не може бути порожнім.");
  }

  let balance = 0;
  const balanceInput = prompt("Введіть початковий баланс (залиште порожнім для 0):");
  if (balanceInput) {
    if (isNaN(balanceInput) || parseFloat(balanceInput) < 0) {
      return alert("Будь ласка, введіть коректне значення для балансу.");
    }
    balance = parseFloat(balanceInput);
  }

  const cardNumber = prompt("Введіть номер картки (необов’язково):") || "";
  
  const newUserData = {
    username: username.trim(),
    balance: balance,
    cardNumber: cardNumber.trim(),
    role: "user"
  };

  try {
    await addDoc(collection(db, "users"), newUserData);
    alert("Користувача успішно додано!");
    loadUsers();
  } catch (error) {
    console.error("Помилка при додаванні користувача:", error);
    alert("Помилка при додаванні користувача.");
  }
}


onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists() && userSnap.data().role === "teacher") {
      loadUsers();
    } else {
      document.body.innerHTML = "<h2 style='color: red;'>Доступ заборонено: Ви не є вчителем</h2>";
    }
  } else {
    window.location.href = "login.html";
  }
});
