import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaWrench, FaCheckCircle, FaPaperPlane, FaDownload, FaUserAlt, FaStickyNote, FaImage, FaClock, FaTools } from 'react-icons/fa';

const Maintenance = () => {
  const [requests, setRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]); 
  const [formData, setFormData] = useState({ roomId: '', description: '', image: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [reqRes, roomsRes] = await Promise.all([
        axios.get('/api/maintenance', { headers }),
        axios.get('/api/rooms', { headers })
      ]);
      setRequests(reqRes.data);
      setRooms(roomsRes.data);
      
      if (roomsRes.data.length > 0 && !formData.roomId) {
        setFormData(prev => ({ ...prev, roomId: roomsRes.data[0]._id }));
      }

      if (user.role === 'Admin') {
        const staffRes = await axios.get('/api/auth/role/MaintenanceStaff', { headers });
        setStaff(staffRes.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load system data. Please check your connection.');
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
          setError('Image size too large. Max 2MB.');
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(''); setSuccess('');
    
    const requestData = {
        ...formData,
        roomId: formData.roomId || (user.assignedRooms?.[0])
    };

    if(!requestData.roomId) {
        setError('Please select a valid room.');
        setSubmitting(false);
        return;
    }
    
    try {
      await axios.post('/api/maintenance', requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Maintenance request submitted successfully');
      setFormData({ roomId: rooms[0]?._id || '', description: '', image: '' });
      await fetchData(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    let notes = '';
    if (newStatus === 'Completed') {
      notes = window.prompt('Add repair details/notes:');
      if (notes === null) return; 
    }

    setUpdatingId(id);
    try {
      await axios.put(`/api/maintenance/${id}`, { status: newStatus, notes }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchData(false);
      setSuccess(`Status updated to ${newStatus}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateAssignment = async (id, staffId) => {
    setUpdatingId(id);
    try {
      await axios.put(`/api/maintenance/${id}`, { assignedStaff: staffId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchData(false);
      setSuccess('Technician assigned successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating assignment');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExport = () => {
    const headers = ['ID', 'Room', 'Description', 'Date', 'Status', 'Technician', 'Repair Notes'];
    const csvContent = filteredRequests.map(req => [
      req._id,
      req.roomId?.roomNumber || 'N/A',
      `"${req.description.replace(/"/g, '""')}"`,
      new Date(req.requestDate).toLocaleDateString(),
      req.status,
      req.assignedStaff?.name || 'Unassigned',
      `"${(req.notes || '').replace(/"/g, '""')}"`
    ].join(','));
    
    csvContent.unshift(headers.join(','));
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maintenance_logs_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredRequests = [...requests]
    .filter(req => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (req.roomId?.roomNumber || '').toLowerCase().includes(searchLower) ||
        (req._id || '').toLowerCase().includes(searchLower) ||
        (req.description || '').toLowerCase().includes(searchLower);
        
      const matchesStatus = filterStatus === 'All' ? true : req.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0">
            <FaWrench className="me-2 text-primary" />
            {user.role === 'MaintenanceStaff' ? 'My Assignments' : 'Maintenance System'}
            {loading && <span className="spinner-border spinner-border-sm text-primary ms-3"></span>}
          </h2>
          <p className="text-muted small mb-0">Track and manage building maintenance tasks</p>
        </div>
        {user.role !== 'Resident' && (
          <button className="btn btn-primary d-flex align-items-center px-4" onClick={handleExport} disabled={filteredRequests.length === 0}>
              <FaDownload className="me-2" /> Export Logs
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger border-0 shadow-sm slide-in mb-4 small">{error}</div>}
      {success && <div className="alert alert-success border-0 shadow-sm slide-in mb-4 small">{success}</div>}

      <div className="row g-4">
        {/* Submit Request Section */}
        <div className="col-12 col-xl-4">
          <div className="glass-card h-100 p-4 border-top border-4 border-primary shadow-sm">
            <h5 className="fw-bold mb-4 d-flex align-items-center">
              <FaPaperPlane className="me-2 text-primary" />
              {user.role === 'Resident' ? 'Report New Issue' : 'Log Request'}
            </h5>
            <form onSubmit={handleCreateRequest}>
              {user.role !== 'Resident' && (
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Select Affected Room</label>
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
                        {r.roomNumber} - {r.buildingId?.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold">Issue Description</label>
                <textarea 
                  className="form-control bg-light border-0" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows="4"
                  required 
                  placeholder="Describe the problem in detail..."
                  disabled={submitting}
                />
              </div>
              <div className="mb-4">
                <label className="form-label text-muted small fw-bold">Issue Photo (Optional)</label>
                <div className="input-group">
                    <span className="input-group-text bg-light border-0"><FaImage className="text-muted" /></span>
                    <input 
                        type="file" 
                        className="form-control bg-light border-0" 
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={submitting}
                    />
                </div>
                {formData.image && (
                    <div className="mt-2 text-center fade-in">
                        <img src={formData.image} alt="Preview" className="img-thumbnail" style={{maxHeight: '100px'}} />
                        <button type="button" className="btn btn-sm btn-link text-danger d-block mx-auto" onClick={() => setFormData(p => ({...p, image: ''}))}>Remove</button>
                    </div>
                )}
              </div>
              <button type="submit" className="btn btn-primary w-100 fw-bold py-2 shadow-sm" disabled={submitting}>
                {submitting ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Submitting...
                    </>
                ) : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>

        {/* Requests Management Table */}
        <div className="col-12 col-xl-8">
          <div className="glass-card h-100 p-4 shadow-sm">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <div className="flex-grow-1" style={{minWidth: '200px'}}>
                    <div className="input-group">
                        <span className="input-group-text bg-light border-0 text-muted small">Search</span>
                        <input
                            type="text"
                            className="form-control bg-light border-0"
                            placeholder="Room or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div style={{minWidth: '150px'}}>
                    <select
                        className="form-select bg-light border-0"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-4 py-3 border-0">Request Tracking</th>
                    <th className="py-3 border-0">Current Status</th>
                    <th className="py-3 border-0">Assigned To</th>
                    <th className="py-3 text-end px-4 border-0">Workflow Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                       <tr>
                          <td colSpan="4" className="text-center py-5">
                              <div className="spinner-border text-primary mb-2"></div>
                              <div className="text-muted small">Synchronizing tasks...</div>
                          </td>
                       </tr>
                  ) : filteredRequests.length > 0 ? (
                    filteredRequests.map((req) => (
                      <tr key={req._id} className="fade-in">
                        <td className="px-4 py-3 border-bottom border-light">
                          <div className="d-flex align-items-center">
                            {req.image ? (
                                <img src={req.image} alt="Issue" className="rounded me-3 shadow-sm border" style={{width: '40px', height: '40px', objectFit: 'cover'}} />
                            ) : (
                                <div className="rounded bg-light d-flex align-items-center justify-content-center me-3 border" style={{width: '40px', height: '40px'}}>
                                    <FaWrench className="text-muted extra-small" />
                                </div>
                            )}
                            <div>
                                <div className="fw-bold mb-0">Room {req.roomId?.roomNumber || 'N/A'}</div>
                                <div className="text-muted extra-small" style={{fontSize: '0.7rem'}}>
                                    <FaClock className="me-1" /> {new Date(req.requestDate).toLocaleDateString()}
                                </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 border-bottom border-light">
                           <span className={`badge px-3 py-2 rounded-pill small ${
                             req.status === 'Completed' ? 'bg-success' : 
                             req.status === 'In Progress' ? 'bg-info text-dark' : 'bg-warning text-dark'
                           }`}>
                              {req.status}
                           </span>
                        </td>
                        <td className="py-3 border-bottom border-light">
                          {user.role === 'Admin' ? (
                            <select 
                              className="form-select form-select-sm bg-light border-0" 
                              style={{width: 'auto', maxWidth: '140px'}}
                              value={req.assignedStaff?._id || ''} 
                              onChange={(e) => handleUpdateAssignment(req._id, e.target.value)}
                              disabled={updatingId === req._id}
                            >
                              <option value="">Unassigned</option>
                              {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                          ) : (
                            <span className="text-muted small d-flex align-items-center">
                              <FaUserAlt className="me-2 text-primary" /> {req.assignedStaff?.name || <em>Unassigned</em>}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-end px-4 border-bottom border-light">
                          {updatingId === req._id ? (
                              <div className="spinner-border spinner-border-sm text-primary"></div>
                          ) : req.status !== 'Completed' ? (
                              <div className="d-flex justify-content-end gap-2">
                                {(user.role === 'Admin' || (user.role === 'MaintenanceStaff' && req.assignedStaff?._id === user.id)) && (
                                    <>
                                        {req.status === 'Pending' && (
                                            <button className="btn btn-sm btn-outline-info" onClick={() => handleUpdateStatus(req._id, 'In Progress')}>
                                                <FaTools size={12} className="me-1" /> Start
                                            </button>
                                        )}
                                        <button className="btn btn-sm btn-success shadow-sm" onClick={() => handleUpdateStatus(req._id, 'Completed')}>
                                            <FaCheckCircle size={12} className="me-1" /> Resolve
                                        </button>
                                    </>
                                )}
                                {user.role === 'Resident' && <span className="text-muted extra-small italic">Pending review...</span>}
                              </div>
                          ) : (
                              <div className="text-success small fw-bold d-flex flex-column align-items-end">
                                  <span><FaCheckCircle className="me-1" /> Completed</span>
                                  {req.notes && <div className="text-muted extra-small fw-normal mt-1" style={{maxWidth: '150px'}}><FaStickyNote className="me-1"/>{req.notes}</div>}
                              </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-5 text-muted border-0">
                          <FaWrench size={30} className="mb-3 opacity-25" /><br/>
                          No maintenance requests found matching your filters.
                      </td>
                    </tr>
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

export default Maintenance;
