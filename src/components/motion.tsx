import { useRef, useEffect, type ReactNode, type HTMLAttributes } from "react";

export function FadeUp({
  children,
  delay = 0,
  duration = 0.6,
  y = 24,
  className = "",
  ...props
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        opacity: 0,
        transform: `translateY(${y}px)`,
        animation: `fade-in-up ${duration}s ease-out ${delay}s forwards`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
  ...props
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        opacity: 0,
        animation: `fade-in ${duration}s ease-out ${delay}s forwards`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function ScaleIn({
  children,
  delay = 0,
  className = "",
  ...props
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        opacity: 0,
        transform: "scale(0.95)",
        animation: `scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s forwards`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  threshold = 0.1,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(30px)",
        transition: `opacity 0.7s ease-out ${delay}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export function Stagger({
  children,
  className = "",
  staggerDelay = 0.08,
  baseDelay = 0.1,
}: {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  baseDelay?: number;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <FadeUp key={i} delay={baseDelay + i * staggerDelay}>
          {child}
        </FadeUp>
      ))}
    </div>
  );
}

export function SlideLeft({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        opacity: 0,
        transform: "translateX(-30px)",
        animation: `scroll-reveal-left 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s forwards`,
      }}
    >
      {children}
    </div>
  );
}

export function SlideRight({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        opacity: 0,
        transform: "translateX(30px)",
        animation: `scroll-reveal-right 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s forwards`,
      }}
    >
      {children}
    </div>
  );
}
