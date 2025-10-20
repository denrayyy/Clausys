import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ClassroomManagement.css';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'teacher' | 'admin';
  employeeId: string;
  department: string;
}

interface Classroom {
  _id: string;
  name: string;
  capacity: number;
  location: string;
  equipment: string[];
  isAvailable: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface ClassroomManagementProps {
  user: User;
}

const ClassroomManagement: React.FC<ClassroomManagementProps> = ({ user }) => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    location: '',
    equipment: '',
    description: '',
    isAvailable: true
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/classrooms');
      setClassrooms(response.data);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      setError('Failed to fetch classrooms');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const classroomData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        equipment: formData.equipment.split(',').map(item => item.trim()).filter(item => item)
      };

      if (editingClassroom) {
        await axios.put(`/api/classrooms/${editingClassroom._id}`, classroomData);
      } else {
        await axios.post('/api/classrooms', classroomData);
      }

      setShowForm(false);
      setEditingClassroom(null);
      setFormData({
        name: '',
        capacity: '',
        location: '',
        equipment: '',
        description: '',
        isAvailable: true
      });
      fetchClassrooms();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save classroom');
    }
  };

  const handleEdit = (classroom: Classroom) => {
    setEditingClassroom(classroom);
    setFormData({
      name: classroom.name,
      capacity: classroom.capacity.toString(),
      location: classroom.location,
      equipment: classroom.equipment.join(', '),
      description: classroom.description || '',
      isAvailable: classroom.isAvailable
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this classroom?')) {
      try {
        await axios.delete(`/api/classrooms/${id}`);
        fetchClassrooms();
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to delete classroom');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingClassroom(null);
    setFormData({
      name: '',
      capacity: '',
      location: '',
      equipment: '',
      description: '',
      isAvailable: true
    });
    setError('');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading classrooms...</p>
      </div>
    );
  }

  return (
    <div className="classroom-management">
      <div className="page-header">
        <h1>Classroom Management</h1>
        <p>Manage classroom information and availability</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2>Classrooms</h2>
          {user.role === 'admin' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              Add Classroom
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="classroom-form">
            <h3>{editingClassroom ? 'Edit Classroom' : 'Add New Classroom'}</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Classroom Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="capacity">Capacity</label>
                <input
                  type="number"
                  id="capacity"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="equipment">Equipment (comma-separated)</label>
              <input
                type="text"
                id="equipment"
                value={formData.equipment}
                onChange={(e) => setFormData({...formData, equipment: e.target.value})}
                placeholder="e.g., Projector, Whiteboard, Computer"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                />
                Available for booking
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingClassroom ? 'Update' : 'Create'} Classroom
              </button>
            </div>
          </form>
        )}

        <div className="classroom-grid">
          {classrooms.length === 0 ? (
            <div className="no-classrooms">
              <p>No classrooms found. {user.role === 'admin' && 'Add a classroom to get started.'}</p>
            </div>
          ) : (
            classrooms.map(classroom => (
              <div key={classroom._id} className="classroom-card">
                <div className="classroom-header">
                  <h3>{classroom.name}</h3>
                  <span className={`status-badge ${classroom.isAvailable ? 'status-approved' : 'status-rejected'}`}>
                    {classroom.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                
                <div className="classroom-details">
                  <div className="detail-item">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{classroom.location}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Capacity:</span>
                    <span className="detail-value">{classroom.capacity} students</span>
                  </div>
                  {classroom.equipment.length > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Equipment:</span>
                      <span className="detail-value">{classroom.equipment.join(', ')}</span>
                    </div>
                  )}
                  {classroom.description && (
                    <div className="detail-item">
                      <span className="detail-label">Description:</span>
                      <span className="detail-value">{classroom.description}</span>
                    </div>
                  )}
                </div>

                {user.role === 'admin' && (
                  <div className="classroom-actions">
                    <button
                      className="btn btn-outline"
                      onClick={() => handleEdit(classroom)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(classroom._id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassroomManagement;
