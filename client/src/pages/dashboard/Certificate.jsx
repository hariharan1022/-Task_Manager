import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Download, ExternalLink, RefreshCw } from "lucide-react";
import { api } from "../../utils/axios.js";
import { Badge, Card, EmptyState, ProgressBar, Spinner } from "../../components/common/index.jsx";
import CertificateDocument from "../../components/certificate/CertificateDocument.jsx";
import { extractCertificateId } from "../../components/certificate/certificateUtils.js";
import toast from "react-hot-toast";

export default function Certificate() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState({});
  const [syncing, setSyncing] = useState(null);

  const loadApps = useCallback(() => {
    return api.get("/applications/my").then((res) => {
      const items = res.data.items || [];
      setApps(items);
      return items;
    });
  }, []);

  const fetchCertById = useCallback(async (certId) => {
    const { data } = await api.get(`/certificates/verify/${certId}`);
    return data.certificate;
  }, []);

  const syncApplicationCert = useCallback(
    async (appId) => {
      const { data } = await api.get(`/applications/${appId}/certificate`);
      if (data.certificate) {
        const id = data.certificate.id;
        setCertData((prev) => ({ ...prev, [id]: data.certificate }));
        return data;
      }
      return null;
    },
    []
  );

  const loadCertificates = useCallback(
    async (items) => {
      const completed = items.filter((a) => a.status === "completed");
      const next = {};

      await Promise.all(
        completed.map(async (app) => {
          let certId = extractCertificateId(app.certificateURL);
          if (certId) {
            try {
              next[certId] = await fetchCertById(certId);
            } catch {
              certId = null;
            }
          }
          if (!certId) {
            try {
              const synced = await syncApplicationCert(app._id);
              if (synced?.certificate?.id) {
                next[synced.certificate.id] = synced.certificate;
              }
            } catch {
              /* ignore */
            }
          }
        })
      );

      setCertData(next);
    },
    [fetchCertById, syncApplicationCert]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadApps()
      .then((items) => {
        if (!cancelled) return loadCertificates(items);
      })
      .catch(() => !cancelled && toast.error("Could not load certificates"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [loadApps, loadCertificates]);

  const handleRefresh = async (appId) => {
    setSyncing(appId);
    try {
      const items = await loadApps();
      const app = items.find((a) => a._id === appId);
      if (app) await loadCertificates([app]);
      toast.success("Certificate updated");
    } catch {
      toast.error("Could not refresh certificate");
    } finally {
      setSyncing(null);
    }
  };

  const printCertificate = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="card p-10 flex justify-center">
        <Spinner />
      </div>
    );
  }

  const completed = apps.filter((a) => a.status === "completed");
  const inProgress = apps.filter((a) => a.status === "accepted");

  return (
    <div className="space-y-5 certificate-page">
      <div className="print:hidden">
        <h1 className="text-2xl font-display font-bold text-ink">Certificate</h1>
        <p className="text-text-secondary text-sm mt-1 max-w-2xl">
          Complete all 5 mentor-reviewed tasks (100/100) or get marked complete by admin to unlock
          your certificate with your real score.
        </p>
      </div>

      {completed.map((app) => {
        const certId = extractCertificateId(app.certificateURL);
        const data = certId ? certData[certId] : null;
        const displayScore = data?.percentage ?? data?.score ?? app.totalScore ?? 0;

        return (
          <Card
            key={app._id}
            className="overflow-hidden border-emerald-200 print:border-0 print:shadow-none print:bg-transparent"
          >
            <div className="print:hidden flex flex-wrap items-start justify-between gap-3 p-4 sm:p-6 pb-0">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="text-emerald-600" size={20} />
                  <Badge tone="success">Completed</Badge>
                </div>
                <h2 className="text-lg font-semibold text-ink">{app.internship?.title}</h2>
                <p className="text-sm text-text-secondary mt-1">
                  Score: <strong className="text-ink">{displayScore}/100</strong>
                  {data?.grade ? ` · ${data.grade}` : ""} · {app.internship?.domain}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  className="btn-ghost text-sm"
                  disabled={syncing === app._id}
                  onClick={() => handleRefresh(app._id)}
                >
                  <RefreshCw
                    size={16}
                    className={syncing === app._id ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
                {app.certificateURL && (
                  <Link to={app.certificateURL} className="btn-secondary text-sm">
                    <ExternalLink size={16} /> Verify link
                  </Link>
                )}
              </div>
            </div>

            {data ? (
              <>
                <div className="p-4 sm:p-6 pt-4 print:p-0 overflow-x-auto">
                  <CertificateDocument data={data} />
                </div>
                <div className="print:hidden px-4 sm:px-6 pb-6">
                  <button type="button" className="btn-secondary" onClick={printCertificate}>
                    <Download size={16} /> Print / save as PDF
                  </button>
                </div>
              </>
            ) : (
              <div className="p-6 print:hidden flex flex-col items-center gap-3">
                <Spinner />
                <p className="text-sm text-text-secondary text-center">
                  Generating your certificate…
                </p>
                <button
                  type="button"
                  className="btn-primary text-sm"
                  disabled={syncing === app._id}
                  onClick={() => handleRefresh(app._id)}
                >
                  Generate certificate now
                </button>
              </div>
            )}
          </Card>
        );
      })}

      {inProgress.map((app) => (
        <Card key={app._id}>
          <Badge tone="primary">In progress</Badge>
          <h2 className="text-lg font-semibold text-ink mt-2">{app.internship?.title}</h2>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>Progress toward certificate</span>
              <span>{app.totalScore || 0}/100</span>
            </div>
            <ProgressBar value={app.totalScore || 0} />
          </div>
          <Link to="/dashboard/tasks" className="btn-primary mt-4 inline-flex">
            Continue tasks
          </Link>
        </Card>
      ))}

      {completed.length === 0 && inProgress.length === 0 && (
        <EmptyState
          icon={Award}
          title="No certificate yet"
          description="Get accepted to an internship and complete all 5 tasks to earn your certificate."
          action={
            <Link to="/internships" className="btn-primary">
              Browse internships
            </Link>
          }
        />
      )}
    </div>
  );
}
