import { InternshipProgram } from "../models/Internship.js";
import { Task } from "../models/Task.js";
import { Application } from "../models/Application.js";

function stripTaskIds(tasks) {
  return (tasks || []).map(
    ({ taskNumber, title, description, instructions, submissionType, dueInDays, points }) => ({
      taskNumber,
      title,
      description: description || "",
      instructions: instructions || "",
      submissionType: submissionType || "link",
      dueInDays: dueInDays ?? 7,
      points: points ?? 20,
    })
  );
}

function validateTasks(tasks) {
  if (!Array.isArray(tasks) || tasks.length !== 5) {
    const err = new Error("Exactly 5 tasks are required for each program");
    err.statusCode = 400;
    throw err;
  }
  const numbers = tasks.map((t) => t.taskNumber).sort((a, b) => a - b);
  if (numbers.join(",") !== "1,2,3,4,5") {
    const err = new Error("Tasks must be numbered 1 through 5");
    err.statusCode = 400;
    throw err;
  }
}

async function syncProgramTasks(internshipId, tasks) {
  const normalized = stripTaskIds(tasks);
  validateTasks(normalized);
  await Task.deleteMany({ internship: internshipId });
  await Task.insertMany(normalized.map((t) => ({ ...t, internship: internshipId })));
  await InternshipProgram.findByIdAndUpdate(internshipId, { tasks: normalized });
  return normalized;
}

export async function listInternshipsAdmin(req, res, next) {
  try {
    const items = await InternshipProgram.find()
      .select("-tasks.instructions")
      .sort({ createdAt: -1 })
      .lean();

    const counts = await Application.aggregate([
      { $group: { _id: "$internship", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

    for (const item of items) {
      item.applicationCount = countMap[String(item._id)] || 0;
      item.taskCount = await Task.countDocuments({ internship: item._id });
    }

    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function getInternshipAdmin(req, res, next) {
  try {
    const item = await InternshipProgram.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: "Internship not found" });

    const taskDocs = await Task.find({ internship: item._id })
      .sort({ taskNumber: 1 })
      .lean();
    item.tasks = taskDocs;

    res.json({ item });
  } catch (err) {
    next(err);
  }
}

export async function listInternships(req, res, next) {
  try {
    const { domain, q } = req.query;
    const filter = { isActive: true };
    if (domain) filter.domain = domain;
    if (q) filter.title = { $regex: q, $options: "i" };
    const items = await InternshipProgram.find(filter)
      .select("-tasks.instructions")
      .sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function getInternship(req, res, next) {
  try {
    const item = await InternshipProgram.findOne({
      _id: req.params.id,
      isActive: true,
    }).lean();
    if (!item) return res.status(404).json({ message: "Internship not found" });

    const taskDocs = await Task.find({ internship: item._id })
      .sort({ taskNumber: 1 })
      .select("taskNumber title description instructions submissionType dueInDays points")
      .lean();

    if (taskDocs.length) {
      item.tasks = taskDocs;
    }

    res.json({ item });
  } catch (err) {
    next(err);
  }
}

export async function createInternship(req, res, next) {
  try {
    const { tasks, ...programData } = req.body;
    if (tasks) validateTasks(tasks);

    const item = await InternshipProgram.create({
      ...programData,
      tasks: tasks ? stripTaskIds(tasks) : [],
      createdBy: req.user._id,
      isActive: programData.isActive !== false,
    });

    if (tasks) await syncProgramTasks(item._id, tasks);

    const populated = await InternshipProgram.findById(item._id).lean();
    populated.tasks = await Task.find({ internship: item._id }).sort({ taskNumber: 1 }).lean();
    res.status(201).json({ item: populated });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

export async function updateInternship(req, res, next) {
  try {
    const { tasks, ...programData } = req.body;
    if (tasks) validateTasks(tasks);

    const item = await InternshipProgram.findByIdAndUpdate(
      req.params.id,
      {
        ...programData,
        ...(tasks ? { tasks: stripTaskIds(tasks) } : {}),
      },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: "Internship not found" });

    if (tasks) await syncProgramTasks(item._id, tasks);

    const populated = item.toObject();
    populated.tasks = await Task.find({ internship: item._id }).sort({ taskNumber: 1 }).lean();
    res.json({ item: populated });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

export async function deleteInternship(req, res, next) {
  try {
    const item = await InternshipProgram.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Internship not found" });
    res.json({ message: "Internship deactivated" });
  } catch (err) {
    next(err);
  }
}
