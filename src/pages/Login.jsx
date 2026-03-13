import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, var(--surface-hover), var(--bg-color))' }}>
      <div className="glass-card p-5 fade-in" style={{ width: '100%', maxWidth: '420px', margin: '20px' }}>
        <div className="text-center mb-4">
          <div className="d-inline-block p-3 rounded-circle bg-primary-subtle mb-3">
             <span className="fs-1">🏢</span>
          </div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--primary)' }}>SBAMS Portal</h2>
          <p className="text-muted">Sign in to your account</p>
        </div>
        
        {error && (
            <div className="alert alert-danger border-0 py-2 text-center small slide-in mb-4" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                {error}
            </div>
        )}
        
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
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
          <div className="mb-2">
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
          <button 
            type="submit" 
            className="btn btn-primary btn-lg w-100 fw-bold mt-2 d-flex align-items-center justify-content-center"
            disabled={loading}
          >
            {loading ? (
                <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Authenticating...
                </>
            ) : 'Sign In'}
          </button>
        </form>
        
        <p className="text-center mt-4 mb-0 text-muted">
          Don't have an account? <Link to="/register" className="text-primary text-decoration-none fw-bold hover-underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
