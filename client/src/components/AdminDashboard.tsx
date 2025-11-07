import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

interface AdminDashboardProps {
  fullName: string;
  onLogout?: () => void;
  profilePhoto?: string;
}

interface ActivityRecord {
  _id: string;
  student: {
    firstName: string;
    lastName: string;
    email: string;
  };
  classroom: {
    name: string;
    location: string;
  };
  instructorName: string;
  timeIn: string;
  timeOut?: string;
  date: string;
  isArchived?: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ fullName }) => {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [archivedActivities, setArchivedActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchName, setSearchName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/timein', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Separate archived and non-archived records
      const nonArchived = response.data.filter((record: ActivityRecord) => !record.isArchived);
      const archived = response.data.filter((record: ActivityRecord) => record.isArchived);
      
      setActivities(nonArchived);
      setArchivedActivities(archived);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setLoading(false);
    }
  };

  const handleArchiveClick = (id: string) => {
    setSelectedRecordId(id);
    setShowArchiveConfirm(true);
  };

  const handleArchiveConfirm = async () => {
    if (!selectedRecordId) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/timein/${selectedRecordId}/archive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Record archived successfully');
      setShowArchiveConfirm(false);
      setSelectedRecordId(null);
      fetchRecentActivities();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to archive record');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleArchiveCancel = () => {
    setShowArchiveConfirm(false);
    setSelectedRecordId(null);
  };

  const handleUnarchive = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/timein/${id}/unarchive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Record unarchived successfully');
      fetchRecentActivities();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to unarchive record');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedRecordId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRecordId) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/timein/${selectedRecordId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Record deleted successfully');
      setShowDeleteConfirm(false);
      setSelectedRecordId(null);
      fetchRecentActivities();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete record');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setSelectedRecordId(null);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  const getStatus = (record: ActivityRecord) => {
    return record.timeOut ? 'Time Out' : 'Active';
  };

  const filterActivities = (activitiesList: ActivityRecord[]) => {
    return activitiesList.filter((activity) => {
      // Filter by name
      if (searchName) {
        const fullName = `${activity.student?.firstName} ${activity.student?.lastName}`.toLowerCase();
        if (!fullName.includes(searchName.toLowerCase())) {
          return false;
        }
      }

      // Filter by status
      if (filterStatus !== 'all') {
        const isActive = !activity.timeOut;
        if (filterStatus === 'active' && !isActive) return false;
        if (filterStatus === 'timed-out' && isActive) return false;
      }

      // Filter by date
      if (filterDate) {
        const activityDate = new Date(activity.timeIn).toLocaleDateString('en-US');
        const selectedDate = new Date(filterDate).toLocaleDateString('en-US');
        if (activityDate !== selectedDate) {
          return false;
        }
      }

      return true;
    });
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Recent Activities</h2>
          <p>Monitor recent classroom usage and time-in/out records</p>
        </div>
        
        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <div className="activities-section">
          <div className="activities-header">
            <button 
              className={`btn-toggle ${!showArchived ? 'active' : ''}`}
              onClick={() => setShowArchived(false)}
            >
              Recent Activities
            </button>
            <button 
              className={`btn-toggle ${showArchived ? 'active' : ''}`}
              onClick={() => setShowArchived(true)}
            >
              Archived ({archivedActivities.length})
            </button>
          </div>

          <div className="filters-section">
            <div className="filter-group">
              <label>Search by Name:</label>
              <input
                type="text"
                placeholder="Enter name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label>Filter by Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="timed-out">Time Out</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Filter by Date:</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="filter-input"
              />
            </div>
            <button 
              className="btn-clear-filters"
              onClick={() => {
                setSearchName('');
                setFilterStatus('all');
                setFilterDate('');
              }}
            >
              Clear Filters
            </button>
          </div>

          {loading ? (
            <p>Loading activities...</p>
          ) : (() => {
            const filteredActivities = filterActivities(
              (showArchived ? archivedActivities : activities).filter(
                (activity) => activity.student && activity.classroom
              )
            );
            return filteredActivities.length === 0 ? (
              <p>No {showArchived ? 'archived' : 'recent'} activities found.</p>
            ) : (
              <div className="activities-table-container">
                <table className="activities-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Account Name</th>
                      <th>Instructor</th>
                      <th>ComLab</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.map((activity) => {
                      const { date, time } = formatDateTime(activity.timeIn);
                      const isActive = !activity.timeOut;
                      return (
                        <tr key={activity._id}>
                          <td>{date}</td>
                          <td>{time}</td>
                          <td>{activity.student?.firstName} {activity.student?.lastName}</td>
                          <td>{activity.instructorName || 'N/A'}</td>
                          <td>{activity.classroom?.name}</td>
                          <td className={isActive ? 'status-active' : 'status-timed-out'}>
                            {getStatus(activity)}
                          </td>
                          <td>
                            {!showArchived ? (
                              <button 
                                className="btn-archive"
                                onClick={() => handleArchiveClick(activity._id)}
                              >
                                Archive
                              </button>
                            ) : (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  className="btn-unarchive"
                                  onClick={() => handleUnarchive(activity._id)}
                                >
                                  Unarchive
                                </button>
                                <button 
                                  className="btn-delete"
                                  onClick={() => handleDeleteClick(activity._id)}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            );
          })()}
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Archive Record</h3>
            <p>Are you sure you want to archive this record?</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={handleArchiveCancel}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={handleArchiveConfirm}>
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Delete Record</h3>
            <p>Are you sure you want to permanently delete this archived record? This action cannot be undone.</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;


