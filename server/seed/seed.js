import { User } from "../models/User.js";
import { InternshipProgram } from "../models/Internship.js";
import { Task } from "../models/Task.js";
import { Application } from "../models/Application.js";
import { programs } from "./programs.js";

export async function upsertPrograms() {
  console.log("Upserting internship programs (skips existing domains)...");
  let added = 0;
  for (const p of programs) {
    const existing = await InternshipProgram.findOne({
      domain: p.domain,
      title: p.title,
    });
    if (existing) {
      console.log(`  skip: ${p.title} (${p.domain})`);
      continue;
    }
    const tasks = p.tasks;
    const { tasks: _omit, ...rest } = p;
    const program = await InternshipProgram.create({
      ...rest,
      tasks,
      isActive: true,
    });
    for (const t of tasks) {
      await Task.create({ ...t, internship: program._id });
    }
    console.log(`  added: ${p.title} (${p.domain})`);
    added += 1;
  }
  console.log(`Done. ${added} program(s) added.`);
}

export async function seedDatabase({ clear = false } = {}) {
  if (clear) {
    console.log("Clearing existing seed data...");
    await Application.deleteMany({});
    await User.deleteMany({});
    await InternshipProgram.deleteMany({});
    await Task.deleteMany({});
  }

  const adminEmail = "admin@skyrovix.local";
  const studentEmail = "student@skyrovix.local";

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    console.log("Creating admin user...");
    await User.create({
      fullName: "Admin",
      email: adminEmail,
      password: "Admin@12345",
      role: "admin",
      isEmailVerified: true,
      college: "skyrovix HQ",
      department: "Operations",
    });
  } else {
    console.log(`Admin already exists (${adminEmail}) — keeping existing users.`);
  }

  const existingStudent = await User.findOne({ email: studentEmail });
  if (!existingStudent) {
    console.log("Creating sample student...");
    await User.create({
      fullName: "Demo Student",
      email: studentEmail,
      password: "Student@12345",
      role: "student",
      isEmailVerified: true,
      college: "ABC College of Engineering",
      department: "Computer Science",
      graduationYear: 2026,
    });
  }

  console.log("Upserting internship programs and tasks...");
  for (const p of programs) {
    const exists = await InternshipProgram.findOne({
      domain: p.domain,
      title: p.title,
    });
    if (exists) {
      console.log(`  skip: ${p.title} (${p.domain})`);
      continue;
    }
    const tasks = p.tasks;
    const { tasks: _omit, ...rest } = p;
    const program = await InternshipProgram.create({
      ...rest,
      tasks,
      isActive: true,
    });
    for (const t of tasks) {
      await Task.create({ ...t, internship: program._id });
    }
    console.log(`  added: ${p.title} (${p.domain})`);
  }

  console.log("Seed complete.");
  console.log("Admin login: admin@skyrovix.local / Admin@12345");
  console.log("Student login: student@skyrovix.local / Student@12345");
}
