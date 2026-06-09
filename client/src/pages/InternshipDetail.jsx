import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  Briefcase,
  CheckCircle2,
  Clock,
  IndianRupee,
  Loader2,
} from "lucide-react";
import { api } from "../utils/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Badge, Card, Input, Spinner, Textarea } from "../components/common/index.jsx";
import toast from "react-hot-toast";

export default function InternshipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [existingApp, setExistingApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    motivation: "",
    availability: "Immediate",
    relevantExperience: "",
    projectsHighlight: "",
    skillsText: "",
    linkedInUrl: "",
    githubUrl: "",
    hoursPerWeek: "10–15 hours",
    expectedStart: "Immediate",
  });

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      linkedInUrl: f.linkedInUrl || user.linkedinProfile || "",
      githubUrl: f.githubUrl || user.githubUrl || "",
      skillsText: f.skillsText || (user.skills || []).join(", "),
    }));
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setItem(null);

    api
      .get(`/internships/${id}`)
      .then((res) => {
        if (!cancelled) setItem(res.data.item);
      })
      .catch(() => {
        if (!cancelled) setItem(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!user) {
      setExistingApp(null);
      return;
    }
    let cancelled = false;
    api
      .get("/applications/my")
      .then((res) => {
        if (cancelled) return;
        const match = (res.data.items || []).find((a) => {
          const internshipId = a.internship?._id || a.internship;
          return String(internshipId) === String(id);
        });
        setExistingApp(match || null);
      })
      .catch(() => {
        if (!cancelled) setExistingApp(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/internships/${id}` } } });
      return;
    }
    if (!form.motivation.trim()) {
      toast.error("Please tell us why you want to apply");
      return;
    }
    if (!form.relevantExperience.trim()) {
      toast.error("Please describe your relevant experience");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/applications", {
        internshipId: id,
        motivation: form.motivation.trim(),
        availability: form.availability,
        relevantExperience: form.relevantExperience.trim(),
        projectsHighlight: form.projectsHighlight.trim(),
        skills: form.skillsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        linkedInUrl: form.linkedInUrl.trim(),
        githubUrl: form.githubUrl.trim(),
        hoursPerWeek: form.hoursPerWeek,
        expectedStart: form.expectedStart,
      });
      toast.success("Application submitted! Check Notifications for updates.");
      navigate("/dashboard/notifications");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to apply";
      if (err.response?.status === 409) {
        const appsRes = await api.get("/applications/my").catch(() => null);
        const match = appsRes?.data?.items?.find((a) => {
          const internshipId = a.internship?._id || a.internship;
          return String(internshipId) === String(id);
        });
        if (match) setExistingApp(match);
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-16 flex justify-center">
        <Spinner />
      </div>
    );
  }
  if (!item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-display font-bold">Internship not found</h1>
        <Link to="/internships" className="btn-secondary mt-4">Back to internships</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
      <Link to="/internships" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-ink mb-5">
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge tone="primary">{item.domain}</Badge>
              <Badge tone="default">
                <Clock size={12} /> {item.duration}
              </Badge>
              <Badge tone="info">
                <IndianRupee size={12} /> {item.stipend}
              </Badge>
            </div>
            <h1 className="text-3xl font-display font-bold text-ink">{item.title}</h1>
            <p className="text-text-secondary mt-3 leading-relaxed">{item.description}</p>
          </div>

          <Card>
            <h2 className="text-lg font-semibold text-ink mb-3">Skills you'll use</h2>
            <div className="flex flex-wrap gap-2">
              {(item.skills || []).map((s) => (
                <span
                  key={s}
                  className="chip bg-primary-light text-primary"
                >
                  {s}
                </span>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-ink mb-3">5 hands-on tasks</h2>
            <ol className="space-y-3">
              {(item.tasks || []).map((t) => (
                <li key={t.taskNumber} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {t.taskNumber}
                  </div>
                  <div>
                    <div className="font-medium text-ink">{t.title}</div>
                    <div className="text-sm text-text-secondary">{t.description}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <Card>
            <h3 className="text-lg font-display font-bold text-ink flex items-center gap-2">
              <Briefcase size={18} className="text-primary" />
              Apply for this internship
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              Takes ~2 minutes. We'll review within 48 hours.
            </p>

            {!user ? (
              <Link
                to="/login"
                state={{ from: { pathname: `/internships/${id}` } }}
                className="btn-primary w-full mt-4"
              >
                Sign in to apply
              </Link>
            ) : existingApp ? (
              <div className="mt-4 rounded-xl bg-primary-light border border-primary/20 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-ink">You&apos;ve already applied</p>
                    <p className="text-sm text-text-secondary mt-1">
                      Status:{" "}
                      <span className="font-medium capitalize text-ink">
                        {existingApp.status || "pending"}
                      </span>
                    </p>
                  </div>
                </div>
                <Link
                  to={
                    existingApp.status === "accepted" || existingApp.status === "completed"
                      ? "/dashboard/tasks"
                      : "/dashboard/my-internships"
                  }
                  className="btn-primary w-full mt-4"
                >
                  {existingApp.status === "accepted" || existingApp.status === "completed"
                    ? "Go to tasks"
                    : "View my application"}
                </Link>
              </div>
            ) : (
              <form className="mt-4 space-y-3 max-h-[70vh] overflow-y-auto pr-1" onSubmit={handleApply}>
                <Textarea
                  label="Why do you want to apply? *"
                  placeholder="Your motivation for this program…"
                  value={form.motivation}
                  onChange={(e) => setForm((f) => ({ ...f, motivation: e.target.value }))}
                  rows={3}
                />
                <Textarea
                  label="Relevant experience *"
                  placeholder="Courses, projects, internships, or work experience…"
                  value={form.relevantExperience}
                  onChange={(e) => setForm((f) => ({ ...f, relevantExperience: e.target.value }))}
                  rows={2}
                />
                <Textarea
                  label="Key projects (optional)"
                  placeholder="Links or short descriptions of your best work…"
                  value={form.projectsHighlight}
                  onChange={(e) => setForm((f) => ({ ...f, projectsHighlight: e.target.value }))}
                  rows={2}
                />
                <Input
                  label="Skills (comma-separated)"
                  placeholder="React, Node.js, UI/UX…"
                  value={form.skillsText}
                  onChange={(e) => setForm((f) => ({ ...f, skillsText: e.target.value }))}
                />
                <Input
                  label="LinkedIn profile URL"
                  placeholder="https://linkedin.com/in/…"
                  value={form.linkedInUrl}
                  onChange={(e) => setForm((f) => ({ ...f, linkedInUrl: e.target.value }))}
                />
                <Input
                  label="GitHub URL (optional)"
                  value={form.githubUrl}
                  onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Hours per week</label>
                    <select
                      className="input"
                      value={form.hoursPerWeek}
                      onChange={(e) => setForm((f) => ({ ...f, hoursPerWeek: e.target.value }))}
                    >
                      <option>5–10 hours</option>
                      <option>10–15 hours</option>
                      <option>15–20 hours</option>
                      <option>20+ hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Expected start</label>
                    <select
                      className="input"
                      value={form.expectedStart}
                      onChange={(e) => setForm((f) => ({ ...f, expectedStart: e.target.value }))}
                    >
                      <option>Immediate</option>
                      <option>Within 2 weeks</option>
                      <option>Within a month</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">General availability</label>
                  <select
                    className="input"
                    value={form.availability}
                    onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}
                  >
                    <option>Immediate</option>
                    <option>Within 2 weeks</option>
                    <option>Within a month</option>
                  </select>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full sticky bottom-0">
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  Submit application
                </button>
                <p className="text-xs text-text-secondary text-center">
                  By applying you agree to our terms.
                </p>
              </form>
            )}

            <div className="mt-5 pt-5 border-t border-border space-y-2 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Award size={14} className="text-primary" /> Verifiable certificate
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <CheckCircle2 size={14} className="text-primary" /> Mentor review
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
