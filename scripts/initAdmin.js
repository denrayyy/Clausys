import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const initAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/classroom-utilization");
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "clausysadmin@buksu.edu.ph" });
    
    if (existingAdmin) {
      console.log("Admin account already exists");
      return;
    }

    // Create admin account
    const adminData = {
      firstName: "System",
      lastName: "Administrator",
      email: "clausysadmin@buksu.edu.ph",
      password: "admin", // Per request
      employeeId: "ADMIN001",
      department: "Administration",
      role: "admin",
      phone: "",
      isActive: true
    };

    const admin = new User(adminData);
    await admin.save();

    console.log("Admin account created successfully:");
    console.log("Email: clausysadmin@buksu.edu.ph");
    console.log("Password: admin");
    console.log("Please change the password on first login for security.");

  } catch (error) {
    console.error("Error initializing admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the initialization
initAdmin();
