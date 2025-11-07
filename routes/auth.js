import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { body, validationResult } from "express-validator";
import { authenticateToken } from "../middleware/auth.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Helper: Verify Google reCAPTCHA v2/v3 token server-side
async function verifyRecaptchaToken(token, remoteip) {
  try {
    // If no secret key is configured, treat reCAPTCHA as disabled
    if (!RECAPTCHA_SECRET_KEY) return true;
    const params = new URLSearchParams();
    params.append("secret", RECAPTCHA_SECRET_KEY);
    params.append("response", token);
    if (remoteip) params.append("remoteip", remoteip);

    const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    const data = await resp.json();
    return !!data.success;
  } catch (e) {
    console.error("reCAPTCHA verify error:", e);
    return false;
  }
}

// Helper: Nodemailer transport for SMTP (forgot password)
function getMailTransport() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });
}

// @route   POST /api/auth/register
// @desc    Register a new instructor (admin accounts are pre-created)
// @access  Public
router.post("/register", [
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("employeeId").notEmpty().withMessage("Employee ID is required")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, employeeId, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { employeeId }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: "User with this email or employee ID already exists" 
      });
    }

    // Only allow student registration
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      employeeId,
      department: "General", // Default department
      role: "student", // Force role to be student
      phone
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Student account created successfully",
      token,
      user: {
        _id: user._id,
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        phone: user.phone,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  body("recaptchaToken").custom((value) => {
    if (!RECAPTCHA_SECRET_KEY) return true; // skip validation when disabled
    if (!value) {
      throw new Error("reCAPTCHA token is required");
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, recaptchaToken } = req.body;

    // Verify reCAPTCHA for both User and Admin logins (when enabled)
    const recaptchaOk = await verifyRecaptchaToken(recaptchaToken, req.ip);
    if (!recaptchaOk) {
      return res.status(400).json({ message: "reCAPTCHA verification failed" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: "Account is deactivated" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        phone: user.phone,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// @route   POST /api/auth/google
// @desc    Google OAuth login (user). Client sends Google ID token; server verifies and issues JWT.
// @access  Public
router.post("/google", [
  body("idToken").notEmpty().withMessage("Google idToken is required")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "GOOGLE_CLIENT_ID not configured" });
    }

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const { idToken } = req.body;

    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const email = payload?.email;
    const sub = payload?.sub; // Google user ID

    if (!email) {
      return res.status(400).json({ message: "Google token missing email" });
    }

    // Allow sign-in for existing users by email (no auto-register to preserve employeeId rules)
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Account not found. Please contact admin to enable Google login." });
    }

    // Optionally store googleId if not set
    if (!user.googleId && sub) {
      user.googleId = sub;
      await user.save();
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({
      message: "Google login successful",
      token,
      user: {
        _id: user._id,
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        phone: user.phone,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    console.error("Google OAuth login error:", error);
    res.status(500).json({ message: "Server error during Google login" });
  }
});

// @route   POST /api/auth/forgot
// @desc    Send password reset email with token (SMTP)
// @access  Public
router.post("/forgot", [ body("email").isEmail().withMessage("Valid email is required") ], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // Avoid user enumeration: respond success regardless
      return res.json({ message: "If the email exists, a reset link has been sent." });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
    await user.save();

    const transporter = getMailTransport();
    if (!transporter) {
      return res.status(500).json({ message: "SMTP not configured" });
    }

    const appUrl = process.env.APP_URL || "http://localhost:5000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Instructions",
      html: `<p>You requested a password reset.</p>
             <p>Click the link below to set a new password (valid for 30 minutes):</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>`
    });

    return res.json({ message: "If the email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error during forgot password" });
  }
});

// @route   POST /api/auth/reset
// @desc    Reset password using token
// @access  Public
router.post("/reset", [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = password; // will be hashed by pre-save hook
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        _id: req.user._id,
        id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role,
        employeeId: req.user.employeeId,
        department: req.user.department,
        phone: req.user.phone,
        profilePhoto: req.user.profilePhoto,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", authenticateToken, [
  body("firstName").optional().notEmpty().withMessage("First name cannot be empty"),
  body("lastName").optional().notEmpty().withMessage("Last name cannot be empty"),
  body("email").optional().isEmail().withMessage("Valid email is required"),
  body("phone").optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, phone } = req.body;
    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      user
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error during profile update" });
  }
});

export default router;
