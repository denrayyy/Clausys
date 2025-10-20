import mongoose from "mongoose";

const classroomUsageSchema = mongoose.Schema({
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classroom",
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  schedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Schedule"
  },
  date: {
    type: Date,
    required: true
  },
  timeIn: {
    type: Date,
    required: true
  },
  timeOut: {
    type: Date
  },
  actualStartTime: {
    type: String
  },
  actualEndTime: {
    type: String
  },
  status: {
    type: String,
    enum: ["on-time", "late-start", "early-end", "no-show", "cancelled"],
    default: "on-time"
  },
  attendance: {
    type: Number,
    min: 0
  },
  remarks: {
    type: String
  },
  signature: {
    type: String
  },
  isHoliday: {
    type: Boolean,
    default: false
  },
  isAsynchronous: {
    type: Boolean,
    default: false
  },
  reasonForAbsence: {
    type: String
  },
  utilizationRate: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Calculate utilization rate
classroomUsageSchema.pre("save", function(next) {
  if (this.timeOut && this.timeIn) {
    const scheduledDuration = this.schedule ? 
      (new Date(`2000-01-01T${this.schedule.endTime}`) - new Date(`2000-01-01T${this.schedule.startTime}`)) / (1000 * 60 * 60) : 8; // Default 8 hours
    const actualDuration = (this.timeOut - this.timeIn) / (1000 * 60 * 60);
    this.utilizationRate = Math.round((actualDuration / scheduledDuration) * 100);
  }
  next();
});

const ClassroomUsage = mongoose.model("ClassroomUsage", classroomUsageSchema);

export default ClassroomUsage;
