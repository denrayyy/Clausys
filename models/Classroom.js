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
  }
}, {
  timestamps: true
});

const Classroom = mongoose.model("Classroom", classroomSchema);

export default Classroom;
