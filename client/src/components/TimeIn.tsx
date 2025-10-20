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
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timeInData, setTimeInData] = useState<any>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClassroom || !evidence) {
      setError('Please select a classroom and upload evidence');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('classroom', selectedClassroom);
      formData.append('evidence', evidence);
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
        setRemarks('');
        // Reset file input
        const fileInput = document.getElementById('evidence') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Auto-redirect to TimeTracker after 2 seconds
        setTimeout(() => {
          onBack();
        }, 2000);
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

  if (success) {
    return (
      <div className="timein-page">
        <div className="timein-container">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Timed in at {formattedTime}</h2>
            <p>Your time-in has been recorded with evidence.</p>
            <p className="redirect-message">Redirecting to dashboard...</p>
            <button className="btn-primary" onClick={onBack}>
              Back to Dashboard
            </button>
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
                      {classroom.name} - {classroom.location}
                    </option>
                  ))}
                </select>
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
