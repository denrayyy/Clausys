import mongoose from "mongoose";

const classroomSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  location: {
    type: String,
    required: true
  },
  equipment: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  description: {
    type: String
  },
  schedules: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    time: {
      type: String
    },
    section: {
      type: String
    },
    subjectCode: {
      type: String
    },
    instructor: {
      type: String
    }
  }]
}, {
  timestamps: true
});

const Classroom = mongoose.model("Classroom", classroomSchema);

export default Classroom;
