import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

interface AdminDashboardProps {
  fullName: string;
  onLogout?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ fullName, onLogout }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="brand">
          <div className="logo" aria-hidden>
            <svg viewBox="0 0 64 64" width="34" height="34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 56h16" stroke="#11303b" strokeWidth="4" strokeLinecap="round"/>
              <path d="M32 8c-9.389 0-17 7.611-17 17 0 6.06 3.087 11.382 7.78 14.5 1.689 1.114 2.22 2.654 2.22 4.5v2h16v-2c0-1.846.531-3.386 2.22-4.5C45.913 36.382 49 31.06 49 25c0-9.389-7.611-17-17-17Z" stroke="#11303b" strokeWidth="3"/>
              <path d="M26 42h12" stroke="#11303b" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="brand-text">
            <div className="title">ClaUSys</div>
            <div className="subtitle">Classroom Utilization System</div>
          </div>
        </div>
        <div className="user" ref={menuRef}>
          <span className="name">{fullName}</span>
          <button className="avatar" aria-label="Admin menu" onClick={() => setMenuOpen((s) => !s)}>
            <svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg" fill="none">
              <circle cx="12" cy="8" r="3.5" stroke="#102a36" strokeWidth="1.8"/>
              <path d="M4 20c1.8-4 5-6 8-6s6.2 2 8 6" stroke="#102a36" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="admin-menu">
              <button className="menu-item" onClick={() => { setMenuOpen(false); onLogout && onLogout(); }}>Log out</button>
            </div>
          )}
        </div>
      </header>

      <main className="admin-cards">
        <button className="admin-card" onClick={() => navigate('/schedules')}>
          <div className="icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="88" height="88" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="5" width="18" height="16" rx="2" stroke="#16384a" strokeWidth="2"/>
              <path d="M7 3v4M17 3v4M3 10h18" stroke="#16384a" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 15l2 2 4-4" stroke="#16384a" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="label">Scheduling</div>
        </button>

        <button className="admin-card" onClick={() => navigate('/reports')}>
          <div className="icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="88" height="88" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="3" width="14" height="18" rx="2" stroke="#16384a" strokeWidth="2"/>
              <path d="M8 8h6M8 12h6M8 16h4" stroke="#16384a" strokeWidth="2" strokeLinecap="round"/>
              <path d="M14 3v4h4" stroke="#16384a" strokeWidth="2"/>
            </svg>
          </div>
          <div className="label">Reports</div>
        </button>

        <button className="admin-card" onClick={() => navigate('/classrooms')}>
          <div className="icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="88" height="88" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="10" r="3" stroke="#16384a" strokeWidth="2"/>
              <circle cx="17" cy="12" r="3" stroke="#16384a" strokeWidth="2"/>
              <path d="M4 20c1.2-3.2 3.6-5 5-5 2 0 3 1 4 2M13 17c1.1-1.2 2.3-2 4-2 2 0 3.8 1.6 5 5" stroke="#16384a" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="label">Manage Users</div>
        </button>
      </main>
    </div>
  );
};

export default AdminDashboard;


