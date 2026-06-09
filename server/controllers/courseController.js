import crypto from "crypto";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { LessonProgress } from "../models/LessonProgress.js";
import { Result } from "../models/Result.js";

function objId() {
  return crypto.randomUUID();
}

function slugify(str) {
  return String(str).toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

function firstLessonVideo(course) {
  if (course.videoUrl) return course.videoUrl;
  if (!course.modules?.length) return "";
  const first = course.modules[0].lessons?.[0];
  return first?.videoUrl || "";
}

export async function listCourses(req, res, next) {
  try {
    const { category, level, q, featured } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (featured === "true") filter.isFeatured = true;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { shortDescription: { $regex: q, $options: "i" } },
      ];
    }
    const items = (await Course.find(filter).sort({ createdAt: -1 })).map((c) => ({
      ...c,
      videoUrl: firstLessonVideo(c),
      totalLessons: firstLessonVideo(c) ? 1 : c.totalLessons,
    }));
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function getCourse(req, res, next) {
  try {
    const { id } = req.params;
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let course;
    if (uuidRe.test(id)) {
      course = await Course.findOne({ _id: id, isPublished: true });
    }
    if (!course) {
      course = await Course.findOne({ slug: id, isPublished: true });
    }
    if (!course) return res.status(404).json({ message: "Course not found" });
    course.videoUrl = firstLessonVideo(course);
    course.totalLessons = course.videoUrl ? 1 : course.totalLessons;
    let enrollment = null;
    if (req.user) {
      enrollment = await Enrollment.findOne({ user: req.user._id, course: course._id });
    }
    res.json({ course, enrollment });
  } catch (err) {
    next(err);
  }
}

export async function listCategories(req, res, next) {
  try {
    const categories = await Course.distinct("category", { isPublished: true });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

export async function enrollCourse(req, res, next) {
  try {
    const { id } = req.params;
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let course;
    if (uuidRe.test(id)) {
      course = await Course.findById(id);
    }
    if (!course) {
      course = await Course.findOne({ slug: id, isPublished: true });
    }
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    const existing = await Enrollment.findOne({ user: req.user._id, course: course._id });
    if (existing) {
      return res.json({ enrollment: existing, message: "Already enrolled" });
    }
    const enrollment = await Enrollment.create({
      user: req.user._id,
      course: course._id,
      status: "active",
    });
    await Course.findByIdAndUpdate(course._id, { enrolledCount: (course.enrolledCount || 0) + 1 });
    await Result.findOneAndUpdate(
      { user: req.user._id, course: course._id },
      { $setOnInsert: { user: req.user._id, course: course._id } },
      { upsert: true, new: true }
    );
    res.status(201).json({ enrollment });
  } catch (err) {
    next(err);
  }
}

export async function myEnrollments(req, res, next) {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id }).sort({ updatedAt: -1 });
    const results = await Result.find({
      user: req.user._id,
      course: { $in: enrollments.map((e) => e.course?._id || e.course).filter(Boolean) },
    });
    const resultMap = {};
    results.forEach((r) => (resultMap[r.course?._id || r.course] = r));
    const items = enrollments.map((e) => ({
      ...e,
      result: resultMap[e.course?._id || e.course] || null,
    }));
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function getCourseLearning(req, res, next) {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course || !course.isPublished) {
      return res.status(404).json({ message: "Course not found" });
    }
    course.videoUrl = firstLessonVideo(course);
    const enrollment = await Enrollment.findOne({ user: req.user._id, course: course._id });
    if (!enrollment) {
      return res.status(403).json({ message: "Enroll in the course first" });
    }

    const courseLesson = {
      lessonId: course._id,
      title: course.title,
      description: course.shortDescription || course.description,
      videoUrl: course.videoUrl,
      duration: 0,
      resources: [],
      completed: enrollment.status === "completed",
      watchTime: 0,
      lastPosition: 0,
    };

    const completedCount = courseLesson.completed ? 1 : 0;
    const progressPct = completedCount * 100;

    if (enrollment.progress !== progressPct) {
      await Enrollment.findByIdAndUpdate(enrollment._id, {
        progress: progressPct,
        ...(progressPct === 100 ? { status: "completed", completedAt: new Date() } : {}),
      });
    }

    res.json({
      course: {
        _id: course._id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        category: course.category,
        level: course.level,
        duration: course.duration,
        instructor: course.instructor,
        videoUrl: course.videoUrl,
      },
      currentLesson: courseLesson,
      lessons: [courseLesson],
      progress: { total: 1, completed: completedCount, percentage: progressPct },
    });
  } catch (err) {
    next(err);
  }
}

export async function markLessonComplete(req, res, next) {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const enrollment = await Enrollment.findByIdAndUpdate(
      (await Enrollment.findOne({ user: req.user._id, course: course._id }))._id,
      { progress: 100, status: "completed", completedAt: new Date() },
      { new: true }
    );

    await LessonProgress.findOneAndUpdate(
      { user: req.user._id, lessonId: course._id },
      { user: req.user._id, course: course._id, lessonId: course._id, completed: true, completedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ progress: enrollment, enrollment });
  } catch (err) {
    next(err);
  }
}

export async function updateLessonProgress(req, res, next) {
  try {
    const { courseId } = req.params;
    const { lastPosition, watchTime } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    const enrollment = await Enrollment.findOne({ user: req.user._id, course: course._id });

    if (enrollment) {
      await Enrollment.findByIdAndUpdate(enrollment._id, {
        lastPosition: lastPosition || 0,
      });
    }

    res.json({ progress: { lastPosition, watchTime } });
  } catch (err) {
    next(err);
  }
}

export async function adminListCourses(req, res, next) {
  try {
    const items = (await Course.find().sort({ createdAt: -1 })).map((c) => ({
      ...c,
      videoUrl: firstLessonVideo(c),
      totalLessons: firstLessonVideo(c) ? 1 : c.totalLessons,
    }));
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function adminGetCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    course.videoUrl = firstLessonVideo(course);
    res.json({ course });
  } catch (err) {
    next(err);
  }
}

export async function adminCreateCourse(req, res, next) {
  try {
    const data = { ...req.body };
    if (!data.slug && data.title) data.slug = slugify(data.title);
    data.createdBy = req.user._id;
    const course = await Course.create(data);
    res.status(201).json({ course });
  } catch (err) {
    if (err.message && err.message.includes("duplicate")) {
      return res.status(409).json({ message: "Course slug already exists" });
    }
    next(err);
  }
}

export async function adminUpdateCourse(req, res, next) {
  try {
    const data = { ...req.body };
    if (data.title && !data.slug) data.slug = slugify(data.title);
    const course = await Course.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ course });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteCourse(req, res, next) {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, { isPublished: false }, { new: true });
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ message: "Course unpublished" });
  } catch (err) {
    next(err);
  }
}

export async function adminAddModule(req, res, next) {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    const { title, description } = req.body;
    const modules = [...(course.modules || [])];
    modules.push({ _id: objId(), id: objId(), title, description, order: modules.length, lessons: [] });
    await Course.findByIdAndUpdate(course._id, { modules });
    const updated = await Course.findById(course._id);
    res.status(201).json({ course: updated });
  } catch (err) {
    next(err);
  }
}

export async function adminAddLesson(req, res, next) {
  try {
    const { id, moduleId } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    const modules = [...(course.modules || [])];
    const modIdx = modules.findIndex((m) => m._id === moduleId || m.id === moduleId);
    if (modIdx === -1) return res.status(404).json({ message: "Module not found" });
    const lessons = [...(modules[modIdx].lessons || [])];
    lessons.push({ _id: objId(), id: objId(), ...req.body, order: lessons.length });
    modules[modIdx] = { ...modules[modIdx], lessons };
    await Course.findByIdAndUpdate(course._id, { modules });
    const updated = await Course.findById(course._id);
    res.status(201).json({ course: updated });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteLesson(req, res, next) {
  try {
    const { id, moduleId, lessonId } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    const modules = [...(course.modules || [])];
    const modIdx = modules.findIndex((m) => m._id === moduleId || m.id === moduleId);
    if (modIdx === -1) return res.status(404).json({ message: "Module not found" });
    modules[modIdx] = {
      ...modules[modIdx],
      lessons: (modules[modIdx].lessons || []).filter((l) => l._id !== lessonId && l.id !== lessonId),
    };
    await Course.findByIdAndUpdate(course._id, { modules });
    const updated = await Course.findById(course._id);
    res.json({ course: updated });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteModule(req, res, next) {
  try {
    const { id, moduleId } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    const modules = (course.modules || []).filter((m) => m._id !== moduleId && m.id !== moduleId);
    await Course.findByIdAndUpdate(course._id, { modules });
    const updated = await Course.findById(course._id);
    res.json({ course: updated });
  } catch (err) {
    next(err);
  }
}
