import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Award, ShieldCheck, ShieldX, Loader2, Download } from "lucide-react";
import { api } from "../utils/axios.js";
import CertificateDocument from "../components/certificate/CertificateDocument.jsx";

export default function VerifyCertificate() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    setState({ loading: true, data: null, error: null });
    api
      .get(`/certificates/verify/${id}`)
      .then((res) => setState({ loading: false, data: res.data, error: null }))
      .catch((err) =>
        setState({
          loading: false,
          data: null,
          error: err.response?.data?.message || "Verification failed",
        })
      );
  }, [id]);

  const printCertificate = () => {
    window.print();
  };

  return (
    <div className="certificate-verify-page max-w-4xl mx-auto px-4 py-10 sm:py-14">
      <div className="print:hidden text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-primary-light text-primary flex items-center justify-center mx-auto mb-4">
          <Award size={26} />
        </div>
        <h1 className="text-2xl font-display font-bold text-ink">Certificate Verification</h1>
        <p className="text-sm text-text-secondary mt-1 font-mono break-all">{id}</p>
      </div>

      {state.loading ? (
        <div className="card p-12 flex justify-center print:hidden">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : state.error || !state.data?.valid ? (
        <div className="card p-6 print:hidden">
          <div className="rounded-xl bg-red-50 border border-red-100 p-4 flex gap-3">
            <ShieldX className="text-danger shrink-0" />
            <div>
              <div className="font-semibold text-danger">Invalid certificate</div>
              <div className="text-sm text-text-secondary mt-0.5">
                {state.error || "We could not find this certificate."}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="print:hidden mb-4 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800">
              <ShieldCheck size={18} /> Valid certificate
            </span>
            <button type="button" className="btn-secondary text-sm" onClick={printCertificate}>
              <Download size={16} /> Print / save as PDF
            </button>
          </div>
          <CertificateDocument data={state.data.certificate} />
        </>
      )}
    </div>
  );
}
