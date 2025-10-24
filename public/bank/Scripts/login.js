import { auth, db } from './firebase.js';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Вхід через пошту та пароль
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (userDoc.exists()) {
      const username = userDoc.data().username;
      sessionStorage.setItem('username', username);
      window.location.href = "main.html";
    } else {
      alert("User not found in database.");
    }
  } catch (error) {
    console.error("Помилка входу:", error.message);
    alert("Login error: " + error.message);
  }
});

// Вхід через гугл
document.getElementById('googleSignIn').addEventListener('click', async (e) => {
  e.preventDefault();
  const provider = new GoogleAuthProvider();

  // Генерація номера картки
  const generateCardNumber = () => {
    const randomPart = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
    return '88888888' + randomPart;
  };

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
    
      document.getElementById('emailGroup').style.display = 'none';
      document.getElementById('passwordGroup').style.display = 'none';
      document.getElementById('loginButton').style.display = 'none';
      document.getElementById('googleSignIn').style.display = 'none';
      document.getElementById('usernameGroup').style.display = 'block';
      document.getElementById('usernameButton').style.display = 'block';

      // Обробка введення імені 
      document.getElementById('usernameButton').addEventListener('click', async () => {
        const username = document.getElementById('usernameInput').value.trim();
        if (username) {
          // Зберегти дані в базі
          await setDoc(userDocRef, {
            username: username,
            email: user.email,
            balance: 0,
            cardNumber: generateCardNumber()
          }, { merge: true });

          // Зберегти ім'я
          sessionStorage.setItem('username', username);
          window.location.href = "main.html";
        } else {
          document.getElementById('username-error').style.display = 'block';
        }
      });
    } else {
      // Для існуючих користувачів
      const username = userDoc.data().username;
      sessionStorage.setItem('username', username);
      window.location.href = "main.html";
    }
  } catch (error) {
    console.error("Помилка входу через Google:", error.message);
    alert("Google login error: " + error.message);
  }
});