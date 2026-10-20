import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDBBamiS4LCxL1JyZZifQrwOgO3Fi1ugHk",
  authDomain: "kritikal-hack.firebaseapp.com",
  projectId: "kritikal-hack",
  storageBucket: "kritikal-hack.firebasestorage.app",
  messagingSenderId: "245281286448",
  appId: "1:245281286448:web:18b1781d4eccce1a69c0f5",
  measurementId: "G-P2G84F52YP"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
