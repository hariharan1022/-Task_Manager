const LOGOS = [
  { top: "2%",  left: "3%",  delay: "0s",    size: 44, src: "https://cdn.simpleicons.org/html5/E34F26" },
  { top: "2%",  left: "50%", delay: "0.5s",  size: 44, src: "https://cdn.simpleicons.org/css/264DE4" },
  { top: "2%",  left: "85%", delay: "1s",    size: 44, src: "https://cdn.simpleicons.org/javascript/F7DF1E" },

  { top: "16%", left: "6%",  delay: "0.3s",  size: 42, src: "https://cdn.simpleicons.org/react/61DAFB" },
  { top: "14%", left: "40%", delay: "0.9s",  size: 40, src: "https://cdn.simpleicons.org/nextdotjs/000000" },
  { top: "16%", left: "82%", delay: "1.7s",  size: 42, src: "https://cdn.simpleicons.org/typescript/3178C6" },

  { top: "30%", left: "3%",  delay: "0.6s",  size: 46, src: "https://cdn.simpleicons.org/python/3776AB" },
  { top: "28%", left: "35%", delay: "1.4s",  size: 38, src: "https://cdn.simpleicons.org/openjdk/ED8B00" },
  { top: "30%", left: "78%", delay: "0.2s",  size: 46, src: "https://cdn.simpleicons.org/tailwindcss/06B6D4" },

  { top: "44%", left: "8%",  delay: "1.8s",  size: 40, src: "https://cdn.simpleicons.org/express/000000" },
  { top: "42%", left: "55%", delay: "0.7s",  size: 42, src: "https://cdn.simpleicons.org/flutter/02569B" },
  { top: "44%", left: "88%", delay: "1.2s",  size: 40, src: "https://cdn.simpleicons.org/php/777BB4" },

  { top: "58%", left: "4%",  delay: "2s",    size: 44, src: "https://cdn.simpleicons.org/mysql/4479A1" },
  { top: "56%", left: "45%", delay: "0.4s",  size: 40, src: "https://cdn.simpleicons.org/amazonwebservices/FF9900" },
  { top: "58%", left: "85%", delay: "1.5s",  size: 44, src: "https://cdn.simpleicons.org/docker/2496ED" },

  { top: "72%", left: "6%",  delay: "0.8s",  size: 42, src: "https://cdn.simpleicons.org/firebase/FFCA28" },
  { top: "70%", left: "38%", delay: "2.1s",  size: 38, src: "https://cdn.simpleicons.org/mongodb/47A248" },
  { top: "72%", left: "82%", delay: "1.3s",  size: 42, src: "https://cdn.simpleicons.org/linux/FCC624" },

  { top: "86%", left: "10%", delay: "1.6s",  size: 40, src: "https://cdn.simpleicons.org/redux/764ABC" },
  { top: "84%", left: "50%", delay: "0.1s",  size: 40, src: "https://cdn.simpleicons.org/git/F05032" },
  { top: "86%", left: "85%", delay: "1.9s",  size: 40, src: "https://cdn.simpleicons.org/cplusplus/00599C" },
];

export function MobileFloatingIcons() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden md:hidden" aria-hidden="true">
      {LOGOS.map((l, i) => (
        <div
          key={i}
          className="absolute z-0 opacity-[0.25]"
          style={{
            top: l.top,
            left: l.left,
            width: l.size,
            height: l.size,
            willChange: "transform",
            animation: `float ${3 + (i % 3) * 0.5}s ease-in-out ${l.delay} infinite alternate`,
          }}
        >
          <img src={l.src} alt="" className="w-full h-full drop-shadow-lg" loading="lazy" />
        </div>
      ))}
    </div>
  );
}
