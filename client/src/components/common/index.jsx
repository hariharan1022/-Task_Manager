import clsx from "clsx";

export function Button({ variant = "primary", className, children, ...rest }) {
  const map = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    danger: "btn-danger",
  };
  return (
    <button className={clsx(map[variant], className)} {...rest}>
      {children}
    </button>
  );
}

export function Input({ label, error, className, ...rest }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      <input className="input" {...rest} />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className, ...rest }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      <textarea className="input min-h-[100px] resize-y" {...rest} />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Select({ label, error, options = [], className, ...rest }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      <select className="input" {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Card({ className, children, ...rest }) {
  return (
    <div className={clsx("card p-6", className)} {...rest}>
      {children}
    </div>
  );
}

export function Badge({ tone = "default", children, className }) {
  const tones = {
    default: "bg-surface text-text-secondary",
    primary: "bg-primary-light text-primary",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-cyan-50 text-cyan-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <span className={clsx("chip", tones[tone], className)}>{children}</span>
  );
}

export function ProgressBar({ value, max = 100, className }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={clsx("h-2 w-full rounded-full bg-surface overflow-hidden", className)}>
      <div
        className="h-full rounded-full bg-gradient-brand transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Spinner({ size = 20, className }) {
  return (
    <svg
      className={clsx("animate-spin text-primary", className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.2"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EmptyState({ icon: Icon, title, description, action, cta }) {
  return (
    <div className="card p-10 text-center flex flex-col items-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-primary-light text-primary flex items-center justify-center mb-4">
          <Icon size={26} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary mt-1 max-w-md">{description}</p>
      )}
      {(action || cta) && <div className="mt-4">{action || cta}</div>}
    </div>
  );
}

export function FullPageSpinner({ label = "Loading…" }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-3">
      <Spinner size={28} />
      <div className="text-sm text-text-secondary">{label}</div>
    </div>
  );
}

export { Modal, ConfirmDialog } from "./Modal.jsx";
export { Avatar } from "./Avatar.jsx";
export { PasswordInput, PasswordStrength, passwordStrength } from "./PasswordInput.jsx";
export { default as UserMenu } from "./UserMenu.jsx";
export { default as AuthBrandPanel } from "./AuthBrandPanel.jsx";
export { default as Logo } from "./Logo.jsx";
export { default as LogoutOverlay } from "./LogoutOverlay.jsx";
export { default as SessionExpiredModal } from "./SessionExpiredModal.jsx";
export { default as VerifyQRCode } from "./VerifyQRCode.jsx";
