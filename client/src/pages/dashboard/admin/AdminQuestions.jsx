import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  ListChecks,
  Check,
  X,
  Save,
} from "lucide-react";
import { api } from "../../../utils/axios.js";
import { Spinner, EmptyState, Modal } from "../../../components/common/index.jsx";
import { toast } from "react-hot-toast";

const blank = {
  question: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  explanation: "",
  marks: 1,
};

export default function AdminQuestions() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get(`/exams/admin/${examId}/questions`)
      .then((r) => setQuestions(r.data.items || []))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    api
      .get(`/exams/admin/all`)
      .then((r) => {
        const found = (r.data.items || []).find((e) => e._id === examId);
        if (found) setExam(found);
      })
      .catch(() => {});
    load();
  }, [examId]);

  const save = async () => {
    if (!form.question || form.options.some((o) => !o.trim())) {
      toast.error("Question and all 4 options are required");
      return;
    }
    try {
      if (editing) {
        await api.put(`/exams/admin/questions/${editing}`, form);
        toast.success("Question updated");
      } else {
        await api.post(`/exams/admin/${examId}/questions`, form);
        toast.success("Question added");
      }
      setOpen(false);
      setEditing(null);
      setForm(blank);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this question?")) return;
    try {
      await api.delete(`/exams/admin/questions/${id}`);
      load();
      toast.success("Deleted");
    } catch (err) {
      toast.error("Failed");
    }
  };

  const startEdit = (q) => {
    setEditing(q._id);
    setForm({
      question: q.question,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "",
      marks: q.marks || 1,
    });
    setOpen(true);
  };

  const parseBulk = (text) => {
    const blocks = text.split(/\n\s*\n/).filter((b) => b.trim());
    const out = [];
    for (const b of blocks) {
      const lines = b.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length < 5) continue;
      const qLine = lines[0].replace(/^Q[\.\)]\s*/i, "");
      const optLines = lines.slice(1, 5);
      const ansLine = lines[5] || "";
      const ansMatch = ansLine.match(/^A[\.\):]\s*(\d+)/i);
      const correctAnswer = ansMatch ? Number(ansMatch[1]) - 1 : 0;
      out.push({
        question: qLine,
        options: optLines.map((l) => l.replace(/^[A-D][\.\)]\s*/i, "")),
        correctAnswer,
        explanation: "",
        marks: 1,
      });
    }
    return out;
  };

  const submitBulk = async () => {
    const parsed = parseBulk(bulkText);
    if (parsed.length === 0) {
      toast.error("Could not parse any questions. Check the format.");
      return;
    }
    try {
      const { data } = await api.post(
        `/exams/admin/${examId}/questions/bulk`,
        { questions: parsed }
      );
      toast.success(`Added ${data.count} questions`);
      setBulkOpen(false);
      setBulkText("");
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
          <Link
            to="/dashboard/admin/exams"
            className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-ink mb-2"
          >
            <ArrowLeft size={14} /> Back to exams
          </Link>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">
            {exam?.title || "Exam Questions"}
          </h1>
          <p className="mt-1 text-text-secondary text-sm">
            {questions.length} / {exam?.totalQuestions || 100} questions added
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setBulkOpen(true)}
            className="btn-secondary h-10 text-sm"
          >
            <ListChecks size={14} /> Bulk add
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setForm(blank);
              setOpen(true);
            }}
            className="btn-primary h-10 text-sm"
          >
            <Plus size={16} /> Add question
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No questions yet"
          description="Add questions one by one or use the bulk add feature."
        />
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q._id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                    Q{i + 1}
                  </div>
                  <div className="font-semibold text-ink mt-1">{q.question}</div>
                  <div className="mt-2 grid sm:grid-cols-2 gap-1.5">
                    {q.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                          q.correctAnswer === oi
                            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                            : "bg-surface text-text-secondary"
                        }`}
                      >
                        {q.correctAnswer === oi ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <X size={14} className="text-muted" />
                        )}
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(q)}
                    className="text-primary hover:bg-primary-light p-1.5 rounded-lg"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => remove(q._id)}
                    className="text-danger hover:bg-red-50 p-1.5 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Modal
          onClose={() => {
            setOpen(false);
            setEditing(null);
            setForm(blank);
          }}
          title={editing ? "Edit question" : "Add question"}
        >
          <div className="space-y-3">
            <div>
              <label className="label">Question *</label>
              <textarea
                className="input min-h-[80px] py-3"
                value={form.question}
                onChange={(e) =>
                  setForm({ ...form, question: e.target.value })
                }
              />
            </div>
            {form.options.map((opt, i) => (
              <div key={i}>
                <label className="label flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.correctAnswer === i}
                    onChange={() => setForm({ ...form, correctAnswer: i })}
                  />
                  Option {String.fromCharCode(65 + i)}{" "}
                  {form.correctAnswer === i && (
                    <span className="text-[10px] font-bold text-emerald-600">
                      CORRECT
                    </span>
                  )}
                </label>
                <input
                  className="input h-10"
                  value={opt}
                  onChange={(e) => {
                    const next = [...form.options];
                    next[i] = e.target.value;
                    setForm({ ...form, options: next });
                  }}
                />
              </div>
            ))}
            <div>
              <label className="label">Explanation (optional)</label>
              <textarea
                className="input min-h-[60px] py-3"
                value={form.explanation}
                onChange={(e) =>
                  setForm({ ...form, explanation: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setOpen(false);
                  setEditing(null);
                  setForm(blank);
                }}
                className="btn-secondary h-10 text-sm"
              >
                Cancel
              </button>
              <button onClick={save} className="btn-primary h-10 text-sm">
                <Save size={14} /> Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {bulkOpen && (
        <Modal
          onClose={() => setBulkOpen(false)}
          title="Bulk add questions"
        >
          <p className="text-sm text-text-secondary mb-3">
            Paste questions in this format. Separate each question with a blank
            line.
          </p>
          <pre className="bg-surface p-3 rounded-lg text-xs text-text-secondary whitespace-pre-wrap">
{`Q. What is 2 + 2?
A. 3
B. 4
C. 5
D. 6
A: 2

Q. What is the capital of France?
A. London
B. Berlin
C. Paris
D. Madrid
A: 3`}
          </pre>
          <textarea
            className="input min-h-[200px] py-3 font-mono text-xs"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="Paste your questions here…"
          />
          <div className="flex justify-end gap-2 pt-3">
            <button
              onClick={() => setBulkOpen(false)}
              className="btn-secondary h-10 text-sm"
            >
              Cancel
            </button>
            <button onClick={submitBulk} className="btn-primary h-10 text-sm">
              Add questions
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
