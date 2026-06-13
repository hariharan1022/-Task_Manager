import { useCallback, useEffect, useRef, useState } from "react";
import {
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Trophy,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../../../utils/axios.js";
import { Card, Spinner, Badge } from "../../../components/common/index.jsx";
import { listenDashboardRefresh } from "../../../utils/refreshEvents.js";
import { toast } from "react-hot-toast";

const POLL_INTERVAL = 10000;

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            {label}
          </div>
          <div className="mt-2 text-3xl font-display font-extrabold text-ink">
            {value}
          </div>
        </div>
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center ${color} text-white shadow-md`}
        >
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
}

function formatTime(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [dashStats, setDashStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState(null);
  const intervalRef = useRef(null);

  const loadAnalytics = useCallback(async () => {
    console.log("[AdminAnalytics] ===== FETCHING ANALYTICS =====");
    console.log("[AdminAnalytics] Timestamp:", new Date().toISOString());
    try {
      const [a, s] = await Promise.all([
        api.get("/admin/analytics").catch((err) => {
          console.error("[AdminAnalytics] Analytics fetch failed:", err.message);
          return { data: null };
        }),
        api.get("/admin/dashboard/stats").catch((err) => {
          console.error("[AdminAnalytics] Dashboard stats fetch failed:", err.message);
          return { data: null };
        }),
      ]);
      console.log("[AdminAnalytics] Analytics response:", a.data);
      console.log("[AdminAnalytics] Dashboard stats response:", s.data);
      setData(a.data);
      setDashStats(s.data);
      setLastFetched(new Date().toISOString());
    } catch (err) {
      console.error("[AdminAnalytics] Load error:", err.message);
      toast.error(err.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
      console.log("[AdminAnalytics] ===== FETCH COMPLETE =====");
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
    intervalRef.current = setInterval(loadAnalytics, POLL_INTERVAL);
    console.log("[AdminAnalytics] Polling started, interval:", POLL_INTERVAL + "ms");
    const unlisten = listenDashboardRefresh((detail) => {
      console.log("[AdminAnalytics] Immediate refresh triggered by:", detail.source);
      loadAnalytics();
    });
    return () => {
      console.log("[AdminAnalytics] Cleaning up interval + listener");
      clearInterval(intervalRef.current);
      unlisten();
    };
  }, [loadAnalytics]);

  if (loading)
    return (
      <div className="py-16 flex justify-center">
        <Spinner size={32} />
      </div>
    );

  const distribution = data?.scoreDistribution || [];
  const maxBucket = Math.max(...distribution.map((b) => b.count || 0), 1);
  const buckets = [
    { label: "0-49 (Fail)", color: "bg-red-400", range: [0, 50] },
    { label: "50-59 (C)", color: "bg-amber-400", range: [50, 60] },
    { label: "60-69 (B)", color: "bg-yellow-400", range: [60, 70] },
    { label: "70-79 (B+)", color: "bg-lime-400", range: [70, 80] },
    { label: "80-89 (A)", color: "bg-emerald-400", range: [80, 90] },
    { label: "90-100 (A+)", color: "bg-emerald-600", range: [90, 101] },
  ];
  const getBucketCount = (range) =>
    distribution
      .filter((b) => b._id >= range[0] && b._id < range[1])
      .reduce((s, b) => s + (b.count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">
            Analytics
          </h1>
          <p className="mt-1 text-text-secondary text-sm">
            Performance and engagement insights across the platform.
          </p>
        </div>
        <p className="text-xs text-text-secondary flex items-center gap-1.5">
          <RefreshCw size={12} />
          Updated at{" "}
          <span className="font-mono font-medium text-ink">
            {formatTime(lastFetched)}
          </span>
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={dashStats?.totalUsers ?? 0}
          icon={Users}
          color="bg-gradient-to-br from-purple-500 to-pink-500"
        />
        <StatCard
          label="Courses"
          value={dashStats?.totalCourses ?? 0}
          icon={BookOpen}
          color="bg-gradient-to-br from-blue-500 to-cyan-500"
        />
        <StatCard
          label="Enrollments"
          value={dashStats?.totalEnrollments ?? 0}
          icon={TrendingUp}
          color="bg-gradient-to-br from-emerald-500 to-teal-500"
        />
        <StatCard
          label="Completed"
          value={dashStats?.completionRate ?? 0}
          icon={Award}
          color="bg-gradient-to-br from-amber-500 to-orange-500"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="font-bold text-ink flex items-center gap-2 text-base">
            <BarChart3 size={18} className="text-primary" /> Top courses by enrollment
          </h3>
          <div className="mt-4 space-y-3">
            {data?.topCourses?.length ? (
              data.topCourses.map((c) => (
                <div key={c._id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
                    <BookOpen size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink text-sm truncate">
                      {c.title}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {c.category} · {c.enrolledCount || 0} enrolled
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary">No data yet</p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-ink flex items-center gap-2 text-base">
            <Trophy size={18} className="text-amber-500" /> Score distribution
          </h3>
          <div className="mt-4 space-y-2.5">
            {buckets.map((b) => {
              const count = getBucketCount(b.range);
              const pct = maxBucket > 0 ? (count / maxBucket) * 100 : 0;
              return (
                <div key={b.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary font-medium">
                      {b.label}
                    </span>
                    <span className="font-bold text-ink">{count}</span>
                  </div>
                  <div className="mt-1 h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full ${b.color} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-ink flex items-center gap-2 text-base">
          <Clock size={18} className="text-primary" /> Recent results
        </h3>
        {data?.recentResults?.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border/80">
                  <th className="py-2">Student</th>
                  <th className="py-2">Course</th>
                  <th className="py-2">Score</th>
                  <th className="py-2">Grade</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentResults.map((r) => (
                  <tr key={r._id} className="border-b border-border/60">
                    <td className="py-2.5">{r.user?.fullName || "—"}</td>
                    <td className="py-2.5 text-text-secondary">
                      {r.course?.title || "—"}
                    </td>
                    <td className="py-2.5 font-bold">
                      {r.totalScore}
                      <span className="text-text-muted text-xs font-medium"> / 100</span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          r.grade === "Fail"
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {r.grade}
                      </span>
                    </td>
                    <td className="py-2.5">
                      {r.status === "passed" ? (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      ) : (
                        <XCircle size={14} className="text-red-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-text-secondary mt-3">No results yet</p>
        )}
      </div>
    </div>
  );
}
