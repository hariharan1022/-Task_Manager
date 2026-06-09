import {
  Award,
  ClipboardList,
  FileText,
  Linkedin,
  ListChecks,
} from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Apply to an internship",
    desc: "Fill out the application form with your motivation, skills, and availability.",
  },
  {
    icon: FileText,
    title: "Receive your offer letter",
    desc: "Once accepted, your PDF offer letter is generated instantly in your dashboard.",
  },
  {
    icon: Linkedin,
    title: "Share on LinkedIn",
    desc: "Post your offer letter on LinkedIn, then paste the post URL on Skyrovix to verify.",
  },
  {
    icon: ListChecks,
    title: "Complete 5 mentor-reviewed tasks",
    desc: "After your LinkedIn link is approved, all five sequenced tasks unlock one by one.",
  },
  {
    icon: Award,
    title: "Earn your certificate",
    desc: "When all 5 tasks are approved, your verifiable internship certificate is generated automatically.",
  },
];

export default function InternshipPath({ compact = false }) {
  return (
    <ol className={compact ? "space-y-4" : "grid sm:grid-cols-2 lg:grid-cols-5 gap-4"}>
      {steps.map((step, i) => (
        <li
          key={step.title}
          className={
            compact
              ? "flex gap-4 min-w-0"
              : "relative rounded-2xl border border-border bg-white p-5 shadow-card min-w-0"
          }
        >
          <div
            className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-brand text-white flex items-center justify-center font-bold text-sm shadow-glow ${
              compact ? "" : "mb-4"
            }`}
          >
            {compact ? i + 1 : <step.icon size={18} />}
          </div>
          <div className="min-w-0">
            {!compact && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Step {i + 1}
              </span>
            )}
            <h3 className={`font-bold text-ink break-words ${compact ? "text-base" : "text-sm mt-1"}`}>
              {step.title}
            </h3>
            <p className="mt-1 text-sm text-text-secondary leading-relaxed break-words">
              {step.desc}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
