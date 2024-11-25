import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAllTeachers, getTeacherTimetable } from './timetableService';

export const findAvailableTeachers = async (date, period) => {
    try {
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        const teachers = await getAllTeachers();
        const availableTeachers = [];

        for (const teacher of teachers) {
            const timetable = await getTeacherTimetable(teacher.id);
            if (timetable.periods[dayOfWeek]?.[period] === 'FREE') {
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

        // Sort by number of substitutions (fewer first)
        return availableTeachers.sort((a, b) =>
            a.substitutionCount - b.substitutionCount
        );
    } catch (error) {
        console.error('Error finding available teachers:', error);
        throw error;
    }
};
export const findAvailableTeachersForPeriod = async (date, period) => {
    try {
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        const teachers = await getAllTeachers();
        const availableTeachers = [];

        for (const teacher of teachers) {
            const timetable = await getTeacherTimetable(teacher.id);
            if (timetable.periods[dayOfWeek]?.[period] === 'FREE') {
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

        // Sort by number of substitutions (fewer first)
        return availableTeachers.sort((a, b) =>
            a.substitutionCount - b.substitutionCount
        );
    } catch (error) {
        console.error('Error finding available teachers:', error);
        throw error;
    }
};