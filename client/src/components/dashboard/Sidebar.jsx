import { Link, NavLink } from "react-router-dom";
import { assetUrl } from "../../utils/paths.js";
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  FileText,
  Award,
  User as UserIcon,
  IdCard,
  Share2,
  Truck,
  Trophy,
  Bell,
  Settings,
  HelpCircle,
  Shield,
  GraduationCap,
  ClipboardCheck,
  FileCheck,
  BookOpen,
  Video,
  BarChart3,
  ListChecks,
  Briefcase,
} from "lucide-react";
import clsx from "clsx";
import UserMenu from "../common/UserMenu.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const adminLinks = [
  { to: "/dashboard/admin", label: "Admin overview", icon: Shield, end: true },
  { to: "/dashboard/admin/courses", label: "Courses", icon: BookOpen },
  { to: "/dashboard/admin/exams", label: "Exams", icon: Trophy },
  { to: "/dashboard/admin/assignments", label: "Assignments", icon: ListChecks },
  { to: "/dashboard/admin/programs", label: "Internships", icon: GraduationCap },
  { to: "/dashboard/admin/applications", label: "Applications", icon: ClipboardCheck },
  { to: "/dashboard/admin/submissions", label: "Review submissions", icon: FileCheck },
  { to: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
];

const links = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/my-courses", label: "My Courses", icon: BookOpen },
  { to: "/dashboard/my-internships", label: "My Internships", icon: Briefcase },
  { to: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/dashboard/offer-letter", label: "Offer Letter", icon: FileText },
  { to: "/dashboard/certificate", label: "Certificate", icon: Award },
  { to: "/dashboard/id-card", label: "ID Card", icon: IdCard },
  { to: "/dashboard/profile", label: "Profile", icon: UserIcon },
  { to: "/dashboard/share", label: "Share with Friends", icon: Share2 },
  { to: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
  { to: "/dashboard/help", label: "Help", icon: HelpCircle },
];

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
          isActive
            ? "bg-gradient-brand text-white shadow-glow"
            : "text-text-secondary hover:bg-surface hover:text-ink"
        )
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-white border-r border-border z-30">
      <div className="px-4 py-4 border-b border-border">
        <Link to="/">
          <img src={assetUrl("/skyrovix-logo.png")} alt="SKYROVIX" className="h-10 w-auto object-contain" />
        </Link>
        <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-secondary mt-2">
          BUILD THE FUTURE
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {isAdmin && (
          <>
            <div className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
              Admin
            </div>
            {adminLinks.map((link) => (
              <NavItem key={link.to} {...link} />
            ))}
            <div className="my-2 border-t border-border" />
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary">
              Student view
            </div>
          </>
        )}
        {links.map((link) => (
          <NavItem key={link.to} {...link} />
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <UserMenu />
      </div>
    </aside>
  );
}
