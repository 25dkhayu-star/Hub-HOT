const express = require("express");
const path = require("path");
const fetch = require("node-fetch"); // npm install node-fetch@2
const admin = require("firebase-admin");

// 🔹 Подключение Firebase Admin SDK
const serviceAccount = require("./lyceumbank-firebase.json"); // путь к твоему JSON ключу

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Генератор номера карты
function generateCardNumber() {
  return "88888888" + Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join("");
}

// 🔹 Endpoint: LDAP + Firebase
app.post("/api/ldap-login", async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: "Login and password required" });
  }

  try {
    // 1️⃣ Проверка LDAP
    const ldapResponse = await fetch("https://services.lyceum.ztu.edu.ua/ldap/auth/ldap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password })
    });

    const ldapData = await ldapResponse.json();
    console.log("LDAP response status:", ldapResponse.status);
    console.log("LDAP response body:", ldapData);

    if (!ldapResponse.ok || !ldapData.ok) {
      return res.status(401).json({ error: ldapData.detail || "LDAP authentication failed" });
    }

    // 2️⃣ Проверка/создание пользователя в Firebase
    const usersRef = db.collection("users");
    const querySnapshot = await usersRef.where("login", "==", login).get();

    let userData;
    if (querySnapshot.empty) {
      // Пользователь не найден → создаём
      const newUser = {
        login,
        username: login,
        balance: 100,
        cardNumber: generateCardNumber()
      };
      const userRef = await usersRef.add(newUser);
      userData = { id: userRef.id, ...newUser };
    } else {
      // Пользователь уже есть
      const doc = querySnapshot.docs[0];
      userData = { id: doc.id, ...doc.data() };
    }

    // 3️⃣ Возвращаем фронту
    res.json({
      success: true,
      username: userData.username,
      balance: userData.balance,
      cardNumber: userData.cardNumber
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
