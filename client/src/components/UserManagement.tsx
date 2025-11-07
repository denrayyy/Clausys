import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ClassroomManagement.css';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'admin' | 'teacher'; // 'teacher' kept for backward compatibility
  employeeId: string;
  department: string;
  phone?: string;
}

interface RegisteredUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'admin' | 'teacher'; // 'teacher' kept for backward compatibility
  employeeId: string;
  department: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface Schedule {
  day: string;
  time: string;
  section: string;
  subjectCode: string;
  instructor: string;
}

interface Classroom {
  _id: string;
  name: string;
  capacity: number;
  location: string;
  equipment: string[];
  isAvailable: boolean;
  description?: string;
  schedules?: Schedule[];
  createdAt: string;
  updatedAt: string;
}

interface UserManagementProps {
  user: User;
  defaultTab?: 'classrooms' | 'users';
}

const UserManagement: React.FC<UserManagementProps> = ({ user, defaultTab = 'users' }) => {
  const [activeTab, setActiveTab] = useState<'classrooms' | 'users'>(defaultTab);
  
  // Classroom state
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [activeTimeIns, setActiveTimeIns] = useState<any[]>([]);
  const [showClassroomForm, setShowClassroomForm] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [showScheduleView, setShowScheduleView] = useState(false);
  const [viewingClassroom, setViewingClassroom] = useState<Classroom | null>(null);
  const [isEditingSchedules, setIsEditingSchedules] = useState(false);
  const [showDeleteClassroomConfirm, setShowDeleteClassroomConfirm] = useState(false);
  const [classroomToDelete, setClassroomToDelete] = useState<string | null>(null);
  const [scheduleFormData, setScheduleFormData] = useState({
    day: 'Monday',
    time: '',
    section: '',
    subjectCode: '',
    instructor: ''
  });
  const [classroomFormData, setClassroomFormData] = useState({
    name: '',
    capacity: '',
    location: '',
    equipment: '',
    description: '',
    isAvailable: true
  });

  // User state
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [userToArchive, setUserToArchive] = useState<{ id: string; name: string } | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<{ id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeId: '',
    department: '',
    phone: '',
    role: 'student' as 'student' | 'admin' | 'teacher',
    password: '',
    isActive: true
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update activeTab when defaultTab prop changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    fetchData();
  }, [activeTab, showArchived]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'classrooms') {
        const response = await axios.get('/api/classrooms');
        setClassrooms(response.data);
        
        // Fetch active time-ins (records without timeOut)
        const timeInResponse = await axios.get('/api/timein');
        const activeRecords = timeInResponse.data.filter((record: any) => !record.timeOut);
        setActiveTimeIns(activeRecords);
      } else {
        const response = await axios.get('/api/users');
        // Filter based on active/archived status and exclude admins
        const filteredUsers = response.data.filter((u: RegisteredUser) => {
          if (u.role === 'admin') return false;
          return showArchived ? !u.isActive : u.isActive;
        });
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if classroom is in use
  const isClassroomInUse = (classroomId: string) => {
    return activeTimeIns.some((record: any) => record.classroom && record.classroom._id === classroomId);
  };

  // Classroom handlers
  const handleClassroomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const classroomData = {
        ...classroomFormData,
        capacity: parseInt(classroomFormData.capacity),
        equipment: classroomFormData.equipment.split(',').map(item => item.trim()).filter(item => item)
      };

      if (editingClassroom) {
        await axios.put(`/api/classrooms/${editingClassroom._id}`, classroomData);
      } else {
        await axios.post('/api/classrooms', classroomData);
      }

      setShowClassroomForm(false);
      setEditingClassroom(null);
      setClassroomFormData({
        name: '',
        capacity: '',
        location: '',
        equipment: '',
        description: '',
        isAvailable: true
      });
      fetchData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save classroom');
    }
  };

  const handleEditClassroom = (classroom: Classroom) => {
    setEditingClassroom(classroom);
    setClassroomFormData({
      name: classroom.name,
      capacity: classroom.capacity.toString(),
      location: classroom.location,
      equipment: classroom.equipment.join(', '),
      description: classroom.description || '',
      isAvailable: classroom.isAvailable
    });
    setShowClassroomForm(true);
  };

  const handleDeleteClassroomClick = (id: string) => {
    setClassroomToDelete(id);
    setShowDeleteClassroomConfirm(true);
  };

  const handleDeleteClassroomConfirm = async () => {
    if (!classroomToDelete) return;
    
    try {
      await axios.delete(`/api/classrooms/${classroomToDelete}`);
      setSuccess('Classroom deleted successfully');
      setShowDeleteClassroomConfirm(false);
      setClassroomToDelete(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete classroom');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteClassroomCancel = () => {
    setShowDeleteClassroomConfirm(false);
    setClassroomToDelete(null);
  };

  const handleCancelClassroom = () => {
    setShowClassroomForm(false);
    setEditingClassroom(null);
    setClassroomFormData({
      name: '',
      capacity: '',
      location: '',
      equipment: '',
      description: '',
      isAvailable: true
    });
    setError('');
  };

  const handleViewSchedules = (classroom: Classroom) => {
    setViewingClassroom(classroom);
    setShowScheduleView(true);
  };

  const handleCloseScheduleView = () => {
    setShowScheduleView(false);
    setViewingClassroom(null);
    setIsEditingSchedules(false);
    setScheduleFormData({
      day: 'Monday',
      time: '',
      section: '',
      subjectCode: '',
      instructor: ''
    });
  };

  const handleSaveSchedules = async () => {
    if (!viewingClassroom) return;

    try {
      await axios.put(`/api/classrooms/${viewingClassroom._id}`, {
        schedules: viewingClassroom.schedules
      });
      setSuccess('Schedules updated successfully!');
      setIsEditingSchedules(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update schedules');
    }
  };

  const handleAddSchedule = () => {
    if (!viewingClassroom) return;
    
    const newSchedule = {
      day: scheduleFormData.day,
      time: scheduleFormData.time,
      section: scheduleFormData.section,
      subjectCode: scheduleFormData.subjectCode,
      instructor: scheduleFormData.instructor
    };

    setViewingClassroom({
      ...viewingClassroom,
      schedules: [...(viewingClassroom.schedules || []), newSchedule]
    });

    setScheduleFormData({
      day: 'Monday',
      time: '',
      section: '',
      subjectCode: '',
      instructor: ''
    });
  };

  const handleDeleteSchedule = (index: number) => {
    if (!viewingClassroom) return;
    
    const updatedSchedules = viewingClassroom.schedules?.filter((_, i) => i !== index) || [];
    setViewingClassroom({
      ...viewingClassroom,
      schedules: updatedSchedules
    });
  };

  // User handlers
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const userData = {
        firstName: userFormData.firstName,
        lastName: userFormData.lastName,
        email: userFormData.email,
        employeeId: userFormData.employeeId,
        department: userFormData.department,
        phone: userFormData.phone,
        role: userFormData.role,
        isActive: userFormData.isActive,
        password: userFormData.password || 'DefaultPassword123'
      };

      await axios.post('/api/users', userData);

      setSuccess('User created successfully!');
      setUserFormData({
        firstName: '',
        lastName: '',
        email: '',
        employeeId: '',
        department: '',
        phone: '',
        role: 'student',
        password: '',
        isActive: true
      });

      // Refresh the user list and close the form
      fetchData();
      setShowUserForm(false);

      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleCancelUser = () => {
    setShowUserForm(false);
    setUserFormData({
      firstName: '',
      lastName: '',
      email: '',
      employeeId: '',
      department: '',
      phone: '',
      role: 'student',
      password: '',
      isActive: true
    });
    setError('');
  };

  const handleEditUser = async (userToEdit: RegisteredUser) => {
    const updatedData = prompt(`Edit user: ${userToEdit.firstName} ${userToEdit.lastName}\n\nEnter new department (current: ${userToEdit.department}):`, userToEdit.department);
    
    if (updatedData && updatedData !== userToEdit.department) {
      try {
        await axios.put(`/api/users/${userToEdit._id}`, {
          ...userToEdit,
          department: updatedData
        });
        setSuccess('User updated successfully!');
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to update user');
      }
    }
  };

  const handleArchiveUser = (id: string, userName: string) => {
    setUserToArchive({ id, name: userName });
    setShowArchiveConfirm(true);
  };

  const handleArchiveConfirm = async () => {
    if (!userToArchive) return;

    try {
      await axios.put(`/api/users/${userToArchive.id}`, { isActive: false });
      setSuccess('User archived successfully!');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to archive user');
    } finally {
      setShowArchiveConfirm(false);
      setUserToArchive(null);
    }
  };

  const handleArchiveCancel = () => {
    setShowArchiveConfirm(false);
    setUserToArchive(null);
  };

  const handleResetPassword = (id: string, userName: string) => {
    setUserToResetPassword({ id, name: userName });
    setNewPassword('');
    setShowPassword(false);
    setPasswordResetSuccess(false);
    setShowResetPassword(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!userToResetPassword || !newPassword || newPassword.length < 5) {
      setError('Password must be at least 5 characters long');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      await axios.put(`/api/users/${userToResetPassword.id}/reset-password`, { newPassword });
      setPasswordResetSuccess(true);
      setSuccess(`Password for ${userToResetPassword.name} has been reset successfully`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reset password');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCloseResetPassword = () => {
    setShowResetPassword(false);
    setUserToResetPassword(null);
    setNewPassword('');
    setShowPassword(false);
    setPasswordResetSuccess(false);
  };

  const handleUnarchiveUser = async (id: string, userName: string) => {
    if (window.confirm(`Are you sure you want to unarchive ${userName}?`)) {
      try {
        await axios.put(`/api/users/${id}`, { isActive: true });
        setSuccess('User unarchived successfully!');
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to unarchive user');
      }
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(userItem => {
    const fullName = `${userItem.firstName} ${userItem.lastName}`.toLowerCase();
    const email = userItem.email.toLowerCase();
    const employeeId = userItem.employeeId.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || email.includes(query) || employeeId.includes(query);
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="classroom-management">
      {activeTab === 'users' && (
        <>
          <div className="page-header">
          </div>

          {error && <div className="error-message">{error}</div>}
          
          <div className="card">
          {success && <div className="success-message">{success}</div>}
          
          {showUserForm ? (
            <form onSubmit={handleUserSubmit} className="classroom-form user-creation-form">
              <h3>Add New User</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    value={userFormData.firstName}
                    onChange={(e) => setUserFormData({...userFormData, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    value={userFormData.lastName}
                    onChange={(e) => setUserFormData({...userFormData, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="employeeId">Employee ID</label>
                  <input
                    type="text"
                    id="employeeId"
                    value={userFormData.employeeId}
                    onChange={(e) => setUserFormData({...userFormData, employeeId: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <input
                    type="text"
                    id="department"
                    value={userFormData.department}
                    onChange={(e) => setUserFormData({...userFormData, department: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({...userFormData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({...userFormData, role: e.target.value as 'student' | 'admin' | 'teacher'})}
                    required
                  >
                    <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                  placeholder="Leave blank for default password"
                />
                <small>Default: DefaultPassword123</small>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={userFormData.isActive}
                  onChange={(e) => setUserFormData({...userFormData, isActive: e.target.checked})}
                />
                Active Account
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCancelUser}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-large">
                Create User
              </button>
            </div>
            </form>
          ) : (
             <div className="user-list-section">
               <div className="section-header">
                 <h3 className="section-title">{showArchived ? 'Archived Users' : 'Manage Users'}</h3>
                 <div className="header-actions">
                   <button
                     className={`btn ${showArchived ? 'btn-secondary' : 'btn-outline'}`}
                     onClick={() => setShowArchived(!showArchived)}
                   >
                     {showArchived ? 'Show Active Users' : 'View Archived'}
                   </button>
                   {!showArchived && (
                     <button
                       className="btn btn-primary"
                       onClick={() => setShowUserForm(true)}
                     >
                       Add User
                     </button>
                   )}
                 </div>
               </div>

               {/* Search Bar */}
               {!showArchived && (
                 <div className="search-bar-container">
                   <input
                     type="text"
                     className="search-input"
                     placeholder="Search by name, email, or employee ID..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                   {searchQuery && (
                     <button 
                       className="clear-search-btn"
                       onClick={() => setSearchQuery('')}
                       title="Clear search"
                     >
                       ✕
                     </button>
                   )}
                 </div>
               )}
             
             <div className="users-table">
               {filteredUsers.length === 0 ? (
                 <div className="no-classrooms">
                   <p>{showArchived ? 'No archived users found.' : searchQuery ? 'No users match your search.' : 'No users found.'}</p>
                 </div>
               ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Employee ID</th>
                      <th>Department</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                   </thead>
                   <tbody>
                     {filteredUsers.map(userItem => (
                       <tr key={userItem._id}>
                         <td>{userItem.firstName} {userItem.lastName}</td>
                         <td>{userItem.email}</td>
                         <td>{userItem.employeeId}</td>
                         <td>{userItem.department}</td>
                         <td>
                           <span className={`role-badge role-${userItem.role}`}>
                             {userItem.role}
                           </span>
                         </td>
                         <td>
                           <span className={`status-badge ${userItem.isActive ? 'status-approved' : 'status-rejected'}`}>
                             {userItem.isActive ? 'Active' : 'Archived'}
                           </span>
                         </td>
                         <td>
                           {userItem.lastLogin 
                             ? new Date(userItem.lastLogin).toLocaleDateString() 
                             : 'Never'}
                         </td>
                         <td className="action-buttons">
                           {showArchived ? (
                             <button
                               className="btn btn-success btn-sm"
                               onClick={() => handleUnarchiveUser(userItem._id, `${userItem.firstName} ${userItem.lastName}`)}
                               title="Unarchive user"
                             >
                               Unarchive
                             </button>
                           ) : (
                            <>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleEditUser(userItem)}
                                title="Edit user"
                              >
                                Edit
                              </button>
                              {userItem._id !== user.id && (
                                <>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleResetPassword(userItem._id, `${userItem.firstName} ${userItem.lastName}`)}
                                    title="Reset password"
                                  >
                                    Reset Password
                                  </button>
                                  <button
                                    className="btn btn-warning btn-sm"
                                    onClick={() => handleArchiveUser(userItem._id, `${userItem.firstName} ${userItem.lastName}`)}
                                    title="Archive user"
                                  >
                                    Archive
                                  </button>
                                </>
                              )}
                            </>
                           )}
                         </td>
                       </tr>
                     ))}
                  </tbody>
                </table>
              )}
            </div>
            </div>
          )}
        </div>
        </>
      )}

      {/* Classrooms Tab */}
      {activeTab === 'classrooms' && (
        <>
          <div className="page-header">
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="card">
            <div className="card-header">
              <h2>Classrooms</h2>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingClassroom(null);
                  setClassroomFormData({
                    name: '',
                    capacity: '',
                    location: '',
                    equipment: '',
                    description: '',
                    isAvailable: true
                  });
                  setShowClassroomForm(true);
                }}
              >
                Add Classroom
              </button>
            </div>

          {showClassroomForm && (
            <form onSubmit={handleClassroomSubmit} className="classroom-form">
              <h3>{editingClassroom ? 'Edit Classroom' : 'Add New Classroom'}</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Classroom Name</label>
                  <input
                    type="text"
                    id="name"
                    value={classroomFormData.name}
                    onChange={(e) => setClassroomFormData({...classroomFormData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="capacity">Capacity</label>
                  <input
                    type="number"
                    id="capacity"
                    value={classroomFormData.capacity}
                    onChange={(e) => setClassroomFormData({...classroomFormData, capacity: e.target.value})}
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
                  value={classroomFormData.location}
                  onChange={(e) => setClassroomFormData({...classroomFormData, location: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="equipment">Equipment (comma-separated)</label>
                <input
                  type="text"
                  id="equipment"
                  value={classroomFormData.equipment}
                  onChange={(e) => setClassroomFormData({...classroomFormData, equipment: e.target.value})}
                  placeholder="e.g., Projector, Whiteboard, Computer"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={classroomFormData.description}
                  onChange={(e) => setClassroomFormData({...classroomFormData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={classroomFormData.isAvailable}
                    onChange={(e) => setClassroomFormData({...classroomFormData, isAvailable: e.target.checked})}
                  />
                  Available for booking
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCancelClassroom}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingClassroom ? 'Update' : 'Create'} Classroom
                </button>
              </div>
            </form>
          )}

          {!showClassroomForm && (
            <div className="classroom-grid">
              {classrooms.length === 0 ? (
                <div className="no-classrooms">
                  <p>No classrooms found.</p>
                </div>
              ) : (
                classrooms.map(classroom => {
                  const inUse = isClassroomInUse(classroom._id);
                  return (
                  <div key={classroom._id} className="classroom-card">
                    <div className="classroom-header">
                      <h3>{classroom.name}</h3>
                      <span className={`status-badge ${inUse ? 'status-in-use' : (classroom.isAvailable ? 'status-approved' : 'status-rejected')}`}>
                        {inUse ? 'In Use' : (classroom.isAvailable ? 'Available' : 'Unavailable')}
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

                    <div className="classroom-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => handleViewSchedules(classroom)}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleEditClassroom(classroom)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteClassroomClick(classroom._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          )}
          </div>
        </>
      )}

      {/* Schedule View Modal */}
      {showScheduleView && viewingClassroom && (
        <div className="modal-overlay">
          <div className="schedule-view-modal">
            <h3 className="schedule-view-title">{viewingClassroom.name} Schedule</h3>
            
            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}
            
            <div className="schedule-header-actions">
              {!isEditingSchedules ? (
                <button className="btn btn-primary" onClick={() => setIsEditingSchedules(true)}>
                  Edit Schedules
                </button>
              ) : (
                <button className="btn btn-success" onClick={handleSaveSchedules}>
                  Save Changes
                </button>
              )}
            </div>

            {isEditingSchedules && (
              <div className="add-schedule-form">
                <h4>Add New Schedule</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Day</label>
                    <select
                      value={scheduleFormData.day}
                      onChange={(e) => setScheduleFormData({...scheduleFormData, day: e.target.value})}
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Time</label>
                    <input
                      type="text"
                      value={scheduleFormData.time}
                      onChange={(e) => setScheduleFormData({...scheduleFormData, time: e.target.value})}
                      placeholder="e.g., 7:30-9:00"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Section</label>
                    <input
                      type="text"
                      value={scheduleFormData.section}
                      onChange={(e) => setScheduleFormData({...scheduleFormData, section: e.target.value})}
                      placeholder="e.g., BSIT 3F"
                    />
                  </div>
                  <div className="form-group">
                    <label>Subject Code</label>
                    <input
                      type="text"
                      value={scheduleFormData.subjectCode}
                      onChange={(e) => setScheduleFormData({...scheduleFormData, subjectCode: e.target.value})}
                      placeholder="e.g., IT 137"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Instructor</label>
                  <input
                    type="text"
                    value={scheduleFormData.instructor}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, instructor: e.target.value})}
                    placeholder="e.g., CASERES"
                  />
                </div>
                <button className="btn btn-outline" onClick={handleAddSchedule}>
                  Add Schedule
                </button>
              </div>
            )}
            
            {viewingClassroom.schedules && viewingClassroom.schedules.length > 0 ? (
              <div className="schedule-table-container">
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Time</th>
                      <th>Section</th>
                      <th>Subject Code</th>
                      <th>Instructor</th>
                      {isEditingSchedules && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {viewingClassroom.schedules.map((schedule, index) => (
                      <tr key={index}>
                        <td>{schedule.day}</td>
                        <td>{schedule.time}</td>
                        <td>{schedule.section}</td>
                        <td>{schedule.subjectCode}</td>
                        <td>{schedule.instructor}</td>
                        {isEditingSchedules && (
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteSchedule(index)}
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-schedules">No schedules assigned to this classroom.</p>
            )}
            
            <div className="schedule-view-buttons">
              {isEditingSchedules && (
                <button className="btn btn-secondary" onClick={() => setIsEditingSchedules(false)}>
                  Cancel Edit
                </button>
              )}
              <button className="btn btn-secondary" onClick={handleCloseScheduleView}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && userToArchive && (
        <div className="modal-overlay">
          <div className="archive-confirm-modal">
            <p className="archive-confirm-text">
              Are you sure you want to archive <strong>{userToArchive.name}</strong>? They will be moved to the archived users list.
            </p>
            <div className="archive-confirm-buttons">
              <button className="btn-confirm-yes" onClick={handleArchiveConfirm}>Yes</button>
              <button className="btn-confirm-no" onClick={handleArchiveCancel}>No</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassword && userToResetPassword && (
        <div className="modal-overlay">
          <div className="reset-password-modal">
            <h3 className="reset-password-title">Reset Password for <strong>{userToResetPassword.name}</strong></h3>
            
            {!passwordResetSuccess ? (
              <>
                <div className="password-input-group">
                  <label className="password-label">Enter New Password:</label>
                  <div className="input-with-toggle">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="password-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 5 characters)"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="reset-password-buttons">
                  <button 
                    className="btn-confirm-reset" 
                    onClick={handleConfirmResetPassword}
                    disabled={!newPassword || newPassword.length < 5}
                  >
                    Reset Password
                  </button>
                  <button className="btn-cancel-reset" onClick={handleCloseResetPassword}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div className="success-message-box">
                  <div className="success-icon">✅</div>
                  <p className="success-text">Password has been reset successfully!</p>
                  <div className="final-password-display">
                    <p className="password-label">New Password:</p>
                    <div className="password-box">
                      <code>{newPassword}</code>
                      <button
                        className="btn-copy-password"
                        onClick={() => {
                          navigator.clipboard.writeText(newPassword);
                          setSuccess('Password copied to clipboard!');
                          setTimeout(() => setSuccess(''), 2000);
                        }}
                        title="Copy password"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                  <p className="reminder-text">⚠️ Make sure to save this password and share it with the user!</p>
                </div>
                <button className="btn-done-reset" onClick={handleCloseResetPassword}>Done</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Classroom Confirmation Modal */}
      {showDeleteClassroomConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Delete Classroom</h3>
            <p>Are you sure you want to permanently delete this classroom? This action cannot be undone.</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={handleDeleteClassroomCancel}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={handleDeleteClassroomConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;


