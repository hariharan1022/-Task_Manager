import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Star,
  Users,
  Video,
  Clock,
  Code2,
  Globe,
  Brain,
  Smartphone,
  Database,
  Cpu,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../utils/axios.js";
import { Spinner } from "../components/common/index.jsx";
import { toast } from "react-hot-toast";

const categoryIcons = {
  Programming: Code2,
  "Web Development": Globe,
  "Data Science": Brain,
  "Mobile Development": Smartphone,
  Database: Database,
  "Cloud & DevOps": Cpu,
};

function CourseCard({ course }) {
  const Icon = categoryIcons[course.category] || BookOpen;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group"
    >
      <Link
        to={`/courses/${course._id || course.id}`}
        className="block card overflow-hidden hover:shadow-glow hover:border-primary/20 hover:-translate-y-1 transition-all duration-300"
      >
        <div className="h-36 sm:h-40 bg-gradient-to-br from-primary/90 to-accent/90 relative overflow-hidden">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <Icon size={56} className="opacity-90" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-white/95 text-[10px] font-bold uppercase tracking-wider text-ink">
            {course.level}
          </div>
          {course.isFeatured && (
            <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-amber-400 text-[10px] font-bold uppercase tracking-wider text-ink flex items-center gap-1">
              <Star size={10} className="fill-current" /> Featured
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1.5">
            {course.category}
          </div>
          <h3 className="font-bold text-ink text-base sm:text-lg line-clamp-2 group-hover:text-primary transition">
            {course.title}
          </h3>
          <p className="text-xs sm:text-sm text-text-secondary mt-1.5 line-clamp-2 leading-relaxed">
            {course.shortDescription}
          </p>
          <div className="flex items-center gap-3 sm:gap-4 mt-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <Clock size={12} /> {course.duration || "Self-paced"}
            </span>
            <span className="flex items-center gap-1">
              <Video size={12} /> {course.totalLessons || 0} lessons
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} /> {course.enrolledCount || 0}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    api
      .get("/courses/categories")
      .then((r) => setCategories(r.data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (category) params.category = category;
    if (level) params.level = level;
    if (search) params.q = search;
    api
      .get("/courses", { params })
      .then((r) => setCourses(r.data.items || []))
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load courses"))
      .finally(() => setLoading(false));
  }, [category, level, search]);

  return (
    <div className="bg-gradient-soft min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="mb-8">
          <span className="chip bg-primary-light text-primary border border-primary/15 mb-3 inline-block">
            <BookOpen size={12} className="inline mr-1" /> Training Programs
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-ink">
            Explore our courses
          </h1>
          <p className="mt-2 text-text-secondary max-w-2xl">
            Choose from 20+ industry-grade courses with video lessons, hands-on
            assignments, exams, and verifiable certificates.
          </p>
        </div>

        <div className="card p-4 sm:p-5 mb-6">
          <div className="grid sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses, topics, or skills…"
                className="input pl-10 h-11"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input h-11"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="input h-11"
              >
                <option value="">All levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Spinner size={32} />
          </div>
        ) : courses.length === 0 ? (
          <div className="card p-10 text-center">
            <BookOpen size={32} className="text-muted mx-auto" />
            <p className="mt-3 text-text-secondary">No courses match your filters.</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-text-secondary mb-4">
              Showing <span className="font-bold text-ink">{courses.length}</span>{" "}
              course{courses.length !== 1 ? "s" : ""}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {courses.map((c) => (
                <CourseCard key={c._id} course={c} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
