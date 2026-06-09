import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, ExternalLink, Plus } from "lucide-react";
import { api } from "../../utils/axios.js";
import { Badge, Card, EmptyState, ProgressBar, Spinner } from "../../components/common/index.jsx";

const tone = {
  pending: "warning",
  accepted: "primary",
  rejected: "danger",
  completed: "success",
};

export default function MyInternships() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/applications/my")
      .then((res) => !cancelled && setItems(res.data.items || []))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">My Internships</h1>
          <p className="text-text-secondary text-sm mt-1">
            Track all your applications and their progress in one place.
          </p>
        </div>
        <Link to="/internships" className="btn-primary">
          <Plus size={14} /> Apply to more
        </Link>
      </div>

      {loading ? (
        <div className="card p-10 flex justify-center"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="You haven't applied to any internship yet"
          description="Browse our programs and apply in just 2 minutes."
          action={<Link to="/internships" className="btn-primary">Browse internships</Link>}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((app) => (
            <Card key={app._id} className="hover:shadow-glow transition">
              <div className="flex items-center justify-between mb-2">
                <Badge tone={tone[app.status] || "default"}>{app.status}</Badge>
                <span className="text-xs text-text-secondary">
                  {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-ink">
                {app.internship?.title}
              </h3>
              <div className="text-sm text-text-secondary">
                {app.internship?.domain} · {app.internship?.duration}
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
                  <span>Progress</span>
                  <span>{app.totalScore || 0}/100</span>
                </div>
                <ProgressBar value={app.totalScore || 0} />
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  to={`/internships/${app.internship?._id}`}
                  className="btn-secondary text-xs"
                >
                  <ExternalLink size={12} /> View program
                </Link>
                {(app.status === "accepted" || app.status === "pending") && (
                  <Link
                    to={app.status === "accepted" ? "/dashboard/tasks" : "/dashboard/offer-letter"}
                    className="btn-primary text-xs"
                  >
                    {app.status === "accepted" ? "Continue tasks" : "View status"}
                  </Link>
                )}
                {app.status === "completed" && (
                  <Link to="/dashboard/certificate" className="btn-primary text-xs">
                    View certificate
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
