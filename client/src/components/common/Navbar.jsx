import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import UserMenu from "./UserMenu.jsx";
import Logo from "./Logo.jsx";
import { hashLink } from "../../utils/paths.js";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/courses", label: "Courses" },
  { to: "/internships", label: "Internships" },
  { to: "/verify", label: "Verify" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

function MobileMenu({ open, onClose, user }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button
        type="button"
        className="fixed inset-0 z-[100] bg-ink/60 backdrop-blur-sm animate-fadeIn"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-[110] w-full max-w-[min(100%,22rem)] bg-white shadow-2xl flex flex-col animate-slideInRight safe-pt safe-pb">
        <div className="shrink-0 px-5 py-4 border-b border-border bg-gradient-soft">
          <div className="flex items-center justify-between gap-3">
            <Logo size="sm" linkTo={null} />
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white border border-border hover:bg-surface min-w-[44px] min-h-[44px] flex items-center justify-center text-ink shadow-sm"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          {!user && (
            <p className="mt-3 text-sm text-text-secondary leading-snug">
              Join thousands of students earning verified internship certificates.
            </p>
          )}
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-1.5">
          {links.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              end={l.end}
              onClick={onClose}
              className={({ isActive }) =>
                `block px-4 py-3.5 rounded-xl text-base font-semibold min-h-[48px] flex items-center transition ${
                  isActive
                    ? "bg-gradient-brand text-white shadow-glow"
                    : "text-ink hover:bg-surface"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <a
            href={hashLink("how-it-works")}
            onClick={onClose}
            className="block px-4 py-3.5 rounded-xl text-base font-semibold text-ink hover:bg-surface min-h-[48px] flex items-center"
          >
            How it works
          </a>
          <a
            href={hashLink("features")}
            onClick={onClose}
            className="block px-4 py-3.5 rounded-xl text-base font-semibold text-ink hover:bg-surface min-h-[48px] flex items-center"
          >
            Features
          </a>
          <a
            href={hashLink("testimonials")}
            onClick={onClose}
            className="block px-4 py-3.5 rounded-xl text-base font-semibold text-ink hover:bg-surface min-h-[48px] flex items-center"
          >
            Testimonials
          </a>
        </nav>

        <div className="shrink-0 p-4 pt-3 border-t border-border bg-surface/80 space-y-2.5">
          {user ? (
            <>
              <div className="px-2 py-1.5 text-sm text-text-secondary truncate">{user.email}</div>
              <Link
                to="/dashboard"
                onClick={onClose}
                className="btn-primary w-full justify-center min-h-[48px] text-base"
              >
                Dashboard
              </Link>
              <Link
                to="/dashboard/profile"
                onClick={onClose}
                className="btn-secondary w-full justify-center min-h-[48px] text-base"
              >
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                onClick={onClose}
                className="btn-primary w-full justify-center min-h-[48px] text-base shadow-glow"
              >
                Get started free
              </Link>
              <Link
                to="/login"
                onClick={onClose}
                className="btn-secondary w-full justify-center min-h-[48px] text-base bg-white"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-lg border-b border-border/80 safe-pt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Logo size="sm" linkTo="/" />

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-text-secondary">
            {links.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg hover:text-ink hover:bg-surface transition ${
                    isActive ? "text-primary font-semibold bg-primary-light" : ""
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          <a
            href={hashLink("how-it-works")}
            className="px-3 py-2 rounded-lg hover:text-ink hover:bg-surface transition"
          >
            How it works
          </a>
          <a
            href={hashLink("features")}
            className="px-3 py-2 rounded-lg hover:text-ink hover:bg-surface transition"
          >
            Features
          </a>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link to="/dashboard" className="btn-primary">
                  Dashboard
                </Link>
                <UserMenu />
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary">
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="md:hidden p-2.5 min-w-[44px] min-h-[44px] rounded-xl bg-gradient-brand text-white shadow-glow hover:opacity-95 transition"
            aria-label="Open menu"
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      <MobileMenu open={open} onClose={close} user={user} />
    </>
  );
}
