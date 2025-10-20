import express from "express";
import Schedule from "../models/Schedule.js";
import Classroom from "../models/Classroom.js";
import { body, validationResult } from "express-validator";
import { authenticateToken, requireAdmin, requireTeacher } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/schedules
// @desc    Get all schedules
// @access  Private
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { teacher, status, semester, academicYear } = req.query;
    let query = {};

    // If user is teacher, only show their schedules
    if (req.user.role === "teacher") {
      query.teacher = req.user._id;
    }

    if (teacher) query.teacher = teacher;
    if (status) query.status = status;
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;

    const schedules = await Schedule.find(query)
      .populate("teacher", "firstName lastName email employeeId department")
      .populate("classroom", "name location capacity")
      .populate("approvedBy", "firstName lastName")
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json(schedules);
  } catch (error) {
    console.error("Get schedules error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/schedules/:id
// @desc    Get schedule by ID
// @access  Private
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate("teacher", "firstName lastName email employeeId department")
      .populate("classroom", "name location capacity")
      .populate("approvedBy", "firstName lastName");

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Teachers can only view their own schedules
    if (req.user.role === "teacher" && schedule.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(schedule);
  } catch (error) {
    console.error("Get schedule error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/schedules
// @desc    Create a new schedule request
// @access  Private (Teacher)
router.post("/", authenticateToken, requireTeacher, [
  body("classroom").isMongoId().withMessage("Valid classroom ID is required"),
  body("subject").notEmpty().withMessage("Subject is required"),
  body("courseCode").notEmpty().withMessage("Course code is required"),
  body("dayOfWeek").isIn(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])
    .withMessage("Valid day of week is required"),
  body("startTime").matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage("Valid start time is required"),
  body("endTime").matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage("Valid end time is required"),
  body("semester").notEmpty().withMessage("Semester is required"),
  body("academicYear").notEmpty().withMessage("Academic year is required")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      classroom,
      subject,
      courseCode,
      dayOfWeek,
      startTime,
      endTime,
      semester,
      academicYear,
      notes,
      isRecurring,
      endDate
    } = req.body;

    // Check if classroom exists
    const classroomExists = await Classroom.findById(classroom);
    if (!classroomExists) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Check for time conflicts
    const conflictingSchedule = await Schedule.findOne({
      classroom,
      dayOfWeek,
      status: { $in: ["pending", "approved", "active"] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (conflictingSchedule) {
      return res.status(400).json({
        message: "Time conflict: Another schedule exists for this time slot"
      });
    }

    const schedule = new Schedule({
      teacher: req.user._id,
      classroom,
      subject,
      courseCode,
      dayOfWeek,
      startTime,
      endTime,
      semester,
      academicYear,
      notes,
      isRecurring,
      endDate
    });

    await schedule.save();
    await schedule.populate("classroom", "name location capacity");

    res.status(201).json({
      message: "Schedule request submitted successfully",
      schedule
    });
  } catch (error) {
    console.error("Create schedule error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/schedules/:id/approve
// @desc    Approve schedule request
// @access  Private (Admin)
router.put("/:id/approve", authenticateToken, requireAdmin, [
  body("notes").optional().isString()
], async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (schedule.status !== "pending") {
      return res.status(400).json({ message: "Schedule is not pending approval" });
    }

    schedule.status = "approved";
    schedule.approvedBy = req.user._id;
    schedule.approvedDate = new Date();
    if (req.body.notes) {
      schedule.notes = req.body.notes;
    }

    await schedule.save();
    await schedule.populate("teacher", "firstName lastName email employeeId department");
    await schedule.populate("classroom", "name location capacity");
    await schedule.populate("approvedBy", "firstName lastName");

    res.json({
      message: "Schedule approved successfully",
      schedule
    });
  } catch (error) {
    console.error("Approve schedule error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/schedules/:id/reject
// @desc    Reject schedule request
// @access  Private (Admin)
router.put("/:id/reject", authenticateToken, requireAdmin, [
  body("notes").notEmpty().withMessage("Rejection reason is required")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (schedule.status !== "pending") {
      return res.status(400).json({ message: "Schedule is not pending approval" });
    }

    schedule.status = "rejected";
    schedule.approvedBy = req.user._id;
    schedule.approvedDate = new Date();
    schedule.notes = req.body.notes;

    await schedule.save();
    await schedule.populate("teacher", "firstName lastName email employeeId department");
    await schedule.populate("classroom", "name location capacity");
    await schedule.populate("approvedBy", "firstName lastName");

    res.json({
      message: "Schedule rejected successfully",
      schedule
    });
  } catch (error) {
    console.error("Reject schedule error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/schedules/:id
// @desc    Update schedule
// @access  Private
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Teachers can only update their own schedules
    if (req.user.role === "teacher" && schedule.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Only allow updates if schedule is pending or if user is admin
    if (schedule.status !== "pending" && req.user.role !== "admin") {
      return res.status(400).json({ message: "Cannot update approved schedule" });
    }

    const allowedUpdates = ["subject", "courseCode", "startTime", "endTime", "notes", "isRecurring", "endDate"];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate("teacher", "firstName lastName email employeeId department")
     .populate("classroom", "name location capacity");

    res.json({
      message: "Schedule updated successfully",
      schedule: updatedSchedule
    });
  } catch (error) {
    console.error("Update schedule error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/schedules/:id
// @desc    Delete schedule
// @access  Private
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Teachers can only delete their own schedules
    if (req.user.role === "teacher" && schedule.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Only allow deletion if schedule is pending or if user is admin
    if (schedule.status !== "pending" && req.user.role !== "admin") {
      return res.status(400).json({ message: "Cannot delete approved schedule" });
    }

    await Schedule.findByIdAndDelete(req.params.id);

    res.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Delete schedule error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
