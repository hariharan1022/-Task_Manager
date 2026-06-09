import { useEffect, useState } from "react";
import {
  Plus,
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
  Edit3,
  Trash2,
  Award,
  MessageSquare,
} from "lucide-react";
import { api } from "../../../utils/axios.js";
import { Spinner, EmptyState, Modal } from "../../../components/common/index.jsx";
import { toast } from "react-hot-toast";

const blankForm = {
  title: "",
  description: "",
  instructions: "",
  maxMarks: 50,
  course: "",
  dueDate: "",
};

export default function AdminAssignments() {
  const [items, setItems] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("submissions");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [grading, setGrading] = useState(null);
  const [gradeForm, setGradeForm] = useState({ marks: 0, feedback: "" });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/assignments/admin/all").catch(() => ({ data: { items: [] } })),
      api.get("/assignments/admin/submissions").catch(() => ({ data: { items: [] } })),
      api.get("/courses/admin/all").catch(() => ({ data: { items: [] } })),
    ])
      .then(([a, s, c]) => {
        setItems(a.data.items || []);
        setSubmissions(s.data.items || []);
        setCourses(c.data.items || []);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.title || !form.course) {
      toast.error("Title and course are required");
      return;
    }
    setSaving(true);
    try {
      await api.post("/assignments/admin", form);
      toast.success("Assignment created");
      setOpen(false);
      setForm(blankForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this assignment?")) return;
    try {
      await api.delete(`/assignments/admin/${id}`);
      load();
      toast.success("Deleted");
    } catch (err) {
      toast.error("Failed");
    }
  };

  const submitGrade = async () => {
    try {
      await api.post(`/assignments/submissions/${grading._id}/grade`, gradeForm);
      toast.success(`Graded ${gradeForm.marks} marks`);
      setGrading(null);
      setGradeForm({ marks: 0, feedback: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
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
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">
            Assignments
          </h1>
          <p className="mt-1 text-text-secondary text-sm">
            Create assignments and grade student submissions.
          </p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary h-10 text-sm">
          <Plus size={16} /> New assignment
        </button>
      </div>

      <div className="flex gap-1 border-b border-border">
        {[
          { key: "submissions", label: "Submissions", count: submissions.filter((s) => s.status === "submitted").length },
          { key: "assignments", label: "All assignments", count: items.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-ink"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-light text-primary">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "submissions" ? (
        submissions.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No submissions yet"
            description="Student submissions will appear here for grading."
          />
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <div key={s._id} className="card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-ink">
                        {s.assignment?.title || "Assignment"}
                      </h3>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          s.status === "graded"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <div className="text-xs text-text-secondary mt-1">
                      {s.user?.fullName} · {s.course?.title}
                    </div>
                    {s.content && (
                      <p className="mt-2 text-sm text-text-secondary bg-surface p-3 rounded-lg">
                        {s.content}
                      </p>
                    )}
                    {s.fileName && (
                      <div className="mt-2 text-xs text-primary">
                        📎 {s.fileName}
                      </div>
                    )}
                  </div>
                  {s.status === "submitted" ? (
                    <button
                      onClick={() => {
                        setGrading(s);
                        setGradeForm({ marks: 0, feedback: "" });
                      }}
                      className="btn-primary h-9 text-xs"
                    >
                      <Award size={12} /> Grade
                    </button>
                  ) : (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-700">
                        {s.marks}
                        <span className="text-xs text-text-secondary font-medium">
                          {" "}
                          / {s.assignment?.maxMarks || 50}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                {s.feedback && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                    <MessageSquare size={12} className="inline mr-1" />
                    {s.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assignments created"
          cta={
            <button onClick={() => setOpen(true)} className="btn-primary">
              <Plus size={16} /> New assignment
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a._id} className="card p-4 flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-bold text-ink">{a.title}</h3>
                <div className="text-xs text-text-secondary mt-1">
                  {a.course?.title} · {a.maxMarks} marks
                </div>
                {a.description && (
                  <p className="text-sm text-text-secondary mt-2">{a.description}</p>
                )}
              </div>
              <button
                onClick={() => remove(a._id)}
                className="text-danger hover:bg-red-50 p-1.5 rounded-lg"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Modal onClose={() => setOpen(false)} title="Create assignment">
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
            <div>
              <label className="label">Instructions</label>
              <textarea
                className="input min-h-[80px] py-3"
                value={form.instructions}
                onChange={(e) =>
                  setForm({ ...form, instructions: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Max marks</label>
                <input
                  type="number"
                  className="input h-11"
                  value={form.maxMarks}
                  onChange={(e) =>
                    setForm({ ...form, maxMarks: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="label">Due date</label>
                <input
                  type="date"
                  className="input h-11"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>
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

      {grading && (
        <Modal onClose={() => setGrading(null)} title="Grade submission">
          <div className="space-y-3">
            <div className="rounded-lg bg-surface p-3 text-sm">
              <div className="font-semibold text-ink">
                {grading.assignment?.title}
              </div>
              <div className="text-xs text-text-secondary mt-0.5">
                {grading.user?.fullName} ({grading.user?.email})
              </div>
            </div>
            <div>
              <label className="label">Marks (0 - {grading.assignment?.maxMarks || 50})</label>
              <input
                type="number"
                min={0}
                max={grading.assignment?.maxMarks || 50}
                className="input h-11"
                value={gradeForm.marks}
                onChange={(e) =>
                  setGradeForm({ ...gradeForm, marks: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="label">Feedback</label>
              <textarea
                className="input min-h-[100px] py-3"
                value={gradeForm.feedback}
                onChange={(e) =>
                  setGradeForm({ ...gradeForm, feedback: e.target.value })
                }
                placeholder="Share your feedback with the student…"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setGrading(null)}
                className="btn-secondary h-10 text-sm"
              >
                Cancel
              </button>
              <button onClick={submitGrade} className="btn-primary h-10 text-sm">
                Save grade
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
