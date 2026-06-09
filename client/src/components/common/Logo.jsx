import { Link } from "react-router-dom";
import clsx from "clsx";
import { assetUrl } from "../../utils/paths.js";

export default function Logo({ className, linkTo = "/", size = "md", showTagline = false }) {
  const href = linkTo === false || linkTo === null ? null : linkTo || "/";
  const sizes = {
    sm: "h-8",
    md: "h-10",
    lg: "h-14",
    xl: "h-20",
  };

  const content = (
    <div className={clsx("flex items-center gap-2.5", className)}>
      <img
        src={assetUrl("/skyrovix-logo.png")}
        alt="SKYROVIX"
        className={clsx(sizes[size] || sizes.md, "w-auto object-contain")}
      />
      {showTagline && (
        <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.2em] text-text-secondary">
          Internships
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
        {content}
      </Link>
    );
  }

  return <div className="flex-shrink-0">{content}</div>;
}
