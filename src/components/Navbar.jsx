import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, Settings } from 'lucide-react';
import logo from '../images/logo.png';

export default function Navbar() {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Timetables', icon: Calendar },
        { path: '/substitutions', label: 'Substitutions', icon: Users },
        { path: '/admin', label: 'Admin', icon: Settings },
    ];

    return (
        <nav className="bg-white shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center space-x-4">
                        <img src={logo} alt="SJMC Logo" className="h-12" />
                        {/* Navigation Links */}
                        <div className="flex space-x-4">
                            {navItems.map(({ path, label, icon: Icon }) => (
                                <Link
                                    key={path}
                                    to={path}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md ${location.pathname === path
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}