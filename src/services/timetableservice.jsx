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

export const loadTimetable = async (teacherName) => {
    try {
        const timetablesRef = collection(db, 'timetables');
        const q = query(timetablesRef, where('teacherName', '==', teacherName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data().timetableData;
        }
        return null;
    } catch (error) {
        console.error('Error loading timetable:', error);
        throw error;
    }
};