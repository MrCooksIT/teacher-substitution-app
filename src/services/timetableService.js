import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const getAllTeachers = async () => {
    try {
        const teachersRef = collection(db, 'teachers');
        const snapshot = await getDocs(teachersRef);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching teachers:', error);
        throw error;
    }
};

export const addTeacher = async (teacherData) => {
    try {
        // First check if teacher code already exists
        const teachersRef = collection(db, 'teachers');
        const q = query(teachersRef, where('code', '==', teacherData.code));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            throw new Error('Teacher code already exists');
        }

        // Add new teacher
        const docRef = await addDoc(teachersRef, {
            code: teacherData.code,
            name: teacherData.name,
            createdAt: new Date()
        });

        // Create empty timetable for new teacher
        await addDoc(collection(db, 'timetables'), {
            teacherId: docRef.id,
            periods: createEmptyTimetable(),
            createdAt: new Date()
        });

        return { success: true };
    } catch (error) {
        console.error('Error adding teacher:', error);
        throw error;
    }
};

export const updateTeacher = async (teacherId, teacherData) => {
    try {
        const teacherRef = doc(db, 'teachers', teacherId);
        await updateDoc(teacherRef, {
            code: teacherData.code,
            name: teacherData.name,
            updatedAt: new Date()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating teacher:', error);
        throw error;
    }
};

export const removeTeacher = async (teacherId) => {
    try {
        // Remove teacher's timetable first
        const timetablesRef = collection(db, 'timetables');
        const q = query(timetablesRef, where('teacherId', '==', teacherId));
        const snapshot = await getDocs(q);

        const deletePromises = snapshot.docs.map(doc =>
            deleteDoc(doc.ref)
        );
        await Promise.all(deletePromises);

        // Remove teacher
        await deleteDoc(doc(db, 'teachers', teacherId));

        return { success: true };
    } catch (error) {
        console.error('Error removing teacher:', error);
        throw error;
    }
};

export const getTeacherTimetable = async (teacherId) => {
    try {
        const timetablesRef = collection(db, 'timetables');
        const q = query(timetablesRef, where('teacherId', '==', teacherId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return {
                teacherId,
                periods: createEmptyTimetable()
            };
        }

        return {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data()
        };
    } catch (error) {
        console.error('Error fetching timetable:', error);
        throw error;
    }
};

export const saveTimetable = async (timetableData) => {
    try {
        const timetablesRef = collection(db, 'timetables');

        // Check if timetable exists
        const q = query(timetablesRef, where('teacherId', '==', timetableData.teacherId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // Update existing timetable
            const timetableRef = doc(db, 'timetables', snapshot.docs[0].id);
            await updateDoc(timetableRef, {
                periods: timetableData.periods,
                updatedAt: new Date()
            });
        } else {
            // Create new timetable
            await addDoc(timetablesRef, {
                teacherId: timetableData.teacherId,
                periods: timetableData.periods,
                createdAt: new Date()
            });
        }
    } catch (error) {
        console.error('Error saving timetable:', error);
        throw error;
    }
};

export const findAvailableTeachers = async (date, period) => {
    try {
        const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
            .substring(0, 3); // Get 'Mon', 'Tue', etc.

        const teachers = await getAllTeachers();
        const availableTeachers = [];

        for (const teacher of teachers) {
            const timetable = await getTeacherTimetable(teacher.id);

            // Check if teacher is free during this period
            if (timetable.periods[day]?.[period] === 'FREE') {
                // Get substitution count for fair distribution
                const substitutionsRef = collection(db, 'substitutions');
                const q = query(
                    substitutionsRef,
                    where('substituteId', '==', teacher.id),
                    where('date', '==', date)
                );
                const subsSnapshot = await getDocs(q);

                availableTeachers.push({
                    ...teacher,
                    substitutionCount: subsSnapshot.size
                });
            }
        }

        // Sort by substitution count (fewer first)
        return availableTeachers.sort((a, b) =>
            a.substitutionCount - b.substitutionCount
        );
    } catch (error) {
        console.error('Error finding available teachers:', error);
        throw error;
    }
};

const createEmptyTimetable = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const periods = {};

    days.forEach(day => {
        periods[day] = {};
        [
            "8:05", "8:50", "9:35", "10:45",
            "11:30", "12:15", "13:25", "14:10"
        ].forEach(time => {
            periods[day][time] = 'FREE';
        });
    });

    return periods;
};