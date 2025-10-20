# Classroom Utilization System

A comprehensive MERN stack application for managing classroom utilization, scheduling, and monitoring in educational institutions.

## Features

Based on the system flowchart, this application includes:

### 1. User Registration & Authentication
- **Instructor Registration**: Self-service account creation for instructors
- **Admin Account**: Pre-created admin account (clausys@admin.buksu)
- Secure login with JWT authentication
- Role-based access control
- User profile management

### 2. Dashboard
- Teacher/Admin dashboard with navigation
- Real-time statistics and metrics
- Recent activities overview
- Quick action buttons

### 3. Schedule Request & Assignment
- Submit subject and schedule requests
- Request preferred time slots
- Admin approval/rejection workflow
- Schedule conflict detection
- Recurring schedule support

### 4. Classroom Utilization Tracking
- Time in/Time out functionality
- Instructor classroom monitoring
- Remarks and signature capture
- Holiday and no-class indicators
- Asynchronous class monitoring
- Utilization rate calculation

### 5. Monitoring System
- Daily classroom usage monitoring
- Schedule conflict resolution
- Underutilized classroom identification
- Real-time utilization statistics

### 6. Reporting System
- Teacher utilization reports
- Administrative utilization reports
- Weekly and monthly summaries
- Print-friendly report formats
- Report sharing capabilities

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **React Router** - Navigation
- **Axios** - HTTP client
- **CSS3** - Styling

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the project root directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/classroom_utilization
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key
   NODE_ENV=development
   ```

4. Initialize the admin account:
   ```bash
   npm run init-admin
   ```
   This creates the pre-configured admin account with:
   - Email: clausys@admin.buksu
   - Password: admin123 (change on first login)

5. Start the backend server:
   ```bash
   npm run server
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

### Running Both Servers

From the root directory, run:
```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend server (port 3000) concurrently.

## Admin Account Setup

The system comes with a pre-created admin account for system administration:

**Admin Credentials:**
- Email: `clausys@admin.buksu`
- Password: `admin123`
- Employee ID: `ADMIN001`
- Department: `Administration`

**Important Security Notes:**
1. Change the default password immediately after first login
2. The admin account has full system access
3. Only authorized personnel should have admin access
4. Use the `npm run init-admin` command to create the admin account if it doesn't exist

**Instructor Registration:**
- Instructors can self-register using the registration form
- They need to provide their employee ID and department
- All instructor accounts are automatically assigned the "teacher" role
- Admin approval may be required depending on system configuration

## API Endpoints

### Authentication
- `POST /api/auth/register` - Instructor registration (admin accounts are pre-created)
- `POST /api/auth/login` - User login (admin or instructor)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Classrooms
- `GET /api/classrooms` - Get all classrooms
- `GET /api/classrooms/:id` - Get classroom by ID
- `POST /api/classrooms` - Create classroom
- `PUT /api/classrooms/:id` - Update classroom
- `DELETE /api/classrooms/:id` - Delete classroom

### Schedules
- `GET /api/schedules` - Get all schedules
- `GET /api/schedules/:id` - Get schedule by ID
- `POST /api/schedules` - Create schedule request
- `PUT /api/schedules/:id/approve` - Approve schedule
- `PUT /api/schedules/:id/reject` - Reject schedule
- `PUT /api/schedules/:id` - Update schedule
- `DELETE /api/schedules/:id` - Delete schedule

### Usage Tracking
- `GET /api/usage` - Get usage records
- `POST /api/usage/checkin` - Check in to classroom
- `PUT /api/usage/:id/checkout` - Check out from classroom
- `PUT /api/usage/:id` - Update usage record
- `GET /api/usage/utilization/summary` - Get utilization summary

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports/teacher` - Generate teacher report
- `POST /api/reports/admin` - Generate admin report
- `POST /api/reports/weekly` - Generate weekly report
- `POST /api/reports/:id/share` - Share report
- `DELETE /api/reports/:id` - Delete report

## Database Models

### User
- Personal information (name, email, employee ID)
- Role (teacher/admin)
- Department and contact details
- Authentication credentials

### Classroom
- Basic information (name, location, capacity)
- Equipment and amenities
- Availability status
- Description

### Schedule
- Teacher and classroom assignment
- Subject and course details
- Time slots and recurrence
- Approval workflow
- Academic period information

### ClassroomUsage
- Time tracking (check-in/check-out)
- Attendance records
- Status indicators
- Utilization metrics
- Remarks and signatures

### Report
- Report metadata and type
- Generated data and statistics
- Sharing permissions
- File storage information

## User Roles

### Instructor/Teacher
- **Account Creation**: Self-register with employee ID and department
- View and manage own schedules
- Request new schedule assignments
- Track classroom usage
- Generate personal reports
- Check in/out of classrooms

### Administrator
- **Pre-created Account**: Use clausys@admin.buksu (password: admin123)
- Manage all users and classrooms
- Approve/reject schedule requests
- Monitor system-wide utilization
- Generate administrative reports
- Resolve conflicts and optimize allocation

## Features Implementation Status

✅ **Completed:**
- User authentication and registration
- Classroom management
- Schedule request and approval system
- Basic dashboard with statistics
- Responsive UI design
- API endpoints for all major features

🚧 **In Progress:**
- Classroom usage tracking (check-in/out)
- Real-time monitoring dashboard
- Advanced reporting system
- Email notifications
- Data export functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.