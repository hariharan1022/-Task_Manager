import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Mail, Sparkles, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "../utils/axios.js";
import AuthBrandPanel from "../components/common/AuthBrandPanel.jsx";

export default function ForgotPassword() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("If that email exists, a reset link has been sent.");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface">
      <div className="hidden lg:block">
        <AuthBrandPanel variant="forgot" />
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10 relative">
        <div className="absolute inset-0 -z-10 opacity-50 [background-image:radial-gradient(circle_at_20%_10%,rgba(6,182,212,0.08),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(79,70,229,0.08),transparent_40%)]" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-6 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white">
                <Sparkles size={16} />
              </div>
              <div className="font-display font-bold text-ink">skyrovix</div>
            </Link>
            <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-ink mb-6"
          >
            <ArrowLeft size={14} /> Back to sign in
          </Link>

          {sent ? (
            <div className="card p-7 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-success flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={26} />
              </div>
              <h1 className="text-2xl font-display font-bold text-ink">Check your email</h1>
              <p className="text-sm text-text-secondary mt-2">
                We sent a password reset link to{" "}
                <span className="font-semibold text-ink">{email}</span>. The link
                expires in 30 minutes.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="btn-primary mt-6 w-full"
              >
                Back to sign in
              </button>
              <button
                onClick={() => setSent(false)}
                className="btn-ghost mt-2 w-full"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent bg-accent-light px-2.5 py-1 rounded-full">
                <ShieldCheck size={12} /> Account recovery
              </span>
              <h1 className="mt-3 text-3xl font-display font-bold text-ink">
                Forgot your password?
              </h1>
              <p className="text-text-secondary mt-1.5 text-sm">
                Enter the email you used to register and we'll send you a secure
                reset link.
              </p>

              <form className="mt-7 space-y-4" onSubmit={onSubmit}>
                <div>
                  <label className="label">Email</label>
                  <div className="relative group">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition"
                    />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10 h-11"
                      placeholder="you@college.edu"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !email}
                  className="btn-primary w-full h-11"
                >
                  {submitting ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <p className="text-center text-sm text-text-secondary mt-6">
                Remembered it?{" "}
                <Link to="/login" className="text-primary font-semibold">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
