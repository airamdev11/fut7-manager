// src/lib/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAx8RXEoxu6HOzpHGuz1HGvAKjxAaNj1BQ",
    authDomain: "fut7-manager.firebaseapp.com",
    projectId: "fut7-manager",
    storageBucket: "fut7-manager.firebasestorage.app",
    messagingSenderId: "544111313951",
    appId: "1:544111313951:web:9520ee8f6b4bfbc861412a",
    measurementId: "G-HTF40ZDSH9"
  };

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
