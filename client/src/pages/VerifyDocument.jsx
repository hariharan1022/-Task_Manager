import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Award,
  FileText,
  IdCard,
  Loader2,
  Search,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { api } from "../utils/axios.js";
import { useManagedLoading } from "../hooks/useManagedLoading.js";
import CertificateDocument from "../components/certificate/CertificateDocument.jsx";
import OfferLetterDocument from "../components/offer/OfferLetterDocument.jsx";
import IdCardDocument from "../components/idcard/IdCardDocument.jsx";
import { Spinner } from "../components/common/index.jsx";

const TYPES = [
  { id: "certificate", label: "Certificate", icon: Award, prefix: "CERT- / SKY-" },
  { id: "offer", label: "Offer Letter", icon: FileText, prefix: "OFFER-" },
  { id: "intern", label: "Intern ID", icon: IdCard, prefix: "SKX-" },
];

function ResultBadge({ valid }) {
  if (valid) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800">
        <ShieldCheck size={18} /> Verified — Authentic document
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-4 py-2 text-sm font-semibold text-red-800">
      <ShieldX size={18} /> Invalid — Not found
    </span>
  );
}

function OfferResult({ data }) {
  const offer = data.offer;
  const mockApp = {
    _id: offer.internId,
    internId: offer.internId,
    offerLetterId: offer.offerLetterId,
    appliedAt: offer.issuedAt,
    internshipMode: offer.mode,
  };
  const mockInternship = {
    title: offer.program,
    domain: offer.domain,
    duration: offer.duration,
  };
  return (
    <div className="space-y-4">
      <OfferLetterDocument
        application={mockApp}
        internship={mockInternship}
        studentName={offer.candidateName}
      />
    </div>
  );
}

function InternResult({ data, user }) {
  const intern = data.intern;
  const mockApp = {
    _id: intern.internId,
    internId: intern.internId,
    offerLetterId: intern.offerLetterId,
    appliedAt: intern.validFrom,
    internshipMode: intern.mode,
  };
  const mockUser = {
    fullName: intern.candidateName,
    email: intern.email,
    phone: intern.phone,
    college: intern.college,
    department: intern.department,
    profilePhoto: intern.profilePhoto,
  };
  const mockInternship = {
    title: intern.program,
    domain: intern.domain,
    duration: intern.duration,
  };
  return (
    <IdCardDocument user={mockUser} application={mockApp} internship={mockInternship} />
  );
}

export default function VerifyDocument() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [activeType, setActiveType] = useState("certificate");
  const { loading, run } = useManagedLoading(false);
  const [state, setState] = useState({ data: null, error: null });

  const verify = async (id) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    try {
      const res = await run(() => api.get("/verify/search", { params: { q: trimmed } }));
      setState({ data: res.data, error: null });
    } catch (err) {
      setState({
        data: null,
        error: err.response?.data?.message || err.message || "Verification failed",
      });
    }
  };

  useEffect(() => {
    const q = params.get("q");
    if (q) {
      setQuery(q);
      verify(q);
    }
  }, [params]);

  const onSubmit = (e) => {
    e.preventDefault();
    setParams(query.trim() ? { q: query.trim() } : {});
    verify(query);
  };

  return (
    <div className="verify-page max-w-5xl mx-auto px-4 py-10 sm:py-14">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center mx-auto mb-4 shadow-lg">
          <ShieldCheck size={30} />
        </div>
        <h1 className="text-3xl font-display font-bold text-ink tracking-tight">
          Document Verification Portal
        </h1>
        <p className="text-sm text-text-secondary mt-2 max-w-xl mx-auto">
          Verify Offer Letters, Completion Certificates, and Intern ID Cards issued by SKYROVIX.
          Enter any document ID or scan the QR code on the document.
        </p>
      </div>

      <div className="card p-6 mb-6">
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input pl-10 h-11"
              placeholder="Enter Certificate ID, Offer Letter ID, or Intern ID (SKX-…)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary h-11 px-6" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Verify"}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {TYPES.map(({ id, label, icon: Icon, prefix }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveType(id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                activeType === id
                  ? "border-blue-600 bg-blue-50 text-blue-800"
                  : "border-border text-text-secondary hover:border-blue-300"
              }`}
            >
              <Icon size={14} /> {label}
              <span className="text-[10px] font-normal opacity-70">({prefix})</span>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="card p-12 flex flex-col items-center gap-3">
          <Spinner size={28} />
          <p className="text-sm text-text-secondary">Verifying document…</p>
        </div>
      )}

      {!loading && state.error && (
        <div className="card p-6">
          <ResultBadge valid={false} />
          <p className="mt-3 text-sm text-text-secondary">{state.error}</p>
          <Link to="/register" className="inline-block mt-4 text-sm text-primary font-semibold hover:underline">
            New student? Create an account →
          </Link>
        </div>
      )}

      {!loading && state.data?.valid && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ResultBadge valid />
            <button type="button" className="btn-secondary text-sm" onClick={() => window.print()}>
              Print / Save PDF
            </button>
          </div>

          {state.data.type === "certificate" && (
            <CertificateDocument data={state.data.certificate} />
          )}
          {state.data.type === "offer" && <OfferResult data={state.data} />}
          {state.data.type === "intern" && <InternResult data={state.data} />}
        </div>
      )}

      {!loading && !state.data && !state.error && (
        <div className="card p-8 text-center text-sm text-text-secondary">
          Enter a document ID above to verify its authenticity.
        </div>
      )}
    </div>
  );
}
