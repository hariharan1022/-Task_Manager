import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  Briefcase,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Trophy,
  Sparkles,
  PlayCircle,
  TrendingUp,
  IndianRupee,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { Shield } from "lucide-react";
import { api } from "../../utils/axios.js";
import { Badge, Card, ProgressBar, Spinner } from "../../components/common/index.jsx";

const toneStyles = {
  primary: { bg: "bg-primary-light", text: "text-primary" },
  warning: { bg: "bg-amber-50", text: "text-amber-700" },
  success: { bg: "bg-emerald-50", text: "text-emerald-700" },
  violet: { bg: "bg-violet-50", text: "text-violet-700" },
  blue: { bg: "bg-blue-50", text: "text-blue-700" },
};

const statusTone = {
  pending: "warning",
  accepted: "primary",
  rejected: "danger",
  completed: "success",
};

export default function Overview() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [apps, setApps] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get("/applications/my").catch(() => ({ data: { items: [] } })),
      api.get("/courses/my").catch(() => ({ data: { items: [] } })),
      api.get("/payments/my").catch(() => ({ data: { items: [] } })),
    ])
      .then(([a, e, p]) => {
        if (cancelled) return;
        setApps(a.data.items || []);
        setEnrollments(e.data.items || []);
        setPayments(p.data.items || []);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (apps.length) {
      setScore(Math.max(...apps.map((a) => a.totalScore || 0)));
    }
  }, [apps]);

  const current = apps.find((a) => a.status === "accepted") || apps[0];
  const activeCourses = enrollments.filter((e) => e.status === "active");
  const completedCourses = enrollments.filter((e) => e.result?.status === "passed");

  const stats = [
    { label: "Active courses", value: activeCourses.length, icon: BookOpen, tone: "primary" },
    { label: "Internships", value: apps.length, icon: Briefcase, tone: "blue" },
    { label: "Certificates", value: completedCourses.length, icon: Award, tone: "success" },
    { label: "Avg score", value: completedCourses.length ? `${Math.round(completedCourses.reduce((s, c) => s + (c.result?.totalScore || 0), 0) / completedCourses.length)}/100` : "—", icon: Trophy, tone: "violet" },
  ];

  return (
    <div className="space-y-6">
      {isAdmin && (
        <Link
          to="/dashboard/admin"
          className="card p-4 flex items-center justify-between gap-3 border-primary/30 bg-gradient-soft hover:border-primary transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <div className="font-semibold text-ink">Admin panel</div>
              <p className="text-sm text-text-secondary">
                Manage programs, courses, exams, and verify student submissions.
              </p>
            </div>
          </div>
          <ChevronRight className="text-primary shrink-0" size={20} />
        </Link>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">
            Welcome back, {user?.fullName?.split(" ")[0]} 👋
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Continue learning and building your career.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/courses" className="btn-primary self-start sm:self-auto">
            <BookOpen size={16} /> Browse courses
          </Link>
        </div>
      </div>

      {payments.filter((p) => p.status !== "approved").length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-display font-semibold text-ink">Certificate Payment</h2>
          {payments.filter((p) => p.status !== "approved").map((p) => (
            <Card key={p._id} className={`p-4 border ${
              p.status === "pending" ? "border-amber-200" : "border-red-200"
            }`}>
              <div className="flex items-center gap-3">
                {p.status === "pending" ? (
                  <Clock size={20} className="text-amber-600 shrink-0" />
                ) : (
                  <XCircle size={20} className="text-red-600 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-ink">
                    {p.status === "pending" ? "Payment pending approval" : "Payment rejected"}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {p.programName} · ₹{p.amount}
                  </p>
                  {p.status === "rejected" && p.rejectionReason && (
                    <p className="text-sm text-red-600 mt-0.5">Reason: {p.rejectionReason}</p>
                  )}
                </div>
                <Link to="/dashboard/certificate" className="btn-ghost text-sm shrink-0">
                  View
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-5">
                <div className="skeleton h-4 w-24 mb-3" />
                <div className="skeleton h-7 w-16" />
              </div>
            ))
          : stats.map((s) => {
              const tone = toneStyles[s.tone] || toneStyles.primary;
              return (
                <div key={s.label} className="card p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-text-secondary">{s.label}</div>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tone.bg} ${tone.text}`}>
                      <s.icon size={16} />
                    </div>
                  </div>
                  <div className="text-2xl font-display font-bold text-ink mt-2">
                    {s.value}
                  </div>
                </div>
              );
            })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-ink">
              Continue learning
            </h2>
            <Link
              to="/dashboard/my-courses"
              className="text-sm font-semibold text-primary inline-flex items-center gap-1"
            >
              All courses <ChevronRight size={14} />
            </Link>
          </div>

          {activeCourses.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center mx-auto mb-3">
                <Sparkles size={22} />
              </div>
              <h3 className="font-semibold text-ink">No active courses</h3>
              <p className="text-sm text-text-secondary mt-1">
                Enroll in a course to start your learning journey.
              </p>
              <Link to="/courses" className="btn-primary mt-4">
                Explore courses
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCourses.slice(0, 3).map((e) => (
                <Link
                  key={e._id}
                  to={`/dashboard/courses/${e.course._id}/learn`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/80 hover:border-primary/30 hover:bg-primary-light/30 transition group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-brand text-white flex items-center justify-center flex-shrink-0">
                    <PlayCircle size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink text-sm truncate">
                      {e.course.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-brand"
                          style={{ width: `${e.progress || 0}%` }}
                        />
                      </div>
                      <span className="font-bold text-ink">{e.progress || 0}%</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-display font-semibold text-ink mb-4">
            Current internship
          </h2>
          {!current ? (
            <div className="text-center py-6">
              <Briefcase size={28} className="text-muted mx-auto" />
              <p className="text-sm text-text-secondary mt-2">No active internship</p>
              <Link to="/internships" className="btn-secondary h-9 text-xs mt-3">
                Browse internships
              </Link>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-semibold text-ink truncate">
                    {current.internship?.title}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {current.internship?.domain}
                  </div>
                </div>
                <Badge tone={statusTone[current.status] || "default"}>
                  {current.status}
                </Badge>
              </div>
              <div className="mt-4">
                <ProgressBar value={current.totalScore || 0} />
                <div className="mt-1.5 text-xs text-text-secondary font-medium">
                  {current.totalScore || 0}/100
                </div>
              </div>
              <Link
                to="/dashboard/tasks"
                className="btn-secondary h-9 text-xs mt-4 w-full justify-center"
              >
                View tasks
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
