import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // ▼ 追加

// ※ここをご自身のFirebase設定情報に書き換えてください
const firebaseConfig = {
  apiKey: "AIzaSyBYX377gv9cx_yPwzBTbPvK4mWCoX4-z_s",
  authDomain: "homeless-survival.firebaseapp.com",
  databaseURL: "https://homeless-survival-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "homeless-survival",
  storageBucket: "homeless-survival.firebasestorage.app",
  messagingSenderId: "221306363708",
  appId: "1:221306363708:web:def9c3552a5d03d007c839",
  measurementId: "G-CDRNJEQCQ8"
};

// ▼ ここに export を追加します
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app); // ▼ 追加: Authインスタンスの共通化
export const googleProvider = new GoogleAuthProvider(); // ▼ 追加: Googleログインプロバイダ