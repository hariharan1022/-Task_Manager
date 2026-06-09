import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  XCircle,
  Download,
  Trophy,
  Target,
  TrendingUp,
  BookOpen,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../../utils/axios.js";
import { Spinner } from "../../components/common/index.jsx";
import { toast } from "react-hot-toast";

function ScoreCard({ label, marks, max, color, icon: Icon }) {
  const pct = max > 0 ? Math.round((marks / max) * 100) : 0;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          {label}
        </span>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon size={16} />
        </div>
      </div>
      <div className="mt-3 text-3xl font-display font-extrabold text-ink">
        {marks}
        <span className="text-base text-text-secondary font-medium"> / {max}</span>
      </div>
      <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full ${color.replace("text-", "bg-")} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function GradeDisplay({ grade, status }) {
  const passed = status === "passed";
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 text-center ${
        passed
          ? "bg-gradient-brand text-white shadow-glow-lg"
          : "bg-gradient-to-br from-slate-700 to-slate-900 text-white"
      }`}
    >
      <div className="absolute inset-0 hero-grid opacity-30" />
      <div className="relative">
        <div className="text-xs sm:text-sm font-bold uppercase tracking-wider opacity-90">
          {passed ? "Congratulations!" : "Keep practicing!"}
        </div>
        <div className="mt-3 text-7xl sm:text-8xl font-display font-extrabold">
          {grade}
        </div>
        <div className="mt-2 text-sm sm:text-base opacity-90">
          {passed ? "You passed this course" : "Score below 50% — retake available"}
        </div>
      </div>
    </motion.div>
  );
}

export default function CourseResults() {
  const { courseId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/exams/course/${courseId}/result`)
      .then((r) => setData(r.data))
      .catch((err) => {
        if (err.response?.status === 404) setData(null);
        else toast.error(err.response?.data?.message || "Failed to load result");
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading)
    return (
      <div className="py-16 flex justify-center">
        <Spinner size={32} />
      </div>
    );
  if (!data)
    return (
      <div className="text-center py-16 text-text-secondary">
        No result available yet. Complete assignments and exams first.
      </div>
    );

  const { result, latestExam, latestAssignment } = data;
  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/dashboard/my-courses"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-ink mb-2"
        >
          <ArrowLeft size={14} /> My courses
        </Link>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">
          {result.course?.title} — Result
        </h1>
      </div>

      <GradeDisplay grade={result.grade} status={result.status} />

      <div className="grid sm:grid-cols-3 gap-4">
        <ScoreCard
          label="Assignment"
          marks={result.assignmentMarks || 0}
          max={50}
          color="text-blue-500"
          icon={CheckCircle2}
        />
        <ScoreCard
          label="Exam"
          marks={result.examMarks || 0}
          max={50}
          color="text-amber-500"
          icon={Trophy}
        />
        <ScoreCard
          label="Total"
          marks={result.totalScore || 0}
          max={100}
          color="text-emerald-500"
          icon={Target}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {latestAssignment && (
          <div className="card p-5">
            <h3 className="font-bold text-ink flex items-center gap-2 text-sm">
              <CheckCircle2 size={16} className="text-blue-500" /> Latest assignment
            </h3>
            <div className="mt-2 text-sm text-text-secondary">
              {latestAssignment.assignment?.title || "Assignment"}
            </div>
            <div className="mt-2 text-2xl font-bold text-ink">
              {latestAssignment.marks}
              <span className="text-sm text-text-secondary font-medium">
                {" "}
                / 50
              </span>
            </div>
            {latestAssignment.feedback && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                "{latestAssignment.feedback}"
              </div>
            )}
          </div>
        )}
        {latestExam && (
          <div className="card p-5">
            <h3 className="font-bold text-ink flex items-center gap-2 text-sm">
              <Trophy size={16} className="text-amber-500" /> Latest exam
            </h3>
            <div className="mt-2 text-sm text-text-secondary">
              {latestExam.correctCount} / {latestExam.totalQuestions} correct
            </div>
            <div className="mt-2 text-2xl font-bold text-ink">
              {latestExam.convertedMarks}
              <span className="text-sm text-text-secondary font-medium"> / 50</span>
            </div>
            <div className="mt-2 text-xs text-text-muted">
              <Clock size={10} className="inline mr-1" />
              {Math.round((latestExam.timeSpent || 0) / 60)} min spent
            </div>
          </div>
        )}
      </div>

      {result.status === "passed" && (
        <div className="card p-6 text-center">
          <Award size={36} className="text-primary mx-auto" />
          <h3 className="mt-3 text-lg font-bold text-ink">
            You earned a certificate!
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Continue learning or share your achievement.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <Link
              to="/dashboard/certificate"
              className="btn-primary h-10 text-sm"
            >
              <Download size={14} /> View certificate
            </Link>
            <Link
              to="/courses"
              className="btn-secondary h-10 text-sm"
            >
              <BookOpen size={14} /> Browse more courses
            </Link>
          </div>
        </div>
      )}

      {result.status !== "passed" && (
        <div className="card p-6 text-center">
          <XCircle size={36} className="text-amber-500 mx-auto" />
          <h3 className="mt-3 text-lg font-bold text-ink">You can retake</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Review the course material and try again.
          </p>
          <Link
            to={`/dashboard/courses/${courseId}/learn`}
            className="btn-primary h-10 text-sm mt-4"
          >
            <TrendingUp size={14} /> Continue learning
          </Link>
        </div>
      )}
    </div>
  );
}
