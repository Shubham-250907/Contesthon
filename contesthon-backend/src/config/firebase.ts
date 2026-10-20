import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "kritikal-hack.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: "kritikal-hack.firebasestorage.app",
  messagingSenderId: "245281286448",
  appId: "1:245281286448:web:18b1781d4eccce1a69c0f5",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
