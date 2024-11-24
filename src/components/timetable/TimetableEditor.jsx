import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Plus, Save, Trash, Copy, Check } from 'lucide-react';
import TeacherSelect from './TeacherSelect';
import { saveTimetable, loadTimetable } from '../../services/TimetableService';

const commonSubjects = [
    'Mathematics', 'English', 'Science', 'History', 'Geography',
    'Physics', 'Chemistry', 'Biology', 'Computer Science'
];

const TimetableEditor = () => {
    const [teacherName, setTeacherName] = useState('');
    const [periods, setPeriods] = useState([
        { time: "8:05", label: "Period 1" },
        { time: "8:50", label: "Period 2" },
        { time: "9:35", label: "Period 3" },
        { time: "10:45", label: "Period 4" },
        { time: "11:30", label: "Period 5" },
        { time: "12:15", label: "Period 6" },
        { time: "13:25", label: "Period 7" },
        { time: "14:10", label: "Period 8" }
    ]);
    const [selectedCell, setSelectedCell] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [timetableData, setTimetableData] = useState({});
    const [showCopied, setShowCopied] = useState(false);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    useEffect(() => {
        if (editValue) {
            const filtered = commonSubjects.filter(subject =>
                subject.toLowerCase().includes(editValue.toLowerCase())
            );
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    }, [editValue]);

    const handleCellClick = (period, day) => {
        setSelectedCell({ period, day });
        setEditValue(timetableData[`${period.time}-${day}`] || '');
    };

    const handleCellSave = () => {
        if (selectedCell) {
            const key = `${selectedCell.period.time}-${selectedCell.day}`;
            setTimetableData(prev => ({
                ...prev,
                [key]: editValue
            }));
            setSelectedCell(null);
            setSuggestions([]);
        }
    };

    const handleSaveTimetable = async () => {
        if (!teacherName.trim()) {
            alert('Please enter a teacher name');
            return;
        }
        try {
            await saveTimetable(teacherName, timetableData);
            alert('Timetable saved successfully!');
        } catch (error) {
            alert('Error saving timetable');
        }
    };

    const handleLoadTimetable = async () => {
        if (!teacherName.trim()) {
            alert('Please enter a teacher name');
            return;
        }
        try {
            const data = await loadTimetable(teacherName);
            if (data) {
                setTimetableData(data);
            } else {
                alert('No timetable found for this teacher');
            }
        } catch (error) {
            alert('Error loading timetable');
        }
    };

    const handleCopyTimetable = () => {
        const formattedData = days.map(day => {
            const dayData = periods.map(period => {
                const key = `${period.time}-${day}`;
                return timetableData[key] || '';
            }).join('\t');
            return `${day}\t${dayData}`;
        }).join('\n');

        navigator.clipboard.writeText(formattedData);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    };

    const handlePasteTimetable = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const rows = text.split('\n');
            const newData = {};

            rows.forEach((row, rowIndex) => {
                const cells = row.split('\t');
                if (cells.length === periods.length + 1) {
                    const day = days[rowIndex];
                    cells.slice(1).forEach((cell, cellIndex) => {
                        if (cell.trim()) {
                            const key = `${periods[cellIndex].time}-${day}`;
                            newData[key] = cell.trim();
                        }
                    });
                }
            });

            setTimetableData(prev => ({ ...prev, ...newData }));
        } catch (error) {
            alert('Error pasting timetable data');
        }
    };

    return (
        <Card className="w-full max-w-6xl mx-auto">
            <CardHeader className="flex flex-col gap-4">
                <CardTitle>Teacher Timetable</CardTitle>
                <TeacherSelect
                    value={teacherName}
                    onChange={setTeacherName}
                    onSave={handleSaveTimetable}
                />
                <div className="flex gap-2">
                    <button
                        onClick={handleLoadTimetable}
                        className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                        Load Timetable
                    </button>
                    <button
                        onClick={handleCopyTimetable}
                        className="flex items-center px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        {showCopied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                        {showCopied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                        onClick={handlePasteTimetable}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        Paste
                    </button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="border p-2 w-32">Time</th>
                                {days.map(day => (
                                    <th key={day} className="border p-2">{day}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {periods.map((period) => (
                                <tr key={period.time}>
                                    <td className="border p-2 font-medium text-center bg-gray-50">
                                        {period.time}
                                        <div className="text-sm text-gray-500">{period.label}</div>
                                    </td>
                                    {days.map(day => {
                                        const key = `${period.time}-${day}`;
                                        const isSelected = selectedCell?.period === period && selectedCell?.day === day;
                                        return (
                                            <td
                                                key={day}
                                                className="border p-2 cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleCellClick(period, day)}
                                            >
                                                {isSelected ? (
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            className="w-full p-1 border rounded"
                                                            autoFocus
                                                        />
                                                        {suggestions.length > 0 && (
                                                            <div className="absolute z-10 w-full bg-white border rounded-md mt-1">
                                                                {suggestions.map((suggestion, index) => (
                                                                    <div
                                                                        key={index}
                                                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                                                        onClick={() => {
                                                                            setEditValue(suggestion);
                                                                            setSuggestions([]);
                                                                        }}
                                                                    >
                                                                        {suggestion}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={handleCellSave}
                                                            className="absolute right-1 top-1 p-1 bg-green-500 text-white rounded hover:bg-green-600"
                                                        >
                                                            <Save className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="min-h-[2rem] flex items-center justify-center">
                                                        {timetableData[key]}
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
    );
};

export default TimetableEditor;