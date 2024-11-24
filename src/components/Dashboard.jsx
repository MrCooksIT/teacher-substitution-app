import React from 'react';
import { Bell, Calendar, Settings, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DashboardLayout = () => {
    const stats = [
        {
            title: "Total Teachers",
            value: "24",
            icon: <Users className="h-4 w-4 text-muted-foreground" />
        },
        {
            title: "Absent Today",
            value: "3",
            icon: <Calendar className="h-4 w-4 text-muted-foreground" />
        },
        {
            title: "Pending Substitutions",
            value: "5",
            icon: <Bell className="h-4 w-4 text-muted-foreground" />
        }
    ];

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-sm">
                <div className="p-4">
                    <h1 className="text-xl font-bold">Teacher Substitution</h1>
                    <nav className="mt-8">
                        <div className="space-y-2">
                            <button className="w-full flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">
                                <Calendar className="h-5 w-5 mr-3" />
                                Dashboard
                            </button>
                            <button className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                                <Users className="h-5 w-5 mr-3" />
                                Teachers
                            </button>
                            <button className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                                <Settings className="h-5 w-5 mr-3" />
                                Settings
                            </button>
                        </div>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    {stats.map((stat, index) => (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                {stat.icon}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Timetable Section */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Today's Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-6 gap-4 font-medium text-center py-2 bg-gray-50">
                            <div>Time</div>
                            <div>Monday</div>
                            <div>Tuesday</div>
                            <div>Wednesday</div>
                            <div>Thursday</div>
                            <div>Friday</div>
                        </div>
                        {/* We'll populate this with actual timetable data later */}
                        <div className="h-96 flex items-center justify-center text-gray-500">
                            Timetable data will be displayed here
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DashboardLayout;