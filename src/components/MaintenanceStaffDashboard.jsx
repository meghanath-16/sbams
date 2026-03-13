import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaWrench, FaCheckCircle, FaTools, FaClock, FaDoorOpen, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';

const MaintenanceStaffDashboard = ({ user, token }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('/api/maintenance', { headers });
      setRequests(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching staff dashboard data:', err);
      setError('Failed to load tasks.');
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || !user.id) return;

    fetchRequests();
    
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl);
    socket.on('connect', () => {
        socket.emit('join', user.id); 
    });
    
    socket.on('NewAssignment', () => fetchRequests());
    socket.on('MaintenanceUpdate', () => fetchRequests());

    const interval = setInterval(fetchRequests, 60000); 
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [user.id, token, fetchRequests]);


  const handleUpdateStatus = async (id, newStatus) => {
    let notes = '';
    if (newStatus === 'Completed') {
      notes = window.prompt('Add completion notes (optional):');
      if (notes === null) return;
    }

    setUpdatingId(id);
    setError('');
    setSuccessMsg('');

    try {
      await axios.put(`/api/maintenance/${id}`, { status: newStatus, notes }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg(`Task marked as ${newStatus}`);
      await fetchRequests();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  const stats = {
    assigned: requests.length,
    completed: requests.filter(r => r.status === 'Completed').length,
    pending: requests.filter(r => r.status === 'Pending').length,
  };

  const cards = [
    { title: 'Assigned Requests', value: stats.assigned, icon: <FaWrench />, color: 'primary' },
    { title: 'Completed Requests', value: stats.completed, icon: <FaCheckCircle />, color: 'success' },
    { title: 'Pending Requests', value: stats.pending, icon: <FaExclamationTriangle />, color: 'warning' },
  ];

  return (
    <div className="fade-in">
      <div className="row g-4 mb-5">
        {cards.map((c, i) => (
          <div className="col-md-4" key={i}>
            <div className={`glass-card p-4 border-start border-4 border-${c.color} h-100 shadow-sm transition-hover`}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small fw-bold text-uppercase">{c.title}</div>
                  <h2 className="fw-bold mb-0 mt-1">{c.value}</h2>
                </div>
                <div className={`fs-1 text-${c.color} opacity-50`}>{c.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-4 shadow-sm border-0">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0 d-flex align-items-center">
            <FaTools className="me-2 text-primary" /> Maintenance Task List
          </h5>
          <Link to="/maintenance" className="btn btn-sm btn-outline-primary rounded-pill px-3">Full Access</Link>
        </div>

        {error && <div className="alert alert-danger border-0 py-2 small mb-4">{error}</div>}
        {successMsg && <div className="alert alert-success border-0 py-2 small mb-4">{successMsg}</div>}

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="border-0 px-4">Request ID</th>
                <th className="border-0">Room</th>
                <th className="border-0">Issue</th>
                <th className="border-0">Date</th>
                <th className="border-0">Status</th>
                <th className="border-0 text-end px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map(req => (
                  <tr key={req._id}>
                    <td className="px-4 border-bottom border-light">
                      <span className="text-muted extra-small fw-mono">#{req._id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td className="border-bottom border-light">
                      <div className="fw-bold small">{req.roomId?.roomNumber || 'N/A'}</div>
                    </td>
                    <td className="border-bottom border-light">
                      <div className="text-truncate small" style={{maxWidth: '200px'}}>{req.description}</div>
                    </td>
                    <td className="border-bottom border-light">
                      <div className="extra-small text-muted">{new Date(req.requestDate).toLocaleDateString()}</div>
                    </td>
                    <td className="border-bottom border-light">
                       <span className={`badge rounded-pill extra-small px-3 ${
                         req.status === 'Completed' ? 'bg-success' : 
                         req.status === 'In Progress' ? 'bg-info text-dark' : 'bg-warning text-dark'
                       }`}>
                          {req.status}
                       </span>
                    </td>
                    <td className="text-end px-4 border-bottom border-light">
                      {updatingId === req._id ? (
                        <div className="spinner-border spinner-border-sm text-primary"></div>
                      ) : req.status !== 'Completed' ? (
                        <div className="d-flex justify-content-end gap-2">
                          {req.status === 'Pending' && (
                            <button className="btn btn-sm btn-outline-info py-1" onClick={() => handleUpdateStatus(req._id, 'In Progress')}>
                              Start
                            </button>
                          )}
                          <button className="btn btn-sm btn-success py-1 shadow-sm" onClick={() => handleUpdateStatus(req._id, 'Completed')}>
                            Resolve
                          </button>
                        </div>
                      ) : (
                        <FaCheckCircle className="text-success" />
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center py-5 text-muted small">No assigned tasks found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceStaffDashboard;
