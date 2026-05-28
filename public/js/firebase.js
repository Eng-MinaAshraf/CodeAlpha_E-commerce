/**
 * @fileoverview Firebase initialization module
 * @description تهيئة Firebase وتصدير الخدمات الأساسية
 * @module firebase
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

/**
 * Firebase project configuration
 * @type {Object}
 */
const firebaseConfig = {
  apiKey: "AIzaSyA6gDKeyKJfbj3V_fIrkCJzXNS90jkFdUg",
  authDomain: "project-firebase-49e06.firebaseapp.com",
  projectId: "project-firebase-49e06",
  storageBucket: "project-firebase-49e06.firebasestorage.app",
  messagingSenderId: "728318998528",
  appId: "1:728318998528:web:c40649313d3596c6b080e5"
};

/** @type {import('firebase/app').FirebaseApp} */
const app = initializeApp(firebaseConfig);

/** @type {import('firebase/auth').Auth} */
const auth = getAuth(app);

/** @type {import('firebase/firestore').Firestore} */
const db = getFirestore(app);

/** @type {import('firebase/auth').GoogleAuthProvider} */
const googleProvider = new GoogleAuthProvider();

// إضافة نطاقات Google OAuth الإضافية
googleProvider.addScope("profile");
googleProvider.addScope("email");

export { app, auth, db, googleProvider };
