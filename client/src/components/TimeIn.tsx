import React, { useState, useEffect } from 'react';
import './TimeIn.css';

interface TimeInProps {
  user: { firstName: string; lastName: string; email: string };
  onBack: () => void;
}

interface Classroom {
  _id: string;
  name: string;
  location: string;
  capacity: number;
}

const TimeIn: React.FC<TimeInProps> = ({ user, onBack }) => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [evidence, setEvidence] = useState<File | null>(null);
  const [instructorName, setInstructorName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timeInData, setTimeInData] = useState<any>(null);
  const [timeOutSuccess, setTimeOutSuccess] = useState(false);
  const [timeOutTime, setTimeOutTime] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);

  // Get current date and time
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
  const formattedTime = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  useEffect(() => {
    fetchClassrooms();
    checkActiveTimeIn();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/classrooms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setClassrooms(data);
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
  };

  const checkActiveTimeIn = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/timein', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Find active time-in (one without timeOut)
        const activeTimeIn = data.find((record: any) => !record.timeOut);
        
        if (activeTimeIn) {
          setTimeInData(activeTimeIn);
          setSuccess(true);
        }
      }
    } catch (error) {
      console.error('Error checking active time-in:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setEvidence(file);
      setError('');
    }
  };

  const handleTimeOut = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/timein/timeout', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        const timeOutDate = new Date(data.timeInRecord.timeOut);
        const formattedTime = timeOutDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        setTimeOutTime(formattedTime);
        setTimeOutSuccess(true);
        setSuccess(false); // Clear the success state
      } else {
        setError(data.message || 'Time-out failed');
      }
    } catch (error) {
      console.error('Time-out error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    setShowLogoutSuccess(true);
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const handleLoginAgain = () => {
    // Clear token and redirect to landing page
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClassroom || !evidence || !instructorName.trim()) {
      setError('Please select a classroom, upload evidence, and enter instructor name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('classroom', selectedClassroom);
      formData.append('evidence', evidence);
      formData.append('instructorName', instructorName);
      if (remarks) formData.append('remarks', remarks);

      console.log('Sending time-in request...', { selectedClassroom, evidence: evidence?.name, remarks });
      
      const response = await fetch('/api/timein', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setTimeInData(data.timeInRecord);
        setSuccess(true);
        // Reset form
        setSelectedClassroom('');
        setEvidence(null);
        setInstructorName('');
        setRemarks('');
        // Reset file input
        const fileInput = document.getElementById('evidence') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setError(data.message || 'Time-in failed');
      }
    } catch (error) {
      console.error('Time-in error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Cannot connect to server. Please make sure the server is running.');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show logout success screen
  if (showLogoutSuccess) {
    return (
      <div className="logout-page">
        <div className="logout-container">
          <div className="logout-content">
            <div className="logout-logo">
              <svg viewBox="0 0 64 64" width="80" height="80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 56h16" stroke="#11303b" strokeWidth="4" strokeLinecap="round"/>
                <path d="M32 8c-9.389 0-17 7.611-17 17 0 6.06 3.087 11.382 7.78 14.5 1.689 1.114 2.22 2.654 2.22 4.5v2h16v-2c0-1.846.531-3.386 2.22-4.5C45.913 36.382 49 31.06 49 25c0-9.389-7.611-17-17-17Z" stroke="#11303b" strokeWidth="3"/>
                <path d="M26 42h12" stroke="#11303b" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="logout-title">ClaUSys</h1>
            <p className="logout-subtitle">Classroom Utilization System</p>
            <p className="logout-message">Successfully Logged Out!</p>
            <button className="btn-login-again" onClick={handleLoginAgain}>
              Login Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show time-out success screen
  if (timeOutSuccess) {
    return (
      <div className="status-page">
        <div className="status-box">
          <div className="status-content">
            <div className="status-icon">⏰</div>
            <h2 className="status-title">Timed out at {timeOutTime}</h2>
            <p className="status-message">Your time-out has been recorded successfully.</p>
            <button className="btn-logout-blue" onClick={handleLogoutClick}>
              Logout
            </button>
          </div>
        </div>
        {showLogoutConfirm && (
          <div className="modal-overlay">
            <div className="logout-confirm-modal">
              <p className="logout-confirm-text">Are you sure you want to <strong>log-out</strong>?</p>
              <div className="logout-confirm-buttons">
                <button className="btn-confirm-yes" onClick={handleLogoutConfirm}>Yes</button>
                <button className="btn-confirm-no" onClick={handleLogoutCancel}>No</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show time-in success screen with Time Out button
  if (success) {
    // Get the time-in time from the record if available, otherwise use current time
    let displayTime = formattedTime;
    if (timeInData && timeInData.timeIn) {
      const timeInDate = new Date(timeInData.timeIn);
      displayTime = timeInDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    return (
      <div className="status-page">
        <div className="status-box">
          <div className="status-content">
            <div className="status-icon-check">✓</div>
            <h2 className="status-title">Timed in at {displayTime}</h2>
            <p className="status-message">Your time-in has been recorded with evidence.</p>
            <button 
              className="btn-timeout-red" 
              onClick={handleTimeOut}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Time Out'}
            </button>
            {error && <div className="error-message" style={{marginTop: '20px'}}>{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="timein-page">
      <div className="timein-container">
        <div className="timein-header">
          <button className="back-btn" onClick={onBack}>
            ← Proof of Timed-in
          </button>
        </div>

        <form className="timein-form" onSubmit={handleSubmit}>
          <div className="form-content">
            <div className="upload-section">
              <div className="upload-area">
                <div className="upload-icon">
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17l10 5 10-5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12l10 5 10-5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <input
                  type="file"
                  id="evidence"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <button type="button" className="upload-btn" onClick={() => document.getElementById('evidence')?.click()}>
                  Upload Photo
                </button>
                {evidence && (
                  <p className="file-info">Selected: {evidence.name}</p>
                )}
              </div>
            </div>

            <div className="form-fields">
              <div className="field-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={`${user.firstName} ${user.lastName}`}
                  readOnly
                  className="readonly-field"
                />
              </div>

              <div className="field-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="readonly-field"
                />
              </div>

              <div className="field-group">
                <label>Time-In:</label>
                <input
                  type="text"
                  value={formattedTime}
                  readOnly
                  className="readonly-field"
                />
              </div>

              <div className="field-group">
                <label>Date:</label>
                <input
                  type="text"
                  value={formattedDate}
                  readOnly
                  className="readonly-field"
                />
              </div>

              <div className="field-group">
                <label>Classroom:</label>
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  required
                  className="form-field"
                >
                  <option value="">Select Classroom</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom._id} value={classroom._id}>
                      {classroom.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label>Instructor Name:</label>
                <input
                  type="text"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  placeholder="Enter instructor's name"
                  required
                  className="form-field"
                />
              </div>

              <div className="field-group">
                <label>Remarks (Optional):</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any remarks..."
                  className="form-field"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="submit"
              className="btn-timein"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Time-In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeIn;
