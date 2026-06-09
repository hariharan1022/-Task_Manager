import { createModel } from "../config/modelFactory.js";

const Course = createModel("courses", {
  _id: "id",
  id: "id",
  title: "title",
  slug: "slug",
  shortDescription: "short_description",
  description: "description",
  thumbnail: "thumbnail",
  category: "category",
  level: "level",
  duration: "duration",
  instructor: "instructor",
  learningObjectives: "learning_objectives",
  requirements: "requirements",
  tags: "tags",
  modules: "modules",
  videoUrl: "video_url",
  totalLessons: "total_lessons",
  totalDuration: "total_duration",
  enrolledCount: "enrolled_count",
  rating: "rating",
  isPublished: "is_published",
  isFeatured: "is_featured",
  createdBy: "created_by",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

async function recalcTotals(course) {
  if (course.videoUrl) {
    return { totalLessons: 1, totalDuration: 0 };
  }
  const modules = course.modules || [];
  return {
    totalLessons: modules.reduce((s, m) => s + ((m.lessons || []).length), 0),
    totalDuration: modules.reduce((s, m) => s + (m.lessons || []).reduce((s2, l) => s2 + (l.duration || 0), 0), 0),
  };
}

const origCreate = Course.create.bind(Course);
Course.create = async function (data) {
  const { totalLessons, totalDuration } = await recalcTotals(data);
  return origCreate({ ...data, totalLessons, totalDuration });
};

const origUpdate = Course.findByIdAndUpdate.bind(Course);
Course.findByIdAndUpdate = async function (id, data, options) {
  if (data.videoUrl || data.modules || data.title) {
    const existing = await Course.findById(id);
    if (existing) {
      const merged = { ...existing, ...data };
      const totals = await recalcTotals(merged);
      data = { ...data, ...totals };
    }
  }
  return origUpdate(id, data, options);
};

export { Course };
