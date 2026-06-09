import { useEffect, useState } from "react";
import { Users, Layers, TrendingUp, Star } from "lucide-react";
import { api } from "../../utils/axios.js";

const defaults = {
  internsOnline: 0,
  totalInterns: 0,
  domainsLabel: "3+",
  completionRate: 99,
  studentRating: 4.7,
};

export default function PlatformStats({ variant = "light", className = "" }) {
  const [stats, setStats] = useState(defaults);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      api
        .get("/stats/public")
        .then((res) => {
          if (!cancelled) {
            setStats({ ...defaults, ...res.data });
            setLive(true);
          }
        })
        .catch(() => {
          if (!cancelled) setStats(defaults);
        });
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const isDark = variant === "dark";

  const items = [
    {
      icon: Users,
      value: live ? String(stats.internsOnline) : "—",
      label: "Interns online now",
      hint: stats.totalInterns > 0 ? `${stats.totalInterns} registered` : "Live logins",
      pulse: true,
    },
    {
      icon: Layers,
      value: stats.domainsLabel || "3+",
      label: "Domains",
      hint: "Active programs",
    },
    {
      icon: TrendingUp,
      value: `${stats.completionRate}%`,
      label: "Completion rate",
      hint: "Program finishers",
    },
    {
      icon: Star,
      value: String(stats.studentRating),
      label: "Student rating",
      hint: "Out of 5",
    },
  ];

  return (
    <div
      className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${className}`}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={
            isDark
              ? "rounded-2xl border border-white/20 bg-white/10 p-4 sm:p-5 backdrop-blur-sm"
              : "glass-stat p-4 sm:p-5"
          }
        >
          <div className="flex items-center gap-2 mb-2">
            <item.icon
              size={16}
              className={isDark ? "text-purple-200" : "text-primary shrink-0"}
            />
            {item.pulse && live && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </div>
          <div
            className={`text-2xl sm:text-3xl font-display font-bold break-words ${
              isDark ? "text-white" : "text-ink"
            }`}
          >
            {item.value}
            {item.label === "Student rating" && (
              <span className="text-lg text-amber-400">★</span>
            )}
          </div>
          <div
            className={`text-xs sm:text-sm font-semibold mt-0.5 ${
              isDark ? "text-white" : "text-ink"
            }`}
          >
            {item.label}
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? "text-slate-300" : "text-text-secondary"}`}>
            {item.hint}
          </div>
        </div>
      ))}
    </div>
  );
}
