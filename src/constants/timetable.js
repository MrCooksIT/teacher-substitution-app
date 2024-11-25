export const TEACHING_PERIODS = [
    { time: "8:05", label: "Period 1" },
    { time: "8:50", label: "Period 2" },
    { time: "9:35", label: "Period 3" },
    { time: "10:45", label: "Period 4" },
    { time: "11:30", label: "Period 5" },
    { time: "12:15", label: "Period 6" },
    { time: "13:25", label: "Period 7" },
    { time: "14:10", label: "Period 8" }
];

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const CLASSES = ['Gr8', 'Gr9', 'Gr10', 'Gr11', 'Gr12'];

export const SUBJECTS = [
    'Math', 'English', 'Phyiscs', 'Life Sciences', 'Chemistry', 'Math Lit',
    'History', 'Geography', 'Accounting', 'IT', 'EMS', 'Life Orientation',
    'Afrikaans', 'isiXhosa', 'Art', 'Music', 'Business Studies','PE','Technology'
];

// Helper function to create empty timetable structure
export const createEmptyTimetable = () => {
    const periods = {};

    DAYS.forEach(day => {
        periods[day] = {};
        TEACHING_PERIODS.forEach(period => {
            periods[day][period.time] = 'FREE';
        });
    });

    return periods;
};

// Helper function to get period number from time
export const getPeriodNumber = (time) => {
    const periodIndex = TEACHING_PERIODS.findIndex(p => p.time === time);
    return periodIndex + 1;
};

// Helper function to format class and subject
export const formatClassSubject = (grade, subject) => {
    return grade === 'FREE' ? 'FREE' : `${grade} ${subject}`;
};