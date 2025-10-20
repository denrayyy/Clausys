import express from "express";
import Classroom from "../models/Classroom.js";
import { body, validationResult } from "express-validator";

const router = express.Router();

// @route   GET /api/classrooms
// @desc    Get all classrooms
// @access  Public
router.get("/", async (req, res) => {
  try {
    const classrooms = await Classroom.find();
    res.json(classrooms);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET /api/classrooms/:id
// @desc    Get classroom by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ msg: "Classroom not found" });
    }
    res.json(classroom);
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Classroom not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/classrooms
// @desc    Create a new classroom
// @access  Public
router.post("/", [
  body("name").notEmpty().withMessage("Name is required"),
  body("capacity").isNumeric().withMessage("Capacity must be a number"),
  body("location").notEmpty().withMessage("Location is required")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, capacity, location, equipment, description } = req.body;

    const classroom = new Classroom({
      name,
      capacity,
      location,
      equipment: equipment || [],
      description
    });

    await classroom.save();
    res.json(classroom);
  } catch (error) {
    console.error(error.message);
    if (error.code === 11000) {
      return res.status(400).json({ msg: "Classroom with this name already exists" });
    }
    res.status(500).send("Server Error");
  }
});

// @route   PUT /api/classrooms/:id
// @desc    Update classroom
// @access  Public
router.put("/:id", async (req, res) => {
  try {
    const { name, capacity, location, equipment, description, isAvailable } = req.body;

    const classroom = await Classroom.findByIdAndUpdate(
      req.params.id,
      { name, capacity, location, equipment, description, isAvailable },
      { new: true }
    );

    if (!classroom) {
      return res.status(404).json({ msg: "Classroom not found" });
    }

    res.json(classroom);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// @route   DELETE /api/classrooms/:id
// @desc    Delete classroom
// @access  Public
router.delete("/:id", async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndDelete(req.params.id);
    if (!classroom) {
      return res.status(404).json({ msg: "Classroom not found" });
    }
    res.json({ msg: "Classroom deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

export default router;
