import { Course } from "../models/Course.js";
import { User } from "../models/User.js";
import courses from "./courses.js";

function slugify(str) {
  return String(str).toLowerCase().trim().replace(/\s+/g, "-");
}

export async function seedCourses({ clear = false } = {}) {
  if (clear) {
    console.log("Clearing existing courses...");
    await Course.deleteMany({});
  }
  let added = 0;
  let updated = 0;
  for (const c of courses) {
    const slug = c.slug || slugify(c.title);
    const existing = await Course.findOne({ slug });
    if (existing) {
      const totals = {
        totalLessons: (c.modules || []).reduce((s, m) => s + ((m.lessons || []).length), 0),
        totalDuration: (c.modules || []).reduce((s, m) => s + (m.lessons || []).reduce((s2, l) => s2 + (l.duration || 0), 0), 0),
      };
      await Course.findByIdAndUpdate(existing._id, { ...c, slug, ...totals, isPublished: true });
      updated += 1;
      console.log(`  updated: ${c.title}`);
      continue;
    }
    const totalLessons = (c.modules || []).reduce((s, m) => s + ((m.lessons || []).length), 0);
    const totalDuration = (c.modules || []).reduce((s, m) => s + (m.lessons || []).reduce((s2, l) => s2 + (l.duration || 0), 0), 0);
    await Course.create({
      ...c,
      slug,
      totalLessons,
      totalDuration,
      isPublished: true,
    });
    added += 1;
    console.log(`  added: ${c.title}`);
  }
  console.log(`Done. ${added} course(s) added, ${updated} updated. Total in DB: ${await Course.countDocuments()}`);
}
