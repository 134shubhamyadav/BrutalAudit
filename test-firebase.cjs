const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyAQxHns9JjNkjwump2GrLHBceaEsmpNBOI",
  authDomain: "brutalaudit.firebaseapp.com",
  projectId: "brutalaudit",
  storageBucket: "brutalaudit.firebasestorage.app",
  messagingSenderId: "1081521820818",
  appId: "1:1081521820818:web:458aec9c159c875b52824b",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test() {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, "test-user-brutal-audit-999@example.com", "Password123!");
    console.log("Success:", userCredential.user.uid);
  } catch (err) {
    console.error("Full Error:", err);
    if (err.customData) {
      console.error("Custom Data:", err.customData);
    }
  }
}

test();
