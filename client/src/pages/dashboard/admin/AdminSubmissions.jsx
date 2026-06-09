import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import { api } from "../../../utils/axios.js";
import {
  Badge,
  Card,
  EmptyState,
  Input,
  Select,
  Spinner,
  Textarea,
} from "../../../components/common/index.jsx";
import toast from "react-hot-toast";

const filterOptions = [
  { value: "submitted", label: "Awaiting review" },
  { value: "", label: "All submissions" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const statusTone = {
  submitted: "warning",
  approved: "success",
  rejected: "danger",
  reviewed: "info",
};

function SubmissionLink({ content }) {
  const isUrl = /^https?:\/\//i.test(content);
  if (!isUrl) {
    return <p className="text-sm text-ink break-all whitespace-pre-wrap">{content}</p>;
  }
  return (
    <a
      href={content}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-sm text-primary font-semibold break-all hover:underline"
    >
      {content} <ExternalLink size={14} className="shrink-0" />
    </a>
  );
}

export default function AdminSubmissions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("submitted");
  const [review, setReview] = useState({});
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    api
      .get(`/tasks/submissions${qs}`)
      .then((res) => setItems(res.data.items || []))
      .catch(() => toast.error("Could not load submissions"))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const getReview = (id) => review[id] || { feedback: "", score: 20 };

  const setReviewField = (id, field, value) => {
    setReview((r) => ({
      ...r,
      [id]: { ...getReview(id), [field]: value },
    }));
  };

  const submitReview = async (id, status) => {
    const r = getReview(id);
    setBusy(id + status);
    try {
      await api.put(`/tasks/submissions/${id}/review`, {
        status,
        feedback: r.feedback,
        score: Number(r.score) || 20,
      });
      toast.success(status === "approved" ? "Submission approved" : "Submission rejected");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Review failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <Select
          label="Filter"
          className="max-w-xs"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          options={filterOptions}
        />
        <p className="text-sm text-text-secondary pb-2">
          {items.length} submission{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      {loading ? (
        <Card className="flex justify-center py-16">
          <Spinner />
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          title="No submissions"
          description="Student project submissions will appear here for verification."
        />
      ) : (
        <div className="space-y-4">
          {items.map((sub) => {
            const program = sub.application?.internship?.title;
            const maxPoints = sub.task?.points ?? 20;
            const r = getReview(sub._id);
            return (
              <Card key={sub._id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-ink">{sub.student?.fullName}</h3>
                      <Badge tone={statusTone[sub.status] || "default"}>{sub.status}</Badge>
                    </div>
                    <p className="text-sm text-text-secondary">{sub.student?.email}</p>
                    {sub.student?.college && (
                      <p className="text-xs text-muted">{sub.student.college}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium text-ink">
                      Task {sub.task?.taskNumber}: {sub.task?.title}
                    </div>
                    <div className="text-text-secondary text-xs">{program}</div>
                    <div className="text-xs text-muted mt-1">
                      Submitted {new Date(sub.submittedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-surface border border-border">
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                    Student submission
                  </div>
                  <SubmissionLink content={sub.submissionContent} />
                  {sub.submissionFileUrl && (
                    <a
                      href={sub.submissionFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm text-primary mt-2 hover:underline"
                    >
                      Attachment: {sub.submissionFileUrl}
                    </a>
                  )}
                </div>

                {sub.feedback && sub.status !== "submitted" && (
                  <p className="text-sm text-text-secondary mt-3">
                    <span className="font-medium text-ink">Previous feedback:</span> {sub.feedback}
                  </p>
                )}

                {sub.status === "submitted" && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <Textarea
                      label="Feedback for student"
                      value={r.feedback}
                      onChange={(e) => setReviewField(sub._id, "feedback", e.target.value)}
                      rows={2}
                      placeholder="Great work! Deploy is live and code is clean."
                    />
                    <Input
                      label={`Score (max ${maxPoints})`}
                      type="number"
                      min={0}
                      max={maxPoints}
                      className="max-w-[140px]"
                      value={r.score}
                      onChange={(e) => setReviewField(sub._id, "score", e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-primary text-sm"
                        disabled={!!busy}
                        onClick={() => submitReview(sub._id, "approved")}
                      >
                        <CheckCircle2 size={14} />
                        {busy === sub._id + "approved" ? "Approving…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        className="btn-danger text-sm"
                        disabled={!!busy}
                        onClick={() => submitReview(sub._id, "rejected")}
                      >
                        <XCircle size={14} />
                        {busy === sub._id + "rejected" ? "Rejecting…" : "Reject"}
                      </button>
                    </div>
                  </div>
                )}

                {sub.status === "approved" && (
                  <p className="text-sm text-emerald-700 mt-3 font-medium">
                    Approved · {sub.score}/{maxPoints} points
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
