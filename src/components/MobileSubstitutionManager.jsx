import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import {
    Copy, Check, Loader2, X, AlertCircle,
    Monitor, UserPlus, Calendar
} from 'lucide-react';
import { getAllTeachers, getTeacherTimetable } from '../services/timetableService';
import { useNotification } from '../contexts/NotificationContext';
import { TEACHING_PERIODS } from '../constants/timetable';

const MobileSubstitutionManager = () => {
    const [loading, setLoading] = useState(true);
    const [teachers, setTeachers] = useState([]);
    const [showAdjustments, setShowAdjustments] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [absentTeachers, setAbsentTeachers] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [substitutionPlan, setSubstitutionPlan] = useState(null);
    const [showCopied, setShowCopied] = useState(false);
    const [periodSubstitutions, setPeriodSubstitutions] = useState({});
    const { showNotification } = useNotification();

    useEffect(() => {
        loadTeachers();
    }, []);

    const loadTeachers = async () => {
        try {
            const teachersList = await getAllTeachers();
            // Sort teachers by code when loading
            setTeachers(teachersList.sort((a, b) => a.code.localeCompare(b.code)));
            setLoading(false);
        } catch (error) {
            showNotification('Failed to load teachers: ' + error.message, 'error');
            setLoading(false);
        }
    };

    const findAvailableTeachersForPeriod = async (occupiedTeachers, day, period, date) => {
        const available = [];
        for (const teacher of teachers) {
            if (occupiedTeachers.includes(teacher.id)) continue;

            const timetable = await getTeacherTimetable(teacher.id);
            if (!timetable.periods[day] || timetable.periods[day][period] === 'FREE') {
                const todayCount = Object.values(periodSubstitutions)
                    .flat()
                    .filter(sub => sub.substituteId === teacher.id)
                    .length;

                available.push({
                    ...teacher,
                    todayCount,
                });
            }
        }
        return available.sort((a, b) => a.todayCount - b.todayCount);
    };

    const handleAddAbsentTeacher = () => {
        if (!selectedTeacher) return;
        const teacher = teachers.find(t => t.id === selectedTeacher);
        if (teacher && !absentTeachers.find(t => t.id === teacher.id)) {
            setAbsentTeachers(prev => [...prev, teacher]);
            setSelectedTeacher('');
        }
    };

    const handleSelectSubstitute = (periodKey, substituteId) => {
        setPeriodSubstitutions(prev => ({
            ...prev,
            [periodKey]: prev[periodKey].map(sub => ({
                ...sub,
                selected: sub.substituteId === substituteId
            }))
        }));
    };


    const generateMessage = () => {
        let message = 'Good morning\n';
        const teacherSubs = {};
        Object.entries(periodSubstitutions).forEach(([periodKey, subs]) => {
            const selected = subs.find(sub => sub.selected);
            if (selected) {
                const { absentTeacher } = selected.periodInfo;
                if (!teacherSubs[absentTeacher]) {
                    teacherSubs[absentTeacher] = [];
                }
                teacherSubs[absentTeacher].push(selected);
            }
        });
        Object.entries(teacherSubs).forEach(([absentTeacher, subs]) => {
            message += `\nSubs for ${absentTeacher}\n`;
            subs.sort((a, b) => {
                const timeA = a.periodInfo.time.split(':').map(Number);
                const timeB = b.periodInfo.time.split(':').map(Number);
                return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
            }).forEach(sub => {
                const periodNum = TEACHING_PERIODS.findIndex(
                    p => p.time === sub.periodInfo.time
                ) + 1;
                message += `P${periodNum} ${sub.periodInfo.class} - ${sub.code}\n`;
            });
        });

        setSubstitutionPlan(message);
    };

    const copyToClipboard = async () => {
        if (!substitutionPlan) return;
        try {
            await navigator.clipboard.writeText(substitutionPlan);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
        } catch (error) {
            showNotification('Failed to copy to clipboard', 'error');
        }
    };
    const generatePlan = async () => {
        if (absentTeachers.length === 0) {
            showNotification('Please select at least one absent teacher', 'error');
            return;
        }

        try {
            setLoading(true);
            const dateObj = new Date(date);
            const dayIndex = dateObj.getDay() - 1;
            if (dayIndex < 0 || dayIndex > 4) {
                throw new Error('Please select a weekday (Monday-Friday)');
            }
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
            const currentDay = days[dayIndex];

            const newPeriodSubs = {};
            const occupiedTeachers = new Set();
            let message = 'Good morning\n';

            for (const absentTeacher of absentTeachers) {
                const timetable = await getTeacherTimetable(absentTeacher.id);
                let teacherSubs = [];

                for (const [period, classInfo] of Object.entries(timetable.periods[currentDay] || {})) {
                    if (classInfo && classInfo !== 'FREE') {
                        const availableSubs = await findAvailableTeachersForPeriod(
                            Array.from(occupiedTeachers),
                            currentDay,
                            period,
                            date
                        );

                        if (availableSubs.length > 0) {
                            const substitute = availableSubs[0];
                            occupiedTeachers.add(substitute.id);
                            teacherSubs.push({
                                period,
                                class: classInfo,
                                substituteCode: substitute.code,
                                periodNum: TEACHING_PERIODS.findIndex(p => p.time === period) + 1
                            });

                            const periodKey = `${absentTeacher.code}-${period}`;
                            newPeriodSubs[periodKey] = availableSubs.map((sub, index) => ({
                                substituteId: sub.id,
                                code: sub.code,
                                name: sub.name,
                                todayCount: sub.todayCount,
                                selected: index === 0,
                                periodInfo: {
                                    time: period,
                                    class: classInfo,
                                    absentTeacher: absentTeacher.code
                                }
                            }));
                        }
                    }
                }

                if (teacherSubs.length > 0) {
                    message += `\nSubs for ${absentTeacher.code}\n`;
                    teacherSubs
                        .sort((a, b) => a.periodNum - b.periodNum)
                        .forEach(sub => {
                            message += `P${sub.periodNum} ${sub.class} - ${sub.substituteCode}\n`;
                        });
                }
            }

            setPeriodSubstitutions(newPeriodSubs);
            setSubstitutionPlan(message);
            setShowAdjustments(false);
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 max-w-md mx-auto pb-6">
            {/* Link to desktop version */}
            <div className="flex justify-end px-4">
                <Link
                    to="/substitutions"
                    className="flex items-center gap-2 text-blue-500"
                >
                    <Monitor className="h-4 w-4" />
                    Desktop Version
                </Link>
            </div>

            {/* Date Selection */}
            <Card>
                <CardContent className="p-4">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-3 border rounded-lg text-lg"
                    />
                </CardContent>
            </Card>

            {/* Teacher Selection */}
            <Card>
                <CardContent className="p-4 space-y-3">
                    <select
                        value={selectedTeacher}
                        onChange={(e) => setSelectedTeacher(e.target.value)}
                        className="w-full p-3 border rounded-lg text-lg"
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
                        className="w-full flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded-lg"
                    >
                        <UserPlus className="h-5 w-5" />
                        Add Teacher
                    </button>
                </CardContent>
            </Card>

            {/* Absent Teachers List */}
            {absentTeachers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Absent Teachers</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-2">
                            {absentTeachers.map(teacher => (
                                <div
                                    key={teacher.id}
                                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-full"
                                >
                                    {teacher.code}
                                    <button
                                        onClick={() => setAbsentTeachers(prev =>
                                            prev.filter(t => t.id !== teacher.id)
                                        )}
                                        className="hover:text-blue-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Generate Button */}
            {absentTeachers.length > 0 && (
                <button
                    onClick={generatePlan}
                    className="w-full p-4 bg-green-500 text-white rounded-lg text-lg font-medium"
                >
                    Generate Substitutions
                </button>
            )}

            {/* Substitution Plan */}
            {substitutionPlan && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Substitution Plan</CardTitle>
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg"
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
                    </CardHeader>
                    <CardContent>
                        <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded border text-sm">
                            {substitutionPlan}
                        </pre>
                    </CardContent>
                </Card>
            )}

            {loading && (
                <div className="fixed inset-0 bg-white/80 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            )}
        </div>
    );
};

export default MobileSubstitutionManager;