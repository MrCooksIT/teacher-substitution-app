import React from 'react';
import { Search } from 'lucide-react';

const TeacherSelect = ({ value, onChange, onSave }) => {
    return (
        <div className="flex gap-4 items-center mb-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Enter teacher name"
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <button
                onClick={onSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
                Save Timetable
            </button>
        </div>
    );
};