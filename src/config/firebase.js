import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    // Replace with your Firebase config
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

// src/services/timetableService.js
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const saveTimetable = async (teacherName, timetableData) => {
    try {
        const timetablesRef = collection(db, 'timetables');
        const q = query(timetablesRef, where('teacherName', '==', teacherName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docId = querySnapshot.docs[0].id;
            await updateDoc(doc(db, 'timetables', docId), { timetableData });
        } else {
            await addDoc(timetablesRef, {
                teacherName,
                timetableData,
                createdAt: new Date()
            });
        }
    } catch (error) {
        console.error('Error saving timetable:', error);
        throw error;
    }
};  