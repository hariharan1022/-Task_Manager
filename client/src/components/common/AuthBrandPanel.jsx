import { Link } from "react-router-dom";
import { assetUrl } from "../../utils/paths.js";
import { ShieldCheck, Award, FileText, CheckCircle2 } from "lucide-react";

export default function AuthBrandPanel({
  variant = "login",
  title,
  subtitle,
  bullets,
  footerNote,
}) {
  const copy = {
    login: {
      title: title || "Welcome back, future intern.",
      subtitle:
        subtitle ||
        "Pick up exactly where you left off — tasks, deadlines and your next certificate are waiting.",
      bullets: bullets || [
        { icon: CheckCircle2, text: "Track tasks, scores and deadlines in one place" },
        { icon: FileText, text: "Auto-generated offer letters and certificates" },
        { icon: Award, text: "Verifiable credentials recruiters actually respect" },
      ],
    },
    register: {
      title: title || "Your internship, your edge.",
      subtitle:
        subtitle ||
        "Free to join. Apply to curated programs, get mentor feedback, and earn certificates recruiters respect.",
      bullets: bullets || [
        { icon: ShieldCheck, text: "No prior experience required for most programs" },
        { icon: FileText, text: "Verifiable certificates with QR code" },
        { icon: CheckCircle2, text: "Mentor-reviewed task submissions" },
      ],
    },
    forgot: {
      title: title || "Reset your password",
      subtitle:
        subtitle ||
        "Enter your email and we'll send a secure link to set a new password.",
      bullets: bullets || [
        { icon: ShieldCheck, text: "Reset links expire after 30 minutes" },
        { icon: CheckCircle2, text: "You'll be signed out on all devices" },
        { icon: FileText, text: "Your tasks and certificates stay safe" },
      ],
    },
  }[variant] || {};

  return (
    <div className="relative h-full overflow-hidden bg-gradient-brand text-white">
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="relative h-full flex flex-col p-8 sm:p-10 lg:p-12">
        <Link to="/" className="inline-block group">
          <div className="inline-flex rounded-2xl bg-white px-4 py-3 shadow-lg ring-1 ring-white/20 group-hover:shadow-xl transition">
            <img
              src={assetUrl("/skyrovix-logo.png")}
              alt="SKYROVIX"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 mt-3">
            BUILD THE FUTURE
          </div>
        </Link>

        <div className="my-auto py-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold leading-[1.05] max-w-md">
            {copy.title}
          </h2>
          <p className="mt-4 text-white/80 max-w-md leading-relaxed">{copy.subtitle}</p>
          <ul className="mt-7 space-y-3 max-w-md">
            {copy.bullets?.map((b, i) => (
              <li key={i} className="flex items-center gap-3 text-white/90">
                <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <b.icon size={15} />
                </span>
                <span className="text-sm">{b.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between text-xs text-white/60">
          <span>{footerNote || `© ${new Date().getFullYear()} skyrovix`}</span>
          <div className="hidden sm:flex items-center gap-1">
            <ShieldCheck size={12} /> Secure session
          </div>
        </div>
      </div>
    </div>
  );
}
