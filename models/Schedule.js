import mongoose from "mongoose";

const scheduleSchema = mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classroom",
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  courseCode: {
    type: String,
    required: true
  },
  dayOfWeek: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "active", "completed"],
    default: "pending"
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  approvedDate: {
    type: Date
  },
  notes: {
    type: String
  },
  isRecurring: {
    type: Boolean,
    default: true
  },
  endDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Validate that endTime is after startTime
scheduleSchema.pre("save", function(next) {
  const start = new Date(`2000-01-01T${this.startTime}`);
  const end = new Date(`2000-01-01T${this.endTime}`);
  
  if (end <= start) {
    next(new Error("End time must be after start time"));
  } else {
    next();
  }
});

const Schedule = mongoose.model("Schedule", scheduleSchema);

export default Schedule;
