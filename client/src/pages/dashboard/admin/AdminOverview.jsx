import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  ClipboardList,
  FileCheck,
  Award,
  ChevronRight,
  BookOpen,
  Trophy,
  ListChecks,
  BarChart3,
  TrendingUp,
  Clock,
  IndianRupee,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Activity,
} from "lucide-react";
import { api } from "../../../utils/axios.js";
import { Card, Spinner, Badge } from "../../../components/common/index.jsx";
import { listenDashboardRefresh, formatLastFetched } from "../../../utils/refreshEvents.js";
import { getSocket } from "../../../utils/useSocket.js";

const POLL_INTERVAL = 5000;

const statCards = [
  { key: "totalUsers", label: "Total Users", icon: Users, tone: "primary" },
  { key: "userRegistrations", label: "Registrations Today", icon: TrendingUp, tone: "success" },
  { key: "totalEnrollments", label: "Enrollments", icon: TrendingUp, tone: "violet" },
  { key: "totalCourses", label: "Courses", icon: BookOpen, tone: "violet" },
  { key: "totalInternships", label: "Internships", icon: GraduationCap, tone: "blue" },
  { key: "totalCertificates", label: "Certificates", icon: Award, tone: "success" },
  { key: "activeUsers", label: "Active (24h)", icon: Clock, tone: "warning" },
  { key: "pendingSubmissions", label: "Pending reviews", icon: Clock, tone: "danger" },
];

const toneStyles = {
  primary: "bg-primary-light text-primary",
  violet: "bg-violet-50 text-violet-700",
  blue: "bg-blue-50 text-blue-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  success: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
};

const quickLinks = [
  {
    to: "/dashboard/admin/courses",
    title: "Manage courses",
    desc: "Create and edit training programs, modules, and lessons.",
    icon: BookOpen,
  },
  {
    to: "/dashboard/admin/exams",
    title: "Manage exams",
    desc: "Build 100-question MCQ exams and add questions in bulk.",
    icon: Trophy,
  },
  {
    to: "/dashboard/admin/assignments",
    title: "Review assignments",
    desc: "Grade student assignment submissions and provide feedback.",
    icon: ListChecks,
  },
  {
    to: "/dashboard/admin/programs",
    title: "Manage internships",
    desc: "Create internship programs with 5 mentor-reviewed tasks.",
    icon: GraduationCap,
  },
  {
    to: "/dashboard/admin/payment-approvals",
    title: "Payment approvals",
    desc: "Review and approve certificate payment requests from students.",
    icon: IndianRupee,
  },
  {
    to: "/dashboard/admin/analytics",
    title: "View analytics",
    desc: "Top courses, score distribution, and recent results.",
    icon: BarChart3,
  },
];

function formatTime(isoString) {
  return formatLastFetched(isoString);
}

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [paymentStats, setPaymentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState(null);
  const intervalRef = useRef(null);

  const loadDashboard = useCallback(async () => {
    console.log("[AdminOverview] ===== FETCHING DASHBOARD DATA =====");
    console.log("[AdminOverview] Timestamp:", new Date().toISOString());
    try {
      const [s, p] = await Promise.all([
        api.get("/admin/dashboard/stats").catch((err) => {
          console.error("[AdminOverview] Stats fetch failed:", err.message);
          return { data: {} };
        }),
        api.get("/payments/admin/stats").catch((err) => {
          console.error("[AdminOverview] Payment stats fetch failed:", err.message);
          return { data: {} };
        }),
      ]);
      console.log("[AdminOverview] Dashboard stats response:", s.data);
      console.log("[AdminOverview] Payment stats response:", p.data);
      setStats(s.data);
      setPaymentStats(p.data);
      const now = new Date().toISOString();
      setLastFetched(now);
      console.log("[AdminOverview] Updated at:", now);
    } catch (err) {
      console.error("[AdminOverview] Load error:", err.message);
    } finally {
      setLoading(false);
      console.log("[AdminOverview] ===== FETCH COMPLETE =====");
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    intervalRef.current = setInterval(loadDashboard, POLL_INTERVAL);
    console.log("[AdminOverview] Polling started, interval:", POLL_INTERVAL + "ms");

    const socket = getSocket();
    const socketEvents = [
      "user_registered", "user_updated", "user_deleted",
      "payment_approved", "certificate_generated",
      "submission_uploaded", "submission_approved",
      "course_created", "course_updated", "course_completed",
      "internship_assigned", "internship_completed",
      "quiz_submitted", "quiz_evaluated",
    ];
    const handlers = {};
    for (const evt of socketEvents) {
      const handler = (payload) => {
        console.log("[AdminOverview] Socket event:", evt, payload);
        loadDashboard();
      };
      socket.on(evt, handler);
      handlers[evt] = handler;
    }

    const unlisten = listenDashboardRefresh((detail) => {
      console.log("[AdminOverview] Immediate refresh triggered by:", detail.source);
      loadDashboard();
    });

    return () => {
      console.log("[AdminOverview] Cleaning up interval + listeners");
      clearInterval(intervalRef.current);
      for (const [evt, handler] of Object.entries(handlers)) {
        socket.off(evt, handler);
      }
      unlisten();
    };
  }, [loadDashboard]);

  if (loading) {
    return (
      <Card className="flex justify-center py-16">
        <Spinner />
      </Card>
    );
  }

  const completionRate = stats?.completionRate ?? 0;

  return (
    <div className="space-y-6">
      {/* Last fetched timestamp */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary flex items-center gap-1.5">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Updated at{" "}
          <span className="font-mono font-medium text-ink">
            {formatTime(lastFetched)}
          </span>
          {stats?.fetchedAt && (
            <span className="text-muted">(server: {formatTime(stats.fetchedAt)})</span>
          )}
        </p>
        <button
          type="button"
          className="btn-ghost text-xs"
          onClick={loadDashboard}
          disabled={loading}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(({ key, label, icon: Icon, tone }) => (
          <Card key={key} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary font-medium">{label}</span>
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${toneStyles[tone]}`}
              >
                <Icon size={16} />
              </div>
            </div>
            <div className="text-2xl font-display font-bold text-ink mt-2">
              {stats?.[key] ?? 0}
            </div>
          </Card>
        ))}
      </div>

      {/* Completion rate card */}
      <Card className="p-5 border-primary/20">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary font-medium">Completion Rate</span>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary-light text-primary">
            <Activity size={16} />
          </div>
        </div>
        <div className="text-2xl font-display font-bold text-ink mt-2">{completionRate}%</div>
        <div className="mt-3 w-full bg-border rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
            style={{ width: `${Math.min(completionRate, 100)}%` }}
          />
        </div>
      </Card>

      {/* Payment stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5 border-amber-200/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Pending payments</span>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50 text-amber-700">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-ink mt-2">{paymentStats?.pending ?? 0}</div>
        </Card>
        <Card className="p-5 border-emerald-200/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Approved payments</span>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-ink mt-2">{paymentStats?.approved ?? 0}</div>
        </Card>
        <Card className="p-5 border-red-200/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Rejected payments</span>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-50 text-red-700">
              <XCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-ink mt-2">{paymentStats?.rejected ?? 0}</div>
        </Card>
        <Card className="p-5 border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Certificate revenue</span>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary-light text-primary">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-ink mt-2">₹{paymentStats?.totalRevenue ?? 0}</div>
        </Card>
      </div>

      {/* Recent activities */}
      {stats?.recentActivities && stats.recentActivities.length > 0 && (
        <Card>
          <h2 className="text-lg font-display font-semibold text-ink mb-4 flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            Recent Activity
          </h2>
          <div className="space-y-2">
            {stats.recentActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3 py-2 border-b border-border last:border-0"
              >
                <Badge tone={act.type === "system" ? "primary" : act.type === "task" ? "warning" : "success"}>
                  {act.type}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{act.title}</p>
                  <p className="text-xs text-text-secondary truncate">{act.body}</p>
                </div>
                <span className="text-xs text-muted shrink-0">{formatTime(act.createdAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <Card>
        <h2 className="text-lg font-display font-semibold text-ink mb-4">Quick actions</h2>
        <ul className="divide-y divide-border">
          {quickLinks.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex items-center justify-between gap-4 py-4 group hover:bg-surface/80 -mx-2 px-2 rounded-xl transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
                    <item.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-ink group-hover:text-primary transition">
                      {item.title}
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-muted shrink-0 group-hover:text-primary transition"
                />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
