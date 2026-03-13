import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBolt, FaPlus, FaDownload, FaChartPie, FaRegClock } from 'react-icons/fa';
import EnergyAnalytics from '../components/EnergyAnalytics';

const EnergyLogs = () => {
  const [logs, setLogs] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ roomId: '', energyUsed: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [logsRes, roomsRes] = await Promise.all([
        axios.get('/api/energylogs', { headers }),
        axios.get('/api/rooms', { headers })
      ]);
      setLogs(logsRes.data);
      setRooms(roomsRes.data);
      
      if (roomsRes.data.length > 0 && !formData.roomId) {
        setFormData(prev => ({ ...prev, roomId: roomsRes.data[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load sensor data charts. System may be offline.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      const interval = setInterval(() => fetchData(false), 15000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(''); setSuccess('');
    
    if(!formData.roomId) {
        setError('Please select a valid room.');
        setSubmitting(false);
        return;
    }
    if (formData.energyUsed <= 0) {
        setError('Energy consumed must be greater than 0.');
        setSubmitting(false);
        return;
    }
    
    try {
      await axios.post('/api/energylogs', { ...formData, timestamp: new Date() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Energy log added successfully');
      setFormData({ roomId: rooms[0]?._id || '', energyUsed: '' });
      setShowForm(false);
      await fetchData(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding energy log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    const headers = ['Room Number', 'Building', 'Energy Used (kWh)', 'Date Logged'];
    const csvContent = logs.map(log => [
      log.roomId?.roomNumber || 'N/A',
      log.roomId?.buildingId?.name || 'N/A',
      log.energyUsed,
      new Date(log.timestamp).toLocaleString()
    ].join(','));
    
    csvContent.unshift(headers.join(','));
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `energy_logs_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container-fluid py-4 fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0">
            <FaBolt className="me-2 text-warning" />
            Energy Intelligence
            {loading && <span className="spinner-border spinner-border-sm text-warning ms-3"></span>}
          </h2>
          <p className="text-muted small mb-0">Track {user.role === 'Resident' ? 'your room\'s' : 'building-wide'} power consumption analytics</p>
        </div>
        <div className="d-flex gap-2">
            {user.role !== 'Resident' && (
                <button className="btn btn-warning d-flex align-items-center px-4 shadow-sm border-0" onClick={() => setShowForm(!showForm)}>
                    <FaPlus className="me-2" /> Log Activity
                </button>
            )}
            <button className="btn btn-primary d-flex align-items-center px-4 shadow-sm border-0" onClick={handleExport} disabled={logs.length === 0}>
                <FaDownload className="me-2" /> Export
            </button>
        </div>
      </div>

      {error && <div className="alert alert-danger border-0 shadow-sm mb-4 slide-in small">{error}</div>}
      {success && <div className="alert alert-success border-0 shadow-sm mb-4 slide-in small">{success}</div>}

      {/* Energy Form (Conditional for Admin/Staff) */}
      {showForm && (user.role === 'Admin' || user.role === 'MaintenanceStaff') && (
        <div className="col-12 mb-5 slide-in">
          <div className="glass-card p-4 border-top border-4 border-warning shadow-sm">
            <h5 className="fw-bold mb-4 d-flex align-items-center">
              <FaPlus className="me-2 text-warning" /> Create Hourly Meter Reading
            </h5>
            <form onSubmit={handleAddLog} className="row g-3 align-items-end">
              <div className="col-md-5">
                <label className="form-label text-muted small fw-bold">Target Room</label>
                <select 
                  className="form-select bg-light border-0" 
                  name="roomId" 
                  value={formData.roomId} 
                  onChange={handleChange} 
                  required
                  disabled={submitting}
                >
                  <option value="" disabled>Choose a room...</option>
                  {rooms.map(r => (
                    <option key={r._id} value={r._id}>
                      {r.roomNumber} - {r.buildingId?.name || 'Building'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-5">
                <label className="form-label text-muted small fw-bold">Consumption Value (kWh)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control bg-light border-0" 
                  name="energyUsed" 
                  value={formData.energyUsed} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g. 12.5"
                  disabled={submitting}
                />
              </div>
              <div className="col-md-2">
                <button type="submit" className="btn btn-warning w-100 fw-bold border-0 text-dark shadow-sm" disabled={submitting}>
                    {submitting ? <span className="spinner-border spinner-border-sm"></span> : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analytics Section */}
      {loading ? (
          <div className="text-center py-5 glass-card mb-5">
              <div className="spinner-border text-primary"></div>
              <p className="mt-3 text-muted">Calculating real-time analytics...</p>
          </div>
      ) : logs.length > 0 ? (
          <EnergyAnalytics logs={logs} user={user} />
      ) : (
          <div className="alert alert-light border-0 text-center py-5 shadow-xs mb-5">
              <FaChartPie size={40} className="text-muted opacity-25 mb-3" />
              <p className="text-muted mb-0">Recording analytics data. Please log consumption to see charts.</p>
          </div>
      )}

      {/* Detailed Log History */}
      <div className="col-12">
        <div className="glass-card p-4 shadow-sm">
          <h5 className="fw-bold mb-4 d-flex align-items-center">
            <FaRegClock className="me-2 text-primary" /> 
            {user.role === 'Resident' ? 'My Meter Readings' : 'System Wide Consumption Logs'}
          </h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3 border-0">Asset Detail</th>
                  <th className="py-3 border-0">Usage Intensity</th>
                  <th className="py-3 border-0 text-center">Timestamp</th>
                  <th className="py-3 border-0 text-end px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                    <tr>
                        <td colSpan="4" className="text-center py-5">
                            <div className="spinner-border spinner-border-sm text-primary"></div>
                        </td>
                    </tr>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log._id} className="fade-in">
                      <td className="px-4 py-3 border-bottom border-light">
                        <div className="fw-bold small">{log.roomId?.roomNumber || 'N/A'}</div>
                        <div className="text-muted extra-small">{log.roomId?.buildingId?.name || 'N/A'}</div>
                      </td>
                      <td className="py-3 border-bottom border-light text-warning fw-bold">
                        {parseFloat(log.energyUsed).toFixed(2)} kWh
                      </td>
                      <td className="py-3 border-bottom border-light text-center">
                        <div className="small fw-bold">{new Date(log.timestamp).toLocaleDateString()}</div>
                        <div className="extra-small text-muted">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td className="py-3 text-end px-4 border-bottom border-light">
                        <span className="badge bg-success-subtle text-success border border-success extra-small px-3 rounded-pill">Recorded</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-5 text-muted border-0">No sensor data discovered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnergyLogs;
