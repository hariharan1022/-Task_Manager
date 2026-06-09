import { forwardRef, useMemo, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import clsx from "clsx";

export function passwordStrength(pwd = "") {
  if (!pwd) return { score: 0, label: "Empty", tone: "default" };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 12) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  const map = [
    { label: "Very weak", tone: "danger" },
    { label: "Weak", tone: "danger" },
    { label: "Fair", tone: "warning" },
    { label: "Good", tone: "info" },
    { label: "Strong", tone: "success" },
    { label: "Excellent", tone: "success" },
  ];
  return { score, ...map[score] };
}

export function PasswordStrength({ password }) {
  const { score, label, tone } = useMemo(() => passwordStrength(password), [password]);
  const pct = Math.min(100, (score / 5) * 100);
  const color = {
    danger: "bg-danger",
    warning: "bg-warning",
    info: "bg-accent",
    success: "bg-success",
    default: "bg-border",
  }[tone];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className={clsx("h-full transition-all duration-300", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px]">
        <span className="text-text-secondary">Password strength</span>
        <span
          className={clsx(
            "font-medium",
            tone === "danger" && "text-danger",
            tone === "warning" && "text-warning",
            tone === "info" && "text-accent",
            tone === "success" && "text-success"
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

export const PasswordInput = forwardRef(function PasswordInput(
  {
    label,
    error,
    showStrength = false,
    strengthValue,
    autoComplete = "current-password",
    className,
    inputClassName,
    id,
    name,
    onChange,
    onBlur,
    ...rest
  },
  ref
) {
  const [show, setShow] = useState(false);
  const [local, setLocal] = useState("");

  const strengthSource = strengthValue ?? local;

  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative">
        <Lock
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          ref={ref}
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          className={clsx(
            "input pl-10 pr-10 min-h-[44px]",
            inputClassName,
            error && "border-danger focus:border-danger"
          )}
          onBlur={onBlur}
          onChange={(e) => {
            setLocal(e.target.value);
            onChange?.(e);
          }}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-muted hover:text-ink hover:bg-surface touch-manipulation"
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {showStrength && <PasswordStrength password={strengthSource} />}
    </div>
  );
});
