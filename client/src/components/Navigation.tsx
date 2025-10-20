import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'teacher' | 'admin';
  employeeId: string;
  department: string;
}

interface NavigationProps {
  user: User;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/classrooms', label: 'Classrooms', icon: '🏫' },
    { path: '/schedules', label: 'Schedules', icon: '📅' },
    { path: '/usage', label: 'Classroom Usage', icon: '⏰' },
    { path: '/monitoring', label: 'Monitoring', icon: '👁️' },
    { path: '/reports', label: 'Reports', icon: '📈' }
  ];

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>Classroom Utilization System</h2>
        </div>

        <div className="nav-menu">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="nav-user">
          <div className="user-info">
            <span className="user-name">{user.firstName} {user.lastName}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>

        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>
      </div>

      {isMenuOpen && (
        <div className="mobile-menu">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navigation;
