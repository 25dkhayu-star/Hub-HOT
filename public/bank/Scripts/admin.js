import { auth, db } from './firebase.js';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, addDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

let allUsers = [];
let allProducts = [];
let allNews = [];
let allClubs = [];
let allPlans = [];

// Modal Functions
function showModal(title, fields, callback) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalForm = document.getElementById('modalForm');
    const modalMessage = document.getElementById('modalMessage');
    const modalSubmit = document.getElementById('modalSubmit');
    const modalCancel = document.getElementById('modalCancel');

    modalTitle.textContent = title;
    modalMessage.style.display = 'none';
    modalForm.innerHTML = '';

    fields.forEach(field => {
      const label = document.createElement('label');
      label.textContent = field.label;
      const input = field.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
      input.id = field.id;
      if (input.tagName === 'INPUT') {
        input.type = field.type || 'text'; // Only set type for <input> elements
      }
      if (field.value) input.value = field.value;
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.required) input.required = true;
      if (field.readonly) input.readOnly = true;
      modalForm.appendChild(label);
      modalForm.appendChild(input);
    });

    modal.style.display = 'flex';

    const submitHandler = (e) => {
      e.preventDefault();
      const values = {};
      fields.forEach(field => {
        const input = document.getElementById(field.id);
        values[field.id] = input.value.trim();
      });
      resolve(values);
      modal.style.display = 'none';
      modalForm.removeEventListener('submit', submitHandler);
    };

    modalForm.addEventListener('submit', submitHandler);

    modalCancel.onclick = () => {
      modal.style.display = 'none';
      resolve(null);
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        resolve(null);
      }
    };
  });
}

function showConfirmModal(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalForm = document.getElementById('modalForm');
    const modalMessage = document.getElementById('modalMessage');
    const modalSubmit = document.getElementById('modalSubmit');
    const modalCancel = document.getElementById('modalCancel');

    modalTitle.textContent = 'Confirm';
    modalMessage.textContent = message;
    modalMessage.style.display = 'block';
    modalForm.innerHTML = '';
    modalSubmit.textContent = 'Yes';
    modalCancel.textContent = 'No';

    modal.style.display = 'flex';

    modalSubmit.onclick = () => {
      modal.style.display = 'none';
      resolve(true);
    };

    modalCancel.onclick = () => {
      modal.style.display = 'none';
      resolve(false);
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        resolve(false);
      }
    };
  });
}

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
    showModal('Error', [{ id: 'error', label: 'Помилка завантаження користувачів.', type: 'text', value: error.message, readonly: true }], () => {});
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
      <td>${user.id}</td>
      <td>
        ${balance}
        <button onclick="editBalance('${user.id}')">Редагувати баланс</button>
      </td>
      <td>${cardNumber}</td>
      <td>
        <button class="edit-btn" onclick="editUsername('${user.id}')">Редагувати ім'я</button>
        <button class="edit-btn" onclick="editCardNumber('${user.id}')">Редагувати номер картки</button>
        <button class="delete-btn" onclick="deleteUser('${user.id}')">Видалити</button>
      </td>
    `;
    table.appendChild(tr);
  });
}

async function loadNews() {
  try {
    const q = query(collection(db, "news"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    allNews = [];
    snapshot.forEach((docSnap) => {
      allNews.push({ id: docSnap.id, ...docSnap.data() });
    });
    displayNews(allNews);
  } catch (error) {
    console.error("Помилка завантаження новин:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка завантаження новин.', type: 'text', value: error.message, readonly: true }], () => {});
  }
}

function displayNews(newsArray) {
  const table = document.getElementById('newsTable');
  table.innerHTML = "";
  if (newsArray.length === 0) {
    table.innerHTML = `<tr><td colspan="5" style="text-align:center;">Немає новин.</td></tr>`;
    return;
  }
  newsArray.forEach((news) => {
    const tr = document.createElement('tr');
    const date = news.timestamp?.toDate().toLocaleString() || "—";
    tr.innerHTML = `
      <td>${news.title || "—"}</td>
      <td>${news.description || "—"}</td>
      <td><img src="${news.image || ""}" alt="новина" style="max-width:80px;"></td>
      <td>${date}</td>
      <td>
        <button class="edit-btn" onclick="editNews('${news.id}')">Редагувати</button>
        <button class="delete-btn" onclick="deleteNews('${news.id}')">Видалити</button>
      </td>
    `;
    table.appendChild(tr);
  });
}

window.showNews = () => {
  document.getElementById('usersTableContainer').style.display = 'none';
  document.getElementById('transfersTableContainer').style.display = 'none';
  document.getElementById('productsTableContainer').style.display = 'none';
  document.getElementById('newsTableContainer').style.display = 'table';
  document.getElementById('searchContainer').style.display = 'none';
  document.getElementById('productSearchContainer').style.display = 'none';
  document.getElementById('newsSearchContainer').style.display = 'block';
  document.getElementById('clubSearchContainer').style.display = 'none';
  document.getElementById('planSearchContainer').style.display = 'none';
  loadNews();
};

window.addNews = async function() {
  const fields = [
    { id: 'title', label: 'Заголовок', type: 'text', required: true },
    { id: 'description', label: 'Короткий опис', type: 'text' },
    { id: 'fullText', label: 'Повний текст', type: 'textarea' },
    { id: 'image', label: 'URL зображення', type: 'text' }
  ];
  const values = await showModal('Додати новину', fields);
  if (!values || !values.title) {
    showModal('Error', [{ id: 'error', label: 'Заголовок не може бути порожнім.', type: 'text', readonly: true }], () => {});
    return;
  }
  const newNews = {
    title: values.title,
    description: values.description || '',
    fullText: values.fullText || '',
    image: values.image || '',
    timestamp: new Date()
  };
  try {
    await addDoc(collection(db, "news"), newNews);
    showModal('Success', [{ id: 'success', label: 'Новину додано!', type: 'text', readonly: true }], () => {});
    loadNews();
  } catch (error) {
    console.error("Помилка при додаванні:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка при додаванні новини.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.editNews = async function(newsId) {
  const ref = doc(db, "news", newsId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    showModal('Error', [{ id: 'error', label: 'Новину не знайдено!', type: 'text', readonly: true }], () => {});
    return;
  }
  const data = snap.data();
  const fields = [
    { id: 'title', label: 'Заголовок', type: 'text', value: data.title, required: true },
    { id: 'description', label: 'Опис', type: 'text', value: data.description },
    { id: 'fullText', label: 'Повний текст', type: 'textarea', value: data.fullText },
    { id: 'image', label: 'URL зображення', type: 'text', value: data.image }
  ];
  const values = await showModal('Редагувати новину', fields);
  if (!values || !values.title) {
    showModal('Error', [{ id: 'error', label: 'Заголовок обов’язковий.', type: 'text', readonly: true }], () => {});
    return;
  }
  try {
    await updateDoc(ref, {
      title: values.title,
      description: values.description || '',
      fullText: values.fullText || '',
      image: values.image || ''
    });
    showModal('Success', [{ id: 'success', label: 'Новину оновлено!', type: 'text', readonly: true }], () => {});
    loadNews();
  } catch (error) {
    console.error("Помилка при оновленні:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка оновлення.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.deleteNews = async function(newsId) {
  const confirmed = await showConfirmModal('Видалити новину?');
  if (!confirmed) return;
  try {
    await deleteDoc(doc(db, "news", newsId));
    showModal('Success', [{ id: 'success', label: 'Новину видалено!', type: 'text', readonly: true }], () => {});
    loadNews();
  } catch (error) {
    console.error("Помилка при видаленні:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка видалення.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

function searchNews(queryText) {
  const lower = queryText.toLowerCase();
  const filtered = allNews.filter(n =>
    (n.title || "").toLowerCase().includes(lower) ||
    (n.description || "").toLowerCase().includes(lower)
  );
  displayNews(filtered);
}

async function loadProducts() {
  try {
    const productsSnapshot = await getDocs(collection(db, "products"));
    allProducts = [];
    productsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      allProducts.push({ id: docSnap.id, ...data });
    });
    displayProducts(allProducts);
  } catch (error) {
    console.error("Помилка завантаження товарів:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка завантаження товарів.', type: 'text', value: error.message, readonly: true }], () => {});
  }
}

function displayProducts(products) {
  const table = document.getElementById('productsTable');
  table.innerHTML = "";
  if (products.length === 0) {
    table.innerHTML = `<tr><td colspan="6" style="text-align: center;">Немає товарів.</td></tr>`;
    return;
  }
  products.forEach((product) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${product.name || 'Немає назви'}</td>
      <td>${product.price || 'Немає ціни'}</td>
      <td>${product.description || 'Немає опису'}</td>
      <td>${product.image || 'Немає зображення'}</td>
      <td>${product.article || 'Немає артикулу'}</td>
      <td>
        <button class="edit-btn" onclick="editProduct('${product.id}')">Редагувати</button>
        <button class="delete-btn" onclick="deleteProduct('${product.id}')">Видалити</button>
      </td>
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

function searchProducts(queryText) {
  const lowerQuery = queryText.toLowerCase();
  const filtered = allProducts.filter(product => {
    const name = (product.name || "").toLowerCase();
    const description = (product.description || "").toLowerCase();
    const article = (product.article || "").toLowerCase();
    return name.includes(lowerQuery) || description.includes(lowerQuery) || article.includes(lowerQuery);
  });
  displayProducts(filtered);
}

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
        <td>${amount} HOT</td>
        <td>${timestamp}</td>
        <td><button class="delete-btn" onclick="deleteTransaction('${docSnap.id}')">Видалити</button></td>
      `;
      table.appendChild(tr);
    });
  } catch (error) {
    console.error("Помилка завантаження транзакцій:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка завантаження транзакцій.', type: 'text', value: error.message, readonly: true }], () => {});
  }
}

window.showUsers = () => {
  document.getElementById('usersTableContainer').style.display = 'table';
  document.getElementById('transfersTableContainer').style.display = 'none';
  document.getElementById('productsTableContainer').style.display = 'none';
  document.getElementById('newsTableContainer').style.display = 'none';
  document.getElementById('clubs')

('TableContainer').style.display = 'none';
  document.getElementById('plansTableContainer').style.display = 'none';
  document.getElementById('searchContainer').style.display = 'block';
  document.getElementById('productSearchContainer').style.display = 'none';
  document.getElementById('newsSearchContainer').style.display = 'none';
  document.getElementById('clubSearchContainer').style.display = 'none';
  document.getElementById('planSearchContainer').style.display = 'none';
  loadUsers();
};

window.showTransfers = () => {
  document.getElementById('usersTableContainer').style.display = 'none';
  document.getElementById('transfersTableContainer').style.display = 'table';
  document.getElementById('productsTableContainer').style.display = 'none';
  document.getElementById('newsTableContainer').style.display = 'none';
  document.getElementById('clubsTableContainer').style.display = 'none';
  document.getElementById('plansTableContainer').style.display = 'none';
  document.getElementById('searchContainer').style.display = 'none';
  document.getElementById('productSearchContainer').style.display = 'none';
  document.getElementById('newsSearchContainer').style.display = 'none';
  document.getElementById('clubSearchContainer').style.display = 'none';
  document.getElementById('planSearchContainer').style.display = 'none';
  loadTransfers();
};

window.showProducts = () => {
  document.getElementById('usersTableContainer').style.display = 'none';
  document.getElementById('transfersTableContainer').style.display = 'none';
  document.getElementById('productsTableContainer').style.display = 'table';
  document.getElementById('newsTableContainer').style.display = 'none';
  document.getElementById('clubsTableContainer').style.display = 'none';
  document.getElementById('plansTableContainer').style.display = 'none';
  document.getElementById('searchContainer').style.display = 'none';
  document.getElementById('productSearchContainer').style.display = 'block';
  document.getElementById('newsSearchContainer').style.display = 'none';
  document.getElementById('clubSearchContainer').style.display = 'none';
  document.getElementById('planSearchContainer').style.display = 'none';
  loadProducts();
};

window.editBalance = async function(userId) {
  const fields = [
    { id: 'balance', label: 'Новий баланс', type: 'number', placeholder: 'Введіть баланс', required: true }
  ];
  const values = await showModal('Редагувати баланс', fields);
  if (!values || !values.balance || isNaN(values.balance) || parseFloat(values.balance) < 0) {
    showModal('Error', [{ id: 'error', label: 'Будь ласка, введіть коректний баланс.', type: 'text', readonly: true }], () => {});
    return;
  }
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      balance: parseFloat(values.balance)
    });
    showModal('Success', [{ id: 'success', label: 'Баланс оновлено!', type: 'text', readonly: true }], () => {});
    loadUsers();
  } catch (error) {
    console.error("Помилка оновлення балансу:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка оновлення балансу.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.editUsername = async function(userId) {
  const fields = [
    { id: 'username', label: 'Нове ім’я користувача', type: 'text', placeholder: 'Введіть ім’я', required: true }
  ];
  const values = await showModal('Редагувати ім’я', fields);
  if (!values || !values.username) {
    showModal('Error', [{ id: 'error', label: 'Будь ласка, введіть коректне ім’я.', type: 'text', readonly: true }], () => {});
    return;
  }
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      username: values.username
    });
    showModal('Success', [{ id: 'success', label: 'Ім’я користувача оновлено!', type: 'text', readonly: true }], () => {});
    loadUsers();
  } catch (error) {
    console.error("Помилка оновлення імені:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка оновлення імені.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.editCardNumber = async function(userId) {
  const fields = [
    { id: 'cardNumber', label: 'Новий номер картки', type: 'text', placeholder: 'Вensteinіть номер картки' }
  ];
  const values = await showModal('Редагувати номер картки', fields);
  if (!values) return;
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      cardNumber: values.cardNumber || ''
    });
    showModal('Success', [{ id: 'success', label: 'Номер картки оновлено!', type: 'text', readonly: true }], () => {});
    loadUsers();
  } catch (error) {
    console.error("Помилка оновлення номера картки:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка оновлення номера картки.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.deleteTransaction = async function(transactionId) {
  const confirmed = await showConfirmModal('Ви впевнені, що хочете видалити цю транзакцію?');
  if (!confirmed) return;
  try {
    const transactionRef = doc(db, "transfers", transactionId);
    await deleteDoc(transactionRef);
    showModal('Success', [{ id: 'success', label: 'Транзакцію успішно видалено!', type: 'text', readonly: true }], () => {});
    loadTransfers();
  } catch (error) {
    console.error("Помилка видалення транзакції:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка видалення транзакції.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.deleteUser = async function(userId) {
  const confirmed = await showConfirmModal('Ви впевнені, що хочете видалити цього користувача?');
  if (!confirmed) return;
  try {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    showModal('Success', [{ id: 'success', label: 'Користувача успішно видалено!', type: 'text', readonly: true }], () => {});
    loadUsers();
  } catch (error) {
    console.error("Помилка видалення користувача:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка видалення користувача.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.addUser = async function() {
  const fields = [
    { id: 'username', label: 'Ім’я користувача', type: 'text', placeholder: 'Введіть ім’я', required: true },
    { id: 'balance', label: 'Початковий баланс', type: 'number', placeholder: '0', value: '0' },
    { id: 'cardNumber', label: 'Номер картки', type: 'text', placeholder: 'Введіть номер картки (необов’язково)' }
  ];
  const values = await showModal('Додати користувача', fields);
  if (!values || !values.username) {
    showModal('Error', [{ id: 'error', label: 'Ім’я користувача не може бути порожнім.', type: 'text', readonly: true }], () => {});
    return;
  }
  const balance = values.balance ? parseFloat(values.balance) : 0;
  if (isNaN(balance) || balance < 0) {
    showModal('Error', [{ id: 'error', label: 'Будь ласка, введіть коректне числове значення для балансу.', type: 'text', readonly: true }], () => {});
    return;
  }
  const newUserData = {
    username: values.username,
    balance: balance,
    cardNumber: values.cardNumber || '',
    role: 'user'
  };
  try {
    await addDoc(collection(db, "users"), newUserData);
    showModal('Success', [{ id: 'success', label: 'Користувача успішно додано!', type: 'text', readonly: true }], () => {});
    loadUsers();
  } catch (error) {
    console.error("Помилка при додаванні користувача:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка при додаванні користувача.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.addProduct = async function() {
  const fields = [
    { id: 'name', label: 'Назва товару', type: 'text', placeholder: 'Введіть назву', required: true },
    { id: 'price', label: 'Ціна', type: 'number', placeholder: 'Введіть ціну', required: true },
    { id: 'description', label: 'Опис', type: 'textarea', placeholder: 'Введіть опис' },
    { id: 'image', label: 'URL зображення', type: 'text', placeholder: 'Введіть URL зображення' },
    { id: 'article', label: 'Артикул', type: 'text', placeholder: 'Введіть артикул' }
  ];
  const values = await showModal('Додати товар', fields);
  if (!values || !values.name) {
    showModal('Error', [{ id: 'error', label: 'Назва товару не може бути порожньою.', type: 'text', readonly: true }], () => {});
    return;
  }
  const price = parseFloat(values.price);
  if (isNaN(price) || price < 0) {
    showModal('Error', [{ id: 'error', label: 'Будь ласка, введіть коректне числове значення для ціни.', type: 'text', readonly: true }], () => {});
    return;
  }
  const newProductData = {
    name: values.name,
    price: price,
    description: values.description || '',
    image: values.image || '',
    article: values.article || ''
  };
  try {
    await addDoc(collection(db, "products"), newProductData);
    showModal('Success', [{ id: 'success', label: 'Товар успішно додано!', type: 'text', readonly: true }], () => {});
    loadProducts();
  } catch (error) {
    console.error("Помилка при додаванні товару:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка при додаванні товару.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.editProduct = async function(productId) {
  const productRef = doc(db, "products", productId);
  const productSnap = await getDoc(productRef);
  if (!productSnap.exists()) {
    showModal('Error', [{ id: 'error', label: 'Товар не знайдено!', type: 'text', readonly: true }], () => {});
    return;
  }
  const productData = productSnap.data();
  const fields = [
    { id: 'name', label: 'Назва товару', type: 'text', value: productData.name, required: true },
    { id: 'price', label: 'Ціна', type: 'number', value: productData.price, required: true },
    { id: 'description', label: 'Опис', type: 'textarea', value: productData.description },
    { id: 'image', label: 'URL зображення', type: 'text', value: productData.image },
    { id: 'article', label: 'Артикул', type: 'text', value: productData.article }
  ];
  const values = await showModal('Редагувати товар', fields);
  if (!values || !values.name) {
    showModal('Error', [{ id: 'error', label: 'Назва товару не може бути порожньою.', type: 'text', readonly: true }], () => {});
    return;
  }
  const price = parseFloat(values.price);
  if (isNaN(price) || price < 0) {
    showModal('Error', [{ id: 'error', label: 'Будь ласка, введіть коректне числове значення для ціни.', type: 'text', readonly: true }], () => {});
    return;
  }
  try {
    await updateDoc(productRef, {
      name: values.name,
      price: price,
      description: values.description || '',
      image: values.image || '',
      article: values.article || ''
    });
    showModal('Success', [{ id: 'success', label: 'Товар успішно оновлено!', type: 'text', readonly: true }], () => {});
    loadProducts();
  } catch (error) {
    console.error("Помилка при оновленні товару:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка при оновленні товару.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.deleteProduct = async function(productId) {
  const confirmed = await showConfirmModal('Ви впевнені, що хочете видалити цей товарconstexpr')

 ('товар?');
  if (!confirmed) return;
  try {
    const productRef = doc(db, "products", productId);
    await deleteDoc(productRef);
    showModal('Success', [{ id: 'success', label: 'Товар успішно видалено!', type: 'text', readonly: true }], () => {});
    loadProducts();
  } catch (error) {
    console.error("Помилка при видаленні товару:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка при видаленні товару.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

async function loadClubs() {
  try {
    const snapshot = await getDocs(collection(db, "clubs"));
    allClubs = [];
    snapshot.forEach(docSnap => {
      allClubs.push({ id: docSnap.id, ...docSnap.data() });
    });
    displayClubs(allClubs);
  } catch (error) {
    console.error("Помилка завантаження клубів:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка завантаження клубів.', type: 'text', value: error.message, readonly: true }], () => {});
  }
}

function displayClubs(clubs) {
  const table = document.getElementById("clubsTable");
  table.innerHTML = "";
  if (clubs.length === 0) {
    table.innerHTML = `<tr><td colspan="7" style="text-align:center;">Немає клубів.</td></tr>`;
    return;
  }
  clubs.forEach(club => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${club.name || "—"}</td>
      <td>${club.description || "—"}</td>
      <td><img src="${club.image || ""}" alt="клуб" style="max-width:80px;"></td>
      <td><img src="${club.image2 || ""}" alt="ведучий клубу" style="max-width:80px;"></td>
      <td>${club.leaderName || "—"}</td>
      <td><a href="${club.googleForm || "#"}" target="_blank">${club.googleForm ? "Відкрити форму" : "—"}</a></td>
      <td>
        <button class="edit-btn" onclick="editClub('${club.id}')">Редагувати</button>
        <button class="delete-btn" onclick="deleteClub('${club.id}')">Видалити</button>
      </td>
    `;
    table.appendChild(tr);
  });
}

window.addClub = async function() {
  const fields = [
    { id: 'name', label: 'Назва клубу', type: 'text', placeholder: 'Введіть назву', required: true },
    { id: 'description', label: 'Опис', type: 'textarea', placeholder: 'Введіть опис' },
    { id: 'image', label: 'URL першого зображення', type: 'text', placeholder: 'Введіть URL' },
    { id: 'image2', label: 'URL другого зображення (ведучого)', type: 'text', placeholder: 'Введіть URL' },
    { id: 'leaderName', label: 'Ім’я ведучого', type: 'text', placeholder: 'Введіть ім’я' },
    { id: 'googleForm', label: 'Посилання на Google Form', type: 'text', placeholder: 'Введіть посилання' }
  ];
  const values = await showModal('Додати клуб', fields);
  if (!values || !values.name) {
    showModal('Error', [{ id: 'error', label: 'Назва клубу не може бути порожньою.', type: 'text', readonly: true }], () => {});
    return;
  }
  const newClub = {
    name: values.name,
    description: values.description || '',
    image: values.image || '',
    image2: values.image2 || '',
    leaderName: values.leaderName || '',
    googleForm: values.googleForm || ''
  };
  try {
    await addDoc(collection(db, "clubs"), newClub);
    showModal('Success', [{ id: 'success', label: 'Клуб додано!', type: 'text', readonly: true }], () => {});
    loadClubs();
  } catch (error) {
    console.error("Помилка додавання клубу:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка додавання клубу.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.editClub = async function(id) {
  const ref = doc(db, "clubs", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    showModal('Error', [{ id: 'error', label: 'Клуб не знайдено!', type: 'text', readonly: true }], () => {});
    return;
  }
  const data = snap.data();
  const fields = [
    { id: 'name', label: 'Назва', type: 'text', value: data.name, required: true },
    { id: 'description', label: 'Опис', type: 'textarea', value: data.description },
    { id: 'image', label: 'URL першого зображення', type: 'text', value: data.image },
    { id: 'image2', label: 'URL другого зображення (ведучого)', type: 'text', value: data.image2 },
    { id: 'leaderName', label: 'Ім’я ведучого', type: 'text', value: data.leaderName },
    { id: 'googleForm', label: 'Посилання на Google Form', type: 'text', value: data.googleForm }
  ];
  const values = await showModal('Редагувати клуб', fields);
  if (!values || !values.name) {
    showModal('Error', [{ id: 'error', label: 'Назва клубу не може бути порожньою.', type: 'text', readonly: true }], () => {});
    return;
  }
  try {
    await updateDoc(ref, {
      name: values.name,
      description: values.description || '',
      image: values.image || '',
      image2: values.image2 || '',
      leaderName: values.leaderName || '',
      googleForm: values.googleForm || ''
    });
    showModal('Success', [{ id: 'success', label: 'Клуб оновлено!', type: 'text', readonly: true }], () => {});
    loadClubs();
  } catch (error) {
    console.error("Помилка оновлення клубу:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка оновлення.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.deleteClub = async function(id) {
  const confirmed = await showConfirmModal('Видалити клуб?');
  if (!confirmed) return;
  try {
    await deleteDoc(doc(db, "clubs", id));
    showModal('Success', [{ id: 'success', label: 'Клуб видалено!', type: 'text', readonly: true }], () => {});
    loadClubs();
  } catch (error) {
    console.error("Помилка видалення клубу:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка видалення.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

function searchClubs(queryText) {
  const lower = queryText.toLowerCase();
  const filtered = allClubs.filter(club =>
    (club.name || "").toLowerCase().includes(lower) ||
    (club.description || "").toLowerCase().includes(lower) ||
    (club.leaderName || "").toLowerCase().includes(lower)
  );
  displayClubs(filtered);
}

async function loadPlans() {
  try {
    const snapshot = await getDocs(collection(db, "plans"));
    allPlans = [];
    snapshot.forEach(docSnap => {
      allPlans.push({ id: docSnap.id, ...docSnap.data() });
    });
    displayPlans(allPlans);
  } catch (error) {
    console.error("Помилка завантаження планів:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка завантаження планів.', type: 'text', value: error.message, readonly: true }], () => {});
  }
}

function displayPlans(plans) {
  const table = document.getElementById("plansTable");
  table.innerHTML = "";
  if (plans.length === 0) {
    table.innerHTML = `<tr><td colspan="5" style="text-align:center;">Немає планів.</td></tr>`;
    return;
  }
  plans.forEach(plan => {
    const date = plan.timestamp?.toDate().toLocaleDateString() || "—";
    const progress = plan.progress ?? 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${plan.title || "—"}</td>
      <td>${plan.description || "—"}</td>
      <td>${date}</td>
      <td>
        <div style="width:120px; background:#eee; border-radius:6px; overflow:hidden;">
          <div style="width:${progress}%; background:#4caf50; color:white; text-align:center; font-size:12px;">
            ${progress}%
          </div>
        </div>
      </td>
      <td>
        <button class="edit-btn" onclick="editPlan('${plan.id}')">Редагувати</button>
        <button class="delete-btn" onclick="deletePlan('${plan.id}')">Видалити</button>
      </td>
    `;
    table.appendChild(tr);
  });
}

window.addPlan = async function() {
  const fields = [
    { id: 'title', label: 'Заголовок', type: 'text', placeholder: 'Введіть заголовок', required: true },
    { id: 'description', label: 'Опис', type: 'textarea', placeholder: 'Введіть опис' },
    { id: 'progress', label: 'Прогрес виконання (0-100)', type: 'number', placeholder: '0', value: '0' }
  ];
  const values = await showModal('Додати план', fields);
  if (!values || !values.title) {
    showModal('Error', [{ id: 'error', label: 'Заголовок не може бути порожнім.', type: 'text', readonly: true }], () => {});
    return;
  }
  const progress = parseInt(values.progress) || 0;
  const newPlan = {
    title: values.title,
    description: values.description || '',
    progress: isNaN(progress) ? 0 : Math.min(Math.max(progress, 0), 100),
    timestamp: new Date()
  };
  try {
    await addDoc(collection(db, "plans"), newPlan);
    showModal('Success', [{ id: 'success', label: 'План додано!', type: 'text', readonly: true }], () => {});
    loadPlans();
  } catch (error) {
    console.error("Помилка додавання плану:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка додавання плану.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.editPlan = async function(id) {
  const ref = doc(db, "plans", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    showModal('Error', [{ id: 'error', label: 'План не знайдено!', type: 'text', readonly: true }], () => {});
    return;
  }
  const data = snap.data();
  const fields = [
    { id: 'title', label: 'Заголовок', type: 'text', value: data.title, required: true },
    { id: 'description', label: 'Опис', type: 'textarea', value: data.description },
    { id: 'progress', label: 'Прогрес виконання (0-100)', type: 'number', value: data.progress ?? 0 }
  ];
  const values = await showModal('Редагувати план', fields);
  if (!values || !values.title) {
    showModal('Error', [{ id: 'error', label: 'Заголовок не може бути порожнім.', type: 'text', readonly: true }], () => {});
    return;
  }
  const progress = parseInt(values.progress) || 0;
  try {
    await updateDoc(ref, {
      title: values.title,
      description: values.description || '',
      progress: isNaN(progress) ? 0 : Math.min(Math.max(progress, 0), 100)
    });
    showModal('Success', [{ id: 'success', label: 'План оновлено!', type: 'text', readonly: true }], () => {});
    loadPlans();
  } catch (error) {
    console.error("Помилка оновлення плану:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка оновлення.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.deletePlan = async function(id) {
  const confirmed = await showConfirmModal('Видалити план?');
  if (!confirmed) return;
  try {
    await deleteDoc(doc(db, "plans", id));
    showModal('Success', [{ id: 'success', label: 'План видалено!', type: 'text', readonly: true }], () => {});
    loadPlans();
  } catch (error) {
    console.error("Помилка видалення плану:", error);
    showModal('Error', [{ id: 'error', label: 'Помилка видалення.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.showClubs = () => {
  document.getElementById('usersTableContainer').style.display = 'none';
  document.getElementById('transfersTableContainer').style.display = 'none';
  document.getElementById('productsTableContainer').style.display = 'none';
  document.getElementById('newsTableContainer').style.display = 'none';
  document.getElementById('clubsTableContainer').style.display = 'table';
  document.getElementById('plansTableContainer').style.display = 'none';
  document.getElementById('searchContainer').style.display = 'none';
  document.getElementById('productSearchContainer').style.display = 'none';
  document.getElementById('newsSearchContainer').style.display = 'none';
  document.getElementById('clubSearchContainer').style.display = 'block';
  document.getElementById('planSearchContainer').style.display = 'none';
  loadClubs();
};

window.showPlans = () => {
  document.getElementById('usersTableContainer').style.display = 'none';
  document.getElementById('transfersTableContainer').style.display = 'none';
  document.getElementById('productsTableContainer').style.display = 'none';
  document.getElementById('newsTableContainer').style.display = 'none';
  document.getElementById('clubsTableContainer').style.display = 'none';
  document.getElementById('plansTableContainer').style.display = 'table';
  document.getElementById('searchContainer').style.display = 'none';
  document.getElementById('productSearchContainer').style.display = 'none';
  document.getElementById('newsSearchContainer').style.display = 'none';
  document.getElementById('clubSearchContainer').style.display = 'none';
  document.getElementById('planSearchContainer').style.display = 'block';
  loadPlans();
};

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('userSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      searchUsers(event.target.value);
    });
  }
  const productSearchInput = document.getElementById('productSearchInput');
  if (productSearchInput) {
    productSearchInput.addEventListener('input', (event) => {
      searchProducts(event.target.value);
    });
  }
  const newsSearchInput = document.getElementById('newsSearchInput');
  if (newsSearchInput) {
    newsSearchInput.addEventListener('input', (event) => {
      searchNews(event.target.value);
    });
  }
  const clubSearchInput = document.getElementById('clubSearchInput');
  if (clubSearchInput) {
    clubSearchInput.addEventListener('input', (event) => {
      searchClubs(event.target.value);
    });
  }
  const planSearchInput = document.getElementById('planSearchInput');
  if (planSearchInput) {
    planSearchInput.addEventListener('input', (event) => {
      const lower = event.target.value.toLowerCase();
      const filtered = allPlans.filter(plan =>
        (plan.title || "").toLowerCase().includes(lower) ||
        (plan.description || "").toLowerCase().includes(lower)
      );
      displayPlans(filtered);
    });
  }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists() && userSnap.data().role === "admin") {
      loadUsers();
    } else {
      document.body.innerHTML = "<h2 style='color: red;'>Доступ заборонено: Ви не адміністратор</h2>";
    }
  } else {
    window.location.href = "login.html";
  };})