import { useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import { assetUrl } from "../../utils/paths.js";
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  Trophy,
  User as UserIcon,
  X,
  Bell,
  FileText,
  Award,
  IdCard,
  Share2,
  Truck,
  Settings,
  HelpCircle,
  LogOut,
  Shield,
  GraduationCap,
  ClipboardCheck,
  FileCheck,
  BookOpen,
  Briefcase,
  ListChecks,
  BarChart3,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { Avatar, ConfirmDialog } from "../common/index.jsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const primary = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/dashboard/my-courses", label: "My Courses", icon: BookOpen },
  { to: "/dashboard/my-internships", label: "Internships", icon: Briefcase },
  { to: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/dashboard/profile", label: "Profile", icon: UserIcon },
];

const adminNav = [
  { to: "/dashboard/admin", label: "Admin overview", icon: Shield, end: true },
  { to: "/dashboard/admin/courses", label: "Courses", icon: BookOpen },
  { to: "/dashboard/admin/exams", label: "Exams", icon: Trophy },
  { to: "/dashboard/admin/assignments", label: "Assignments", icon: ListChecks },
  { to: "/dashboard/admin/programs", label: "Internships", icon: GraduationCap },
  { to: "/dashboard/admin/applications", label: "Applications", icon: ClipboardCheck },
  { to: "/dashboard/admin/submissions", label: "Submissions", icon: FileCheck },
  { to: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
];

const more = [
  { to: "/dashboard/offer-letter", label: "Offer Letter", icon: FileText },
  { to: "/dashboard/certificate", label: "Certificate", icon: Award },
  { to: "/dashboard/id-card", label: "ID Card", icon: IdCard },
  { to: "/dashboard/share", label: "Share with Friends", icon: Share2 },
  { to: "/dashboard/physical-certificate", label: "Physical Certificate", icon: Truck },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
  { to: "/dashboard/help", label: "Help", icon: HelpCircle },
];

function NavItem({ to, label, icon: Icon, end, onClose, variant = "primary" }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClose}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium min-h-[48px] transition",
          variant === "primary" &&
            (isActive
              ? "bg-gradient-brand text-white shadow-glow"
              : "text-text-secondary hover:bg-surface hover:text-ink"),
          variant === "more" &&
            (isActive ? "bg-surface text-ink font-semibold" : "text-text-secondary hover:bg-surface")
        )
      }
    >
      <Icon size={18} className="shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export default function MobileNav({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logout();
      onClose?.();
      setConfirmOpen(false);
      toast.success("Signed out");
      navigate("/", { replace: true });
    } catch {
      toast.error("Could not sign out");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const drawer = (
    <div className="fixed inset-0 z-[200] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-ink/60 backdrop-blur-[2px]"
        aria-label="Close menu"
      />

      <aside
        className="absolute inset-y-0 left-0 flex w-[min(88vw,20rem)] max-w-sm flex-col bg-white shadow-2xl animate-slideIn"
        style={{ height: "100dvh", maxHeight: "100dvh" }}
      >
        <div className="shrink-0 flex items-center justify-between gap-2 border-b border-border px-4 py-3 safe-pt">
          <img src={assetUrl("/skyrovix-logo.png")} alt="SKYROVIX" className="h-9 w-auto object-contain" />
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl hover:bg-surface"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <div className="shrink-0 border-b border-border bg-gradient-soft px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar src={user?.profilePhoto} name={user?.fullName} size={44} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-ink">{user?.fullName}</div>
              <div className="truncate text-xs text-text-secondary">{user?.email}</div>
              {user?.role === "admin" && (
                <span className="mt-1 inline-flex rounded bg-primary-light px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 space-y-0.5">
          {user?.role === "admin" && (
            <>
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-primary">
                Admin
              </div>
              {adminNav.map((link) => (
                <NavItem key={link.to} {...link} onClose={onClose} />
              ))}
              <div className="my-3 border-t border-border" />
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                Student view
              </div>
            </>
          )}
          {primary.map((link) => (
            <NavItem key={link.to} {...link} onClose={onClose} />
          ))}
          <div className="my-3 border-t border-border" />
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
            More
          </div>
          {more.map((link) => (
            <NavItem key={link.to} {...link} onClose={onClose} variant="more" />
          ))}
        </nav>

        <div className="shrink-0 border-t border-border bg-white p-3 safe-pb">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-danger hover:bg-red-50"
          >
            <LogOut size={18} className="shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Sign out of skyrovix?"
        description="You'll need to sign in again to access your dashboard, tasks and certificates."
        confirmText="Sign out"
        variant="danger"
        loading={busy}
      />
    </div>
  );

  return createPortal(drawer, document.body);
}
