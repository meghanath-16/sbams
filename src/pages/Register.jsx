import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'MaintenanceStaff', roomId: '' });
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get('/api/rooms');
        setRooms(res.data);
      } catch (err) {
        console.error('Error fetching rooms:', err);
      }
    };
    fetchRooms();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/auth/register', formData);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 py-5" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, var(--surface-hover), var(--bg-color))' }}>
      <div className="glass-card p-5 fade-in" style={{ width: '100%', maxWidth: '480px', margin: '20px' }}>
        <div className="text-center mb-4">
          <div className="d-inline-block p-3 rounded-circle bg-primary-subtle mb-3">
             <span className="fs-1">📝</span>
          </div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--primary)' }}>Create Account</h2>
          <p className="text-muted">Join the SBAMS platform</p>
        </div>
        
        {error && <div className="alert alert-danger border-0 py-2 text-center small slide-in mb-3" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{error}</div>}
        {success && <div className="alert alert-success border-0 py-2 text-center small slide-in mb-3" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981' }}>{success}</div>}
        
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label text-muted small fw-bold mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-control form-control-lg bg-light border-0"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="form-label text-muted small fw-bold mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-control form-control-lg bg-light border-0"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="form-label text-muted small fw-bold mb-1">Password</label>
            <input
              type="password"
              name="password"
              className="form-control form-control-lg bg-light border-0"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-2">
            <label className="form-label text-muted small fw-bold mb-1">Account Role</label>
            <select
              name="role"
              className="form-select form-select-lg bg-light border-0"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="MaintenanceStaff">Maintenance Staff</option>
              <option value="Resident">Resident</option>
              <option value="Admin">Administrator</option>
            </select>
          </div>

          {formData.role === 'Resident' && (
            <div className="slide-in">
              <label className="form-label text-muted small fw-bold mb-1">Assign to Room</label>
              <select
                name="roomId"
                className="form-select form-select-lg border-primary bg-primary-subtle border-0"
                value={formData.roomId}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Select your room...</option>
                {rooms.map(r => (
                  <option key={r._id} value={r._id}>{r.roomNumber} - {r.buildingId?.name || 'Unknown Building'}</option>
                ))}
              </select>
            </div>
          )}
          <button 
             type="submit" 
             className="btn btn-primary btn-lg w-100 fw-bold mt-2 d-flex align-items-center justify-content-center"
             disabled={loading}
          >
            {loading ? (
                <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Creating Account...
                </>
            ) : 'Register'}
          </button>
        </form>
        
        <p className="text-center mt-4 mb-0 text-muted">
          Already have an account? <Link to="/login" className="text-primary text-decoration-none fw-bold">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
