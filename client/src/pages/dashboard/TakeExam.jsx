import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../../utils/axios.js";
import { Spinner } from "../../components/common/index.jsx";
import { toast } from "react-hot-toast";

export default function TakeExam() {
  const { courseId, examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [startedAt] = useState(Date.now());
  const submittedRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/exams/${examId}/start`)
      .then((r) => {
        if (r.data.attempt?.status === "completed") {
          toast("You already submitted this exam");
          navigate(`/dashboard/courses/${courseId}/result`);
          return;
        }
        setExam(r.data.exam);
        setQuestions(r.data.questions);
        setAttemptId(r.data.attempt._id);
        setAnswers({});
        setTimeLeft((r.data.exam.duration || 60) * 60);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to start exam");
        if (err.response?.status === 403 || err.response?.status === 404) {
          navigate(`/dashboard/courses/${courseId}/exams`);
        }
      })
      .finally(() => setLoading(false));
  }, [courseId, examId, navigate]);

  const submitExam = useCallback(
    async (autoSubmit = false) => {
      if (submittedRef.current || !attemptId) return;
      submittedRef.current = true;
      setSubmitting(true);
      const payload = {
        answers: Object.entries(answers).map(([qid, selected]) => ({
          questionId: qid,
          selected: typeof selected === "number" ? selected : -1,
        })),
      };
      try {
        const { data } = await api.post(`/exams/${examId}/submit`, payload);
        if (autoSubmit) toast("Time's up! Auto-submitted.");
        else toast.success(`Submitted! You scored ${data.attempt.convertedMarks} / 50`);
        navigate(`/dashboard/courses/${courseId}/result`);
      } catch (err) {
        submittedRef.current = false;
        toast.error(err.response?.data?.message || "Failed to submit");
      } finally {
        setSubmitting(false);
      }
    },
    [answers, attemptId, courseId, examId, navigate]
  );

  useEffect(() => {
    if (!exam || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          submitExam(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [exam, submitExam, timeLeft]);

  if (loading)
    return (
      <div className="py-16 flex justify-center">
        <Spinner size={32} />
      </div>
    );
  if (!exam || !questions.length)
    return <div className="text-center py-16 text-text-secondary">No questions</div>;

  const q = questions[current];
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const lowTime = timeLeft < 60;

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center justify-between gap-3 flex-wrap sticky top-0 z-20 bg-white">
        <div>
          <Link
            to={`/dashboard/courses/${courseId}/exams`}
            className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-ink"
          >
            <ArrowLeft size={12} /> Back
          </Link>
          <h1 className="text-base sm:text-lg font-bold text-ink mt-1">{exam.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-text-secondary">
            <span className="font-bold text-ink">{answered}</span> / {total} answered
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
              lowTime
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-primary-light text-primary border border-primary/15"
            }`}
          >
            <Clock size={14} className={lowTime ? "animate-pulse" : ""} />
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <button
            onClick={() => submitExam(false)}
            disabled={submitting}
            className="btn-primary h-9 text-sm"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Submit
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 card p-5 sm:p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Question {current + 1} of {total}
          </div>
          <h2 className="mt-2 text-base sm:text-lg font-bold text-ink leading-relaxed">
            {q.question}
          </h2>
          <div className="mt-5 space-y-2.5">
            {q.options.map((opt, i) => {
              const selected = answers[q._id] === i;
              return (
                <button
                  key={i}
                  onClick={() => setAnswers({ ...answers, [q._id]: i })}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition flex items-center gap-3 ${
                    selected
                      ? "border-primary bg-primary-light"
                      : "border-border/80 hover:border-primary/30 bg-white"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      selected
                        ? "bg-primary text-white"
                        : "bg-surface text-text-secondary"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span
                    className={`text-sm ${selected ? "text-ink font-semibold" : "text-text-secondary"}`}
                  >
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setCurrent(Math.max(0, current - 1))}
              disabled={current === 0}
              className="btn-secondary h-10 text-sm"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            {current === total - 1 ? (
              <button
                onClick={() => submitExam(false)}
                disabled={submitting}
                className="btn-primary h-10 text-sm"
              >
                <Send size={14} /> Submit exam
              </button>
            ) : (
              <button
                onClick={() => setCurrent(Math.min(total - 1, current + 1))}
                className="btn-primary h-10 text-sm"
              >
                Next <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

        <aside className="lg:col-span-1 card p-4 self-start lg:sticky lg:top-24">
          <h3 className="font-bold text-ink text-sm">Question palette</h3>
          <p className="text-xs text-text-secondary mt-1">Tap to navigate</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {questions.map((qq, i) => {
              const isAnswered = answers[qq._id] != null;
              const isCurrent = i === current;
              return (
                <button
                  key={qq._id}
                  onClick={() => setCurrent(i)}
                  className={`aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition ${
                    isCurrent
                      ? "bg-primary text-white shadow-glow"
                      : isAnswered
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-surface text-text-secondary border border-border/80"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-primary" /> Current
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300" /> Answered
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-surface border border-border" /> Not answered
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex gap-2">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>Your answers are auto-saved. Submit before time runs out.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
