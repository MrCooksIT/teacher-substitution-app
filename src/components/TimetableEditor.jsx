import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Save, Loader2 } from 'lucide-react';
import { getAllTeachers, getTeacherTimetable, saveTimetable } from '../services/timetableService';
import { useNotification } from '../contexts/NotificationContext';
import { UserCircle2, Calendar } from 'lucide-react';
import {
    TEACHING_PERIODS,
    DAYS,
    CLASSES,
    SUBJECTS,
    formatClassSubject
} from '../constants/timetable';


export default function TimetableEditor() {
    const [loading, setLoading] = useState(true);
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [selectedCell, setSelectedCell] = useState(null);
    const [editValue, setEditValue] = useState({ class: '', subject: '' });
    const [timetableData, setTimetableData] = useState({});
    const { showNotification } = useNotification();

    useEffect(() => {
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

        loadTeachers();
    }, []);

    useEffect(() => {
        const loadTimetable = async () => {
            if (!selectedTeacher) return;

            try {
                setLoading(true);
                const timetable = await getTeacherTimetable(selectedTeacher);
                setTimetableData(timetable.periods || {});
            } catch (error) {
                showNotification('Failed to load timetable: ' + error.message, 'error');
            } finally {
                setLoading(false);
            }
        };

        loadTimetable();
    }, [selectedTeacher]);


    const handleSaveTimetable = async () => {
        if (!selectedTeacher) {
            showNotification('Please select a teacher first', 'error');
            return;
        }

        try {
            setLoading(true);
            await saveTimetable({
                teacherId: selectedTeacher,
                periods: timetableData
            });
            showNotification('Timetable saved successfully!');
        } catch (error) {
            showNotification('Failed to save timetable: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCellClick = (period, day) => {
        setSelectedCell({ period, day });
        const currentValue = timetableData[day]?.[period.time] || '';
        if (currentValue === 'FREE') {
            setEditValue({ class: 'FREE', subject: '' });
        } else if (currentValue) {
            const [classValue, subjectValue] = currentValue.split(' ');
            setEditValue({
                class: classValue || '',
                subject: subjectValue || ''
            });
        } else {
            setEditValue({ class: '', subject: '' });
        }
    };

    const handleCellSave = () => {
        if (!selectedCell) return;

        const value = editValue.class === 'FREE'
            ? 'FREE'
            : formatClassSubject(editValue.class, editValue.subject);

        if (value) {
            setTimetableData(prev => ({
                ...prev,
                [selectedCell.day]: {
                    ...prev[selectedCell.day] || {},
                    [selectedCell.period.time]: value
                }
            }));
        }
        setSelectedCell(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-500">Loading timetable...</p>
                </div>
            </div>
        );
    }
    const selectedTeacherData = teachers.find(t => t.id === selectedTeacher);

    return (
        <div className="space-y-6">
            {/* Teacher Selection Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <UserCircle2 className="h-12 w-12 text-gray-400" />
                        <select
                            value={selectedTeacher || ''}
                            onChange={(e) => setSelectedTeacher(e.target.value)}
                            className="flex-1 p-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[250px]"
                        >
                            <option value="">Select a teacher</option>
                            {teachers.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.code} - {teacher.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {selectedTeacher && (
                        <button
                            onClick={handleSaveTimetable}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
                        >
                            <Save className="h-5 w-5" />
                            <span>Save Timetable</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Timetable */}
            {selectedTeacher ? (
                <Card className="shadow-lg">
                    <CardHeader className="border-b">
                        <div className="flex items-center space-x-3">
                            <Calendar className="h-6 w-6 text-blue-500" />
                            <CardTitle>
                                {selectedTeacherData ? `${selectedTeacherData.code}'s Timetable` : 'Teacher Timetable'}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-3 bg-gray-50 border-b font-medium text-gray-500 w-32"></th>
                                        {DAYS.map(day => (
                                            <th key={day} className="p-3 bg-gray-50 border-b font-medium text-gray-500">
                                                {day}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {TEACHING_PERIODS.map((period) => (
                                        <tr key={period.time} className="border-b last:border-0">
                                            <td className="p-3 bg-gray-50 w-32">
                                                <div className="text-sm font-medium">{period.time}</div>
                                                <div className="text-xs text-gray-500">{period.label}</div>
                                            </td>
                                            {DAYS.map(day => {
                                                const isSelected = selectedCell?.period === period && selectedCell?.day === day;
                                                return (
                                                    <td
                                                        key={day}
                                                        className={`p-3 border-l cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' :
                                                            timetableData[day]?.[period.time] === 'FREE' ? 'bg-gray-50' :
                                                                'hover:bg-gray-50'
                                                            }`}
                                                        onClick={() => handleCellClick(period, day)}
                                                    >
                                                        {isSelected ? (
                                                            <div className="relative p-2 bg-white shadow-lg rounded-lg border" onClick={e => e.stopPropagation()}>
                                                                <div className="space-y-2">
                                                                    <select
                                                                        value={editValue.class}
                                                                        onChange={e => setEditValue(prev => ({ ...prev, class: e.target.value }))}
                                                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                                        size={1}
                                                                        autoFocus
                                                                    >
                                                                        <option value="">Select Grade</option>
                                                                        <option value="FREE">Free Period</option>
                                                                        {CLASSES.map(cls => (
                                                                            <option key={cls} value={cls}>{cls}</option>
                                                                        ))}
                                                                    </select>

                                                                    {editValue.class && editValue.class !== 'FREE' && (
                                                                        <select
                                                                            value={editValue.subject}
                                                                            onChange={e => setEditValue(prev => ({ ...prev, subject: e.target.value }))}
                                                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                                            size={1}
                                                                        >
                                                                            <option value="">Select Subject</option>
                                                                            {SUBJECTS.map(subject => (
                                                                                <option key={subject} value={subject}>{subject}</option>
                                                                            ))}
                                                                        </select>
                                                                    )}

                                                                    <div className="flex justify-end gap-2">
                                                                        <button
                                                                            onClick={() => setSelectedCell(null)}
                                                                            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                if (editValue.class === 'FREE' || (editValue.class && editValue.subject)) {
                                                                                    handleCellSave();
                                                                                }
                                                                            }}
                                                                            className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1"
                                                                        >
                                                                            <Save className="h-4 w-4" />
                                                                            Save
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className={`min-h-[2rem] flex items-center justify-center ${timetableData[day]?.[period.time] === 'FREE' ? 'text-gray-400 italic' : ''
                                                                }`}>
                                                                {timetableData[day]?.[period.time] || ''}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : (

                <div className="bg-white rounded-lg shadow-sm p-12 text-center border">
                    <UserCircle2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Teacher Selected</h3>
                    <p className="text-gray-500">Please select a teacher to view or edit their timetable.</p>
                </div>
            )
            }
        </div >
    );
}