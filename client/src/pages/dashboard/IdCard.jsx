import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, IdCard as IdCardIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../utils/axios.js";
import { Card, EmptyState, Spinner } from "../../components/common/index.jsx";
import IdCardDocument from "../../components/idcard/IdCardDocument.jsx";
import { useManagedLoading } from "../../hooks/useManagedLoading.js";

export default function IdCard() {
  const { user, updateUser } = useAuth();
  const [apps, setApps] = useState([]);
  const { loading, run } = useManagedLoading(true);

  useEffect(() => {
    api.get("/users/profile").then((res) => updateUser(res.data.user)).catch(() => {});
  }, [updateUser]);

  useEffect(() => {
    run(() =>
      api.get("/applications/my").then((res) => {
        const active = (res.data.items || []).filter((a) =>
          ["accepted", "completed"].includes(a.status)
        );
        setApps(active);
      })
    );
  }, []);

  const printCard = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="card p-10 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">ID Card</h1>
          <p className="text-text-secondary text-sm mt-1">
            Your official intern ID card is issued after your application is accepted.
          </p>
        </div>
        <EmptyState
          icon={IdCardIcon}
          title="No ID card yet"
          description="Apply to an internship and get accepted to unlock your virtual intern ID card."
          action={<Link to="/internships" className="btn-primary">Browse internships</Link>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 id-card-page">
      <div className="print:hidden">
        <h1 className="text-2xl font-display font-bold text-ink">ID Card</h1>
        <p className="text-text-secondary text-sm mt-1 max-w-2xl">
          Official SKYROVIX intern ID — print or save as PDF. Update your photo and details in{" "}
          <Link to="/dashboard/profile" className="text-primary font-semibold">
            Profile
          </Link>
          .
        </p>
      </div>

      <div className="space-y-10">
        {apps.map((app) => (
          <Card
            key={app._id}
            className="overflow-hidden print:border-0 print:shadow-none print:bg-transparent p-4 sm:p-6"
          >
            <p className="print:hidden text-sm font-semibold text-ink mb-4">
              {app.internship?.title}
            </p>
            <IdCardDocument user={user} application={app} internship={app.internship} />
            <button
              type="button"
              className="btn-secondary w-full mt-4 print:hidden text-sm"
              onClick={printCard}
            >
              <Download size={16} /> Print / save as PDF
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
