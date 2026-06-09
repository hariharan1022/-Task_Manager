import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, Lock, Send, XCircle } from "lucide-react";
import { api } from "../../utils/axios.js";
import { Badge, Card, EmptyState, ProgressBar, Spinner, Textarea } from "../../components/common/index.jsx";
import toast from "react-hot-toast";

export default function Tasks() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAppId, setActiveAppId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [openId, setOpenId] = useState(null);

  const fetchApps = (signal) =>
    api
      .get("/applications/my", { signal })
      .then((res) => {
        const list = (res.data.items || []).filter(
          (a) => a.status === "accepted" || a.status === "completed"
        );
        setApps((prev) => {
          if (prev.length === 0 && list[0]) setActiveAppId(list[0]._id);
          return list;
        });
        return list;
      })
      .catch(() => {});

  const fetchSubmissions = (appId, signal) =>
    api
      .get(`/tasks/submissions/my/${appId}`, { signal })
      .then((res) => {
        const map = {};
        (res.data.items || []).forEach((s) => {
          if (s.task?._id) map[s.task._id] = s;
        });
        setSubmissions((prev) => ({ ...prev, ...map }));
      })
      .catch(() => {});

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    fetchApps(controller.signal).finally(() => {
      if (!cancelled) setLoading(false);
    });
    const interval = setInterval(() => {
      fetchApps(controller.signal).then((list) => {
        const appId = activeAppId || list[0]?._id;
        if (appId) fetchSubmissions(appId, controller.signal);
      });
    }, 30000);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!activeAppId) return;
    const app = apps.find((a) => a._id === activeAppId);
    if (!app) return;
    let cancelled = false;
    const controller = new AbortController();
    api
      .get(`/tasks/internship/${app.internship._id}`, { signal: controller.signal })
      .then((res) => !cancelled && setTasks(res.data.tasks || []))
      .catch(() => !cancelled && setTasks([]));
    fetchSubmissions(activeAppId, controller.signal);
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [activeAppId, apps]);

  const handleSubmit = async (task, content) => {
    try {
      const res = await api.post(`/tasks/${task._id}/submit`, {
        submissionContent: content,
      });
      setSubmissions((s) => ({ ...s, [task._id]: res.data.submission }));
      toast.success("Submitted for review!");
      setOpenId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    }
  };

  if (loading) {
    return <div className="card p-10 flex justify-center"><Spinner /></div>;
  }

  if (apps.length === 0) {
    return (
      <EmptyState
        title="No active internship"
        description="Once you're accepted, your 5 tasks will appear here."
        action={<Link to="/internships" className="btn-primary">Browse programs</Link>}
      />
    );
  }

  const activeApp = apps.find((a) => a._id === activeAppId) || apps[0];
  const needsLinkedIn = activeApp && !activeApp.offerLetterLinkedInPost;

  const approvedCount = tasks.filter(
    (t) => submissions[t._id]?.status === "approved" || t.taskNumber <= (activeApp.totalScore || 0) / 20
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Tasks</h1>
          <p className="text-text-secondary text-sm mt-1">
            Complete 5 tasks to unlock your certificate.
          </p>
        </div>
        {apps.length > 1 && (
          <select
            className="input md:w-72"
            value={activeAppId}
            onChange={(e) => setActiveAppId(e.target.value)}
          >
            {apps.map((a) => (
              <option key={a._id} value={a._id}>
                {a.internship?.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {needsLinkedIn && (
        <Card className="border-amber-200 bg-amber-50/50">
          <p className="text-sm text-ink font-semibold">Tasks are locked</p>
          <p className="text-sm text-text-secondary mt-1">
            Post your offer letter on LinkedIn and submit the post URL on the{" "}
            <Link to="/dashboard/offer-letter" className="text-primary font-semibold underline">
              Offer Letter
            </Link>{" "}
            page first.
          </p>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-ink">
            {activeApp.internship?.title}
          </div>
          <div className="text-sm font-mono text-text-secondary">
            {Math.max(activeApp.totalScore || 0, 0)}/100 pts
          </div>
        </div>
        <ProgressBar value={activeApp.totalScore || 0} />
        <div className="mt-5 grid grid-cols-5 gap-2">
          {tasks.map((t, i) => {
            const status =
              submissions[t._id]?.status ||
              (activeApp.totalScore >= t.taskNumber * 20 ? "approved" : "locked");
            const colors = {
              approved: "bg-emerald-100 text-emerald-700",
              submitted: "bg-amber-100 text-amber-700",
              rejected: "bg-red-100 text-red-700",
              locked: "bg-surface text-muted",
            };
            return (
              <div
                key={t._id}
                className={`rounded-xl py-3 text-center text-xs font-semibold ${colors[status]}`}
              >
                <div className="text-[10px] opacity-70">Task</div>
                <div className="text-base font-display">{t.taskNumber}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="space-y-3">
        {tasks.map((t) => {
          const sub = submissions[t._id];
          const approved = (activeApp.totalScore || 0) >= t.taskNumber * 20;
          const isLocked =
            needsLinkedIn ||
            (!approved && t.taskNumber > Math.floor((activeApp.totalScore || 0) / 20) + 1);
          const isOpen = openId === t._id;
          return (
            <Card key={t._id} className="hover:shadow-card transition">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center font-semibold flex-shrink-0">
                    {t.taskNumber}
                  </div>
                  <div>
                    <div className="font-semibold text-ink flex items-center gap-2">
                      {t.title}
                      {approved && <CheckCircle2 size={16} className="text-success" />}
                      {isLocked && <Lock size={14} className="text-muted" />}
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {t.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <Badge tone="default">{t.submissionType}</Badge>
                      <Badge tone="info">{t.points} pts</Badge>
                      <span className="text-text-secondary">Due in {t.dueInDays} days</span>
                    </div>
                    {sub && (
                      <div className="mt-2 text-xs">
                        {sub.status === "approved" && (
                          <span className="text-success font-medium">✓ Approved</span>
                        )}
                        {sub.status === "rejected" && (
                          <span className="text-danger font-medium">✗ Rejected — please resubmit</span>
                        )}
                        {sub.status === "submitted" && (
                          <span className="text-amber-700 font-medium">⏳ Under review</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isLocked && !approved && (
                    <button
                      className="btn-primary"
                      onClick={() => setOpenId(isOpen ? null : t._id)}
                    >
                      {sub ? "Resubmit" : "Submit"} <ChevronRight size={14} />
                    </button>
                  )}
                  {isLocked && (
                    <span className="chip bg-surface text-text-secondary">
                      <Lock size={12} /> Locked
                    </span>
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-xs text-text-secondary mb-2">
                    <span className="font-semibold text-ink">Instructions: </span>
                    {t.instructions}
                  </div>
                  <SubmissionForm
                    submissionType={t.submissionType}
                    onCancel={() => setOpenId(null)}
                    onSubmit={(value) => handleSubmit(t, value)}
                    initial={sub?.submissionContent}
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SubmissionForm({ submissionType, onCancel, onSubmit, initial }) {
  const [value, setValue] = useState(initial || "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSubmit(value);
      }}
      className="space-y-3"
    >
      {submissionType === "text" ? (
        <Textarea
          rows={6}
          maxLength={2000}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your answer here…"
        />
      ) : (
        <input
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            submissionType === "github"
              ? "Paste your GitHub repository URL"
              : submissionType === "file"
              ? "Paste your file URL (Drive, Dropbox…)"
              : "Paste your submission URL"
          }
        />
      )}
      <div className="flex items-center gap-2">
        <button type="submit" className="btn-primary">
          <Send size={14} /> Submit
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <span className="ml-auto text-xs text-text-secondary">
          {submissionType === "text" ? `${value.length}/2000` : "URL"}
        </span>
      </div>
    </form>
  );
}
