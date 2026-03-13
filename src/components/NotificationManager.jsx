import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { FaBell, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const NotificationManager = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.id) {
       setNotifications([]); // Clear notifications on logout
       return;
    }
    
    // Use the same URL as API for socket connection
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('Connected to socket server');
      
      // Join Role rooms
      socket.emit('join', user.role);
      
      // Join Personal ID room
      socket.emit('join', user._id);

      // Join Room specific room if resident
      if (user.roomId) {
        socket.emit('join', user.roomId);
      }
    });

    socket.on('notification', (notif) => {
      const id = Date.now();
      const newNotif = { ...notif, id };
      
      setNotifications(prev => [newNotif, ...prev].slice(0, 5)); // Keep top 5
      
      // Auto-remove after 6s
      setTimeout(() => {
         setNotifications(prev => prev.filter(n => n.id !== id));
      }, 6000);
    });

    return () => socket.disconnect();
  }, [window.location.pathname]); // Re-run on navigation to pick up storage changes

  const removeNotif = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '350px'
    }}>
      {notifications.map(n => (
        <div key={n.id} className="glass-card p-3 shadow-lg fade-in border-start border-4 ripple shadow-sm" style={{
           borderColor: n.type === 'HighUsage' ? '#dc3545' : n.type === 'TaskCompleted' ? '#28a745' : '#0d6efd',
           backgroundColor: 'rgba(255,255,255,0.95)',
           display: 'flex',
           alignItems: 'center',
           gap: '12px'
        }}>
          <div className="fs-4">
             {n.type === 'HighUsage' ? <FaExclamationTriangle className="text-danger" /> : 
              n.type === 'TaskCompleted' ? <FaCheckCircle className="text-success" /> : 
              <FaBell className="text-primary" />}
          </div>
          <div style={{flex: 1}}>
             <div className="fw-bold small">{n.type === 'HighUsage' ? 'Alert: High Power' : n.type === 'TaskCompleted' ? 'Repair Done' : 'New Update'}</div>
             <div className="extra-small text-muted">{n.message}</div>
          </div>
          <button className="btn btn-link btn-sm p-0 m-0 text-muted" onClick={() => removeNotif(n.id)}>
             <FaTimes />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationManager;
