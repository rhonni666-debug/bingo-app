import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD_UWOOZNE22j7-tU_NU3y2IdgCh18TSqU",
  authDomain: "boteco-da-sorte.firebaseapp.com",
  projectId: "boteco-da-sorte",
  storageBucket: "boteco-da-sorte.firebasestorage.app",
  messagingSenderId: "643302706155",
  appId: "1:643302706155:web:6cab665a61b33c6881a7ae",
  measurementId: "G-06HZ9Z755V"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);