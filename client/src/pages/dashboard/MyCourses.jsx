import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  PlayCircle,
  Clock,
  Award,
  CheckCircle2,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../../utils/axios.js";
import { Spinner, EmptyState, ProgressBar } from "../../components/common/index.jsx";

function CourseProgressCard({ enrollment }) {
  const course = enrollment.course;
  if (!course) return null;
  const progress = enrollment.progress || 0;
  const result = enrollment.result;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group card overflow-hidden hover:shadow-glow hover:border-primary/20 transition-all"
    >
      <div className="h-32 bg-gradient-to-br from-primary/90 to-accent/90 relative overflow-hidden">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <BookOpen size={40} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {result && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/95 text-[10px] font-bold uppercase tracking-wider text-ink">
            Grade: {result.grade}
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
          {course.category}
        </div>
        <h3 className="font-bold text-ink line-clamp-1">{course.title}</h3>
        <p className="text-xs text-text-secondary mt-1.5 line-clamp-2">
          {course.shortDescription}
        </p>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium">Progress</span>
            <span className="font-bold text-ink">{progress}%</span>
          </div>
          <ProgressBar value={progress} />
        </div>

        <div className="mt-4 flex items-center gap-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {course.duration}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp size={12} />
            {enrollment.status === "completed" ? "Completed" : "In progress"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to={`/dashboard/courses/${course._id}/learn`}
            className="btn-primary h-10 text-sm"
          >
            <PlayCircle size={14} /> Continue
          </Link>
          {result ? (
            <Link
              to={`/dashboard/courses/${course._id}/result`}
              className="btn-secondary h-10 text-sm"
            >
              <Award size={14} /> Result
            </Link>
          ) : (
            <Link
              to={`/dashboard/courses/${course._id}/assignments`}
              className="btn-secondary h-10 text-sm"
            >
              <CheckCircle2 size={14} /> Tasks
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/courses/my")
      .then((r) => setEnrollments(r.data.items || []))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">
            My Courses
          </h1>
          <p className="mt-1 text-text-secondary text-sm sm:text-base">
            Continue learning, take exams, and earn certificates.
          </p>
        </div>
        <Link to="/courses" className="btn-secondary h-10 text-sm">
          Browse more courses
        </Link>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="You haven't enrolled in any course yet"
          description="Explore our catalog of 20+ courses and start your learning journey today."
          cta={
            <Link to="/courses" className="btn-primary">
              Browse courses
            </Link>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {enrollments.map((e) => (
            <CourseProgressCard key={e._id} enrollment={e} />
          ))}
        </div>
      )}
    </div>
  );
}
