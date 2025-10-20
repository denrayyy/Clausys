import express from "express";
import Report from "../models/Report.js";
import ClassroomUsage from "../models/ClassroomUsage.js";
import Schedule from "../models/Schedule.js";
import Classroom from "../models/Classroom.js";
import User from "../models/User.js";
import { body, validationResult } from "express-validator";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/reports
// @desc    Get all reports
// @access  Private
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { type, status } = req.query;
    let query = {};

    // If user is teacher, only show their reports or shared reports
    if (req.user.role === "teacher") {
      query.$or = [
        { generatedBy: req.user._id },
        { "sharedWith.user": req.user._id }
      ];
    }

    if (type) query.type = type;
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate("generatedBy", "firstName lastName email employeeId")
      .populate("sharedWith.user", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/reports/:id
// @desc    Get report by ID
// @access  Private
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("generatedBy", "firstName lastName email employeeId")
      .populate("sharedWith.user", "firstName lastName email");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Check access permissions
    if (req.user.role === "teacher") {
      const hasAccess = report.generatedBy._id.toString() === req.user._id.toString() ||
        report.sharedWith.some(share => share.user._id.toString() === req.user._id.toString());
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.json(report);
  } catch (error) {
    console.error("Get report error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/reports/teacher
// @desc    Generate teacher report
// @access  Private (Teacher)
router.post("/teacher", authenticateToken, [
  body("startDate").isISO8601().withMessage("Valid start date is required"),
  body("endDate").isISO8601().withMessage("Valid end date is required"),
  body("title").optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, title } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get teacher's usage records
    const usageRecords = await ClassroomUsage.find({
      teacher: req.user._id,
      date: { $gte: start, $lte: end }
    })
      .populate("classroom", "name location capacity")
      .populate("schedule", "subject courseCode dayOfWeek startTime endTime")
      .sort({ date: 1 });

    // Get teacher's schedules
    const schedules = await Schedule.find({
      teacher: req.user._id,
      status: { $in: ["approved", "active"] }
    })
      .populate("classroom", "name location capacity")
      .sort({ dayOfWeek: 1, startTime: 1 });

    // Calculate statistics
    const totalClasses = usageRecords.length;
    const onTimeClasses = usageRecords.filter(record => record.status === "on-time").length;
    const lateStartClasses = usageRecords.filter(record => record.status === "late-start").length;
    const earlyEndClasses = usageRecords.filter(record => record.status === "early-end").length;
    const noShowClasses = usageRecords.filter(record => record.status === "no-show").length;
    const totalHours = usageRecords.reduce((sum, record) => {
      if (record.timeOut && record.timeIn) {
        return sum + (record.timeOut - record.timeIn) / (1000 * 60 * 60);
      }
      return sum;
    }, 0);

    const reportData = {
      teacher: {
        name: req.user.fullName,
        email: req.user.email,
        employeeId: req.user.employeeId,
        department: req.user.department
      },
      period: { startDate: start, endDate: end },
      statistics: {
        totalClasses,
        onTimeClasses,
        lateStartClasses,
        earlyEndClasses,
        noShowClasses,
        totalHours: Math.round(totalHours * 100) / 100,
        attendanceRate: totalClasses > 0 ? Math.round((onTimeClasses / totalClasses) * 100) : 0
      },
      usageRecords,
      schedules
    };

    const report = new Report({
      title: title || `Teacher Report - ${req.user.fullName} (${start.toDateString()} to ${end.toDateString()})`,
      type: "teacher",
      generatedBy: req.user._id,
      period: { startDate: start, endDate: end },
      data: reportData,
      summary: {
        totalClassrooms: new Set(usageRecords.map(r => r.classroom._id)).size,
        totalUtilization: Math.round(totalHours * 100) / 100,
        averageUtilization: totalClasses > 0 ? Math.round((totalHours / totalClasses) * 100) / 100 : 0,
        underutilizedClassrooms: 0,
        conflicts: 0,
        recommendations: []
      },
      status: "completed"
    });

    await report.save();

    res.status(201).json({
      message: "Teacher report generated successfully",
      report
    });
  } catch (error) {
    console.error("Generate teacher report error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/reports/admin
// @desc    Generate admin utilization report
// @access  Private (Admin)
router.post("/admin", authenticateToken, requireAdmin, [
  body("startDate").isISO8601().withMessage("Valid start date is required"),
  body("endDate").isISO8601().withMessage("Valid end date is required"),
  body("title").optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, title } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get utilization summary
    const utilizationSummary = await ClassroomUsage.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: "$classroom",
          totalRecords: { $sum: 1 },
          averageUtilization: { $avg: "$utilizationRate" },
          totalHours: { $sum: { $divide: [{ $subtract: ["$timeOut", "$timeIn"] }, 1000 * 60 * 60] } },
          onTimeCount: { $sum: { $cond: [{ $eq: ["$status", "on-time"] }, 1, 0] } },
          lateStartCount: { $sum: { $cond: [{ $eq: ["$status", "late-start"] }, 1, 0] } },
          earlyEndCount: { $sum: { $cond: [{ $eq: ["$status", "early-end"] }, 1, 0] } },
          noShowCount: { $sum: { $cond: [{ $eq: ["$status", "no-show"] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: "classrooms",
          localField: "_id",
          foreignField: "_id",
          as: "classroom"
        }
      },
      {
        $unwind: "$classroom"
      }
    ]);

    // Get all classrooms for comparison
    const allClassrooms = await Classroom.find();
    const classroomUtilization = allClassrooms.map(classroom => {
      const summary = utilizationSummary.find(s => s._id.toString() === classroom._id.toString());
      return {
        classroom: {
          name: classroom.name,
          location: classroom.location,
          capacity: classroom.capacity
        },
        totalRecords: summary?.totalRecords || 0,
        averageUtilization: summary ? Math.round(summary.averageUtilization * 100) / 100 : 0,
        totalHours: summary ? Math.round(summary.totalHours * 100) / 100 : 0,
        onTimeCount: summary?.onTimeCount || 0,
        lateStartCount: summary?.lateStartCount || 0,
        earlyEndCount: summary?.earlyEndCount || 0,
        noShowCount: summary?.noShowCount || 0,
        isUnderutilized: summary ? summary.averageUtilization < 50 : true
      };
    });

    // Get teacher statistics
    const teacherStats = await ClassroomUsage.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: "$teacher",
          totalClasses: { $sum: 1 },
          onTimeClasses: { $sum: { $cond: [{ $eq: ["$status", "on-time"] }, 1, 0] } },
          totalHours: { $sum: { $divide: [{ $subtract: ["$timeOut", "$timeIn"] }, 1000 * 60 * 60] } }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "teacher"
        }
      },
      {
        $unwind: "$teacher"
      }
    ]);

    const underutilizedClassrooms = classroomUtilization.filter(c => c.isUnderutilized).length;
    const totalUtilization = classroomUtilization.reduce((sum, c) => sum + c.averageUtilization, 0);
    const averageUtilization = classroomUtilization.length > 0 ? totalUtilization / classroomUtilization.length : 0;

    const reportData = {
      period: { startDate: start, endDate: end },
      classroomUtilization,
      teacherStats,
      overallStatistics: {
        totalClassrooms: allClassrooms.length,
        totalUtilization: Math.round(totalUtilization * 100) / 100,
        averageUtilization: Math.round(averageUtilization * 100) / 100,
        underutilizedClassrooms,
        totalTeachers: teacherStats.length,
        totalClasses: teacherStats.reduce((sum, t) => sum + t.totalClasses, 0)
      }
    };

    const recommendations = [];
    if (underutilizedClassrooms > 0) {
      recommendations.push(`Consider reallocating ${underutilizedClassrooms} underutilized classrooms`);
    }
    if (averageUtilization < 70) {
      recommendations.push("Overall utilization is below 70%. Consider optimizing classroom assignments");
    }

    const report = new Report({
      title: title || `Admin Utilization Report (${start.toDateString()} to ${end.toDateString()})`,
      type: "admin",
      generatedBy: req.user._id,
      period: { startDate: start, endDate: end },
      data: reportData,
      summary: {
        totalClassrooms: allClassrooms.length,
        totalUtilization: Math.round(totalUtilization * 100) / 100,
        averageUtilization: Math.round(averageUtilization * 100) / 100,
        underutilizedClassrooms,
        conflicts: 0,
        recommendations
      },
      status: "completed"
    });

    await report.save();

    res.status(201).json({
      message: "Admin report generated successfully",
      report
    });
  } catch (error) {
    console.error("Generate admin report error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/reports/weekly
// @desc    Generate weekly report
// @access  Private
router.post("/weekly", authenticateToken, [
  body("startDate").isISO8601().withMessage("Valid start date is required")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // 7 days including start date

    let query = { date: { $gte: start, $lte: end } };
    
    // If user is teacher, only include their records
    if (req.user.role === "teacher") {
      query.teacher = req.user._id;
    }

    const usageRecords = await ClassroomUsage.find(query)
      .populate("classroom", "name location capacity")
      .populate("teacher", "firstName lastName email employeeId")
      .populate("schedule", "subject courseCode dayOfWeek startTime endTime")
      .sort({ date: 1, timeIn: 1 });

    // Group by day
    const dailyRecords = {};
    usageRecords.forEach(record => {
      const day = record.date.toDateString();
      if (!dailyRecords[day]) {
        dailyRecords[day] = [];
      }
      dailyRecords[day].push(record);
    });

    const reportData = {
      period: { startDate: start, endDate: end },
      dailyRecords,
      summary: {
        totalClasses: usageRecords.length,
        totalHours: usageRecords.reduce((sum, record) => {
          if (record.timeOut && record.timeIn) {
            return sum + (record.timeOut - record.timeIn) / (1000 * 60 * 60);
          }
          return sum;
        }, 0)
      }
    };

    const report = new Report({
      title: `Weekly Report (${start.toDateString()} to ${end.toDateString()})`,
      type: "weekly",
      generatedBy: req.user._id,
      period: { startDate: start, endDate: end },
      data: reportData,
      status: "completed"
    });

    await report.save();

    res.status(201).json({
      message: "Weekly report generated successfully",
      report
    });
  } catch (error) {
    console.error("Generate weekly report error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/reports/:id/share
// @desc    Share report with users
// @access  Private
router.post("/:id/share", authenticateToken, [
  body("userIds").isArray().withMessage("User IDs array is required"),
  body("userIds.*").isMongoId().withMessage("Valid user ID is required")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userIds } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Check if user can share this report
    if (req.user.role === "teacher" && report.generatedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Verify users exist
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return res.status(400).json({ message: "Some users not found" });
    }

    // Add to sharedWith array
    const newShares = userIds.map(userId => ({
      user: userId,
      sharedAt: new Date()
    }));

    report.sharedWith.push(...newShares);
    await report.save();

    res.json({
      message: "Report shared successfully",
      report
    });
  } catch (error) {
    console.error("Share report error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete report
// @access  Private
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Check if user can delete this report
    if (req.user.role === "teacher" && report.generatedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Report.findByIdAndDelete(req.params.id);

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Delete report error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
