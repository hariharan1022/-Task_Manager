import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { AuthBrandPanel, Logo, PasswordInput } from "../components/common/index.jsx";
import toast from "react-hot-toast";

export default function Register() {
  const { register: registerUser, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      college: "",
      department: "",
      graduationYear: "",
    },
  });

  const password = watch("password", "");

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const prefill = location.state?.email;
    if (prefill) setValue("email", prefill);
  }, [location.state?.email, setValue]);

  const onSubmit = async (data) => {
    if (!data.password?.trim()) {
      toast.error("Please enter a password");
      return;
    }
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const res = await registerUser({
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        phone: data.phone?.trim() || undefined,
        college: data.college?.trim() || undefined,
        department: data.department?.trim() || undefined,
        graduationYear: data.graduationYear
          ? Number(data.graduationYear)
          : undefined,
      });
      toast.success(res.message || "Welcome to SKYROVIX!");
      if (res.devOtp) {
        toast(`Email verify OTP (dev): ${res.devOtp}`, { icon: "🔐", duration: 10000 });
      }
      const to = location.state?.from?.pathname || "/dashboard";
      navigate(to, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const email = data.email?.trim().toLowerCase();
      if (status === 409) {
        toast.error("This email is already registered. Sign in instead.");
        navigate("/login", {
          replace: true,
          state: { email, from: location.state?.from },
        });
        return;
      }
      const message =
        err.response?.data?.message || "Could not create account. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface">
      <div className="hidden lg:block order-2">
        <AuthBrandPanel variant="register" />
      </div>

      <div className="flex items-center justify-center p-5 sm:p-8 lg:p-12 order-1 relative">
        <div className="absolute inset-0 -z-10 opacity-50 [background-image:radial-gradient(circle_at_20%_10%,rgba(124,58,237,0.08),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(79,70,229,0.08),transparent_40%)]" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          <div className="lg:hidden mb-6 flex items-center justify-between gap-3">
            <Logo size="sm" />
            <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </div>

          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-secondary bg-secondary-light px-2.5 py-1 rounded-full">
              <Sparkles size={12} /> Free to join
            </span>
            <h1 className="mt-3 text-3xl sm:text-4xl font-display font-bold text-ink tracking-tight">
              Create your account
            </h1>
            <p className="text-text-secondary mt-1.5 text-sm">
              Already have one?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="label" htmlFor="fullName">Full name</label>
              <div className="relative group">
                <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition pointer-events-none" />
                <input
                  id="fullName"
                  autoComplete="name"
                  autoFocus
                  placeholder="Jane Doe"
                  className="input pl-10 h-11"
                  {...register("fullName", {
                    required: "Full name is required",
                    minLength: { value: 2, message: "Too short" },
                    maxLength: { value: 80, message: "Too long" },
                  })}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1.5 text-xs text-danger">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative group">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@college.edu"
                  className="input pl-10 h-11"
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
              <PasswordInput
                id="password"
                label="Password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                showStrength
                strengthValue={password}
                error={errors.password?.message}
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 8, message: "Use at least 8 characters" },
                })}
              />
            </div>

            <div>
              <PasswordInput
                id="confirmPassword"
                label="Confirm password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (v) =>
                    v === watch("password") || "Passwords do not match",
                })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="phone">Phone</label>
                <div className="relative group">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition pointer-events-none" />
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Optional"
                    className="input pl-10 h-11"
                    {...register("phone", {
                      pattern: {
                        value: /^[+0-9\s\-()]{6,20}$/,
                        message: "Enter a valid phone",
                      },
                    })}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1.5 text-xs text-danger">{errors.phone.message}</p>
                )}
              </div>
              <div>
                <label className="label" htmlFor="graduationYear">Graduation year</label>
                <div className="relative group">
                  <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition pointer-events-none" />
                  <input
                    id="graduationYear"
                    type="number"
                    inputMode="numeric"
                    min="1990"
                    max="2050"
                    placeholder="2026"
                    className="input pl-10 h-11"
                    {...register("graduationYear", {
                      min: { value: 1990, message: "Invalid year" },
                      max: { value: 2050, message: "Invalid year" },
                    })}
                  />
                </div>
                {errors.graduationYear && (
                  <p className="mt-1.5 text-xs text-danger">{errors.graduationYear.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="college">College</label>
                <div className="relative group">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition pointer-events-none" />
                  <input
                    id="college"
                    autoComplete="organization"
                    placeholder="Your college"
                    className="input pl-10 h-11"
                    {...register("college")}
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="department">Department</label>
                <input
                  id="department"
                  placeholder="e.g. Computer Science"
                  className="input h-11"
                  {...register("department")}
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-text-secondary cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                required
                className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30"
              />
              <span>
                I agree to the{" "}
                <a className="text-primary hover:underline" href="#">Terms of Service</a>{" "}
                and{" "}
                <a className="text-primary hover:underline" href="#">Privacy Policy</a>.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full h-11 text-base"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Creating account…
                </>
              ) : (
                <>
                  Create account <ArrowRight size={16} />
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-text-secondary">
              Already registered? Use the same email on{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>{" "}
              — no need to create another account.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
