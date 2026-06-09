import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  PlayCircle,
  Award,
  Loader2,
  BookOpen,
  XCircle,
  Calendar,
} from "lucide-react";
import { api } from "../../utils/axios.js";
import { Spinner, EmptyState } from "../../components/common/index.jsx";
import { toast } from "react-hot-toast";

export default function CourseExams() {
  const { courseId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/exams/course/${courseId}`)
      .then((r) => setItems(r.data.items || []))
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading)
    return (
      <div className="py-16 flex justify-center">
        <Spinner size={32} />
      </div>
    );

  return (
    <div className="space-y-5">
      <div>
        <Link
          to="/dashboard/my-courses"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-ink mb-2"
        >
          <ArrowLeft size={14} /> My courses
        </Link>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">
          Exams
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          100 MCQ questions per exam. Score is automatically converted to 50 marks.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No exams scheduled"
          description="Your instructor will publish exams soon."
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((e) => (
            <div key={e._id} className="card p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-ink">{e.title}</h3>
                  {e.description && (
                    <p className="text-sm text-text-secondary mt-1.5">
                      {e.description}
                    </p>
                  )}
                </div>
                {e.attemptStatus === "completed" && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={12} /> Completed
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-surface p-2.5">
                  <div className="text-text-secondary">Questions</div>
                  <div className="font-bold text-ink">{e.totalQuestions}</div>
                </div>
                <div className="rounded-lg bg-surface p-2.5">
                  <div className="text-text-secondary">Duration</div>
                  <div className="font-bold text-ink">{e.duration} min</div>
                </div>
                <div className="rounded-lg bg-surface p-2.5">
                  <div className="text-text-secondary">Converted marks</div>
                  <div className="font-bold text-ink">{e.convertedMarks}</div>
                </div>
                <div className="rounded-lg bg-surface p-2.5">
                  <div className="text-text-secondary">Passing</div>
                  <div className="font-bold text-ink">{e.passingMarks}%</div>
                </div>
              </div>
              {e.attemptStatus === "completed" && e.score != null && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm">
                  <span className="font-bold text-emerald-800">Your score: </span>
                  <span className="text-emerald-700">
                    {e.score} / 50
                  </span>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                {e.attemptStatus === "completed" ? (
                  <>
                    <Link
                      to={`/dashboard/courses/${courseId}/result`}
                      className="btn-secondary h-10 text-sm flex-1"
                    >
                      <Award size={14} /> View result
                    </Link>
                    <Link
                      to={`/dashboard/courses/${courseId}/exams/${e._id}`}
                      className="btn-primary h-10 text-sm flex-1"
                    >
                      Retake
                    </Link>
                  </>
                ) : (
                  <Link
                    to={`/dashboard/courses/${courseId}/exams/${e._id}`}
                    className="btn-primary h-10 text-sm w-full"
                  >
                    <PlayCircle size={14} /> Start exam
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
