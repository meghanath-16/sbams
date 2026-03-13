import { NavLink } from 'react-router-dom';
import { FaBuilding, FaDoorOpen, FaBolt, FaWrench, FaTachometerAlt, FaSignOutAlt, FaBars } from 'react-icons/fa';
import { useState } from 'react';

const Sidebar = ({ onLogout, isOpen, toggleSidebar }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50 d-md-none" 
          style={{ zIndex: 1030 }}
          onClick={toggleSidebar}
        ></div>
      )}
      
      <div 
        className={`sidebar d-flex flex-column flex-shrink-0 p-3 shadow position-fixed top-0 h-100`} 
        style={{ 
          width: '260px',
          left: 0,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
          zIndex: 1045
        }}
        id="sidebar-wrapper"
      >
        <div className="d-flex justify-content-between align-items-center mb-4 mt-2 px-2">
          <a href="/dashboard" className="text-decoration-none">
            <span className="fs-3 fw-bold" style={{ color: 'var(--primary)', letterSpacing: '1px' }}>
              <FaBolt className="me-2 mb-1" />SBAMS
            </span>
          </a>
          <button className="btn btn-sm text-white d-md-none" onClick={toggleSidebar}>
            ✕
          </button>
        </div>
        
        <ul className="nav nav-pills flex-column mb-auto gap-2">
          <li className="nav-item">
            <NavLink to="/dashboard" end className={({ isActive }) => `nav-link px-3 py-2 d-flex align-items-center ${isActive ? 'active' : ''}`} onClick={() => window.innerWidth < 768 && toggleSidebar()}>
              <FaTachometerAlt className="me-3 fs-5" /> <span className="fw-medium">Dashboard</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/buildings" className={({ isActive }) => `nav-link px-3 py-2 d-flex align-items-center ${isActive ? 'active' : ''}`} onClick={() => window.innerWidth < 768 && toggleSidebar()}>
              <FaBuilding className="me-3 fs-5" /> <span className="fw-medium">Buildings</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/rooms" className={({ isActive }) => `nav-link px-3 py-2 d-flex align-items-center ${isActive ? 'active' : ''}`} onClick={() => window.innerWidth < 768 && toggleSidebar()}>
              <FaDoorOpen className="me-3 fs-5" /> <span className="fw-medium">Rooms</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/energy-logs" className={({ isActive }) => `nav-link px-3 py-2 d-flex align-items-center ${isActive ? 'active' : ''}`} onClick={() => window.innerWidth < 768 && toggleSidebar()}>
              <FaBolt className="me-3 fs-5 text-warning" /> <span className="fw-medium">Energy Logs</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/maintenance" className={({ isActive }) => `nav-link px-3 py-2 d-flex align-items-center ${isActive ? 'active' : ''}`} onClick={() => window.innerWidth < 768 && toggleSidebar()}>
              <FaWrench className="me-3 fs-5" /> <span className="fw-medium">Maintenance</span>
            </NavLink>
          </li>
        </ul>
        
        <div className="mt-auto pt-4 border-top" style={{ borderColor: 'var(--border-color) !important' }}>
          <button 
            type="button"
            className="btn btn-danger w-100 d-flex align-items-center justify-content-center py-2" 
            onClick={() => {
              console.log('Sidebar Logout Clicked');
              onLogout();
            }}
          >
            <FaSignOutAlt className="me-2" /> Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
