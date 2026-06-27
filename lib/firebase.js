import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAQxHns9JjNkjwump2GrLHBceaEsmpNBOI",
  authDomain: "brutalaudit.firebaseapp.com",
  projectId: "brutalaudit",
  storageBucket: "brutalaudit.firebasestorage.app",
  messagingSenderId: "1081521820818",
  appId: "1:1081521820818:web:458aec9c159c875b52824b",
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export { app, auth, googleProvider, githubProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };
