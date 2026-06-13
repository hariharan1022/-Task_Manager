import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, RefreshCw, XCircle, Eye, Loader2 } from "lucide-react";
import { api } from "../../../utils/axios.js";
import { emitDashboardRefresh, formatLastFetched, listenDashboardRefresh } from "../../../utils/refreshEvents.js";
import { getSocket } from "../../../utils/useSocket.js";
import {
  Badge,
  Card,
  EmptyState,
  Input,
  Select,
  Spinner,
  Modal,
  Textarea,
} from "../../../components/common/index.jsx";
import toast from "react-hot-toast";

const POLL_INTERVAL = 5000;

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const statusTone = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export default function AdminPaymentApprovals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(null);
  const [viewPayment, setViewPayment] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [lastFetched, setLastFetched] = useState(null);
  const intervalRef = useRef(null);

  const load = useCallback(() => {
    console.log("[AdminPaymentApprovals] Fetching payments...");
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    if (search) params.set("search", search);
    api
      .get(`/payments/admin${params.toString() ? `?${params}` : ""}`)
      .then((res) => {
        setItems(res.data.items || []);
        setLastFetched(new Date().toISOString());
        console.log("[AdminPaymentApprovals] Loaded", res.data.items?.length, "payments");
      })
      .catch(() => toast.error("Could not load payments"))
      .finally(() => setLoading(false));
  }, [filter, search]);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    console.log("[AdminPaymentApprovals] Polling every", POLL_INTERVAL + "ms");

    const socket = getSocket();
    const socketEvents = ["payment_approved", "certificate_generated", "user_registered"];
    const handlers = {};
    for (const evt of socketEvents) {
      const handler = (p) => { console.log("[AdminPaymentApprovals] Socket:", evt, p); load(); };
      socket.on(evt, handler);
      handlers[evt] = handler;
    }
    const unlisten = listenDashboardRefresh(() => load());

    return () => {
      clearInterval(intervalRef.current);
      for (const [evt, handler] of Object.entries(handlers)) socket.off(evt, handler);
      if (unlisten) unlisten();
    };
  }, [load]);

  const handleApproveAndGenerate = async (id) => {
    console.log("[AdminPaymentApprovals] ===== Approve & Generate clicked =====");
    console.log("[AdminPaymentApprovals] Payment ID:", id);
    setBusy(id);
    try {
      console.log("[AdminPaymentApprovals] Sending PUT /payments/admin/" + id + "/approve-and-generate");
      const { data } = await api.put(`/payments/admin/${id}/approve-and-generate`);
      console.log("[AdminPaymentApprovals] API response:", data);
      const msg = data.certificate
        ? `Payment approved & certificate generated (ID: ${data.certificate.certificateId || data.certificate._id})`
        : "Payment approved (certificate generation skipped - no application linked)";
      console.log("[AdminPaymentApprovals] Success:", msg);
      toast.success(msg);
      emitDashboardRefresh("payment-approval");
      load();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Approval & generation failed";
      console.error("[AdminPaymentApprovals] Error:", errMsg);
      console.error("[AdminPaymentApprovals] Full error:", err);
      toast.error(errMsg);
    } finally {
      console.log("[AdminPaymentApprovals] Done processing payment:", id);
      setBusy(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    console.log("[AdminPaymentApprovals] Reject clicked for payment:", rejectModal);
    setBusy(rejectModal + "reject");
    try {
      await api.put(`/payments/admin/${rejectModal}/reject`, { reason: rejectReason.trim() });
      toast.success("Payment rejected");
      setRejectModal(null);
      setRejectReason("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Rejection failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary flex items-center gap-1.5">
          <RefreshCw size={12} />
          Updated: <span className="font-mono font-medium text-ink">{formatLastFetched(lastFetched)}</span>
        </p>
        <p className="text-sm text-text-secondary">{items.length} payment{items.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <Input
            label="Search"
            placeholder="Name, email, transaction or certificate ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select
          label="Filter by status"
          className="max-w-xs"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          options={statusOptions}
        />
      </div>

      {loading ? (
        <Card className="flex justify-center py-16">
          <Spinner />
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          title="No payments"
          description="Certificate payment requests will appear here."
        />
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <Card key={p._id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink">{p.studentName}</h3>
                    <Badge tone={statusTone[p.status] || "default"}>{p.status}</Badge>
                  </div>
                  <p className="text-sm text-text-secondary">{p.email}</p>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium text-ink">₹{p.amount}</div>
                  <div className="text-text-secondary text-xs">{p.programName}</div>
                  <div className="text-xs text-muted mt-1">
                    {new Date(p.submittedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-text-secondary">Cert ID:</span>
                  <p className="text-ink font-medium truncate">{p.certificateId}</p>
                </div>
                <div>
                  <span className="text-text-secondary">Txn ID:</span>
                  <p className="text-ink font-medium truncate">{p.transactionId}</p>
                </div>
                {p.approvedAt && (
                  <div>
                    <span className="text-text-secondary">Approved:</span>
                    <p className="text-ink font-medium">{new Date(p.approvedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {p.rejectionReason && (
                  <div className="col-span-2 sm:col-span-4">
                    <span className="text-danger">Rejection reason:</span>
                    <p className="text-danger/80 mt-0.5">{p.rejectionReason}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-ghost text-sm"
                  onClick={() => setViewPayment(p)}
                >
                  <Eye size={14} /> View details
                </button>
                {p.screenshotUrl && (
                  <a
                    href={p.screenshotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost text-sm"
                  >
                    <ExternalLink size={14} /> Screenshot
                  </a>
                )}
                {p.status === "pending" && (
                  <>
                    <button
                      type="button"
                      className="btn-primary text-sm"
                      disabled={!!busy}
                      onClick={() => handleApproveAndGenerate(p._id)}
                    >
                      {busy === p._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      {busy === p._id ? "Processing…" : "Approve & Generate"}
                    </button>
                    <button
                      type="button"
                      className="btn-danger text-sm"
                      disabled={!!busy}
                      onClick={() => { setRejectModal(p._id); setRejectReason(""); }}
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {viewPayment && (
        <Modal open={true} onClose={() => setViewPayment(null)}>
          <div className="p-6 space-y-4 max-w-lg mx-auto">
            <h2 className="text-lg font-semibold text-ink">Payment Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-text-secondary block">Student</span><span className="font-medium text-ink">{viewPayment.studentName}</span></div>
              <div><span className="text-text-secondary block">Email</span><span className="font-medium text-ink">{viewPayment.email}</span></div>
              <div><span className="text-text-secondary block">Program</span><span className="font-medium text-ink">{viewPayment.programName}</span></div>
              <div><span className="text-text-secondary block">Amount</span><span className="font-medium text-ink">₹{viewPayment.amount}</span></div>
              <div><span className="text-text-secondary block">Certificate ID</span><span className="font-medium text-ink">{viewPayment.certificateId}</span></div>
              <div><span className="text-text-secondary block">Transaction ID</span><span className="font-medium text-ink">{viewPayment.transactionId}</span></div>
              <div><span className="text-text-secondary block">Status</span><Badge tone={statusTone[viewPayment.status] || "default"}>{viewPayment.status}</Badge></div>
              <div><span className="text-text-secondary block">Submitted</span><span className="font-medium text-ink">{new Date(viewPayment.submittedAt).toLocaleString()}</span></div>
              {viewPayment.approvedAt && <div><span className="text-text-secondary block">Approved</span><span className="font-medium text-ink">{new Date(viewPayment.approvedAt).toLocaleString()}</span></div>}
              {viewPayment.rejectionReason && <div className="col-span-2"><span className="text-danger block">Rejection reason</span><span className="font-medium text-danger/80">{viewPayment.rejectionReason}</span></div>}
            </div>
            {viewPayment.screenshotUrl && (
              <a href={viewPayment.screenshotUrl} target="_blank" rel="noreferrer" className="btn-secondary text-sm w-full justify-center">
                <ExternalLink size={14} /> View payment screenshot
              </a>
            )}
          </div>
        </Modal>
      )}

      {rejectModal && (
        <Modal open={true} onClose={() => { setRejectModal(null); setRejectReason(""); }}>
          <div className="p-6 space-y-4 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-ink">Reject Payment</h2>
            <p className="text-sm text-text-secondary">Provide a reason for rejecting this payment.</p>
            <Textarea
              label="Rejection reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Enter reason for rejection..."
            />
            <div className="flex gap-2">
              <button type="button" className="btn-danger text-sm" disabled={!!busy || !rejectReason.trim()} onClick={handleReject}>
                <XCircle size={14} />
                {busy === rejectModal + "reject" ? "Rejecting…" : "Confirm Reject"}
              </button>
              <button type="button" className="btn-ghost text-sm" onClick={() => { setRejectModal(null); setRejectReason(""); }}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
