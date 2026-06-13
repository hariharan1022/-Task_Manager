import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  BookOpen,
  Clock,
  ListChecks,
  Edit3,
  RefreshCw,
  Trash2,
  Award,
  ChevronRight,
} from "lucide-react";
import { api } from "../../../utils/axios.js";
import { formatLastFetched, listenDashboardRefresh } from "../../../utils/refreshEvents.js";
import { getSocket } from "../../../utils/useSocket.js";
import { Spinner, EmptyState, Modal } from "../../../components/common/index.jsx";
import { toast } from "react-hot-toast";

const POLL_INTERVAL = 5000;

const blank = {
  title: "",
  description: "",
  course: "",
  totalQuestions: 100,
  duration: 60,
  totalMarks: 100,
  convertedMarks: 50,
  passingMarks: 50,
  shuffleQuestions: true,
  isActive: true,
};

export default function AdminExams() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const intervalRef = useRef(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/exams/admin/all").catch(() => ({ data: { items: [] } })),
      api.get("/courses/admin/all").catch(() => ({ data: { items: [] } })),
    ])
      .then(([e, c]) => {
        setItems(e.data.items || []);
        setCourses(c.data.items || []);
        setLastFetched(new Date().toISOString());
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    const socket = getSocket();
    const handlers = {};
    for (const evt of ["course_created", "course_updated", "course_completed", "quiz_submitted", "quiz_evaluated"]) {
      const handler = (p) => { console.log("[AdminExams] Socket:", evt, p); load(); };
      socket.on(evt, handler);
      handlers[evt] = handler;
    }
    const unlisten = listenDashboardRefresh(() => load());
    return () => {
      clearInterval(intervalRef.current);
      for (const [evt, h] of Object.entries(handlers)) socket.off(evt, h);
      unlisten();
    };
  }, []);

  const save = async () => {
    if (!form.title || !form.course) {
      toast.error("Title and course are required");
      return;
    }
    setSaving(true);
    try {
      await api.post("/exams/admin", form);
      toast.success("Exam created");
      setOpen(false);
      setForm(blank);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this exam?")) return;
    try {
      await api.delete(`/exams/admin/${id}`);
      load();
      toast.success("Deleted");
    } catch (err) {
      toast.error("Failed");
    }
  };

  if (loading)
    return (
      <div className="py-16 flex justify-center">
        <Spinner size={32} />
      </div>
    );

  return (
    <div className="space-y-5">
      <p className="text-xs text-text-secondary flex items-center gap-1.5">
        <RefreshCw size={12} />
        Updated: <span className="font-mono font-medium text-ink">{formatLastFetched(lastFetched)}</span>
      </p>
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">
            Exams
          </h1>
          <p className="mt-1 text-text-secondary text-sm">
            Create 100-question MCQ exams and manage questions.
          </p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary h-10 text-sm">
          <Plus size={16} /> New exam
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No exams yet"
          cta={
            <button onClick={() => setOpen(true)} className="btn-primary">
              <Plus size={16} /> New exam
            </button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((e) => (
            <div key={e._id} className="card p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-ink">{e.title}</h3>
                  <div className="text-xs text-text-secondary mt-1">
                    {e.course?.title}
                  </div>
                </div>
                <button
                  onClick={() => remove(e._id)}
                  className="text-danger hover:bg-red-50 p-1.5 rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-surface p-2.5">
                  <div className="text-text-secondary">Questions</div>
                  <div className="font-bold text-ink">{e.totalQuestions}</div>
                </div>
                <div className="rounded-lg bg-surface p-2.5">
                  <div className="text-text-secondary">Duration</div>
                  <div className="font-bold text-ink">{e.duration}m</div>
                </div>
                <div className="rounded-lg bg-surface p-2.5">
                  <div className="text-text-secondary">Marks</div>
                  <div className="font-bold text-ink">
                    {e.convertedMarks}/50
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  navigate(`/dashboard/admin/exams/${e._id}/questions`)
                }
                className="btn-primary w-full h-10 text-sm mt-4"
              >
                <ListChecks size={14} /> Manage questions
                <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Modal onClose={() => setOpen(false)} title="Create exam">
          <div className="space-y-3">
            <div>
              <label className="label">Course *</label>
              <select
                className="input h-11"
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
              >
                <option value="">Select a course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Title *</label>
              <input
                className="input h-11"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Python Basics - Final Exam"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input min-h-[80px] py-3"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Total questions</label>
                <input
                  type="number"
                  className="input h-11"
                  value={form.totalQuestions}
                  onChange={(e) =>
                    setForm({ ...form, totalQuestions: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="label">Duration (min)</label>
                <input
                  type="number"
                  className="input h-11"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="label">Converted marks</label>
                <input
                  type="number"
                  className="input h-11"
                  value={form.convertedMarks}
                  onChange={(e) =>
                    setForm({ ...form, convertedMarks: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="label">Passing marks</label>
                <input
                  type="number"
                  className="input h-11"
                  value={form.passingMarks}
                  onChange={(e) =>
                    setForm({ ...form, passingMarks: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.shuffleQuestions}
                onChange={(e) =>
                  setForm({ ...form, shuffleQuestions: e.target.checked })
                }
              />
              Shuffle questions for each student
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="btn-secondary h-10 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="btn-primary h-10 text-sm"
              >
                Create
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
