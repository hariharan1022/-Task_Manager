import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, Shield, User as UserIcon, Settings } from "lucide-react";
import { Avatar } from "./Avatar.jsx";
import { ConfirmDialog } from "./Modal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import toast from "react-hot-toast";

export default function UserMenu({ compact = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logout();
      setOpen(false);
      setConfirmOpen(false);
      toast.success("Signed out");
      navigate("/", { replace: true });
    } catch {
      toast.error("Could not sign out");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-surface transition"
        >
          <Avatar src={user?.profilePhoto} name={user?.fullName} size={32} />
          {!compact && (
            <div className="hidden sm:block text-left pr-1">
              <div className="text-sm font-semibold text-ink leading-tight truncate max-w-[140px]">
                {user?.fullName}
              </div>
              <div className="text-[11px] text-text-secondary truncate max-w-[140px]">
                {user?.email}
              </div>
            </div>
          )}
          <ChevronDown size={14} className="text-muted hidden sm:block" />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-border overflow-hidden z-40"
            >
              <div className="p-4 border-b border-border bg-gradient-soft">
                <div className="flex items-center gap-3">
                  <Avatar src={user?.profilePhoto} name={user?.fullName} size={40} />
                  <div className="min-w-0">
                    <div className="font-semibold text-ink truncate">
                      {user?.fullName}
                    </div>
                    <div className="text-xs text-text-secondary truncate">
                      {user?.email}
                    </div>
                    {user?.role === "admin" && (
                      <div className="mt-1 inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary-light text-primary uppercase tracking-wider">
                        Admin
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-1.5">
                {user?.role === "admin" && (
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate("/dashboard/admin");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-primary-light"
                  >
                    <Shield size={16} /> Admin panel
                  </button>
                )}
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/dashboard/profile");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink hover:bg-surface"
                >
                  <UserIcon size={16} className="text-text-secondary" /> My profile
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/dashboard/settings");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink hover:bg-surface"
                >
                  <Settings size={16} className="text-text-secondary" /> Settings
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={() => {
                    setOpen(false);
                    setConfirmOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-danger hover:bg-red-50"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
    </>
  );
}
