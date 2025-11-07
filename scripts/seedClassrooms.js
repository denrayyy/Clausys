import mongoose from 'mongoose';
import Classroom from '../models/Classroom.js';
import config from '../config/config.js';

// Classrooms extracted from the 2ND SEM ROOM UTILIZATION schedule
// Only the actual ComLabs are rooms, everything else are subject codes
const classrooms = [
  { 
    name: 'ComLab 1', 
    capacity: 30, 
    location: 'ComLab 1', 
    equipment: ['Computers', 'Projector', 'Whiteboard'], 
    isAvailable: true,
    schedules: [
      { day: 'Monday', time: '7:30-9:00', section: 'BSIT 3F', subjectCode: 'IT 137', instructor: 'CASERES' },
      { day: 'Monday', time: '10:00-11:30', section: 'BSIT 3E', subjectCode: 'IT 132', instructor: 'CAGANDE' },
      { day: 'Monday', time: '12:30-2:00', section: 'BSIT 3E', subjectCode: 'IT 137', instructor: 'CASERES' },
      { day: 'Monday', time: '3:00-4:00', section: 'BSIT 3C', subjectCode: 'IT 137', instructor: 'CASERES' },
      { day: 'Monday', time: '5:30-6:30', section: 'BSIT 2A', subjectCode: 'IT 123', instructor: 'DACER' },
      { day: 'Tuesday', time: '7:30-8:00', section: 'BSEMC 2A', subjectCode: 'DA 121', instructor: 'MUKARA' },
      { day: 'Tuesday', time: '12:30-1:00', section: 'BSIT 3A', subjectCode: 'IT 138', instructor: 'ABELLA' },
      { day: 'Tuesday', time: '3:00-3:30', section: 'BSIT 3A', subjectCode: 'IT 1310', instructor: 'DACER' },
      { day: 'Wednesday', time: '7:30-8:00', section: 'BS-BIO', subjectCode: 'GEEL 103', instructor: 'BAGUIO' },
      { day: 'Thursday', time: '7:30-8:00', section: 'BSEMC 3A', subjectCode: 'EMC 113', instructor: 'MACALANDAG' },
      { day: 'Thursday', time: '10:00-10:30', section: 'BSIT 3B', subjectCode: 'IT 138', instructor: 'ABELLA' },
      { day: 'Thursday', time: '12:30-1:00', section: 'BSEMC 3A', subjectCode: 'CC 131', instructor: 'DACER' },
      { day: 'Thursday', time: '3:00-3:30', section: 'BSIT 3C', subjectCode: 'IT 1310', instructor: 'DACER' },
      { day: 'Thursday', time: '5:30-6:00', section: 'BSIT 2A', subjectCode: 'IT 126', instructor: 'LIBE' },
      { day: 'Friday', time: '7:30-8:00', section: 'BSEMC 2A', subjectCode: 'DA 121', instructor: 'MUKARA' },
      { day: 'Friday', time: '12:30-1:00', section: 'BSIT 3A', subjectCode: 'IT 138', instructor: 'ABELLA' },
      { day: 'Friday', time: '3:00-3:30', section: 'BSIT 3A', subjectCode: 'IT 1310', instructor: 'DACER' },
    ]
  },
  { 
    name: 'ComLab 2', 
    capacity: 30, 
    location: 'ComLab 2', 
    equipment: ['Computers', 'Projector', 'Whiteboard'], 
    isAvailable: true,
    schedules: [
      { day: 'Monday', time: '7:30-8:00', section: 'BSIT 2B', subjectCode: 'IT 121', instructor: 'ORACION' },
      { day: 'Monday', time: '10:00-11:30', section: 'BSIT 3D', subjectCode: 'IT 133', instructor: 'NAVIDAD' },
      { day: 'Monday', time: '12:30-2:00', section: 'BSIT 4B', subjectCode: 'IT 141', instructor: 'RABANES' },
      { day: 'Monday', time: '3:00-4:00', section: 'BSIT 3A', subjectCode: 'IT 132', instructor: 'CAGANDE' },
      { day: 'Tuesday', time: '7:30-8:00', section: 'BSIT 1D', subjectCode: 'IT 114', instructor: 'LABASTIDA' },
      { day: 'Tuesday', time: '10:00-11:30', section: 'BSIT 1A', subjectCode: 'IT 114', instructor: 'LABASTIDA' },
      { day: 'Tuesday', time: '12:30-1:00', section: 'BSIT 2A', subjectCode: 'IT 128', instructor: 'LECAROS' },
      { day: 'Tuesday', time: '3:00-3:30', section: 'BSEMC 2B', subjectCode: 'EMC 124', instructor: 'CAYANAN' },
      { day: 'Thursday', time: '7:30-8:00', section: 'BSEMC 1A', subjectCode: 'EMC 124', instructor: 'CAYANAN' },
      { day: 'Thursday', time: '10:00-10:30', section: 'BSEMC 1B', subjectCode: 'EMC 112', instructor: 'PANES' },
      { day: 'Thursday', time: '12:30-1:00', section: 'BSEMC 1B', subjectCode: 'EMC 124', instructor: 'NAVIDAD' },
      { day: 'Thursday', time: '3:00-3:30', section: 'BSEMC 1A', subjectCode: 'EMC 112', instructor: 'PANES' },
      { day: 'Friday', time: '7:30-8:00', section: 'BSIT 1D', subjectCode: 'IT 114', instructor: 'LABASTIDA' },
    ]
  },
  { 
    name: 'ComLab 3', 
    capacity: 30, 
    location: 'ComLab 3', 
    equipment: ['Computers', 'Projector', 'Whiteboard'], 
    isAvailable: true,
    schedules: [
      { day: 'Monday', time: '7:30-8:00', section: 'BSIT 3B', subjectCode: 'IT 135', instructor: 'ABELLA' },
      { day: 'Monday', time: '10:00-11:30', section: 'BSIT 3A', subjectCode: 'IT 136', instructor: 'ARIBE' },
      { day: 'Monday', time: '12:30-2:00', section: 'BSIT 1B', subjectCode: 'IT 111', instructor: 'MACALANDAG' },
      { day: 'Monday', time: '3:00-4:00', section: 'BSIT 3B', subjectCode: 'IT 136', instructor: 'ARIBE' },
      { day: 'Tuesday', time: '7:30-8:00', section: 'BSIT 3A', subjectCode: 'IT 139', instructor: 'NAVIDAD' },
      { day: 'Tuesday', time: '10:00-11:30', section: 'BSIT 3C', subjectCode: 'IT 1312', instructor: 'ARIBE' },
      { day: 'Tuesday', time: '12:30-1:00', section: 'BSIT 1C', subjectCode: 'IT 115', instructor: 'NAVIDAD' },
      { day: 'Tuesday', time: '3:00-3:30', section: 'BSIT 3B', subjectCode: 'IT 1310', instructor: 'ORACION' },
      { day: 'Thursday', time: '7:30-8:00', section: 'BSIT 3A', subjectCode: 'IT 1313', instructor: 'CASERES' },
      { day: 'Thursday', time: '10:00-10:30', section: 'BSIT 3A', subjectCode: 'IT 1312', instructor: 'ARIBE' },
      { day: 'Thursday', time: '12:30-1:00', section: 'BSIT 3C', subjectCode: 'IT 1313', instructor: 'CASERES' },
      { day: 'Thursday', time: '3:00-3:30', section: 'BSIT 3B', subjectCode: 'IT 1312', instructor: 'ARIBE' },
      { day: 'Friday', time: '7:30-8:00', section: 'BSIT 3A', subjectCode: 'IT 139', instructor: 'NAVIDAD' },
      { day: 'Friday', time: '10:00-11:30', section: 'BSIT 3C', subjectCode: 'IT 1312', instructor: 'ARIBE' },
      { day: 'Friday', time: '12:30-1:00', section: 'BSIT 1C', subjectCode: 'IT 115', instructor: 'NAVIDAD' },
    ]
  },
  { 
    name: 'ComLab 4', 
    capacity: 30, 
    location: 'ComLab 4', 
    equipment: ['Computers', 'Projector', 'Whiteboard'], 
    isAvailable: true,
    schedules: [
      { day: 'Monday', time: '7:30-8:00', section: 'BSIT 3D', subjectCode: 'IT 136', instructor: 'LAPATES' },
      { day: 'Monday', time: '10:00-11:30', section: 'BSIT 4A', subjectCode: 'IT 146', instructor: 'MUKARA' },
      { day: 'Monday', time: '12:30-2:00', section: 'BSEMC 4A', subjectCode: 'EMC 142', instructor: 'ESPINA' },
      { day: 'Monday', time: '3:00-4:00', section: 'BSIT 4B', subjectCode: 'IT 146', instructor: 'MUKARA' },
      { day: 'Tuesday', time: '7:30-8:00', section: 'BSIT 2E', subjectCode: 'IT 128', instructor: 'LECAROS' },
      { day: 'Tuesday', time: '10:00-11:30', section: '', subjectCode: '', instructor: '' },
      { day: 'Tuesday', time: '12:30-1:00', section: 'BSIT 3D', subjectCode: 'IT 1311', instructor: 'MUKARA' },
      { day: 'Tuesday', time: '3:00-3:30', section: 'BSIT 2F', subjectCode: 'IT 129', instructor: 'ABELLA' },
      { day: 'Thursday', time: '7:30-8:00', section: 'BSIT 3C', subjectCode: 'IT 138', instructor: 'ABELLA' },
      { day: 'Thursday', time: '10:00-10:30', section: 'BSIT 2C', subjectCode: 'IT 128', instructor: 'RABANES' },
      { day: 'Thursday', time: '12:30-1:00', section: 'BSIT 2B', subjectCode: 'IT 128', instructor: 'RABANES' },
      { day: 'Thursday', time: '3:00-3:30', section: 'BSIT 3D', subjectCode: 'IT 138', instructor: 'ABELLA' },
      { day: 'Friday', time: '7:30-8:00', section: 'BSIT 2E', subjectCode: 'IT 128', instructor: 'LECAROS' },
      { day: 'Friday', time: '10:00-11:30', section: 'BSIT 2E', subjectCode: 'IT 129', instructor: 'CAGANDE' },
      { day: 'Friday', time: '12:30-1:00', section: 'BSIT 3D', subjectCode: 'IT 1311', instructor: 'MUKARA' },
    ]
  },
  { 
    name: 'ComLab 5', 
    capacity: 30, 
    location: 'ComLab 5', 
    equipment: ['Computers', 'Projector', 'Whiteboard'], 
    isAvailable: true,
    schedules: [
      { day: 'Monday', time: '7:30-8:00', section: 'BSIT 4D', subjectCode: 'IT 141', instructor: 'RABANES' },
      { day: 'Monday', time: '10:00-11:30', section: 'BSIT 3F', subjectCode: 'IT 134', instructor: 'MACALANDAG' },
      { day: 'Monday', time: '12:30-2:00', section: 'BSIT 2A', subjectCode: 'IT 121', instructor: 'ORACION' },
      { day: 'Monday', time: '3:00-4:00', section: 'BSEMC 2B', subjectCode: 'CC121', instructor: 'ORACION' },
      { day: 'Thursday', time: '10:00-10:30', section: 'BSIT 2A', subjectCode: 'IT 129', instructor: 'CAGANDE' },
      { day: 'Thursday', time: '3:00-3:30', section: 'BSIT 2B', subjectCode: 'IT 129', instructor: 'CAGANDE' },
      { day: 'Friday', time: '7:30-8:00', section: 'BSIT 2D', subjectCode: 'IT 129', instructor: 'CAGANDE' },
    ]
  },
  { 
    name: 'ComLab 6', 
    capacity: 30, 
    location: 'ComLab 6', 
    equipment: ['Computers', 'Projector', 'Whiteboard'], 
    isAvailable: true,
    schedules: [
      { day: 'Monday', time: '7:30-8:00', section: 'BSIT 4A', subjectCode: 'IT 144', instructor: 'FLORES' },
      { day: 'Monday', time: '10:00-11:30', section: 'BSIT 4D', subjectCode: 'IT 144', instructor: 'LAPATES' },
      { day: 'Monday', time: '12:30-2:00', section: 'BSIT 4C', subjectCode: 'IT 144', instructor: 'FLORES' },
      { day: 'Monday', time: '3:00-4:00', section: 'BSIT 3A', subjectCode: 'IT 135', instructor: 'ABELLA' },
      { day: 'Thursday', time: '10:00-10:30', section: 'BSIT 3D', subjectCode: 'IT 1312', instructor: 'LECAROS' },
      { day: 'Thursday', time: '12:30-1:00', section: 'BSEMC 2A', subjectCode: 'EMC 124', instructor: 'CAYANAN' },
      { day: 'Thursday', time: '3:00-3:30', section: 'BSIT 3A', subjectCode: 'IT 1311', instructor: 'MUKARA' },
      { day: 'Thursday', time: '5:30-6:00', section: 'BSEMC 2B', subjectCode: 'EMC 123', instructor: 'PANES' },
    ]
  },
  { 
    name: 'ComLab 7', 
    capacity: 30, 
    location: 'ComLab 7', 
    equipment: ['Computers', 'Projector', 'Whiteboard'], 
    isAvailable: true,
    schedules: [
      { day: 'Monday', time: '7:30-8:00', section: 'BSEMC 4A', subjectCode: 'DA 142', instructor: 'NAVIDAD' },
      { day: 'Monday', time: '10:00-11:30', section: 'BSEMC 3A', subjectCode: 'DA 131', instructor: 'CAYANAN' },
      { day: 'Monday', time: '12:30-2:00', section: 'BSEMC 3B', subjectCode: 'BA 131', instructor: 'CAYANAN' },
      { day: 'Monday', time: '3:00-4:00', section: 'BSEMC 1A', subjectCode: 'CC112', instructor: 'PANES' },
      { day: 'Thursday', time: '7:30-8:00', section: 'BSIT 1A', subjectCode: 'IT 115', instructor: 'NAVIDAD' },
      { day: 'Thursday', time: '3:00-3:30', section: 'BSEMC 3A', subjectCode: 'DA 135', instructor: 'CAYANAN' },
      { day: 'Friday', time: '10:00-11:30', section: 'BSEMC 3A', subjectCode: 'DA 136', instructor: 'CAYANAN' },
    ]
  },
  { 
    name: 'ComLab 8', 
    capacity: 30, 
    location: 'ComLab 8', 
    equipment: ['Computers', 'Projector', 'Whiteboard'], 
    isAvailable: true,
    schedules: [
      { day: 'Monday', time: '7:30-8:00', section: 'BSIT 2A', subjectCode: 'IT 122', instructor: 'LABASTIDA' },
      { day: 'Monday', time: '10:00-11:30', section: 'BSIT 2B', subjectCode: 'IT 122', instructor: 'LABASTIDA' },
      { day: 'Monday', time: '12:30-2:00', section: 'BSIT 2C', subjectCode: 'IT 124', instructor: 'I.' },
      { day: 'Monday', time: '5:30-6:00', section: '', subjectCode: '', instructor: '' },
      { day: 'Thursday', time: '7:30-8:00', section: 'BSIT 3B', subjectCode: 'IT 139', instructor: 'BAGUIO' },
      { day: 'Thursday', time: '3:00-3:30', section: 'BSIT 2E', subjectCode: 'IT 126', instructor: 'BAGUIO' },
      { day: 'Friday', time: '7:30-8:00', section: 'BSIT 3C', subjectCode: 'IT 139', instructor: 'BAGUIO' },
      { day: 'Friday', time: '10:00-11:30', section: 'BSIT 2F', subjectCode: 'IT 126', instructor: 'BAGUIO' },
    ]
  },
];

async function seedClassrooms() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing classrooms
    await Classroom.deleteMany({});
    console.log('Cleared existing classrooms');

    // Insert new classrooms
    const result = await Classroom.insertMany(classrooms);
    console.log(`Successfully seeded ${result.length} classrooms`);

    // List all classrooms
    console.log('\nClassrooms added:');
    result.forEach((classroom, index) => {
      console.log(`${index + 1}. ${classroom.name} - ${classroom.location} (Capacity: ${classroom.capacity})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding classrooms:', error);
    process.exit(1);
  }
}

seedClassrooms();

