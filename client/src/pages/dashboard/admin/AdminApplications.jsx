import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, RefreshCw, XCircle, ExternalLink } from "lucide-react";
import { api } from "../../../utils/axios.js";
import { formatLastFetched, listenDashboardRefresh } from "../../../utils/refreshEvents.js";
import { getSocket } from "../../../utils/useSocket.js";
import {
  Badge,
  Card,
  EmptyState,
  Select,
  Spinner,
  Textarea,
} from "../../../components/common/index.jsx";
import toast from "react-hot-toast";

const POLL_INTERVAL = 5000;

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
];

const statusTone = {
  pending: "warning",
  accepted: "primary",
  rejected: "danger",
  completed: "success",
};

export default function AdminApplications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [feedback, setFeedback] = useState({});
  const [busy, setBusy] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const intervalRef = useRef(null);

  const load = useCallback(() => {
    console.log("[AdminApplications] Fetching applications...");
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    api
      .get(`/applications${qs}`)
      .then((res) => {
        setItems(res.data.items || []);
        setLastFetched(new Date().toISOString());
        console.log("[AdminApplications] Loaded", res.data.items?.length, "applications");
      })
      .catch(() => toast.error("Could not load applications"))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    const socket = getSocket();
    const handlers = {};
    for (const evt of ["internship_assigned", "internship_completed", "user_registered"]) {
      const handler = (p) => { console.log("[AdminApplications] Socket:", evt, p); load(); };
      socket.on(evt, handler);
      handlers[evt] = handler;
    }
    const unlisten = listenDashboardRefresh(() => load());
    return () => {
      clearInterval(intervalRef.current);
      for (const [evt, h] of Object.entries(handlers)) socket.off(evt, h);
      unlisten();
    };
  }, [load]);

  const updateStatus = async (id, status) => {
    setBusy(id + status);
    try {
      await api.put(`/applications/${id}/status`, {
        status,
        feedback: feedback[id] || "",
      });
      toast.success(`Application ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-secondary flex items-center gap-1.5">
        <RefreshCw size={12} />
        Updated: <span className="font-mono font-medium text-ink">{formatLastFetched(lastFetched)}</span>
      </p>
      <div className="flex flex-wrap items-end gap-4">
        <Select
          label="Filter by status"
          className="max-w-xs"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          options={statusOptions}
        />
        <p className="text-sm text-text-secondary pb-2">
          {items.length} application{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      {loading ? (
        <Card className="flex justify-center py-16">
          <Spinner />
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          title="No applications"
          description="Applications matching this filter will appear here."
        />
      ) : (
        <div className="space-y-4">
          {items.map((app) => (
            <Card key={app._id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink">{app.student?.fullName}</h3>
                    <Badge tone={statusTone[app.status] || "default"}>{app.status}</Badge>
                  </div>
                  <p className="text-sm text-text-secondary">{app.student?.email}</p>
                  {app.student?.college && (
                    <p className="text-xs text-muted mt-0.5">{app.student.college}</p>
                  )}
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium text-ink">{app.internship?.title}</div>
                  <div className="text-text-secondary text-xs">
                    {app.internship?.domain} · {app.internship?.duration}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    Applied {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {app.motivation && (
                <div className="mt-4 p-3 rounded-xl bg-surface border border-border text-sm">
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                    Motivation
                  </div>
                  <p className="text-ink whitespace-pre-wrap">{app.motivation}</p>
                </div>
              )}

              {app.relevantExperience && (
                <div className="mt-3 p-3 rounded-xl bg-surface border border-border text-sm">
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                    Experience
                  </div>
                  <p className="text-ink whitespace-pre-wrap">{app.relevantExperience}</p>
                </div>
              )}

              {app.projectsHighlight && (
                <div className="mt-3 p-3 rounded-xl bg-surface border border-border text-sm">
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                    Projects
                  </div>
                  <p className="text-ink whitespace-pre-wrap">{app.projectsHighlight}</p>
                </div>
              )}

              {(app.skills?.length > 0 || app.availability) && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {app.skills?.map((s) => (
                    <span key={s} className="chip bg-primary-light text-primary">
                      {s}
                    </span>
                  ))}
                  {app.availability && (
                    <span className="chip bg-surface text-text-secondary">
                      Available: {app.availability}
                    </span>
                  )}
                  {app.hoursPerWeek && (
                    <span className="chip bg-surface text-text-secondary">
                      {app.hoursPerWeek}/week
                    </span>
                  )}
                  {app.expectedStart && (
                    <span className="chip bg-surface text-text-secondary">
                      Start: {app.expectedStart}
                    </span>
                  )}
                </div>
              )}

              {(app.linkedInUrl || app.githubUrl) && (
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {app.linkedInUrl && (
                    <a
                      href={app.linkedInUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary font-semibold hover:underline"
                    >
                      LinkedIn <ExternalLink size={12} className="inline" />
                    </a>
                  )}
                  {app.githubUrl && (
                    <a
                      href={app.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary font-semibold hover:underline"
                    >
                      GitHub <ExternalLink size={12} className="inline" />
                    </a>
                  )}
                </div>
              )}

              {app.offerLetterLinkedInPost && (
                <a
                  href={app.offerLetterLinkedInPost}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary font-semibold mt-3 hover:underline"
                >
                  LinkedIn offer post <ExternalLink size={14} />
                </a>
              )}

              {app.totalScore > 0 && (
                <p className="text-xs text-text-secondary mt-2">
                  Task score: {app.totalScore}/100
                </p>
              )}

              {app.status === "pending" && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <Textarea
                    label="Feedback (optional, emailed to student)"
                    value={feedback[app._id] || ""}
                    onChange={(e) =>
                      setFeedback((f) => ({ ...f, [app._id]: e.target.value }))
                    }
                    rows={2}
                    placeholder="Welcome to the program…"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-primary text-sm"
                      disabled={!!busy}
                      onClick={() => updateStatus(app._id, "accepted")}
                    >
                      <CheckCircle2 size={14} />
                      {busy === app._id + "accepted" ? "Accepting…" : "Accept"}
                    </button>
                    <button
                      type="button"
                      className="btn-danger text-sm"
                      disabled={!!busy}
                      onClick={() => updateStatus(app._id, "rejected")}
                    >
                      <XCircle size={14} />
                      {busy === app._id + "rejected" ? "Rejecting…" : "Reject"}
                    </button>
                  </div>
                </div>
              )}

              {app.status === "accepted" && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary text-sm"
                    disabled={!!busy}
                    onClick={() => updateStatus(app._id, "completed")}
                  >
                    Mark completed
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-sm text-danger"
                    disabled={!!busy}
                    onClick={() => updateStatus(app._id, "rejected")}
                  >
                    Revoke
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
