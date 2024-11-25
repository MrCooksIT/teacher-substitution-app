import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBiVf0UFqH7szCQfcbHbGSbbXoTcbVDEh8",
    authDomain: "substituteme-de4ad.firebaseapp.com",
    projectId: "substituteme-de4ad",
    storageBucket: "substituteme-de4ad.firebasestorage.app",
    messagingSenderId: "490257494893",
    appId: "1:490257494893:web:82589cd5146a83bd336064",
    measurementId: "G-LXC255CJV3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);