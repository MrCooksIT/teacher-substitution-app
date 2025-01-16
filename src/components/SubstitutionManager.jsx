import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import {
    Copy,
    Check,
    X,
    AlertCircle,
    Edit2,
    Phone
} from 'lucide-react';
import { getAllTeachers, getTeacherTimetable } from '../services/timetableService';
import { useNotification } from '../contexts/NotificationContext';
import { TEACHING_PERIODS } from '../constants/timetable';
import { Link } from 'react-router-dom';

export default function SubstitutionManager() {
    const [loading, setLoading] = useState(true);
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [absentTeachers, setAbsentTeachers] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [substitutionPlan, setSubstitutionPlan] = useState(null);
    const [showCopied, setShowCopied] = useState(false);
    const [periodSubstitutions, setPeriodSubstitutions] = useState({});
    const [showAdjustments, setShowAdjustments] = useState(false);
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
        // Get the IDs of absent teachers to exclude them
        const absentTeacherIds = absentTeachers.map(t => t.id);

        for (const teacher of teachers) {
            // Skip if teacher is absent or already assigned
            if (absentTeacherIds.includes(teacher.id) || occupiedTeachers.includes(teacher.id)) continue;

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

    const clearSubstitutionPlan = () => {
        setSubstitutionPlan(null);
        setPeriodSubstitutions({});
        setShowAdjustments(false);
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
        <div className="space-y-6">
            <Link
                to="/m/substitutions"
                className="flex items-center gap-2 px-3 py-2 text-blue-500 hover:text-blue-600"
            >
                <Phone className="h-4 w-4" />
                Open Mobile Version
            </Link>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Generate Substitution Message</CardTitle>
                        {substitutionPlan && (
                            <button
                                onClick={clearSubstitutionPlan}
                                className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                <Trash2 className="h-4 w-4" />
                                Clear Plan
                            </button>
                        )}
                    </div>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <select
                                value={selectedTeacher}
                                onChange={(e) => setSelectedTeacher(e.target.value)}
                                className="flex-1 p-2 border rounded"
                            >
                                <option value="">Select absent teacher</option>
                                {teachers
                                    .filter(t => !absentTeachers.some(at => at.id === t.id)) // Filter out already selected teachers
                                    .map(teacher => (
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
                        )}

                        <div className="flex gap-4">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="p-2 border rounded"
                            />
                            <button
                                onClick={generatePlan}
                                disabled={absentTeachers.length === 0}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                            >
                                Generate Plan
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {substitutionPlan && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium">Substitution Plan</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowAdjustments(!showAdjustments)}
                                            className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                            {showAdjustments ? 'Hide Adjustments' : 'Make Adjustments'}
                                        </button>
                                        <button
                                            onClick={copyToClipboard}
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
                                </div>
                                <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded border">
                                    {substitutionPlan}
                                </pre>
                            </div>

                            {showAdjustments && (
                                <div className="space-y-6">
                                    <div className="grid gap-4">
                                        {Object.entries(periodSubstitutions).map(([periodKey, subs]) => {
                                            const { time, class: className, absentTeacher } = subs[0].periodInfo;
                                            const periodNum = TEACHING_PERIODS.findIndex(p => p.time === time) + 1;

                                            return (
                                                <Card key={periodKey} className="border-2">
                                                    <CardHeader>
                                                        <div className="flex justify-between items-center">
                                                            <CardTitle className="text-sm">
                                                                Period {periodNum} - {absentTeacher} - {className}
                                                            </CardTitle>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="grid gap-2">
                                                            {subs.map(sub => (
                                                                <button
                                                                    key={sub.substituteId}
                                                                    onClick={() => {
                                                                        handleSelectSubstitute(periodKey, sub.substituteId);
                                                                        generateMessage();
                                                                    }}
                                                                    className={`flex items-center justify-between p-2 rounded ${sub.selected
                                                                        ? 'bg-green-100 text-green-800 border-2 border-green-500'
                                                                        : 'bg-gray-50 hover:bg-gray-100'
                                                                        }`}
                                                                >
                                                                    <div>
                                                                        <span className="font-medium">{sub.code}</span>
                                                                        <span className="mx-2">-</span>
                                                                        <span className="text-gray-600">{sub.name}</span>
                                                                    </div>
                                                                    {sub.todayCount > 0 && (
                                                                        <span className="text-sm text-orange-600 flex items-center gap-1">
                                                                            <AlertCircle className="h-4 w-4" />
                                                                            {sub.todayCount} subs today
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}