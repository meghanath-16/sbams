import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrash, FaPlus, FaDoorOpen } from 'react-icons/fa';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [formData, setFormData] = useState({ buildingId: '', roomNumber: '', capacity: '', status: 'Available' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [roomsRes, bldgRes] = await Promise.all([
        axios.get('/api/rooms', { headers }),
        axios.get('/api/buildings', { headers })
      ]);
      setRooms(roomsRes.data);
      setBuildings(bldgRes.data);
      
      if (bldgRes.data.length > 0 && !formData.buildingId) {
        setFormData(prev => ({ ...prev, buildingId: bldgRes.data[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load rooms data.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      const interval = setInterval(() => fetchData(false), 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(''); setSuccess('');
    if(!formData.buildingId) {
        setError('Please select a valid building.');
        setSubmitting(false);
        return;
    }
    try {
      await axios.post('/api/rooms', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Room added successfully');
      setFormData({ buildingId: buildings[0]?._id || '', roomNumber: '', capacity: '', status: 'Available' });
      await fetchData(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    setDeletingId(id);
    try {
      await axios.delete(`/api/rooms/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Room deleted successfully');
      await fetchData(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting room');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark"><FaDoorOpen className="me-2" />Rooms Management</h2>
        {loading && <div className="spinner-border spinner-border-sm text-primary"></div>}
      </div>

      {error && <div className="alert alert-danger shadow-sm border-0 small slide-in mb-4">{error}</div>}
      {success && <div className="alert alert-success shadow-sm border-0 small slide-in mb-4">{success}</div>}

      <div className="row g-4">
        {/* Admin Add Form */}
        {user.role === 'Admin' && (
          <div className="col-12 col-xl-4">
            <div className="glass-card h-100 p-2 border-start border-4 border-success">
              <div className="card-header bg-transparent border-0 fw-bold py-3 fs-5">Add New Room</div>
              <div className="card-body">
                <form onSubmit={handleAddRoom}>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-bold">Select Building</label>
                    <select 
                      className="form-select bg-light border-0" 
                      name="buildingId" 
                      value={formData.buildingId} 
                      onChange={handleChange} 
                      required
                      disabled={submitting}
                    >
                      <option value="" disabled>Choose a building...</option>
                      {buildings.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-bold">Room Number/Name</label>
                    <input 
                      type="text" 
                      className="form-control bg-light border-0" 
                      name="roomNumber" 
                      value={formData.roomNumber} 
                      onChange={handleChange} 
                      required 
                      placeholder="e.g. 101, Conference Room A"
                      disabled={submitting}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-bold">Capacity (People)</label>
                    <input 
                      type="number" 
                      className="form-control bg-light border-0" 
                      name="capacity" 
                      value={formData.capacity} 
                      onChange={handleChange} 
                      required 
                      min="1"
                      disabled={submitting}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label text-muted fw-bold">Status</label>
                    <select 
                      className="form-select bg-light border-0" 
                      name="status" 
                      value={formData.status} 
                      onChange={handleChange} 
                      required
                      disabled={submitting}
                    >
                      <option value="Available">Available</option>
                      <option value="Occupied">Occupied</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary w-100 fw-bold shadow-sm" disabled={submitting}>
                    {submitting ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Adding Room...
                        </>
                    ) : (
                        <><FaPlus className="me-2" />Add Room</>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Rooms Table */}
        <div className={`col-12 ${user.role === 'Admin' ? 'col-xl-8' : 'col-xl-12'}`}>
          <div className="glass-card h-100 p-2">
            <div className="card-header bg-transparent border-0 fw-bold py-3 fs-5 d-flex justify-content-between">
                <span>Registered Rooms</span>
                {loading && <div className="spinner-border spinner-border-sm text-primary"></div>}
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3">Room</th>
                      <th className="py-3">Building</th>
                      <th className="py-3">Capacity</th>
                      <th className="py-3">Status</th>
                      <th className="py-3 text-end px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                         <tr>
                            <td colSpan="5" className="text-center py-5">
                                <div className="spinner-border text-primary mb-2"></div>
                                <div className="text-muted small">Loading room infrastructure...</div>
                            </td>
                         </tr>
                    ) : rooms.length > 0 ? (
                      rooms.map((r) => (
                        <tr key={r._id} className="fade-in">
                          <td className="px-4 py-3 fw-bold">{r.roomNumber}</td>
                          <td className="py-3">{r.buildingId?.name || 'N/A'}</td>
                          <td className="py-3">{r.capacity} ppl</td>
                          <td className="py-3">
                            <span className={`badge px-3 py-2 rounded-pill ${r.status === 'Available' ? 'bg-success' : 'bg-warning text-dark'}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3 text-end px-4">
                            {user.role === 'Admin' ? (
                              <button 
                                className="btn btn-sm btn-outline-danger shadow-xs" 
                                onClick={() => handleDelete(r._id)}
                                disabled={deletingId === r._id}
                              >
                                {deletingId === r._id ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                    <FaTrash />
                                )}
                              </button>
                            ) : (
                              <span className="text-muted small italic">View Only</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-5 text-muted">No rooms registered yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rooms;
