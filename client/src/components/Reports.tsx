import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Reports.css';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'admin' | 'teacher'; // 'teacher' kept for backward compatibility
  employeeId: string;
  department: string;
}

interface ReportsProps {
  user: User;
}

const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="reports">
      <div className="page-header">
      </div>

      <div className="card">
        <h2>Reporting System</h2>
        <p>This feature will provide comprehensive reporting capabilities for teachers and administrators.</p>
        <p>Features include:</p>
        <ul>
          <li>Teacher utilization reports</li>
          <li>Administrative utilization reports</li>
          <li>Weekly and monthly summaries</li>
          <li>Classroom vacancy indicators</li>
          <li>Print-friendly report formats</li>
          <li>Report sharing and collaboration</li>
        </ul>
      </div>
    </div>
  );
};

export default Reports;
