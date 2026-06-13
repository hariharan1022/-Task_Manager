import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Download, ExternalLink, RefreshCw, IndianRupee, CheckCircle2, Clock, XCircle } from "lucide-react";
import { api } from "../../utils/axios.js";
import { Badge, Card, EmptyState, ProgressBar, Spinner, Modal, Input } from "../../components/common/index.jsx";
import CertificateDocument from "../../components/certificate/CertificateDocument.jsx";
import { extractCertificateId } from "../../components/certificate/certificateUtils.js";
import toast from "react-hot-toast";

const paymentStatusTone = {
  approved: "success",
  rejected: "danger",
  pending: "warning",
};

export default function Certificate() {
  const [apps, setApps] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState({});
  const [syncing, setSyncing] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadApps = useCallback(() => {
    return api.get("/applications/my").then((res) => {
      const items = res.data.items || [];
      setApps(items);
      return items;
    });
  }, []);

  const loadPayments = useCallback(() => {
    return api.get("/payments/my").then((res) => {
      const items = res.data.items || [];
      setPayments(items);
      return items;
    }).catch(() => []);
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
    Promise.all([loadApps(), loadPayments()])
      .then(([items]) => {
        if (!cancelled) return loadCertificates(items);
      })
      .catch(() => !cancelled && toast.error("Could not load certificates"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [loadApps, loadPayments, loadCertificates]);

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

  const handleSubmitPayment = async () => {
    if (!payModal || !transactionId.trim()) {
      toast.error("Enter UPI Transaction ID");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/payments/submit", {
        applicationId: payModal.application?._id || payModal._id,
        certificateId: extractCertificateId(payModal.certificateURL) || payModal._id,
        programName: payModal.internship?.title || "Certificate",
        transactionId: transactionId.trim(),
      });
      toast.success("Payment Submitted Successfully. Waiting for Admin Approval.");
      setPayModal(null);
      setTransactionId("");
      await loadPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const getPayment = (app) => {
    const certId = extractCertificateId(app.certificateURL);
    if (!certId) return null;
    return payments.find((p) => p.certificateId === certId);
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
          your certificate. Submit ₹100 payment for verification.
        </p>
      </div>

      {completed.map((app) => {
        const certId = extractCertificateId(app.certificateURL);
        const data = certId ? certData[certId] : null;
        const displayScore = data?.percentage ?? data?.score ?? app.totalScore ?? 0;
        const payment = getPayment(app);

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

            {!payment && (
              <div className="print:hidden p-4 sm:p-6 border-t border-border mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-ink">Pay ₹100 & download certificate</p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      Submit payment proof to get your verified certificate.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary text-sm"
                    onClick={() => { setPayModal(app); setTransactionId(""); }}
                  >
                    <IndianRupee size={14} /> Pay ₹100 & Submit
                  </button>
                </div>
              </div>
            )}

            {payment && payment.status === "pending" && (
              <div className="print:hidden p-4 sm:p-6 border-t border-border mt-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <Clock size={20} className="text-amber-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800">Payment pending approval</p>
                    <p className="text-sm text-amber-700 mt-0.5">
                      Txn ID: {payment.transactionId} · Submitted {new Date(payment.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {payment && payment.status === "rejected" && (
              <div className="print:hidden p-4 sm:p-6 border-t border-border mt-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                  <XCircle size={20} className="text-red-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-red-800">Payment rejected</p>
                    <p className="text-sm text-red-700 mt-0.5">
                      Reason: {payment.rejectionReason}
                    </p>
                    <button
                      type="button"
                      className="btn-secondary text-sm mt-2"
                      onClick={() => { setPayModal(app); setTransactionId(""); }}
                    >
                      Resubmit payment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {payment && payment.status === "approved" && data && (
              <>
                <div className="p-4 sm:p-6 pt-4 print:p-0 overflow-x-auto">
                  <CertificateDocument data={data} />
                </div>
                <div className="print:hidden px-4 sm:px-6 pb-4">
                  <div className="flex flex-wrap items-center gap-3 mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">Payment verified</span>
                  </div>
                  <button type="button" className="btn-secondary" onClick={printCertificate}>
                    <Download size={16} /> Print / save as PDF
                  </button>
                </div>
              </>
            )}

            {payment && payment.status === "approved" && !data && (
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

      <Card className="p-5 print:hidden">
        <h3 className="font-semibold text-ink text-sm mb-3">Join Our Community</h3>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a href="https://www.linkedin.com/in/hariharan-s-92b566381" target="_blank" rel="noreferrer" className="text-primary hover:underline">LinkedIn</a>
          <a href="https://www.instagram.com/skyrovix_web" target="_blank" rel="noreferrer" className="text-primary hover:underline">Instagram</a>
          <span className="text-text-secondary">Telegram: <span className="text-ink font-medium">9940773204</span></span>
          <span className="text-text-secondary">WhatsApp: <span className="text-ink font-medium">9940773204</span></span>
        </div>
      </Card>

      {payModal && (
        <Modal open={true} onClose={() => setPayModal(null)}>
          <div className="p-6 space-y-4 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-ink">Pay ₹100 & Get Certificate</h2>
            <p className="text-sm text-text-secondary">
              Submit your UPI payment proof to verify your certificate for <strong>{payModal.internship?.title}</strong>.
            </p>
            <div className="p-4 rounded-xl bg-surface border border-border space-y-2 text-sm">
              <p><span className="text-text-secondary">UPI ID:</span> <span className="font-medium text-ink">skyrovix@upi</span></p>
              <p><span className="text-text-secondary">Amount:</span> <span className="font-medium text-ink">₹100</span></p>
            </div>
            <Input
              label="UPI Transaction ID"
              placeholder="Enter the UPI transaction reference ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary w-full justify-center text-sm"
              disabled={submitting || !transactionId.trim()}
              onClick={handleSubmitPayment}
            >
              {submitting ? "Submitting…" : <><IndianRupee size={14} /> Pay ₹100 & Submit</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}