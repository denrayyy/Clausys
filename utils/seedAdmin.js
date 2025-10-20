import User from "../models/User.js";

export default async function seedAdminIfMissing() {
  // Seed Admin
  const adminEmail = "clausysadmin@buksu.edu.ph";
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const admin = new User({
      firstName: "System",
      lastName: "Administrator",
      email: adminEmail,
      password: "admin",
      employeeId: "ADMIN001",
      department: "Administration",
      role: "admin",
      phone: "",
      isActive: true
    });
    await admin.save();
    console.log("Seeded admin:", adminEmail);
  }

  // Seed Regular User (teacher) - per request
  const userEmail = "reden@gmail.com";
  const existingUser = await User.findOne({ email: userEmail });
  if (!existingUser) {
    const teacher = new User({
      firstName: "Reden",
      lastName: "User",
      email: userEmail,
      password: "reden123",
      employeeId: "REDEN001",
      department: "General",
      role: "teacher",
      phone: "",
      isActive: true
    });
    await teacher.save();
    console.log("Seeded user:", userEmail);
  }
}


