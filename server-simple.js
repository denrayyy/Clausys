import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage (for demo purposes)
let classrooms = [
  {
    _id: "1",
    name: "Room 101",
    capacity: 30,
    location: "Building A",
    equipment: ["Projector", "Whiteboard"],
    isAvailable: true,
    description: "Main lecture hall"
  },
  {
    _id: "2", 
    name: "Room 102",
    capacity: 20,
    location: "Building A",
    equipment: ["Computer", "Smart Board"],
    isAvailable: true,
    description: "Computer lab"
  }
];

let reservations = [
  {
    _id: "1",
    classroom: classrooms[0],
    user: "John Doe",
    startTime: "2024-01-15T09:00:00Z",
    endTime: "2024-01-15T11:00:00Z",
    purpose: "Math Class",
    status: "approved",
    notes: "Regular class session"
  }
];

// Routes
app.get("/", (req, res) => {
  res.json({ 
    message: "Classroom Utilization API is running...",
    version: "1.0.0",
    endpoints: {
      classrooms: "/api/classrooms",
      reservations: "/api/reservations"
    }
  });
});

// Classroom routes
app.get("/api/classrooms", (req, res) => {
  res.json(classrooms);
});

app.get("/api/classrooms/:id", (req, res) => {
  const classroom = classrooms.find(c => c._id === req.params.id);
  if (!classroom) {
    return res.status(404).json({ msg: "Classroom not found" });
  }
  res.json(classroom);
});

app.post("/api/classrooms", (req, res) => {
  const { name, capacity, location, equipment, description } = req.body;
  
  if (!name || !capacity || !location) {
    return res.status(400).json({ msg: "Name, capacity, and location are required" });
  }
  
  const newClassroom = {
    _id: Date.now().toString(),
    name,
    capacity: parseInt(capacity),
    location,
    equipment: equipment || [],
    isAvailable: true,
    description: description || ""
  };
  
  classrooms.push(newClassroom);
  res.json(newClassroom);
});

app.put("/api/classrooms/:id", (req, res) => {
  const classroom = classrooms.find(c => c._id === req.params.id);
  if (!classroom) {
    return res.status(404).json({ msg: "Classroom not found" });
  }
  
  const { name, capacity, location, equipment, description, isAvailable } = req.body;
  Object.assign(classroom, { name, capacity, location, equipment, description, isAvailable });
  
  res.json(classroom);
});

app.delete("/api/classrooms/:id", (req, res) => {
  const index = classrooms.findIndex(c => c._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ msg: "Classroom not found" });
  }
  
  classrooms.splice(index, 1);
  res.json({ msg: "Classroom deleted successfully" });
});

// Reservation routes
app.get("/api/reservations", (req, res) => {
  res.json(reservations);
});

app.get("/api/reservations/:id", (req, res) => {
  const reservation = reservations.find(r => r._id === req.params.id);
  if (!reservation) {
    return res.status(404).json({ msg: "Reservation not found" });
  }
  res.json(reservation);
});

app.post("/api/reservations", (req, res) => {
  const { classroom, user, startTime, endTime, purpose, notes } = req.body;
  
  if (!classroom || !user || !startTime || !endTime || !purpose) {
    return res.status(400).json({ msg: "All fields are required" });
  }
  
  const classroomObj = classrooms.find(c => c._id === classroom);
  if (!classroomObj) {
    return res.status(404).json({ msg: "Classroom not found" });
  }
  
  // Check for conflicts
  const conflict = reservations.find(r => 
    r.classroom._id === classroom && 
    r.status !== 'cancelled' &&
    ((new Date(r.startTime) < new Date(endTime)) && (new Date(r.endTime) > new Date(startTime)))
  );
  
  if (conflict) {
    return res.status(400).json({ msg: "Time conflict: Another reservation exists for this time slot" });
  }
  
  const newReservation = {
    _id: Date.now().toString(),
    classroom: classroomObj,
    user,
    startTime,
    endTime,
    purpose,
    status: "pending",
    notes: notes || ""
  };
  
  reservations.push(newReservation);
  res.json(newReservation);
});

app.put("/api/reservations/:id", (req, res) => {
  const reservation = reservations.find(r => r._id === req.params.id);
  if (!reservation) {
    return res.status(404).json({ msg: "Reservation not found" });
  }
  
  const { status } = req.body;
  if (status && ['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
    reservation.status = status;
  }
  
  res.json(reservation);
});

app.delete("/api/reservations/:id", (req, res) => {
  const index = reservations.findIndex(r => r._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ msg: "Reservation not found" });
  }
  
  reservations.splice(index, 1);
  res.json({ msg: "Reservation deleted successfully" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Open your browser and go to: http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at: http://localhost:${PORT}/api/`);
});
