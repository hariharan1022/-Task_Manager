import clsx from "clsx";

export function Avatar({ src, name = "U", size = 36, className }) {
  const initials = (name || "U")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const dim = { width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.4)) };
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx("rounded-full object-cover bg-primary-light", className)}
        style={dim}
      />
    );
  }
  return (
    <div
      className={clsx(
        "rounded-full bg-primary-light text-primary flex items-center justify-center font-semibold flex-shrink-0",
        className
      )}
      style={dim}
    >
      {initials || "U"}
    </div>
  );
}
