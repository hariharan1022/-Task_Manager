import { NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard,
  GraduationCap,
  ClipboardCheck,
  FileCheck,
  BookOpen,
  ListChecks,
  Trophy,
  BarChart3,
  IndianRupee,
} from "lucide-react";

const tabs = [
  { to: "/dashboard/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/admin/courses", label: "Courses", icon: BookOpen },
  { to: "/dashboard/admin/exams", label: "Exams", icon: Trophy },
  { to: "/dashboard/admin/assignments", label: "Assignments", icon: ListChecks },
  { to: "/dashboard/admin/programs", label: "Internships", icon: GraduationCap },
  { to: "/dashboard/admin/applications", label: "Applications", icon: ClipboardCheck },
  { to: "/dashboard/admin/submissions", label: "Submissions", icon: FileCheck },
  { to: "/dashboard/admin/payment-approvals", label: "Payments", icon: IndianRupee },
  { to: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminShell() {
  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
          Admin panel
        </div>
        <h1 className="text-2xl font-display font-bold text-ink">Manage SKYROVIX</h1>
        <p className="text-text-secondary text-sm mt-1 max-w-2xl">
          Manage training programs, courses, exams, internships, students, and
          view real-time analytics.
        </p>
      </div>

      <nav className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                "inline-flex items-center gap-2 shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition border",
                isActive
                  ? "bg-gradient-brand text-white border-transparent shadow-glow"
                  : "bg-white text-text-secondary border-border hover:border-primary hover:text-primary"
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
