import type { ReactNode } from "react";

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  size: 1.5 + (i % 3) * 1.5,
  x: ((i * 37) % 100),
  y: ((i * 53 + 17) % 100),
  delay: (i % 8) * 2.5,
  duration: 15 + (i % 6) * 3,
}));

export function AuroraBackground({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Base gradient */}
      <div className="absolute inset-0 -z-10 aurora-bg" />

      {/* Grid overlay */}
      <div className="absolute inset-0 -z-10 hero-grid-bg" />

      {/* Aurora layer — top-left large */}
      <div
        className="absolute -top-48 left-1/2 -z-10 size-[600px] sm:size-[800px] -translate-x-1/2 rounded-full animate-aurora"
        style={{
          background:
            "radial-gradient(circle, rgba(7,40,74,0.12) 0%, rgba(29,78,216,0.08) 30%, transparent 70%)",
        }}
      />

      {/* Aurora layer — bottom-left */}
      <div
        className="absolute -bottom-64 left-1/4 -z-10 size-[500px] sm:size-[700px] animate-aurora-2"
        style={{
          background:
            "radial-gradient(circle, rgba(29,78,216,0.08) 0%, rgba(7,40,74,0.06) 40%, transparent 70%)",
        }}
      />

      {/* Aurora layer — right side */}
      <div
        className="absolute right-0 top-1/3 -z-10 size-[400px] sm:size-[600px] animate-aurora"
        style={{
          background:
            "radial-gradient(circle, rgba(7,40,74,0.06) 0%, transparent 60%)",
        }}
      />

      {/* Deep blue-violet drift aura */}
      <div
        className="absolute -top-32 -right-32 -z-10 size-[500px] animate-aurora-drift"
        style={{
          background:
            "radial-gradient(circle, rgba(29,78,216,0.07) 0%, rgba(99,102,241,0.04) 30%, transparent 70%)",
        }}
      />

      {/* Soft center glow */}
      <div
        className="absolute left-1/2 top-1/3 -z-10 size-[400px] -translate-x-1/2 animate-aurora-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(7,40,74,0.04) 0%, transparent 60%)",
        }}
      />

      {/* Spotlight */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 animate-spotlight"
        style={{
          background:
            "radial-gradient(600px circle at 50% 0%, rgba(7,40,74,0.06), transparent 70%)",
        }}
      />

      {/* Floating particles */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-[#07284a]/20 dark:bg-[#60a5fa]/20"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              animation: `particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {children}
    </div>
  );
}
