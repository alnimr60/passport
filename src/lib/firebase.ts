import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDILzw9HRIcfe4VPiyafAzeVbw2WcyPN5Y",
  authDomain: "passport-game-321c5.firebaseapp.com",
  projectId: "passport-game-321c5",
  storageBucket: "passport-game-321c5.firebasestorage.app",
  messagingSenderId: "608965389229",
  appId: "1:608965389229:web:efa384ef1a0694c1868f24"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth();
