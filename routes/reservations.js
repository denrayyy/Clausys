import express from "express";
import Reservation from "../models/Reservation.js";
import Classroom from "../models/Classroom.js";
import { body, validationResult } from "express-validator";

const router = express.Router();

// @route   GET /api/reservations
// @desc    Get all reservations
// @access  Public
router.get("/", async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("classroom", "name location capacity")
      .sort({ startTime: 1 });
    res.json(reservations);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET /api/reservations/:id
// @desc    Get reservation by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("classroom", "name location capacity");
    if (!reservation) {
      return res.status(404).json({ msg: "Reservation not found" });
    }
    res.json(reservation);
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Reservation not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/reservations
// @desc    Create a new reservation
// @access  Public
router.post("/", [
  body("classroom").isMongoId().withMessage("Valid classroom ID is required"),
  body("user").notEmpty().withMessage("User is required"),
  body("startTime").isISO8601().withMessage("Valid start time is required"),
  body("endTime").isISO8601().withMessage("Valid end time is required"),
  body("purpose").notEmpty().withMessage("Purpose is required")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { classroom, user, startTime, endTime, purpose, notes } = req.body;

    // Check if classroom exists
    const classroomExists = await Classroom.findById(classroom);
    if (!classroomExists) {
      return res.status(404).json({ msg: "Classroom not found" });
    }

    // Check for time conflicts
    const conflictingReservation = await Reservation.findOne({
      classroom,
      status: { $in: ["pending", "approved"] },
      $or: [
        {
          startTime: { $lt: new Date(endTime) },
          endTime: { $gt: new Date(startTime) }
        }
      ]
    });

    if (conflictingReservation) {
      return res.status(400).json({ 
        msg: "Time conflict: Another reservation exists for this time slot" 
      });
    }

    const reservation = new Reservation({
      classroom,
      user,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      purpose,
      notes
    });

    await reservation.save();
    await reservation.populate("classroom", "name location capacity");
    res.json(reservation);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /api/reservations/:id
// @desc    Update reservation status
// @access  Public
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "approved", "rejected", "cancelled"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("classroom", "name location capacity");

    if (!reservation) {
      return res.status(404).json({ msg: "Reservation not found" });
    }

    res.json(reservation);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// @route   DELETE /api/reservations/:id
// @desc    Delete reservation
// @access  Public
router.delete("/:id", async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) {
      return res.status(404).json({ msg: "Reservation not found" });
    }
    res.json({ msg: "Reservation deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET /api/reservations/classroom/:classroomId
// @desc    Get reservations for a specific classroom
// @access  Public
router.get("/classroom/:classroomId", async (req, res) => {
  try {
    const reservations = await Reservation.find({ 
      classroom: req.params.classroomId 
    })
      .populate("classroom", "name location capacity")
      .sort({ startTime: 1 });
    res.json(reservations);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

export default router;
