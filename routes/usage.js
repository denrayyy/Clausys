import express from "express";
import ClassroomUsage from "../models/ClassroomUsage.js";
import Schedule from "../models/Schedule.js";
import Classroom from "../models/Classroom.js";
import { body, validationResult } from "express-validator";
import { authenticateToken, requireTeacher } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/usage
// @desc    Get classroom usage records
// @access  Private
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { classroom, teacher, date, status, startDate, endDate } = req.query;
    let query = {};

    // If user is teacher, only show their usage records
    if (req.user.role === "teacher") {
      query.teacher = req.user._id;
    }

    if (classroom) query.classroom = classroom;
    if (teacher) query.teacher = teacher;
    if (status) query.status = status;

    // Date filtering
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const usageRecords = await ClassroomUsage.find(query)
      .populate("classroom", "name location capacity")
      .populate("teacher", "firstName lastName email employeeId department")
      .populate("schedule", "subject courseCode dayOfWeek startTime endTime")
      .sort({ date: -1, timeIn: -1 });

    res.json(usageRecords);
  } catch (error) {
    console.error("Get usage records error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/usage/:id
// @desc    Get usage record by ID
// @access  Private
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const usageRecord = await ClassroomUsage.findById(req.params.id)
      .populate("classroom", "name location capacity")
      .populate("teacher", "firstName lastName email employeeId department")
      .populate("schedule", "subject courseCode dayOfWeek startTime endTime");

    if (!usageRecord) {
      return res.status(404).json({ message: "Usage record not found" });
    }

    // Teachers can only view their own records
    if (req.user.role === "teacher" && usageRecord.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(usageRecord);
  } catch (error) {
    console.error("Get usage record error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/usage/checkin
// @desc    Check in to classroom
// @access  Private (Teacher)
router.post("/checkin", authenticateToken, requireTeacher, [
  body("classroom").isMongoId().withMessage("Valid classroom ID is required"),
  body("schedule").optional().isMongoId().withMessage("Valid schedule ID is required"),
  body("date").isISO8601().withMessage("Valid date is required"),
  body("timeIn").isISO8601().withMessage("Valid time in is required"),
  body("attendance").optional().isInt({ min: 0 }).withMessage("Attendance must be a positive number"),
  body("remarks").optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { classroom, schedule, date, timeIn, attendance, remarks } = req.body;

    // Check if classroom exists
    const classroomExists = await Classroom.findById(classroom);
    if (!classroomExists) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Check if schedule exists and belongs to teacher
    if (schedule) {
      const scheduleExists = await Schedule.findById(schedule);
      if (!scheduleExists) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      if (scheduleExists.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Schedule does not belong to you" });
      }
    }

    // Check if there's already a check-in for this classroom and date
    const existingCheckin = await ClassroomUsage.findOne({
      classroom,
      teacher: req.user._id,
      date: new Date(date)
    });

    if (existingCheckin) {
      return res.status(400).json({ message: "Already checked in for this classroom and date" });
    }

    // Determine status based on time
    let status = "on-time";
    if (schedule) {
      const scheduleStart = new Date(`2000-01-01T${schedule.startTime}`);
      const actualStart = new Date(timeIn);
      const timeDiff = (actualStart - scheduleStart) / (1000 * 60); // minutes

      if (timeDiff > 15) {
        status = "late-start";
      }
    }

    const usageRecord = new ClassroomUsage({
      classroom,
      teacher: req.user._id,
      schedule: schedule || null,
      date: new Date(date),
      timeIn: new Date(timeIn),
      attendance: attendance || 0,
      remarks,
      status
    });

    await usageRecord.save();
    await usageRecord.populate("classroom", "name location capacity");
    await usageRecord.populate("schedule", "subject courseCode dayOfWeek startTime endTime");

    res.status(201).json({
      message: "Check-in successful",
      usageRecord
    });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/usage/:id/checkout
// @desc    Check out from classroom
// @access  Private (Teacher)
router.put("/:id/checkout", authenticateToken, requireTeacher, [
  body("timeOut").isISO8601().withMessage("Valid time out is required"),
  body("attendance").optional().isInt({ min: 0 }).withMessage("Attendance must be a positive number"),
  body("remarks").optional().isString(),
  body("signature").optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { timeOut, attendance, remarks, signature } = req.body;

    const usageRecord = await ClassroomUsage.findById(req.params.id);
    if (!usageRecord) {
      return res.status(404).json({ message: "Usage record not found" });
    }

    // Check if record belongs to teacher
    if (usageRecord.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if already checked out
    if (usageRecord.timeOut) {
      return res.status(400).json({ message: "Already checked out" });
    }

    usageRecord.timeOut = new Date(timeOut);
    if (attendance !== undefined) usageRecord.attendance = attendance;
    if (remarks) usageRecord.remarks = remarks;
    if (signature) usageRecord.signature = signature;

    // Update status based on actual duration
    if (usageRecord.schedule) {
      const scheduleEnd = new Date(`2000-01-01T${usageRecord.schedule.endTime}`);
      const actualEnd = new Date(timeOut);
      const timeDiff = (scheduleEnd - actualEnd) / (1000 * 60); // minutes

      if (timeDiff > 15) {
        usageRecord.status = "early-end";
      }
    }

    await usageRecord.save();
    await usageRecord.populate("classroom", "name location capacity");
    await usageRecord.populate("schedule", "subject courseCode dayOfWeek startTime endTime");

    res.json({
      message: "Check-out successful",
      usageRecord
    });
  } catch (error) {
    console.error("Check-out error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/usage/:id
// @desc    Update usage record
// @access  Private
router.put("/:id", authenticateToken, [
  body("attendance").optional().isInt({ min: 0 }).withMessage("Attendance must be a positive number"),
  body("remarks").optional().isString(),
  body("signature").optional().isString(),
  body("reasonForAbsence").optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const usageRecord = await ClassroomUsage.findById(req.params.id);
    if (!usageRecord) {
      return res.status(404).json({ message: "Usage record not found" });
    }

    // Teachers can only update their own records
    if (req.user.role === "teacher" && usageRecord.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    const allowedUpdates = ["attendance", "remarks", "signature", "reasonForAbsence", "isHoliday", "isAsynchronous"];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedRecord = await ClassroomUsage.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate("classroom", "name location capacity")
     .populate("teacher", "firstName lastName email employeeId department")
     .populate("schedule", "subject courseCode dayOfWeek startTime endTime");

    res.json({
      message: "Usage record updated successfully",
      usageRecord: updatedRecord
    });
  } catch (error) {
    console.error("Update usage record error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/usage/utilization/summary
// @desc    Get classroom utilization summary
// @access  Private
router.get("/utilization/summary", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, classroom } = req.query;
    
    let matchQuery = {};
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (classroom) {
      matchQuery.classroom = classroom;
    }

    const summary = await ClassroomUsage.aggregate([
      { $match: matchQuery },
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
      },
      {
        $project: {
          classroom: {
            name: "$classroom.name",
            location: "$classroom.location",
            capacity: "$classroom.capacity"
          },
          totalRecords: 1,
          averageUtilization: { $round: ["$averageUtilization", 2] },
          totalHours: { $round: ["$totalHours", 2] },
          onTimeCount: 1,
          lateStartCount: 1,
          earlyEndCount: 1,
          noShowCount: 1,
          utilizationRate: { $round: ["$averageUtilization", 2] }
        }
      }
    ]);

    res.json(summary);
  } catch (error) {
    console.error("Get utilization summary error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
