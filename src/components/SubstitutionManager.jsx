import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Copy, Check, Loader2} from 'lucide-react';
import { getAllTeachers, getTeacherTimetable } from '../services/timetableService';
import { useNotification } from '../contexts/NotificationContext';

import {
    getPeriodNumber
} from '../constants/timetable';

export default function SubstitutionManager() {
    const [loading, setLoading] = useState(true);
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [absentTeachers, setAbsentTeachers] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [substitutionMessage, setSubstitutionMessage] = useState('');
    const [showCopied, setShowCopied] = useState(false);
    const { showNotification } = useNotification();

    useEffect(() => {
        loadTeachers();
    }, []);

    const loadTeachers = async () => {
        try {
            const teachersList = await getAllTeachers();
            setTeachers(teachersList);
            setLoading(false);
        } catch (error) {
            showNotification('Failed to load teachers: ' + error.message, 'error');
            setLoading(false);
        }
    };

    const handleAddAbsentTeacher = () => {
        if (!selectedTeacher) return;
        const teacher = teachers.find(t => t.id === selectedTeacher);
        if (teacher && !absentTeachers.find(t => t.id === teacher.id)) {
            setAbsentTeachers(prev => [...prev, teacher]);
            setSelectedTeacher('');
        }
    };

    const handleRemoveAbsentTeacher = (teacherId) => {
        setAbsentTeachers(prev => prev.filter(t => t.id !== teacherId));
    };

    const generateSubstitutionMessage = async () => {
        if (absentTeachers.length === 0) {
            showNotification('Please select at least one absent teacher', 'error');
            return;
        }

        try {
            setLoading(true);

            // Get the day of week
            const dateObj = new Date(date);
            const dayIndex = dateObj.getDay() - 1; // 0 = Sunday, so -1 gives us Monday = 0
            if (dayIndex < 0 || dayIndex > 4) {
                throw new Error('Please select a weekday (Monday-Friday)');
            }
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
            const currentDay = days[dayIndex];

            let message = 'Good morning\n';
            let availableTeachers = [...teachers]; // Copy of all teachers for substitution

            for (const absentTeacher of absentTeachers) {
                let hasClasses = false;
                const timetable = await getTeacherTimetable(absentTeacher.id);

                // Get all periods where this teacher has classes
                const periodsNeeded = [];
                for (const period of Object.keys(timetable.periods[currentDay] || {})) {
                    const classInfo = timetable.periods[currentDay][period];
                    if (classInfo && classInfo !== 'FREE') {
                        periodsNeeded.push({
                            time: period,
                            class: classInfo
                        });
                        hasClasses = true;
                    }
                }

                if (hasClasses) {
                    message += `\nSubs for ${absentTeacher.code}\n`;

                    // Sort periods chronologically
                    periodsNeeded.sort((a, b) => {
                        const timeA = a.time.split(':').map(Number);
                        const timeB = b.time.split(':').map(Number);
                        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
                    });

                    // Assign substitutes for each period
                    for (const periodInfo of periodsNeeded) {
                        const availableSubs = await findAvailableTeachersForPeriod(
                            availableTeachers,
                            currentDay,
                            periodInfo.time
                        );

                        if (availableSubs.length > 0) {
                            const substitute = availableSubs[0];
                            const periodNum = getPeriodNumber(periodInfo.time);
                            message += `P${periodNum} ${periodInfo.class} - ${substitute.code}\n`;
                        }
                    }
                }
            }

            setSubstitutionMessage(message);
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const findAvailableTeachersForPeriod = async (teachers, day, period) => {
        const available = [];
        for (const teacher of teachers) {
            const timetable = await getTeacherTimetable(teacher.id);
            if (!timetable.periods[day] || timetable.periods[day][period] === 'FREE') {
                available.push(teacher);
            }
        }
        // Sort by number of previous substitutions (would need to implement this)
        return available;
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(substitutionMessage);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
            showNotification('Message copied to clipboard');
        } catch (error) {
            showNotification('Failed to copy message', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Generate Substitution Message</CardTitle>
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <select
                            value={selectedTeacher}
                            onChange={(e) => setSelectedTeacher(e.target.value)}
                            className="flex-1 p-2 border rounded"
                        >
                            <option value="">Select absent teacher</option>
                            {teachers.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.code} - {teacher.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleAddAbsentTeacher}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Add
                        </button>
                    </div>

                    {absentTeachers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {absentTeachers.map(teacher => (
                                <div
                                    key={teacher.id}
                                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded"
                                >
                                    {teacher.code}
                                    <button
                                        onClick={() => handleRemoveAbsentTeacher(teacher.id)}
                                        className="hover:text-blue-600"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="p-2 border rounded"
                        />
                        <button
                            onClick={generateSubstitutionMessage}
                            disabled={absentTeachers.length === 0}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                        >
                            Generate Message
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {substitutionMessage && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium">WhatsApp Message</h3>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                {showCopied ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                        <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded border">
                            {substitutionMessage}
                        </pre>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}