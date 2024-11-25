import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
    const location = useLocation();

    return (
        <nav className="bg-white shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex space-x-8">
                        <div className="flex items-center space-x-3">
                            <img
                                src="public\images\logo.png"
                                alt="SJMC Logo"
                                className="h-12"
                            />
                        </div>
                        <div className="text-gray-900">
                            <div className="font-bold text-lg">SJMC</div>
                            <div className="text-sm text-gray-500">Teacher Substitution System</div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 pl-8 border-l border-gray-200">
                        <Link
                            to="/"
                            className={`px-3 py-2 rounded-md ${location.pathname === '/' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                        >
                            Timetables
                        </Link>
                        <Link
                            to="/substitutions"
                            className={`px-3 py-2 rounded-md ${location.pathname === '/substitutions' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                        >
                            Substitutions
                        </Link>
                        <Link
                            to="/admin"
                            className={`px-3 py-2 rounded-md ${location.pathname === '/admin' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                        >
                            Admin
                        </Link>
                    </div>
                </div>
                {/* Right side - Could add any additional elements here if needed */}
                <div>
                    {/* Empty for now, but you could add user profile, settings, etc. */}
                </div>
            </div>
        </nav >
    );
}