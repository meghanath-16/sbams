import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Buildings from './pages/Buildings';
import Rooms from './pages/Rooms';
import EnergyLogs from './pages/EnergyLogs';
import Maintenance from './pages/Maintenance';
import AdminLayout from './components/AdminLayout';
import NotificationManager from './components/NotificationManager';
import { fetchBackendStatus } from './services/api';
import axios from 'axios';

// Configure Axios Base URL for all requests
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

// Protected Route Component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <AdminLayout>{children}</AdminLayout> : <Navigate to="/login" />;
};

function App() {
  const [status, setStatus] = useState('Checking backend status...');

  useEffect(() => {
    const getStatus = async () => {
      try {
        const data = await fetchBackendStatus();
        setStatus(`Backend Online: ${data.message}`);
      } catch (error) {
        setStatus('Backend Offline.');
      }
    };
    getStatus();
  }, []);

  return (
    <Router>
      <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <NotificationManager />
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes wrapped in AdminLayout */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/buildings" element={<PrivateRoute><Buildings /></PrivateRoute>} />
          <Route path="/rooms" element={<PrivateRoute><Rooms /></PrivateRoute>} />
          <Route path="/energy-logs" element={<PrivateRoute><EnergyLogs /></PrivateRoute>} />
          <Route path="/maintenance" element={<PrivateRoute><Maintenance /></PrivateRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
