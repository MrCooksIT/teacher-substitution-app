import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationContext';
import TimetableEditor from './components/TimetableEditor';  // Updated import
import SubstitutionManager from './components/SubstitutionManager';
import AdminPanel from './components/AdminPanel';
import Navbar from './components/Navbar';
import './styles/global.css';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto p-4">
            <Routes>
              <Route path="/" element={<TimetableEditor />} />  {/* Updated component */}
              <Route path="/substitutions" element={<SubstitutionManager />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </main>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;