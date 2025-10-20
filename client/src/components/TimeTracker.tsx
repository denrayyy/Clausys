import React, { useState } from 'react';
import './TimeTracker.css';
import TimeIn from './TimeIn';

interface TimeTrackerProps {
  user: { firstName: string; lastName: string; email: string };
  onLogout: () => void;
}

const TimeTracker: React.FC<TimeTrackerProps> = ({ user, onLogout }) => {
  const [showTimeIn, setShowTimeIn] = useState(false);

  const handleTimeIn = () => {
    setShowTimeIn(true);
  };

  const handleTimeOut = () => {
    // TODO: integrate with backend time-out endpoint
    alert('Time Out recorded');
  };

  const handleBack = () => {
    setShowTimeIn(false);
  };

  if (showTimeIn) {
    return <TimeIn user={user} onBack={handleBack} />;
  }

  return (
    <div className="time-page">
      <div className="time-content">
        <div className="time-actions">
          <button className="btn-time btn-in" onClick={handleTimeIn}>
            <span className="icon" aria-hidden>✔</span>
            <span>Time In</span>
          </button>
          <button className="btn-time btn-out" onClick={handleTimeOut}>
            <span className="icon" aria-hidden>⏰</span>
            <span>Time Out</span>
          </button>
        </div>

        <button className="btn-logout" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
};

export default TimeTracker;


