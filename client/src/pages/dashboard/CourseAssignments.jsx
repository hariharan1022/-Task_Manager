import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  XCircle,
  Award,
  Loader2,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../../utils/axios.js";
import { Spinner, EmptyState } from "../../components/common/index.jsx";
import { toast } from "react-hot-toast";

function StatusBadge({ status }) {
  if (status === "graded")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={12} /> Graded
      </span>
    );
  if (status === "submitted")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        <Clock size={12} /> Awaiting review
      </span>
    );
  return null;
}

function AssignmentCard({ item, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setFileData(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!fileData && !content.trim()) {
      toast.error("Add a file or text content");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await onSubmit(item._id, {
        fileUrl: fileData,
        fileName,
        content,
      });
      toast.success("Assignment submitted!");
      item.submission = data.submission;
      setOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-ink text-base">{item.title}</h3>
            <StatusBadge status={item.submission?.status} />
          </div>
          {item.description && (
            <p className="text-sm text-text-secondary mt-1.5">
              {item.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <Award size={12} /> Max: {item.maxMarks} marks
            </span>
            {item.dueDate && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> Due: {new Date(item.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {item.submission && (
        <div className="mt-4 rounded-xl border border-border/80 bg-surface/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink">Your submission</span>
            {item.submission.marks != null && (
              <span className="text-base font-bold text-success">
                {item.submission.marks} / {item.maxMarks}
              </span>
            )}
          </div>
          {item.submission.fileName && (
            <div className="text-xs text-text-secondary">
              📎 {item.submission.fileName}
            </div>
          )}
          {item.submission.content && (
            <p className="text-sm text-text-secondary bg-white p-3 rounded-lg border border-border/80">
              {item.submission.content}
            </p>
          )}
          {item.submission.feedback && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <div className="font-bold text-amber-900">Mentor feedback</div>
              <p className="text-amber-800 mt-1">{item.submission.feedback}</p>
            </div>
          )}
        </div>
      )}

      {!item.submission || item.submission.status === "submitted" ? (
        <button
          onClick={() => setOpen(!open)}
          className="btn-primary h-10 text-sm mt-4"
        >
          <Upload size={14} />
          {item.submission ? "Resubmit" : "Submit assignment"}
        </button>
      ) : null}

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 border-t border-border/80 pt-4 space-y-3"
        >
          <div>
            <label className="label">Upload file (PDF, image, doc)</label>
            <input
              type="file"
              onChange={handleFile}
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              className="input h-11 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-primary-light file:text-primary file:font-semibold"
            />
            {fileName && (
              <div className="text-xs text-text-secondary mt-1.5">
                ✓ {fileName}
              </div>
            )}
          </div>
          <div>
            <label className="label">Or write your answer</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input min-h-[100px] py-3"
              placeholder="Type your answer here…"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={submitting}
              className="btn-primary h-10 text-sm"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Submit
            </button>
            <button
              onClick={() => setOpen(false)}
              className="btn-secondary h-10 text-sm"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function CourseAssignments() {
  const { courseId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/assignments/course/${courseId}`)
      .then((r) => setItems(r.data.items || []))
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleSubmit = async (assignmentId, payload) => {
    const { data } = await api.post(`/assignments/${assignmentId}/submit`, payload);
    setItems((prev) =>
      prev.map((it) => (it._id === assignmentId ? { ...it, submission: data.submission } : it))
    );
    return data;
  };

  if (loading)
    return (
      <div className="py-16 flex justify-center">
        <Spinner size={32} />
      </div>
    );

  const totalMax = items.reduce((s, i) => s + (i.maxMarks || 0), 0);
  const totalGot = items.reduce(
    (s, i) => s + (i.submission?.marks || 0),
    0
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link
            to="/dashboard/my-courses"
            className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-ink mb-2"
          >
            <ArrowLeft size={14} /> My courses
          </Link>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">
            Assignments
          </h1>
        </div>
        {items.length > 0 && (
          <div className="card p-3 text-sm">
            <span className="text-text-secondary">Score: </span>
            <span className="font-bold text-ink">{totalGot} / {totalMax}</span>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No assignments yet"
          description="Your instructor hasn't posted assignments for this course."
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <AssignmentCard key={item._id} item={item} onSubmit={handleSubmit} />
          ))}
        </div>
      )}
    </div>
  );
}
