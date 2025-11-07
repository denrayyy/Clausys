import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import './Auth.css';

interface LoginProps {
  onLogin: (user: any, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (recaptchaSiteKey && !recaptchaToken) {
      setError('Please complete the reCAPTCHA challenge.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        ...formData,
        recaptchaToken: recaptchaToken || undefined
      });
      if (response.data.user?.role === 'admin') {
        setError('Please use the Admin Login page.');
        return;
      }
      onLogin(response.data.user, response.data.token);
      if (recaptchaSiteKey) {
        setRecaptchaToken(null);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container figma-login-bg">
      <div className="auth-card figma-login-card">
        <div className="auth-brand">
          <div className="brand-logo" aria-hidden>
            {/* simple bulb + arrows icon using inline svg to avoid external assets */}
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

        <h2 className="login-heading">User Login</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {recaptchaSiteKey && (
            <div className="form-group">
              <ReCAPTCHA
                sitekey={recaptchaSiteKey}
                onChange={(token: string | null) => setRecaptchaToken(token)}
                onExpired={() => setRecaptchaToken(null)}
              />
            </div>
          )}

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

export default Login;
