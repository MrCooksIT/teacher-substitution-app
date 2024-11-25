import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { getAllTeachers, updateTeacher, addTeacher, removeTeacher } from '../services/timetableService';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import {
    Loader2, Edit2, Save, Trash2, X, UserPlus,
    Users, Shield
} from 'lucide-react';

export default function AdminPanel() {
    const [loading, setLoading] = useState(true);
    const [teachers, setTeachers] = useState([]);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTeacher, setNewTeacher] = useState({ code: '', name: '' });
    const { showNotification } = useNotification();

    useEffect(() => {
        loadTeachers();
    }, []);

    const loadTeachers = async () => {
        try {
            const teachersList = await getAllTeachers();
            setTeachers(teachersList.sort((a, b) => a.code.localeCompare(b.code)));
            setLoading(false);
        } catch (error) {
            showNotification('Failed to load teachers: ' + error.message, 'error');
            setLoading(false);
        }
    };

    const handleEditSave = async (teacherId) => {
        try {
            setLoading(true);
            await updateTeacher(teacherId, editingTeacher);
            showNotification('Teacher updated successfully');
            setEditingTeacher(null);
            await loadTeachers();
        } catch (error) {
            showNotification('Failed to update teacher: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTeacher = async () => {
        if (!newTeacher.code || !newTeacher.name) {
            showNotification('Please fill in both code and name', 'error');
            return;
        }

        try {
            setLoading(true);
            await addTeacher(newTeacher);
            showNotification('Teacher added successfully');
            setShowAddForm(false);
            setNewTeacher({ code: '', name: '' });
            await loadTeachers();
        } catch (error) {
            showNotification('Failed to add teacher: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveTeacher = async (teacherId, teacherName) => {
        const confirm = window.confirm(
            `Are you sure you want to remove ${teacherName}?\n\nThis will also delete their timetable and cannot be undone.`
        );

        if (!confirm) return;

        try {
            setLoading(true);
            await removeTeacher(teacherId);
            showNotification('Teacher removed successfully');
            await loadTeachers();
        } catch (error) {
            showNotification('Failed to remove teacher: ' + error.message, 'error');
        } finally {
            setLoading(false);
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
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-blue-500" />
                    <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                    <UserPlus className="h-5 w-5" />
                    Add New Teacher
                </button>
            </div>

            {/* Add Teacher Form */}
            {showAddForm && (
                <Card className="border-2 border-green-500 shadow-lg">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <UserPlus className="h-6 w-6 text-green-500" />
                                <CardTitle>Add New Teacher</CardTitle>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNewTeacher({ code: '', name: '' });
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Teacher Code
                                </label>
                                <input
                                    type="text"
                                    value={newTeacher.code}
                                    onChange={(e) => setNewTeacher(prev => ({
                                        ...prev,
                                        code: e.target.value.toUpperCase()
                                    }))}
                                    placeholder="e.g., ABC"
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    maxLength={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Teacher Name
                                </label>
                                <input
                                    type="text"
                                    value={newTeacher.name}
                                    onChange={(e) => setNewTeacher(prev => ({
                                        ...prev,
                                        name: e.target.value
                                    }))}
                                    placeholder="Full Name"
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <button
                                onClick={handleAddTeacher}
                                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors mt-2"
                            >
                                Add Teacher
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Teachers List */}
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Users className="h-6 w-6 text-blue-500" />
                        <CardTitle>Manage Teachers</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {teachers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No teachers found
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {teachers.map(teacher => (
                                    <div
                                        key={teacher.id}
                                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                                    >
                                        {editingTeacher?.id === teacher.id ? (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Teacher Code
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={editingTeacher.code}
                                                            onChange={(e) => setEditingTeacher(prev => ({
                                                                ...prev,
                                                                code: e.target.value.toUpperCase()
                                                            }))}
                                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            maxLength={3}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Teacher Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={editingTeacher.name}
                                                            onChange={(e) => setEditingTeacher(prev => ({
                                                                ...prev,
                                                                name: e.target.value
                                                            }))}
                                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setEditingTeacher(null)}
                                                        className="px-3 py-1.5 text-gray-600 hover:text-gray-800"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditSave(teacher.id)}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                                    >
                                                        <Save className="h-4 w-4" />
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="font-medium text-lg">{teacher.code}</span>
                                                    <span className="mx-2 text-gray-300">|</span>
                                                    <span className="text-gray-600">{teacher.name}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setEditingTeacher(teacher)}
                                                        className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit teacher"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveTeacher(teacher.id, teacher.name)}
                                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove teacher"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}