import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import classroomRoutes from "./routes/classrooms.js";
import reservationRoutes from "./routes/reservations.js";
import authRoutes from "./routes/auth.js";
import scheduleRoutes from "./routes/schedules.js";
import usageRoutes from "./routes/usage.js";
import reportRoutes from "./routes/reports.js";
import timeInRoutes from "./routes/timein.js";
import seedAdminIfMissing from "./utils/seedAdmin.js";

// Load environment variables
dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Just read values once - using hardcoded values for now
const MONGO_URI = "mongodb://localhost:27017/classroom_utilization";
const PORT = process.env.PORT || 5000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); 
app.use(express.static("public"));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, "client/build")));

// Connect to MongoDB
connectDB();

// Ensure admin exists (runs once on startup)
seedAdminIfMissing().catch((e) => console.error("Admin seed error:", e));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/usage", usageRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/timein", timeInRoutes);

// API routes
app.get("/api", (req, res) => {
  res.json({
    message: "Classroom Utilization System API is running...",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      classrooms: "/api/classrooms",
      reservations: "/api/reservations",
      schedules: "/api/schedules",
      usage: "/api/usage",
      reports: "/api/reports",
      timein: "/api/timein",
    },
  });
});

// Serve React app for all non-API routes (for client-side routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// ✅ Only one PORT declaration
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
