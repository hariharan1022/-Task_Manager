import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { api } from "../../utils/axios.js";
import { Card, EmptyState, Spinner } from "../../components/common/index.jsx";
import toast from "react-hot-toast";

const toneStyles = {
  application: "bg-primary-light text-primary",
  task: "bg-sky-50 text-sky-700",
  system: "bg-surface text-text-secondary",
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get("/notifications")
      .then((res) => {
        setItems(res.data.items || []);
        setUnreadCount(res.data.unreadCount || 0);
      })
      .catch(() => toast.error("Could not load notifications"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      toast.error("Could not update notification");
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All caught up");
    } catch {
      toast.error("Could not mark all as read");
    }
  };

  if (loading) {
    return (
      <div className="card p-10 flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Notifications</h1>
          <p className="text-text-secondary text-sm mt-1">
            Application reviews, task feedback, and program updates.
          </p>
        </div>
        {unreadCount > 0 && (
          <button type="button" className="btn-secondary text-sm" onClick={markAllRead}>
            <CheckCheck size={16} /> Mark all read ({unreadCount})
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="When an admin reviews your application or tasks, updates will appear here."
          action={<Link to="/internships" className="btn-primary">Browse internships</Link>}
        />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <Card
              key={n._id}
              className={`flex gap-3 items-start ${!n.read ? "ring-2 ring-primary/20" : ""}`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  toneStyles[n.type] || toneStyles.system
                }`}
              >
                <Bell size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-ink">{n.title}</div>
                  {!n.read && (
                    <span className="text-[10px] font-bold uppercase text-primary bg-primary-light px-1.5 py-0.5 rounded">
                      New
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary mt-0.5 whitespace-pre-wrap">{n.body}</p>
                <div className="text-xs text-muted mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  {n.link && (
                    <Link
                      to={n.link}
                      className="text-sm font-semibold text-primary"
                      onClick={() => !n.read && markRead(n._id)}
                    >
                      View →
                    </Link>
                  )}
                  {!n.read && (
                    <button
                      type="button"
                      className="text-sm text-text-secondary hover:text-ink"
                      onClick={() => markRead(n._id)}
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
