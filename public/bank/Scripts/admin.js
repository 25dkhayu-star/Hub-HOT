import { auth, db } from './firebase.js';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, addDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

let allUsers = [];
let allProducts = [];
let allNews = [];
let allClubs = [];
let allPlans = [];

function showSection(containerId, searchContainerId) {
  const containers = [
    'usersCardContainer', 'transfersCardContainer', 'productsCardContainer',
    'newsCardContainer', 'clubsCardContainer', 'plansCardContainer'
  ];
  const searchContainers = [
    'searchContainer', 'productSearchContainer', 'newsSearchContainer',
    'clubSearchContainer', 'planSearchContainer'
  ];

  containers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.style.display = id === containerId ? 'grid' : 'none';
    } else {
      console.error(`Container with ID ${id} not found`);
    }
  });

  searchContainers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.style.display = id === searchContainerId ? 'flex' : 'none';
    } else {
      console.error(`Search container with ID ${id} not found`);
    }
  });

  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'none';
  }
}


function showModal(title, fields, callback) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalForm = document.getElementById('modalForm');
    const modalMessage = document.getElementById('modalMessage');
    const modalSubmit = document.getElementById('modalSubmit');
    const modalCancel = document.getElementById('modalCancel');

    if (!modal || !modalTitle || !modalForm || !modalMessage || !modalSubmit || !modalCancel) {
      console.error('Modal elements not found');
      resolve(null);
      return;
    }

    modalTitle.textContent = title;
    modalMessage.style.display = 'none';
    modalForm.innerHTML = '';

    fields.forEach(field => {
      const label = document.createElement('label');
      label.textContent = field.label;
      const input = field.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
      input.id = field.id;
      if (input.tagName === 'INPUT') {
        input.type = field.type || 'text';
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

    if (!modal || !modalTitle || !modalForm || !modalMessage || !modalSubmit || !modalCancel) {
      console.error('Modal elements not found');
      resolve(false);
      return;
    }

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
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'block';
  }
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
    await showModal('Error', [{ id: 'error', label: 'Помилка завантаження користувачів.', type: 'text', value: error.message, readonly: true }], () => {});
  } finally {
    if (loading) {
      loading.style.display = 'none';
    }
  }
}

function displayUsers(users) {
  const containerId = 'usersCardContainer';
  const fields = [
    { label: 'Username', key: 'username' },
    { label: 'Email (UID)', key: 'id' },
    { label: 'Balance', key: 'balance' },
    { label: 'Card Number', key: 'cardNumber' }
  ];
  const actions = [
    { label: 'Edit Balance', class: 'edit-btn', callback: (user) => editBalance(user.id) },
    { label: 'Edit Username', class: 'edit-btn', callback: (user) => editUsername(user.id) },
    { label: 'Edit Card', class: 'edit-btn', callback: (user) => editCardNumber(user.id) },
    { label: 'Delete', class: 'delete-btn', callback: (user) => deleteUser(user.id) }
  ];
  renderCards(containerId, users, fields, actions);
}

async function loadNews() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'block';
  }
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
    await showModal('Error', [{ id: 'error', label: 'Помилка завантаження новин.', type: 'text', value: error.message, readonly: true }], () => {});
  } finally {
    if (loading) {
      loading.style.display = 'none';
    }
  }
}

function displayNews(newsArray) {
  const containerId = 'newsCardContainer';
  const fields = [
    { label: 'Title', key: 'title' },
    { label: 'Description', key: 'description' },
    { label: 'Image', key: 'image' },
    { label: 'Date', key: 'timestamp', formatter: (value) => value?.toDate().toLocaleString() || 'N/A' }
  ];
  const actions = [
    { label: 'Edit', class: 'edit-btn', callback: (news) => editNews(news.id) },
    { label: 'Delete', class: 'delete-btn', callback: (news) => deleteNews(news.id) }
  ];
  renderCards(containerId, newsArray, fields, actions);
}

async function loadProducts() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'block';
  }
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
    await showModal('Error', [{ id: 'error', label: 'Помилка завантаження товарів.', type: 'text', value: error.message, readonly: true }], () => {});
  } finally {
    if (loading) {
      loading.style.display = 'none';
    }
  }
}

function displayProducts(products) {
  const containerId = 'productsCardContainer';
  const fields = [
    { label: 'Name', key: 'name' },
    { label: 'Price', key: 'price' },
    { label: 'Description', key: 'description' },
    { label: 'Image', key: 'image' },
    { label: 'Article', key: 'article' }
  ];
  const actions = [
    { label: 'Edit', class: 'edit-btn', callback: (product) => editProduct(product.id) },
    { label: 'Delete', class: 'delete-btn', callback: (product) => deleteProduct(product.id) }
  ];
  renderCards(containerId, products, fields, actions);
}

async function loadTransfers() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'block';
  }
  try {
    const q = query(collection(db, "transfers"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    const transfers = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      transfers.push({ id: docSnap.id, ...data });
    });
    displayTransfers(transfers);
  } catch (error) {
    console.error("Помилка завантаження транзакцій:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка завантаження транзакцій.', type: 'text', value: error.message, readonly: true }], () => {});
  } finally {
    if (loading) {
      loading.style.display = 'none';
    }
  }
}

function displayTransfers(transfers) {
  const containerId = 'transfersCardContainer';
  const fields = [
    { label: 'Sender', key: 'from' },
    { label: 'Recipient', key: 'to' },
    { label: 'Amount', key: 'amount', formatter: (value) => `${value || 0} HOT` },
    { label: 'Date', key: 'timestamp', formatter: (value) => value?.toDate().toLocaleString() || 'N/A' }
  ];
  const actions = [
    { label: 'Delete', class: 'delete-btn', callback: (transfer) => deleteTransaction(transfer.id) }
  ];
  renderCards(containerId, transfers, fields, actions);
}

async function loadClubs() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'block';
  }
  try {
    const snapshot = await getDocs(collection(db, "clubs"));
    allClubs = [];
    snapshot.forEach(docSnap => {
      allClubs.push({ id: docSnap.id, ...docSnap.data() });
    });
    displayClubs(allClubs);
  } catch (error) {
    console.error("Помилка завантаження клубів:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка завантаження клубів.', type: 'text', value: error.message, readonly: true }], () => {});
  } finally {
    if (loading) {
      loading.style.display = 'none';
    }
  }
}

function displayClubs(clubs) {
  const containerId = 'clubsCardContainer';
  const fields = [
    { label: 'Name', key: 'name' },
    { label: 'Description', key: 'description' },
    { label: 'Logo', key: 'image' },
    { label: 'Owner Image', key: 'image2' },
    { label: 'Owner Name', key: 'leaderName' },
    { label: 'Google Form', key: 'googleForm', formatter: (value) => value ? `<a href="${value}" target="_blank">Open Form</a>` : 'N/A' }
  ];
  const actions = [
    { label: 'Edit', class: 'edit-btn', callback: (club) => editClub(club.id) },
    { label: 'Delete', class: 'delete-btn', callback: (club) => deleteClub(club.id) }
  ];
  renderCards(containerId, clubs, fields, actions);
}

async function loadPlans() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'block';
  }
  try {
    const snapshot = await getDocs(collection(db, "plans"));
    allPlans = [];
    snapshot.forEach(docSnap => {
      allPlans.push({ id: docSnap.id, ...docSnap.data() });
    });
    displayPlans(allPlans);
  } catch (error) {
    console.error("Помилка завантаження планів:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка завантаження планів.', type: 'text', value: error.message, readonly: true }], () => {});
  } finally {
    if (loading) {
      loading.style.display = 'none';
    }
  }
}

function displayPlans(plans) {
  const containerId = 'plansCardContainer';
  const fields = [
    { label: 'Title', key: 'title' },
    { label: 'Description', key: 'description' },
    { label: 'Date', key: 'timestamp', formatter: (value) => value?.toDate().toLocaleDateString() || 'N/A' },
    { label: 'Progress', key: 'progress', formatter: (value) => `${value || 0}%` }
  ];
  const actions = [
    { label: 'Edit', class: 'edit-btn', callback: (plan) => editPlan(plan.id) },
    { label: 'Delete', class: 'delete-btn', callback: (plan) => deletePlan(plan.id) }
  ];
  renderCards(containerId, plans, fields, actions);
}

window.showUsers = () => {
  showSection('usersCardContainer', 'searchContainer');
  loadUsers();
};

window.showTransfers = () => {
  showSection('transfersCardContainer', 'searchContainer');
  loadTransfers();
};

window.showProducts = () => {
  showSection('productsCardContainer', 'productSearchContainer');
  loadProducts();
};

window.showNews = () => {
  showSection('newsCardContainer', 'newsSearchContainer');
  loadNews();
};

window.showClubs = () => {
  showSection('clubsCardContainer', 'clubSearchContainer');
  loadClubs();
};

window.showPlans = () => {
  showSection('plansCardContainer', 'planSearchContainer');
  loadPlans();
};

window.addUser = async function() {
  const fields = [
    { id: 'username', label: 'Ім’я користувача', type: 'text', placeholder: 'Введіть ім’я', required: true },
    { id: 'balance', label: 'Початковий баланс', type: 'number', placeholder: '0', value: '0' },
    { id: 'cardNumber', label: 'Номер картки', type: 'text', placeholder: 'Введіть номер картки (необов’язково)' }
  ];
  const values = await showModal('Додати користувача', fields);
  if (!values || !values.username) {
    await showModal('Error', [{ id: 'error', label: 'Ім’я користувача не може бути порожнім.', type: 'text', readonly: true }], () => {});
    return;
  }
  const balance = values.balance ? parseFloat(values.balance) : 0;
  if (isNaN(balance) || balance < 0) {
    await showModal('Error', [{ id: 'error', label: 'Будь ласка, введіть коректне числове значення для балансу.', type: 'text', readonly: true }], () => {});
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
    await showModal('Success', [{ id: 'success', label: 'Користувача успішно додано!', type: 'text', readonly: true }], () => {});
    loadUsers();
  } catch (error) {
    console.error("Помилка при додаванні користувача:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка при додаванні користувача.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.editBalance = async function(userId) {
  const fields = [
    { id: 'balance', label: 'Новий баланс', type: 'number', placeholder: 'Введіть баланс', required: true }
  ];
  const values = await showModal('Редагувати баланс', fields);
  if (!values || !values.balance || isNaN(values.balance) || parseFloat(values.balance) < 0) {
    await showModal('Error', [{ id: 'error', label: 'Будь ласка, введіть коректний баланс.', type: 'text', readonly: true }], () => {});
    return;
  }
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      balance: parseFloat(values.balance)
    });
    await showModal('Success', [{ id: 'success', label: 'Баланс оновлено!', type: 'text', readonly: true }], () => {});
    loadUsers();
  } catch (error) {
    console.error("Помилка оновлення балансу:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка оновлення балансу.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.editUsername = async function(userId) {
  const fields = [
    { id: 'username', label: 'Нове ім’я користувача', type: 'text', placeholder: 'Введіть ім’я', required: true }
  ];
  const values = await showModal('Редагувати ім’я', fields);
  if (!values || !values.username) {
    await showModal('Error', [{ id: 'error', label: 'Будь ласка, введіть коректне ім’я.', type: 'text', readonly: true }], () => {});
    return;
  }
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      username: values.username
    });
    await showModal('Success', [{ id: 'success', label: 'Ім’я користувача оновлено!', type: 'text', readonly: true }], () => {});
    loadUsers();
  } catch (error) {
    console.error("Помилка оновлення імені:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка оновлення імені.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.editCardNumber = async function(userId) {
  const fields = [
    { id: 'cardNumber', label: 'Новий номер картки', type: 'text', placeholder: 'Введіть номер картки' }
  ];
  const values = await showModal('Редагувати номер картки', fields);
  if (!values) return;
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      cardNumber: values.cardNumber || ''
    });
    await showModal('Success', [{ id: 'success', label: 'Номер картки оновлено!', type: 'text', readonly: true }], () => {});
    loadUsers();
  } catch (error) {
    console.error("Помилка оновлення номера картки:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка оновлення номера картки.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.deleteUser = async function(userId) {
  const confirmed = await showConfirmModal('Ви впевнені, що хочете видалити цього користувача?');
  if (!confirmed) return;
  try {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    await showModal('Success', [{ id: 'success', label: 'Користувача успішно видалено!', type: 'text', readonly: true }], () => {});
    loadUsers();
  } catch (error) {
    console.error("Помилка видалення користувача:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка видалення користувача.', type: 'text', value: error.message, readonly: true }], () => {});
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
    await showModal('Error', [{ id: 'error', label: 'Назва товару не може бути порожньою.', type: 'text', readonly: true }], () => {});
    return;
  }
  const price = parseFloat(values.price);
  if (isNaN(price) || price < 0) {
    await showModal('Error', [{ id: 'error', label: 'Будь ласка, введіть коректне числове значення для ціни.', type: 'text', readonly: true }], () => {});
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
    await showModal('Success', [{ id: 'success', label: 'Товар успішно додано!', type: 'text', readonly: true }], () => {});
    loadProducts();
  } catch (error) {
    console.error("Помилка при додаванні товару:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка при додаванні товару.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.editProduct = async function(productId) {
  const productRef = doc(db, "products", productId);
  const productSnap = await getDoc(productRef);
  if (!productSnap.exists()) {
    await showModal('Error', [{ id: 'error', label: 'Товар не знайдено!', type: 'text', readonly: true }], () => {});
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
    await showModal('Error', [{ id: 'error', label: 'Назва товару не може бути порожньою.', type: 'text', readonly: true }], () => {});
    return;
  }
  const price = parseFloat(values.price);
  if (isNaN(price) || price < 0) {
    await showModal('Error', [{ id: 'error', label: 'Будь ласка, введіть коректне числове значення для ціни.', type: 'text', readonly: true }], () => {});
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
    await showModal('Success', [{ id: 'success', label: 'Товар успішно оновлено!', type: 'text', readonly: true }], () => {});
    loadProducts();
  } catch (error) {
    console.error("Помилка при оновленні товару:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка при оновленні товару.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.deleteProduct = async function(productId) {
  const confirmed = await showConfirmModal('Ви впевнені, що хочете видалити цей товар?');
  if (!confirmed) return;
  try {
    const productRef = doc(db, "products", productId);
    await deleteDoc(productRef);
    await showModal('Success', [{ id: 'success', label: 'Товар успішно видалено!', type: 'text', readonly: true }], () => {});
    loadProducts();
  } catch (error) {
    console.error("Помилка при видаленні товару:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка при видаленні товару.', type: 'text', value: error.message, readonly: true }], () => {});
  }
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
    await showModal('Error', [{ id: 'error', label: 'Заголовок не може бути порожнім.', type: 'text', readonly: true }], () => {});
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
    await showModal('Success', [{ id: 'success', label: 'Новину додано!', type: 'text', readonly: true }], () => {});
    loadNews();
  } catch (error) {
    console.error("Помилка при додаванні:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка при додаванні новини.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.editNews = async function(newsId) {
  const ref = doc(db, "news", newsId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await showModal('Error', [{ id: 'error', label: 'Новину не знайдено!', type: 'text', readonly: true }], () => {});
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
    await showModal('Error', [{ id: 'error', label: 'Заголовок обов’язковий.', type: 'text', readonly: true }], () => {});
    return;
  }
  try {
    await updateDoc(ref, {
      title: values.title,
      description: values.description || '',
      fullText: values.fullText || '',
      image: values.image || ''
    });
    await showModal('Success', [{ id: 'success', label: 'Новину оновлено!', type: 'text', readonly: true }], () => {});
    loadNews();
  } catch (error) {
    console.error("Помилка при оновленні:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка оновлення.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.deleteNews = async function(newsId) {
  const confirmed = await showConfirmModal('Видалити новину?');
  if (!confirmed) return;
  try {
    await deleteDoc(doc(db, "news", newsId));
    await showModal('Success', [{ id: 'success', label: 'Новину видалено!', type: 'text', readonly: true }], () => {});
    loadNews();
  } catch (error) {
    console.error("Помилка при видаленні:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка видалення.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

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
    await showModal('Error', [{ id: 'error', label: 'Назва клубу не може бути порожньою.', type: 'text', readonly: true }], () => {});
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
    await showModal('Success', [{ id: 'success', label: 'Клуб додано!', type: 'text', readonly: true }], () => {});
    loadClubs();
  } catch (error) {
    console.error("Помилка додавання клубу:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка додавання клубу.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.editClub = async function(id) {
  const ref = doc(db, "clubs", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await showModal('Error', [{ id: 'error', label: 'Клуб не знайдено!', type: 'text', readonly: true }], () => {});
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
    await showModal('Error', [{ id: 'error', label: 'Назва клубу не може бути порожньою.', type: 'text', readonly: true }], () => {});
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
    await showModal('Success', [{ id: 'success', label: 'Клуб оновлено!', type: 'text', readonly: true }], () => {});
    loadClubs();
  } catch (error) {
    console.error("Помилка оновлення клубу:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка оновлення.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.deleteClub = async function(id) {
  const confirmed = await showConfirmModal('Видалити клуб?');
  if (!confirmed) return;
  try {
    await deleteDoc(doc(db, "clubs", id));
    await showModal('Success', [{ id: 'success', label: 'Клуб видалено!', type: 'text', readonly: true }], () => {});
    loadClubs();
  } catch (error) {
    console.error("Помилка видалення клубу:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка видалення.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.addPlan = async function() {
  const fields = [
    { id: 'title', label: 'Заголовок', type: 'text', placeholder: 'Введіть заголовок', required: true },
    { id: 'description', label: 'Опис', type: 'textarea', placeholder: 'Введіть опис' },
    { id: 'progress', label: 'Прогрес виконання (0-100)', type: 'number', placeholder: '0', value: '0' }
  ];
  const values = await showModal('Додати план', fields);
  if (!values || !values.title) {
    await showModal('Error', [{ id: 'error', label: 'Заголовок не може бути порожнім.', type: 'text', readonly: true }], () => {});
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
    await showModal('Success', [{ id: 'success', label: 'План додано!', type: 'text', readonly: true }], () => {});
    loadPlans();
  } catch (error) {
    console.error("Помилка додавання плану:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка додавання плану.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.editPlan = async function(id) {
  const ref = doc(db, "plans", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await showModal('Error', [{ id: 'error', label: 'План не знайдено!', type: 'text', readonly: true }], () => {});
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
    await showModal('Error', [{ id: 'error', label: 'Заголовок не може бути порожнім.', type: 'text', readonly: true }], () => {});
    return;
  }
  const progress = parseInt(values.progress) || 0;
  try {
    await updateDoc(ref, {
      title: values.title,
      description: values.description || '',
      progress: isNaN(progress) ? 0 : Math.min(Math.max(progress, 0), 100)
    });
    await showModal('Success', [{ id: 'success', label: 'План оновлено!', type: 'text', readonly: true }], () => {});
    loadPlans();
  } catch (error) {
    console.error("Помилка оновлення плану:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка оновлення.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.deletePlan = async function(id) {
  const confirmed = await showConfirmModal('Видалити план?');
  if (!confirmed) return;
  try {
    await deleteDoc(doc(db, "plans", id));
    await showModal('Success', [{ id: 'success', label: 'План видалено!', type: 'text', readonly: true }], () => {});
    loadPlans();
  } catch (error) {
    console.error("Помилка видалення плану:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка видалення.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

window.deleteTransaction = async function(transactionId) {
  const confirmed = await showConfirmModal('Ви впевнені, що хочете видалити цю транзакцію?');
  if (!confirmed) return;
  try {
    const transactionRef = doc(db, "transfers", transactionId);
    await deleteDoc(transactionRef);
    await showModal('Success', [{ id: 'success', label: 'Транзакцію успішно видалено!', type: 'text', readonly: true }], () => {});
    loadTransfers();
  } catch (error) {
    console.error("Помилка видалення транзакції:", error);
    await showModal('Error', [{ id: 'error', label: 'Помилка видалення транзакції.', type: 'text', value: error.message, readonly: true }], () => {});
  }
};

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

function searchNews(queryText) {
  const lower = queryText.toLowerCase();
  const filtered = allNews.filter(n =>
    (n.title || "").toLowerCase().includes(lower) ||
    (n.description || "").toLowerCase().includes(lower)
  );
  displayNews(filtered);
}

function searchClubs(queryText) {
  const lower = queryText.toLowerCase();
  const filtered = allClubs.filter(club =>
    (club.name || "").toLowerCase().includes(lower) ||
    (club.description || "").toLowerCase().includes(lower) ||
    (club.leaderName || "").toLowerCase().includes(lower)
  );
  displayClubs(filtered);
}

function searchPlans(queryText) {
  const lower = queryText.toLowerCase();
  const filtered = allPlans.filter(plan =>
    (plan.title || "").toLowerCase().includes(lower) ||
    (plan.description || "").toLowerCase().includes(lower)
  );
  displayPlans(filtered);
}

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
      searchPlans(event.target.value);
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
  }
});