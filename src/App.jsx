import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/Dashboard';
import TimetableEditor from './components/timetable/TimetableEditor';
import './styles/global.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route path="timetable" element={<TimetableEditor />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;