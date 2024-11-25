import React, { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    const showNotification = (message, type = 'success') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(notification => notification.id !== id));
        }, 5000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ showNotification, removeNotification }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {notifications.map(({ id, message, type }) => (
                    <div
                        key={id}
                        className={`p-4 rounded-md shadow-lg flex items-center justify-between ${type === 'success' ? 'bg-green-500' : 'bg-red-500'
                            } text-white min-w-[300px] max-w-md animate-slide-in-right`}
                    >
                        <span className="mr-2">{message}</span>
                        <button
                            onClick={() => removeNotification(id)}
                            className="ml-4 hover:opacity-80 rounded-full p-1 hover:bg-white/20 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

// Custom hook to use the notification context
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export default NotificationProvider;