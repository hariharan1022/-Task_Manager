import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Loader2, X } from "lucide-react";
import { api } from "../../utils/axios.js";

export default function NotificationPanel({ open, onClose }) {
  const panelRef = useRef(null);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get("/notifications")
      .then((res) => {
        setItems(res.data.items || []);
        setUnreadCount(res.data.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, onClose]);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await api.patch("/notifications/read-all").catch(() => {});
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-[min(100vw-1.5rem,380px)] rounded-2xl border border-border bg-white shadow-xl z-50 overflow-hidden"
      role="dialog"
      aria-label="Notifications"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <span className="font-semibold text-ink">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold bg-danger text-white px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              className="p-1.5 rounded-lg hover:bg-white text-text-secondary"
              title="Mark all read"
              onClick={markAllRead}
            >
              <CheckCheck size={16} />
            </button>
          )}
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-white text-text-secondary"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="max-h-[min(70vh,420px)] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-10 px-4">
            No notifications yet. Apply to an internship to get updates.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.slice(0, 12).map((n) => (
              <li key={n._id} className={`px-4 py-3 ${!n.read ? "bg-primary-light/30" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{n.title}</p>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-danger shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{n.body}</p>
                <p className="text-[10px] text-muted mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
                {n.link && (
                  <Link
                    to={n.link}
                    className="text-xs font-semibold text-primary mt-1.5 inline-block"
                    onClick={() => {
                      if (!n.read) markRead(n._id);
                      onClose();
                    }}
                  >
                    View →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border p-3 bg-surface">
        <Link
          to="/dashboard/notifications"
          className="btn-secondary w-full text-sm justify-center"
          onClick={onClose}
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}

/** Bell button + unread badge; polls lightly when mounted */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapRef = useRef(null);

  const pollUnread = () => {
    api
      .get("/notifications")
      .then((res) => setUnreadCount(res.data.unreadCount || 0))
      .catch(() => {});
  };

  useEffect(() => {
    pollUnread();
    const id = setInterval(pollUnread, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) pollUnread();
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className="relative p-2 rounded-lg hover:bg-surface text-text-secondary min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[8px] h-2 px-0.5 rounded-full bg-danger ring-2 ring-white" />
        )}
      </button>
      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
