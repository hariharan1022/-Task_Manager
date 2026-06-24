import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, LayoutDashboard, Shield, Menu, X, BookOpen, ListChecks, Award, User, Home, Briefcase, Mail, BadgeCheck, Info } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/domains", label: "Internship", icon: Briefcase },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/about", label: "About", icon: Info },
  { to: "/contact", label: "Contact", icon: Mail },
  { to: "/verify-certificate", label: "Verify", icon: BadgeCheck },
] as const;

const DASHBOARD_ITEMS = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard", label: "My Courses", icon: BookOpen, search: { tab: "courses" } },
  { to: "/dashboard", label: "My Tasks", icon: ListChecks, search: { tab: "tasks" } },
  { to: "/dashboard", label: "Certificates", icon: Award, search: { tab: "certificates" } },
  { to: "/dashboard", label: "Profile", icon: User, search: { tab: "profile" } },
] as const;

export function Navbar() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const router = useRouterState();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const pathname = router.location.pathname;

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const goTo = (to: string, search?: Record<string, string>) => {
    navigate({ to, search });
    setOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl transition-all duration-500 ${
          scrolled ? "top-3" : ""
        }`}
      >
        <nav
          className={`relative flex h-14 sm:h-16 items-center justify-between gap-3 rounded-2xl border px-4 sm:px-6 transition-all duration-500 ${
            scrolled
              ? "bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
              : "bg-white/50 dark:bg-[#0f172a]/50 backdrop-blur-md border-transparent"
          }`}
        >
          <Link to="/" className="shrink-0" onClick={() => setOpen(false)}>
            <Logo />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto">
            {NAV.map((n) => {
              const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  activeOptions={{ exact: n.to === "/" }}
                  className={`relative whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "text-[#07284a] dark:text-white bg-[#07284a]/8 dark:bg-white/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-[#07284a]/5 dark:hover:bg-white/5"
                  }`}
                >
                  <Icon className="inline size-4 mr-1.5 -mt-0.5" />{n.label}
                </Link>
              );
            })}
            {user && DASHBOARD_ITEMS.map((item) => {
              const isActive = item.to === "/dashboard" && !item.search
                ? pathname === "/dashboard" && !pathname.includes("?tab=")
                : pathname.startsWith("/dashboard") && pathname.includes(item.search?.tab ?? "");
              return (
                <button key={item.label} onClick={() => goTo(item.to, item.search)}
                  className={`relative whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "text-[#07284a] dark:text-white bg-[#07284a]/8 dark:bg-white/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-[#07284a]/5 dark:hover:bg-white/5"
                  }`}
                >
                  <item.icon className="inline size-3.5 mr-1 -mt-0.5" />{item.label}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {isAdmin && (
                  <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex text-muted-foreground hover:text-foreground rounded-xl h-9">
                    <Link to="/admin"><Shield className="mr-1.5 size-4" />Admin</Link>
                  </Button>
                )}
                <button
                  onClick={signOut}
                  className="hidden md:inline-flex items-center justify-center rounded-xl h-9 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-[#07284a]/5 dark:hover:bg-white/5 transition-all"
                >
                  <LogOut className="size-4" />
                </button>
              </>
            ) : (
              <Button asChild size="sm" className="hidden md:inline-flex rounded-xl h-9 bg-[#07284a] hover:bg-[#07284a]/90 text-white shadow-sm shadow-[#07284a]/20">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex lg:hidden items-center justify-center size-9 rounded-xl border border-border hover:bg-[#07284a]/5 dark:hover:bg-white/5 transition-all touch-target"
              aria-label="Toggle menu"
            >
              <span className={`transition-transform duration-300 ${open ? "rotate-90" : ""}`}>
                {open ? <X className="size-4" /> : <Menu className="size-4" />}
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      {/* Mobile Menu */}
      {open && (
        <div
          ref={menuRef}
          className="fixed left-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 mt-2 rounded-2xl border border-border/60 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl shadow-xl overflow-hidden lg:hidden"
          style={{
            top: scrolled ? "calc(3rem + 8px)" : "calc(4rem + 8px)",
            animation: "fade-in-down 0.2s ease-out forwards",
          }}
        >
          <div className="flex flex-col gap-1 p-3">
            {user ? (
              <>
                {[
                  ...NAV,
                  ...DASHBOARD_ITEMS,
                ].map((item, i) => {
                  const Icon = item.icon;
                  const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                  return (
                    <button key={item.label} onClick={() => goTo(item.to, "search" in item ? item.search : undefined)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all w-full text-left ${
                        active
                          ? "bg-[#07284a]/8 dark:bg-white/10 text-[#07284a] dark:text-white"
                          : "text-muted-foreground hover:text-foreground hover:bg-[#07284a]/5 dark:hover:bg-white/5"
                      }`}
                      style={{ opacity: 0, animation: `fade-in-up 0.25s ease-out ${0.03 * i}s forwards` }}
                    >
                      <Icon className="size-4 shrink-0" />{item.label}
                    </button>
                  );
                })}
                <div className="my-2 border-t border-border" style={{ opacity: 0, animation: `fade-in-up 0.25s ease-out ${0.33}s forwards` }} />
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-[#07284a]/5 dark:hover:bg-white/5 transition-all"
                    style={{ opacity: 0, animation: `fade-in-up 0.25s ease-out 0.36s forwards` }}>
                    <Shield className="size-4" /> Admin
                  </Link>
                )}
                <button onClick={() => { signOut(); setOpen(false); }} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-[#07284a]/5 dark:hover:bg-white/5 transition-all w-full text-left"
                  style={{ opacity: 0, animation: `fade-in-up 0.25s ease-out 0.39s forwards` }}>
                  <LogOut className="size-4" /> Sign out
                </button>
              </>
            ) : (
              <>
                {NAV.map((n, i) => {
                  const Icon = n.icon;
                  const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
                  return (
                    <button key={n.to} onClick={() => goTo(n.to)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all w-full text-left ${
                        active
                          ? "bg-[#07284a]/8 dark:bg-white/10 text-[#07284a] dark:text-white"
                          : "text-muted-foreground hover:text-foreground hover:bg-[#07284a]/5 dark:hover:bg-white/5"
                      }`}
                      style={{ opacity: 0, animation: `fade-in-up 0.25s ease-out ${0.03 * i}s forwards` }}
                    >
                      <Icon className="size-4 shrink-0" />{n.label}
                    </button>
                  );
                })}
                <div className="my-2 border-t border-border" />
                <Link to="/auth" onClick={() => setOpen(false)} className="mt-1 rounded-xl bg-[#07284a] px-4 py-3.5 text-center text-sm font-medium text-white">
                  Sign in to get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
