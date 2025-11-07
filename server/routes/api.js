// server/routes/api.js
// Purpose: Example Express routes for the Classroom Utilization System (MERN).
// - POST /api/attendance: Log class attendance (teacher, classroom, time, status)
// - GET  /api/classrooms:  Fetch classroom status (e.g., which rooms are occupied)
//
// How this connects to MongoDB (overview):
// - In a real MERN setup, you'll connect to MongoDB in your server startup file (e.g., server.js)
//   using Mongoose: mongoose.connect(process.env.MONGO_URI)
// - Replace the mock data and sample write with calls to your Mongoose models in `models/`.
// - Example models you might have: `Classroom`, `TimeIn`, `Reservation`, `Schedule`.
//
// Local testing:
// 1) Ensure you have an Express app and mount this router in server.js:
//      import apiRouter from './server/routes/api.js';
//      app.use('/api', apiRouter);
// 2) Start your server (e.g., node server.js or npm run dev)
// 3) Try requests:
//      POST http://localhost:3000/api/attendance
//        Body: { "teacherId":"T-1", "classroomId":"CR-101", "time":"2025-11-07T08:00:00Z", "status":"present" }
//      GET  http://localhost:3000/api/classrooms?status=In%20Use

import express from 'express';
const router = express.Router();

// Optional: if integrating now, uncomment mongoose imports and models
// const mongoose = require('mongoose');
// const Classroom = require('../../models/Classroom');
// const TimeIn = require('../../models/TimeIn');

// Mock data for classrooms. Replace with Classroom.find(...) once MongoDB is wired.
const classroomStatuses = [
  { classroomId: 'CR-101', building: 'Main', capacity: 40, occupied: 28, status: 'In Use' },
  { classroomId: 'CR-102', building: 'Main', capacity: 35, occupied: 0, status: 'Available' },
  { classroomId: 'CR-201', building: 'North', capacity: 50, occupied: 50, status: 'Full' },
];

// POST /api/attendance
// Logs class attendance for a user/teacher in a given classroom at a specific time.
// Request body (JSON):
//   - teacherId: string (required)    → ID of the teacher logging attendance
//   - classroomId: string (required)  → Classroom code/ID
//   - time: ISO string (optional)     → When the attendance was logged; defaults to now
//   - status: string (optional)       → e.g., "present", "late", "absent"; defaults to "present"
// Response:
//   - 201 Created with the attendance payload
//   - 400 Bad Request if required fields missing
// Mongo integration idea:
//   - await TimeIn.create({ teacherId, classroomId, time, status })
router.post('/attendance', async (req, res) => {
  const { teacherId, classroomId, time, status = 'present' } = req.body || {};

  if (!teacherId || !classroomId) {
    return res.status(400).json({
      error: 'Missing required fields: teacherId and classroomId are required.'
    });
  }

  const timestamp = time ? new Date(time).toISOString() : new Date().toISOString();

  // Example: Replace the following mock return with a real DB write via Mongoose
  // const attendance = await TimeIn.create({ teacherId, classroomId, status, timestamp: new Date(timestamp) });

  return res.status(201).json({
    message: 'Attendance logged successfully.',
    data: {
      teacherId,
      classroomId,
      status,
      timestamp,
    },
  });
});

// GET /api/classrooms
// Returns current classroom statuses. Supports filtering via query parameters.
// Query parameters (optional):
//   - building: string → Filter by building name (e.g., Main, North)
//   - status: string   → Filter by status (e.g., Available, In Use, Full)
// Response: 200 OK with array of classrooms
// Mongo integration idea:
//   const filter = {};
//   if (req.query.building) filter.building = req.query.building;
//   if (req.query.status) filter.status = req.query.status;
//   const results = await Classroom.find(filter).lean();
router.get('/classrooms', async (req, res) => {
  const { building, status } = req.query || {};

  // Replace with Mongoose find(filter) when DB is connected
  let results = classroomStatuses;
  if (building) {
    results = results.filter((c) => String(c.building).toLowerCase() === String(building).toLowerCase());
  }
  if (status) {
    results = results.filter((c) => String(c.status).toLowerCase() === String(status).toLowerCase());
  }

  return res.status(200).json({ count: results.length, classrooms: results });
});

export default router;


