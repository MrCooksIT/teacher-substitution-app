// src/services/timetableService.js

// Mock data structure for our timetable
const mockTeachers = [
    { id: 1, name: "John Doe", subject: "Mathematics" },
    { id: 2, name: "Jane Smith", subject: "English" },
    { id: 3, name: "Bob Wilson", subject: "Science" }
];

const mockSchedule = {
    Monday: {
        "8:00": { teacherId: 1, class: "10A", subject: "Mathematics" },
        "9:00": { teacherId: 2, class: "11B", subject: "English" },
        // Add more periods as needed
    },
    // Add more days
};

export const getTimetableData = () => {
    return {
        teachers: mockTeachers,
        schedule: mockSchedule
    };
};

export const markTeacherAbsent = async (teacherId, date) => {
    // This will be replaced with actual API call later
    console.log(`Marking teacher ${teacherId} absent on ${date}`);
    return true;
};

export const findSubstitute = async (teacherId, period, date) => {
    // This will be replaced with actual logic later
    const availableTeachers = mockTeachers.filter(t => t.id !== teacherId);
    return availableTeachers[0]; // Simply returns first available teacher for now
};