import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  ArrowRight,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Wifi,
  WifiOff,
  RefreshCw,
  Timer,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { AuthBrandPanel, Logo, PasswordInput } from "../components/common/index.jsx";
import { api } from "../utils/axios.js";
import {
  DEFAULT_PRODUCTION_API,
  getApiBaseUrl,
  isHostedOnGitHubPages,
  usesRemoteApi,
} from "../utils/apiConfig.js";
import toast from "react-hot-toast";

const DEMO = { email: "student@skyrovix.local", password: "Student@12345" };

function explainError(err) {
  if (err?.response) {
    const status = err.response.status;
    const msg = err.response.data?.message;
    if (status === 401) {
      return (
        msg ||
        "Invalid email or password. If you registered before a server restart, create a new account or contact support."
      );
    }
    if (status === 403) return msg || "Please verify your email before signing in.";
    if (status === 429) {
      return (
        msg ||
        "Too many login attempts. Wait a few minutes, or restart the API server to reset the limit in local dev."
      );
    }
    if (status === 503) {
      return (
        msg ||
        "Database is not connected. Check MongoDB Atlas network access and restart the API."
      );
    }
    if (status >= 500) return msg || "Server error. Please try again in a moment.";
    return msg || `Request failed (${status}).`;
  }
  if (err?.request) {
    if (usesRemoteApi() || isHostedOnGitHubPages()) {
      return "Can't reach the API. Wait up to 60s (Render free tier waking up), then Retry.";
    }
    return "Can't reach the server. From project root run: npm run dev";
  }
  return err?.message || "Login failed. Please try again.";
}

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [serverOk, setServerOk] = useState(null);
  const [dbOk, setDbOk] = useState(null);
  const [checking, setChecking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimer = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
  });

  const checkServer = useCallback(async () => {
    setChecking(true);
    try {
      const { data } = await api.get("/health", {
        timeout: usesRemoteApi() ? 90000 : 10000,
      });
      const apiHealthy = data?.status === "ok";
      const dbConnected = data?.db === "connected";
      setServerOk(apiHealthy);
      setDbOk(dbConnected);
      if (!apiHealthy) toast.error("API responded but health check failed.");
      else if (!dbConnected) toast.error("API is up but database is not connected.");
    } catch {
      if (usesRemoteApi() || isHostedOnGitHubPages()) {
        const nextRetry = retryCount + 1;
        if (nextRetry <= 6) {
          const delay = Math.min(nextRetry * 5000, 30000);
          setRetryCount(nextRetry);
          retryTimer.current = setTimeout(() => {
            setRetryCount((prev) => Math.max(prev - 1, 0));
            checkServer();
          }, delay);
        } else {
          setServerOk(false);
          setDbOk(false);
          setRetryCount(0);
        }
      } else {
        setServerOk(false);
        setDbOk(false);
      }
    } finally {
      setChecking(false);
    }
  }, [retryCount]);

  useEffect(() => {
    checkServer();
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  useEffect(() => {
    if (location.state?.email) {
      setValue("email", location.state.email, { shouldValidate: true });
    }
  }, [location.state?.email, setValue]);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    }
  }, [authLoading, user, navigate, location.state?.from?.pathname]);

  const useDemo = () => {
    setValue("email", DEMO.email, { shouldValidate: true, shouldDirty: true });
    setValue("password", DEMO.password, { shouldValidate: true, shouldDirty: true });
    setShowDemo(true);
    toast.success("Demo credentials filled — press Sign in", { duration: 2400 });
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await login(data.email.trim().toLowerCase(), data.password, data.remember);
      toast.success("Welcome back!");
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      toast.error(explainError(err));
      if (!err?.response) checkServer();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface">
      <div className="hidden lg:block">
        <AuthBrandPanel variant="login" />
      </div>

      <div className="flex items-center justify-center p-5 sm:p-8 lg:p-12 relative">
        <div className="absolute inset-0 -z-10 opacity-50 [background-image:radial-gradient(circle_at_20%_10%,rgba(79,70,229,0.08),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(6,182,212,0.08),transparent_40%)]" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-6 flex items-center justify-between gap-3">
            <Logo size="sm" />
            <Link
              to="/register"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Sign up
            </Link>
          </div>

          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary bg-primary-light px-2.5 py-1 rounded-full">
              <ShieldCheck size={12} /> Secure sign in
            </span>
            <h1 className="mt-3 text-3xl sm:text-4xl font-display font-bold text-ink tracking-tight">
              Welcome back
            </h1>
            <p className="text-text-secondary mt-1.5 text-sm">
              New to skyrovix?{" "}
              <Link
                to="/register"
                className="text-primary font-semibold hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>

          {retryCount > 0 && serverOk !== false && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <Timer size={16} className="mt-0.5 flex-shrink-0 animate-pulse" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold">Waking up server…</div>
                <p className="text-xs mt-1">
                  Retry {retryCount}/6 · Server waking from sleep, please wait.
                </p>
              </div>
            </div>
          )}
          {serverOk === false && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <WifiOff size={16} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold">API not reachable</div>
                {usesRemoteApi() || isHostedOnGitHubPages() ? (
                  <div className="text-xs mt-1 space-y-1 leading-relaxed">
                    <p>
                      Using cloud API on Render. Free tier sleeps when idle — click{" "}
                      <strong>Retry</strong> and wait.
                    </p>
                    <p className="text-[11px] text-red-700/80 break-all">
                      {getApiBaseUrl() || DEFAULT_PRODUCTION_API}
                    </p>
                    <a
                      href={`${getApiBaseUrl() || DEFAULT_PRODUCTION_API}/health`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-xs font-semibold underline"
                    >
                      Open API health check in new tab
                    </a>
                  </div>
                ) : (
                  <div className="text-xs mt-1 space-y-1">
                    <p>
                      Start the API from the project root:
                    </p>
                    <code className="block font-mono bg-white/60 px-2 py-1 rounded text-[11px]">
                      npm run dev
                    </code>
                    <p className="text-[11px]">
                      Or in two terminals: <code className="font-mono">server</code> then{" "}
                      <code className="font-mono">client</code> — each with{" "}
                      <code className="font-mono">npm run dev</code>.
                    </p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={checkServer}
                className="text-xs font-semibold underline flex items-center gap-1 flex-shrink-0"
              >
                <RefreshCw size={12} className={checking ? "animate-spin" : ""} /> Retry
              </button>
            </div>
          )}
          {serverOk === true && dbOk === true && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
              <Wifi size={12} /> API and database connected
            </div>
          )}
          {serverOk === true && dbOk === false && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <WifiOff size={16} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold">Database not connected</div>
                <div className="text-xs mt-0.5">
                  In MongoDB Atlas, open <strong>Network Access</strong> and allow your IP (or{" "}
                  <code className="font-mono bg-white/60 px-1 rounded">0.0.0.0/0</code> for dev).
                  Then restart <code className="font-mono bg-white/60 px-1 rounded">npm run dev</code> in{" "}
                  <code className="font-mono bg-white/60 px-1 rounded">server</code>.
                </div>
              </div>
              <button
                type="button"
                onClick={checkServer}
                className="text-xs font-semibold underline flex items-center gap-1 flex-shrink-0"
              >
                <RefreshCw size={12} className={checking ? "animate-spin" : ""} /> Retry
              </button>
            </div>
          )}

          <form
            className="space-y-5"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div>
              <label htmlFor="email" className="label">Email</label>
              <div className="relative group">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition pointer-events-none"
                />
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@college.edu"
                  className="input pl-10 h-11"
                  aria-invalid={!!errors.email}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email",
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="label mb-0">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="mt-1.5">
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-11"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 8, message: "Password must be at least 8 characters" },
                  })}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-danger">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-text-secondary cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30"
                  {...register("remember")}
                />
                <span>Keep me signed in</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full h-11 text-base relative overflow-hidden"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Signing you in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-text-secondary">or continue with</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => toast("Google sign-in coming soon", { icon: "🔒" })}
                className="btn-secondary h-11"
              >
                <GoogleIcon /> Google
              </button>
              <button
                type="button"
                onClick={() => toast("GitHub sign-in coming soon", { icon: "🔒" })}
                className="btn-secondary h-11"
              >
                <GitHubIcon /> GitHub
              </button>
            </div>

            <button
              type="button"
              onClick={useDemo}
              className="w-full mt-1 group flex items-center justify-between gap-3 rounded-xl border border-dashed border-primary/30 bg-primary-light/40 hover:bg-primary-light transition px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white text-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                  <KeyRound size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-ink">
                    Try with demo credentials
                  </div>
                  <div className="text-[11px] text-text-secondary truncate">
                    student@skyrovix.local · Student@12345
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-primary group-hover:translate-x-0.5 transition">
                {showDemo ? "Filled" : "Use"}
              </span>
            </button>

            <p className="text-center text-[11px] text-text-secondary mt-2">
              By signing in you agree to our{" "}
              <a className="text-primary hover:underline" href="#">Terms</a> and{" "}
              <a className="text-primary hover:underline" href="#">Privacy Policy</a>.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C40.9 36.6 44 31 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.7.5.7 5.5.7 11.8c0 5 3.2 9.2 7.7 10.7.6.1.8-.2.8-.6v-2c-3.1.7-3.8-1.5-3.8-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.8 2.7 1.3 3.4 1 .1-.7.4-1.3.7-1.6-2.5-.3-5.2-1.3-5.2-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.2 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.5-1.5 7.7-5.7 7.7-10.7C23.3 5.5 18.3.5 12 .5z" />
    </svg>
  );
}
