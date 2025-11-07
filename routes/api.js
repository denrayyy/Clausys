// routes/api.js
// Purpose: This file defines example API endpoints for the Classroom Utilization System
// using Express.js routing. It demonstrates how to:
//  - Log class attendance with a POST request
//  - Fetch classroom status with a GET request
//  - Structure routes and handle basic validation and responses
//
// How to use:
//  1. Import and mount this router in your Express app (e.g., in server.js):
//       const apiRouter = require('./routes/api');
//       app.use('/api', apiRouter);
//  2. Test endpoints (examples):
//       - POST http://localhost:3000/api/attendance
//         Body (JSON): { "classroomId": "CR-101", "userId": "U-123", "status": "present" }
//       - GET  http://localhost:3000/api/classrooms?building=Main
//
// Note: These are example handlers that simulate behavior. Replace with real DB logic
// by integrating your models in `models/` and your middleware in `middleware/`.

const express = require('express');
const router = express.Router();

// External dependencies for new features
const axios = require('axios'); // For calling Google reCAPTCHA verification API
const nodemailer = require('nodemailer'); // For SMTP email sending
const PDFDocument = require('pdfkit'); // For runtime PDF generation
const passport = require('passport'); // For Google OAuth
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const jwt = require('jsonwebtoken');

// Configure Passport Google OAuth 2.0 strategy.
// Note: If this router is mounted at '/api', these routes will be available under '/api/auth/google*'.
// You can alternatively mount the specific auth routes at the app level if you require exact '/auth/*' paths.
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    // Verification callback: Here you would usually find-or-create a user in DB
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Minimal user object derived from Google profile
        const user = {
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails && profile.emails[0] ? profile.emails[0].value : undefined,
          photo: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
        };
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Using Passport without sessions for simplicity here
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Example in-memory store for demonstration purposes only.
// In production, you should read/write to your database (e.g., MongoDB via Mongoose models).
const classroomStatuses = [
  { classroomId: 'CR-101', building: 'Main', capacity: 40, occupied: 28, status: 'In Use' },
  { classroomId: 'CR-102', building: 'Main', capacity: 35, occupied: 0, status: 'Available' },
  { classroomId: 'CR-201', building: 'North', capacity: 50, occupied: 50, status: 'Full' },
];

// POST /api/attendance
// Logs class attendance for a user in a given classroom.
// Request body (JSON):
//   - classroomId: string (required)  → The ID/code of the classroom
//   - userId: string (required)       → The ID of the student/instructor
//   - status: string (optional)       → e.g., "present", "late", "absent" (default: "present")
// Response:
//   201 Created on success with a simple confirmation payload
//   400 Bad Request if required fields are missing
router.post('/attendance', (req, res) => {
  const { classroomId, userId, status = 'present' } = req.body || {};

  // Basic validation: ensure required fields are provided
  if (!classroomId || !userId) {
    return res.status(400).json({
      error: 'Missing required fields: classroomId and userId are required.',
    });
  }

  // Example: In a real app, insert an attendance record into the database here.
  // For example using Mongoose model `TimeIn` or a similar model in `models/TimeIn.js`.
  // await TimeIn.create({ classroomId, userId, status, timestamp: new Date() })

  return res.status(201).json({
    message: 'Attendance logged successfully.',
    data: {
      classroomId,
      userId,
      status,
      timestamp: new Date().toISOString(),
    },
  });
});

// GET /api/classrooms
// Fetches the current status of classrooms. Supports optional filtering by query params.
// Query parameters (optional):
//   - building: string → Filter by building name
//   - status: string   → Filter by status (e.g., "Available", "In Use", "Full")
// Response:
//   200 OK with an array of classroom status objects
router.get('/classrooms', (req, res) => {
  const { building, status } = req.query || {};

  // Filter the example dataset according to provided query parameters
  let results = classroomStatuses;
  if (building) {
    results = results.filter((c) => String(c.building).toLowerCase() === String(building).toLowerCase());
  }
  if (status) {
    results = results.filter((c) => String(c.status).toLowerCase() === String(status).toLowerCase());
  }

  return res.status(200).json({
    count: results.length,
    classrooms: results,
  });
});

// -----------------------------------------------------------------------------
// 1) POST /api/verify-recaptcha
// Verifies a reCAPTCHA token received from the frontend by calling Google's API.
// Request body:
//   { token: string }
// Environment:
//   RECAPTCHA_SECRET_KEY must be set in .env
// Response:
//   { success: boolean, score?: number, action?: string, ...googleRaw }
// -----------------------------------------------------------------------------
router.post('/verify-recaptcha', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ success: false, error: 'Missing reCAPTCHA token' });
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
      return res.status(500).json({ success: false, error: 'Server misconfigured: RECAPTCHA_SECRET_KEY missing' });
    }

    const params = new URLSearchParams();
    params.append('secret', String(secret));
    params.append('response', String(token));

    const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const { data } = await axios.post(verifyUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    });

    // Return Google's response directly with a normalized success flag
    return res.status(200).json({ success: Boolean(data && data.success), ...data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to verify reCAPTCHA', details: err?.message });
  }
});

// -----------------------------------------------------------------------------
// 2) POST /api/send-reset-code
// Sends a 6-digit password reset code to the provided email via SMTP.
// Request body:
//   { email: string }
// Environment:
//   SMTP_EMAIL_USER, SMTP_EMAIL_PASS must be set in .env (Gmail or SMTP credentials)
// Response:
//   { success: boolean, code: string }  // Note: Return the code only for demo/dev; remove in prod
// -----------------------------------------------------------------------------
router.post('/send-reset-code', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = process.env.SMTP_EMAIL_USER;
    const pass = process.env.SMTP_EMAIL_PASS;
    if (!user || !pass) {
      return res.status(500).json({ success: false, error: 'Server misconfigured: SMTP credentials missing' });
    }

    // Generate a random 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Create a transporter. For Gmail, ensure the account allows SMTP (App Passwords recommended).
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    // Email content - customize subject and html/text as needed
    const mailOptions = {
      from: `Classroom Utilization <${user}>`,
      to: email,
      subject: 'Your Password Reset Code',
      text: `Your password reset code is: ${code}`,
      html: `<p>Your password reset code is: <strong>${code}</strong></p>`,
    };

    await transporter.sendMail(mailOptions);

    // In production, store hash of the code with TTL in DB/Redis and DO NOT return it
    return res.status(200).json({ success: true, message: 'Reset code sent', code });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to send reset code', details: err?.message });
  }
});

// -----------------------------------------------------------------------------
// 3) GET /api/export-report
// Generates a simple PDF and sends it as a download. Uses pdfkit.
// How to customize later:
//  - Add tables/graphics by laying out text and drawing shapes/images.
//  - Pull real data from your DB and insert in the PDF instead of static text.
//  - Set fonts, sizes, and add pages with doc.addPage().
// -----------------------------------------------------------------------------
router.get('/export-report', async (req, res) => {
  // Set headers for file download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="classroom-attendance-report.pdf"');

  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Pipe the PDF into the response stream
  doc.pipe(res);

  // Document content (customize freely)
  doc.fontSize(20).text('Classroom Attendance Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
  doc.moveDown();

  // Example summary section
  doc.fontSize(14).text('Summary', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text('- Total Classrooms: 12');
  doc.text('- Total Sessions Today: 34');
  doc.text('- Overall Utilization: 76%');
  doc.moveDown();

  // Example detail section (replace with real data rows)
  doc.fontSize(14).text('Details', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text('CR-101 - 9:00 AM - 10:30 AM - Occupancy: 28/40');
  doc.text('CR-102 - 10:45 AM - 12:15 PM - Occupancy: 22/35');
  doc.text('CR-201 - 1:00 PM - 2:30 PM - Occupancy: 50/50');

  // Finalize the PDF and end the stream
  doc.end();
});

// -----------------------------------------------------------------------------
// 4) Google OAuth routes using Passport.js
// If this router is mounted at '/api', the effective paths will be:
//   GET  /api/auth/google
//   GET  /api/auth/google/callback
// For exact '/auth/*' at root, mount these handlers at the app level without a prefix.
// -----------------------------------------------------------------------------
router.get('/auth/google', passport.initialize(), passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get(
  '/auth/google/callback',
  passport.initialize(),
  passport.authenticate('google', { failureRedirect: '/', session: false }),
  (req, res) => {
    try {
      // Issue a JWT token for the authenticated user
      const jwtSecret = process.env.JWT_SECRET || 'change-me-in-prod';
      const token = jwt.sign(
        {
          sub: req.user.googleId,
          name: req.user.displayName,
          email: req.user.email,
          provider: 'google',
        },
        jwtSecret,
        { expiresIn: '7d' }
      );

      // Respond with JSON. In a real app, you might redirect to the frontend with the token in a query/hash.
      return res.status(200).json({ success: true, token, user: req.user });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'OAuth callback failed', details: err?.message });
    }
  }
);

module.exports = router;


