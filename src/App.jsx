import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationContext';
import TimetableEditor from './components/TimetableEditor';
import SubstitutionManager from './components/SubstitutionManager';
import AdminPanel from './components/AdminPanel';
import Navbar from './components/Navbar';
import './styles/global.css';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {/* Only show navbar on non-mobile routes */}
          <Routes>
            <Route path="/m/*" element={null} />
            <Route path="*" element={<Navbar />} />
          </Routes>

          <main className="container mx-auto p-4">
            <Routes>
              {/* Mobile route */}
              <Route path="/m/substitutions" element={<MobileSubstitutionManager />} />

              {/* Desktop routes */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/" element={<TimetableEditor />} />
              <Route path="/substitutions" element={<SubstitutionManager />} />
              <Route path="/admin" element={<AdminPanel />} />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;