import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, LayoutDashboard, Shield, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/domains", label: "Internship" },
  { to: "/courses", label: "Courses" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/verify-certificate", label: "Verify" },
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

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl transition-all duration-500 ${
        scrolled
          ? "top-3"
          : ""
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
        <div className="hidden lg:flex items-center gap-1">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className={`relative rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "text-[#07284a] dark:text-white bg-[#07284a]/8 dark:bg-white/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-[#07284a]/5 dark:hover:bg-white/5"
                }`}
              >
                {n.label}
                {active && (
                  <span className="absolute -bottom-px left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[#07284a] dark:bg-white" />
                )}
              </Link>
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
              <Button asChild size="sm" className="hidden md:inline-flex rounded-xl h-9 bg-[#07284a] hover:bg-[#07284a]/90 text-white shadow-sm shadow-[#07284a]/20">
                <Link to="/dashboard"><LayoutDashboard className="mr-1.5 size-4" />Dashboard</Link>
              </Button>
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

      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      {/* Mobile Menu */}
      {open && (
        <div
          ref={menuRef}
          className="relative z-50 lg:hidden mt-2 rounded-2xl border border-border/60 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl shadow-xl overflow-hidden"
          style={{
            animation: "fade-in-down 0.2s ease-out forwards",
          }}
        >
          <div className="flex flex-col gap-1 p-3">
            {NAV.map((n, i) => {
              const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    active
                      ? "bg-[#07284a]/8 dark:bg-white/10 text-[#07284a] dark:text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-[#07284a]/5 dark:hover:bg-white/5"
                  }`}
                  style={{
                    opacity: 0,
                    animation: `fade-in-up 0.25s ease-out ${0.03 * i}s forwards`,
                  }}
                >
                  {n.label}
                </Link>
              );
            })}
            <div className="my-2 border-t border-border" />
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-[#07284a]/5 dark:hover:bg-white/5 transition-all">
                  <LayoutDashboard className="size-4" /> Dashboard
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-[#07284a]/5 dark:hover:bg-white/5 transition-all">
                    <Shield className="size-4" /> Admin
                  </Link>
                )}
                <button onClick={() => { signOut(); setOpen(false); }} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-[#07284a]/5 dark:hover:bg-white/5 transition-all w-full text-left">
                  <LogOut className="size-4" /> Sign out
                </button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="mt-1 rounded-xl bg-[#07284a] px-4 py-3.5 text-center text-sm font-medium text-white">
                Sign in to get started
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
