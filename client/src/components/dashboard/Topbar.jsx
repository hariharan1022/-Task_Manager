import { Menu, Search, ShieldCheck } from "lucide-react";
import UserMenu from "../common/UserMenu.jsx";
import MobileNav from "./MobileNav.jsx";
import { NotificationBell } from "./NotificationPanel.jsx";

export default function Topbar({ mobileOpen, onMobileOpen, onMobileClose }) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-border safe-pt">
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 lg:px-8 h-16">
        <button
          type="button"
          onClick={onMobileOpen}
          className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-surface text-ink min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
        >
          <Menu size={20} />
        </button>

        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              placeholder="Search tasks, internships…"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>
        </div>

        <div className="flex-1 md:flex-none" />

        <span className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-medium text-text-secondary bg-emerald-50 text-success px-2 py-1 rounded-full">
          <ShieldCheck size={12} /> Secure session
        </span>

        <NotificationBell />

        <UserMenu />
      </div>
    </header>
  );
}
