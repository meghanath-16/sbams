import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaDoorOpen, FaBolt, FaWrench, FaBuilding, FaMapMarkerAlt, FaUsers, FaClock, FaCheckCircle, FaTools } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';

const ResidentDashboard = ({ user, token }) => {
  const [data, setData] = useState({
    room: null,
    energyThisMonth: 0,
    openRequests: [],
    energyHistory: [],
    loading: true
  });

  const fetchResidentData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // 1. Fetch Room Details
      const roomId = user.assignedRooms?.[0];
      let roomInfo = null;
      if (roomId) {
        const roomRes = await axios.get(`/api/rooms/${roomId}`, { headers });
        roomInfo = roomRes.data;
      }

      // 2. Fetch Energy Logs for this month
      const energyRes = await axios.get('/api/energylogs', { headers });
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const filteredLogs = energyRes.data.filter(log => {
        const d = new Date(log.timestamp);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      });
      const monthTotal = filteredLogs.reduce((sum, log) => sum + Number(log.energyUsed), 0);

      // 3. Fetch Maintenance Requests
      const maintRes = await axios.get('/api/maintenance', { headers });
      const openMaint = maintRes.data.filter(req => req.status !== 'Completed');

      setData({
        room: roomInfo,
        energyThisMonth: monthTotal.toFixed(2),
        openRequests: openMaint,
        energyHistory: energyRes.data.slice(0, 5), // Last 5 logs
        loading: false
      });
    } catch (error) {
      console.error('Error fetching resident dashboard data:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [user.assignedRooms, token]);

  useEffect(() => {
    fetchResidentData();
    
    // Connect to Socket
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl);
    
    // Join room if resident
    const roomId = user.assignedRooms?.[0];
    if (roomId) socket.emit('join', roomId);
    
    socket.on('MaintenanceUpdate', () => fetchResidentData());
    socket.on('NewEnergyLog', () => fetchResidentData());

    const interval = setInterval(fetchResidentData, 60000); // 1 min sync
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [user.assignedRooms, fetchResidentData]);


  if (data.loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  const cards = [
    { title: 'My Total Room', value: data.room ? data.room.roomNumber : 'N/A', icon: <FaDoorOpen />, color: 'primary' },
    { title: 'Monthly Energy', value: `${data.energyThisMonth} kWh`, icon: <FaBolt />, color: 'warning' },
    { title: 'Open Requests', value: data.openRequests.length, icon: <FaWrench />, color: 'danger' },
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

      <div className="row g-4">
        {/* Room Details */}
        <div className="col-lg-6">
          <div className="glass-card p-4 h-100 shadow-sm border-0">
            <h5 className="fw-bold mb-4 d-flex align-items-center">
              <FaDoorOpen className="me-2 text-primary" /> My Room Details
            </h5>
            {data.room ? (
              <div className="row g-3">
                <div className="col-6">
                  <div className="p-3 bg-light rounded shadow-xs">
                    <div className="text-muted extra-small fw-bold text-uppercase"><FaBuilding className="me-1"/> Building</div>
                    <div className="fw-bold">{data.room.buildingId?.name || 'N/A'}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded shadow-xs">
                    <div className="text-muted extra-small fw-bold text-uppercase"><FaMapMarkerAlt className="me-1"/> Location</div>
                    <div className="fw-bold text-truncate">{data.room.buildingId?.location || 'N/A'}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded shadow-xs">
                    <div className="text-muted extra-small fw-bold text-uppercase"><FaUsers className="me-1"/> Capacity</div>
                    <div className="fw-bold">{data.room.capacity} Persons</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded shadow-xs">
                    <div className="text-muted extra-small fw-bold text-uppercase">Status</div>
                    <span className={`badge ${data.room.status === 'Available' ? 'bg-success' : 'bg-info'}`}>{data.room.status}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-warning border-0">No room assigned yet. Please contact admin.</div>
            )}
          </div>
        </div>

        {/* Maintenance Requests */}
        <div className="col-lg-6">
          <div className="glass-card p-4 h-100 shadow-sm border-0">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0 d-flex align-items-center">
                <FaWrench className="me-2 text-danger" /> My Maintenance Requests
              </h5>
              <Link to="/maintenance" className="btn btn-sm btn-outline-danger rounded-pill px-3">View All</Link>
            </div>
            <div className="list-group list-group-flush">
              {data.openRequests.length > 0 ? (
                data.openRequests.map(req => (
                  <div key={req._id} className="list-group-item bg-transparent px-0 py-3 border-light">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-bold small mb-1">{req.description}</div>
                        <div className="text-muted extra-small">
                          <FaClock className="me-1"/> {new Date(req.requestDate).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`badge rounded-pill ${req.status === 'In Progress' ? 'bg-info text-dark' : 'bg-warning text-dark'}`}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted small">No active requests. Everything looks good!</div>
              )}
            </div>
          </div>
        </div>

        {/* Energy History */}
        <div className="col-12">
          <div className="glass-card p-4 shadow-sm border-0">
            <h5 className="fw-bold mb-4 d-flex align-items-center">
              <FaBolt className="me-2 text-warning" /> Energy Usage History
            </h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0">Date & Time</th>
                    <th className="border-0">Energy Consumed</th>
                    <th className="border-0 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.energyHistory.length > 0 ? (
                    data.energyHistory.map(log => (
                      <tr key={log._id}>
                        <td className="border-bottom border-light">
                          <div className="fw-bold small">{new Date(log.timestamp).toLocaleDateString()}</div>
                          <div className="text-muted extra-small">{new Date(log.timestamp).toLocaleTimeString()}</div>
                        </td>
                        <td className="border-bottom border-light">
                          <span className="fw-bold text-dark">{log.energyUsed} kWh</span>
                        </td>
                        <td className="text-end border-bottom border-light">
                          <Link to="/energy-logs" className="btn btn-sm btn-light border">Details</Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3" className="text-center py-4 text-muted small">No usage data logged yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
