import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import Login from './components/Login';
import AdminLogin from './components/AdminLogin';
import Landing from './components/Landing';
// removed Register and Dashboard (not used)
import TimeTracker from './components/TimeTracker';
import ClassroomManagement from './components/ClassroomManagement';
import ScheduleManagement from './components/ScheduleManagement';
import ClassroomUsage from './components/ClassroomUsage';
import Monitoring from './components/Monitoring';
import Reports from './components/Reports';
import Navigation from './components/Navigation';
import AdminDashboard from './components/AdminDashboard';
import Topbar from './components/Topbar';

// Types
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'teacher' | 'admin';
  employeeId: string;
  department: string;
  phone?: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get('/api/auth/me');
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/admin-login" element={<AdminLogin onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app">
        {user.role === 'admin' ? null : <Topbar fullName={`${user.firstName} ${user.lastName}`} onLogout={handleLogout} />}
        <main className="main-content">
          <Routes>
            {user.role === 'admin' ? (
              <>
                <Route path="/" element={<AdminDashboard fullName={`${user.firstName} ${user.lastName}`} onLogout={handleLogout} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<TimeTracker user={user} onLogout={handleLogout} />} />
            <Route path="/classrooms" element={<ClassroomManagement user={user} />} />
            <Route path="/schedules" element={<ScheduleManagement user={user} />} />
            <Route path="/usage" element={<ClassroomUsage user={user} />} />
            <Route path="/monitoring" element={<Monitoring user={user} />} />
            <Route path="/reports" element={<Reports user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;