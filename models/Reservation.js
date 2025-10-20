import mongoose from "mongoose";

const reservationSchema = mongoose.Schema({
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classroom",
    required: true
  },
  user: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled"],
    default: "pending"
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Validate that endTime is after startTime
reservationSchema.pre("save", function(next) {
  if (this.endTime <= this.startTime) {
    next(new Error("End time must be after start time"));
  } else {
    next();
  }
});

const Reservation = mongoose.model("Reservation", reservationSchema);

export default Reservation;
