import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Download, Linkedin, CheckCircle2 } from "lucide-react";
import { api } from "../../utils/axios.js";
import { Badge, Card, EmptyState, Spinner } from "../../components/common/index.jsx";
import OfferLetterDocument from "../../components/offer/OfferLetterDocument.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useManagedLoading } from "../../hooks/useManagedLoading.js";
import toast from "react-hot-toast";

export default function OfferLetter() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const { loading, run } = useManagedLoading(true);
  const [linkedinUrl, setLinkedinUrl] = useState({});
  const [saving, setSaving] = useState(null);

  const load = () =>
    run(() =>
      api.get("/applications/my").then((res) => {
        setApps(
          (res.data.items || []).filter((a) =>
            ["accepted", "completed"].includes(a.status)
          )
        );
      })
    );

  useEffect(() => {
    load();
  }, []);

  const submitLinkedIn = async (appId) => {
    const postUrl = (linkedinUrl[appId] || "").trim();
    if (!postUrl) {
      toast.error("Paste your LinkedIn post URL");
      return;
    }
    setSaving(appId);
    try {
      await api.patch(`/applications/${appId}/offer-linkedin`, { postUrl });
      toast.success("LinkedIn post saved — your 5 tasks are unlocked!");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save LinkedIn URL");
    } finally {
      setSaving(null);
    }
  };

  const printLetter = () => {
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
      <EmptyState
        icon={FileText}
        title="No offer letter yet"
        description="Apply to an internship and get accepted to unlock your offer letter."
        action={<Link to="/internships" className="btn-primary">Browse internships</Link>}
      />
    );
  }

  return (
    <div className="space-y-5 offer-letter-page">
      <div className="print:hidden">
        <h1 className="text-2xl font-display font-bold text-ink">Offer Letter</h1>
        <p className="text-text-secondary text-sm mt-1 max-w-2xl leading-relaxed">
          Your formal offer letter is below. Download it as PDF, share on LinkedIn, then paste the
          post link to unlock your 5 tasks.
        </p>
      </div>

      {apps.map((app) => {
        const posted = !!app.offerLetterLinkedInPost;
        return (
          <Card key={app._id} className="overflow-hidden print:border-0 print:shadow-none print:bg-transparent">
            <div className="print:hidden flex flex-wrap items-start justify-between gap-3 p-4 sm:p-6 pb-0">
              <div className="min-w-0">
                <Badge tone="primary">{app.status}</Badge>
                <h2 className="text-lg font-semibold text-ink mt-2 break-words">
                  {app.internship?.title}
                </h2>
                <p className="text-sm text-text-secondary">
                  {app.internship?.domain} · Issued to {user?.fullName}
                </p>
              </div>
              {posted ? (
                <Link to="/dashboard/tasks" className="btn-primary text-sm shrink-0">
                  Go to tasks
                </Link>
              ) : (
                <span className="chip bg-amber-50 text-amber-800 border border-amber-200">
                  Tasks locked
                </span>
              )}
            </div>

            <div className="p-4 sm:p-6 pt-4 sm:pt-5 print:p-0">
              <OfferLetterDocument
                application={app}
                internship={app.internship}
                studentName={user?.fullName || "Intern"}
              />
            </div>

            <div className="print:hidden px-4 sm:px-6 pb-4 sm:pb-6">
              <button type="button" className="btn-secondary" onClick={printLetter}>
                <Download size={16} /> Print / save as PDF
              </button>
            </div>

            <div className="print:hidden mt-0 px-4 sm:px-6 pb-6 pt-2 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <Linkedin size={18} className="text-[#0A66C2]" />
                <h3 className="font-semibold text-ink">Step 2 — Share on LinkedIn</h3>
              </div>

              {posted ? (
                <div className="flex items-start gap-2 text-sm text-success bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                  <div className="min-w-0 break-all">
                    <p className="font-semibold text-emerald-800">Post link verified</p>
                    <a
                      href={app.offerLetterLinkedInPost}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline mt-1 inline-block"
                    >
                      {app.offerLetterLinkedInPost}
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-text-secondary mb-3">
                    1. Post your offer letter on LinkedIn · 2. Copy the post URL · 3. Paste it here
                    to unlock tasks
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className="input flex-1 min-w-0"
                      placeholder="https://www.linkedin.com/posts/…"
                      value={linkedinUrl[app._id] || ""}
                      onChange={(e) =>
                        setLinkedinUrl((s) => ({ ...s, [app._id]: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className="btn-primary shrink-0"
                      disabled={saving === app._id}
                      onClick={() => submitLinkedIn(app._id)}
                    >
                      {saving === app._id ? "Saving…" : "Unlock tasks"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
