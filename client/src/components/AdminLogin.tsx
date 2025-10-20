import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

interface AdminLoginProps {
  onLogin: (user: any, token: string) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/auth/login', formData);
      const { user, token } = response.data;
      if (user.role !== 'admin') {
        setError('Admin access only.');
        return;
      }
      onLogin(user, token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container figma-login-bg">
      <div className="auth-card figma-login-card">
        <div className="auth-brand">
          <div className="brand-logo" aria-hidden>
            <svg viewBox="0 0 64 64" width="44" height="44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 56h16" stroke="#0b5161" strokeWidth="4" strokeLinecap="round"/>
              <path d="M32 8c-9.389 0-17 7.611-17 17 0 6.06 3.087 11.382 7.78 14.5 1.689 1.114 2.22 2.654 2.22 4.5v2h16v-2c0-1.846.531-3.386 2.22-4.5C45.913 36.382 49 31.06 49 25c0-9.389-7.611-17-17-17Z" stroke="#0b5161" strokeWidth="3"/>
              <path d="M26 42h12" stroke="#0b5161" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="brand-text">
            <div className="brand-title"><span className="brand-strong">ClaUSys</span></div>
            <div className="brand-subtitle">Classroom Utilization System</div>
          </div>
        </div>

        <h2 className="login-heading">Admin Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group input-with-icon">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <span className="left-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6h16v12H4z" stroke="#0b5161" strokeWidth="1.8"/>
                  <path d="M4 7l8 6 8-6" stroke="#0b5161" strokeWidth="1.8" fill="none"/>
                </svg>
              </span>
              <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required disabled={loading} />
            </div>
          </div>
          <div className="form-group input-with-icon">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <span className="left-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="5" y="11" width="14" height="9" rx="2" stroke="#0b5161" strokeWidth="1.8"/>
                  <path d="M8 11V9a4 4 0 1 1 8 0v2" stroke="#0b5161" strokeWidth="1.8"/>
                </svg>
              </span>
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required disabled={loading} />
              <button
                type="button"
                className="right-icon toggle-visibility"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none">
                    <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" stroke="#0b5161" strokeWidth="1.8"/>
                    <circle cx="12" cy="12" r="3" stroke="#0b5161" strokeWidth="1.8"/>
                    <path d="M4 20L20 4" stroke="#0b5161" strokeWidth="1.6"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none">
                    <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" stroke="#0b5161" strokeWidth="1.8"/>
                    <circle cx="12" cy="12" r="3" stroke="#0b5161" strokeWidth="1.8"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary figma-login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
          <div className="forgot-below">
            <Link className="forgot-link" to="/forgot-password">Forgot Password?</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;


