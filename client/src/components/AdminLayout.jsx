import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import axios from 'axios';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  // Close sidebar on route change in mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    // 1. Log to console for debugging
    console.log('Logout initiated...');

    // 2. Fire-and-forget signal to backend (don't wait for it)
    axios.post('/api/auth/logout').catch(() => {});

    // 3. Force clear everything
    localStorage.clear();
    sessionStorage.clear();

    // 4. Native redirect for absolute reliability
    window.location.replace('/login');
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <Sidebar 
        onLogout={handleLogout} 
        isOpen={sidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      <div 
        className="flex-grow-1 d-flex flex-column w-100" 
        style={{ 
          marginLeft: window.innerWidth >= 768 ? '260px' : '0',
          transition: 'margin-left 0.3s ease-in-out',
          minHeight: '100vh'
        }}
      >
        {/* Mobile Header */}
        <div className="d-md-none d-flex align-items-center justify-content-between p-3 border-bottom shadow-sm" style={{ backgroundColor: 'white', zIndex: 1020 }}>
          <span className="fs-5 fw-bold text-primary">SBAMS</span>
          <button className="btn btn-primary btn-sm" onClick={() => setSidebarOpen(true)}>
            <FaBars />
          </button>
        </div>

        <div className="p-4 p-md-5 pt-4 fade-in">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
