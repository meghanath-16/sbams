import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrash, FaPlus, FaBuilding } from 'react-icons/fa';

const Buildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({ buildingName: '', location: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const fetchBuildings = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await axios.get('/api/buildings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBuildings(res.data);
    } catch (err) {
      console.error('Error fetching buildings:', err);
      setError(err.response?.data?.message || 'Failed to load buildings');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBuildings();
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddBuilding = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(''); setSuccess('');
    try {
      await axios.post('/api/buildings', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Building added successfully');
      setFormData({ buildingName: '', location: '' });
      await fetchBuildings(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding building');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this building?')) return;
    setDeletingId(id);
    try {
      await axios.delete(`/api/buildings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Building deleted successfully');
      await fetchBuildings(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting building');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark"><FaBuilding className="me-2" />Buildings Management</h2>
      </div>

      {error && <div className="alert alert-danger shadow-sm border-0">{error}</div>}
      {success && <div className="alert alert-success shadow-sm border-0">{success}</div>}

      <div className="row g-4">
        {/* Only show Add Building form to Admins */}
        {user.role === 'Admin' && (
          <div className="col-12 col-xl-4">
            <div className="glass-card h-100 p-2 border-start border-4 border-primary">
              <div className="card-header bg-transparent border-0 fw-bold py-3 fs-5">Add New Building</div>
              <div className="card-body">
                <form onSubmit={handleAddBuilding}>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-bold">Building Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="buildingName" 
                      value={formData.buildingName} 
                      onChange={handleChange} 
                      required 
                      placeholder="e.g. North Tower"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label text-muted fw-bold">Location</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="location" 
                      value={formData.location} 
                      onChange={handleChange} 
                      required 
                      placeholder="e.g. 123 Main Campus"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-100 fw-bold" disabled={submitting}>
                    {submitting ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Adding...
                        </>
                    ) : (
                        <><FaPlus className="me-2" />Add Building</>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className={`col-12 ${user.role === 'Admin' ? 'col-xl-8' : 'col-xl-12'}`}>
          <div className="glass-card h-100 p-2">
            <div className="card-header bg-transparent border-0 fw-bold py-3 fs-5 d-flex justify-content-between">
                <span>Registered Buildings</span>
                {loading && <div className="spinner-border spinner-border-sm text-primary"></div>}
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3">Building Name</th>
                      <th className="py-3">Location</th>
                      <th className="py-3 text-end px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="3" className="text-center py-5">
                                <div className="spinner-border text-primary mb-2"></div>
                                <div className="text-muted small">Loading building infrastructure...</div>
                            </td>
                        </tr>
                    ) : buildings.length > 0 ? (
                      buildings.map((b) => (
                        <tr key={b._id} className="fade-in">
                          <td className="px-4 py-3 fw-bold">{b.name}</td>
                          <td className="py-3">{b.location}</td>
                          <td className="py-3 text-end px-4">
                            {user.role === 'Admin' ? (
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => handleDelete(b._id)}
                                disabled={deletingId === b._id}
                              >
                                {deletingId === b._id ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                    <FaTrash />
                                )}
                              </button>
                            ) : (
                              <span className="text-muted small">View Only</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center py-5 text-muted">No buildings registered yet.</td>
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

export default Buildings;
