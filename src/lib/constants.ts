export const COMPANY = {
  name: "Skyrovix",
  shortName: "Skyrovix",
  tagline: "Build the Future",
  email: "skyrovix@gmail.com",
  website: "www.skyrovix.com",
  founder: { name: "Hariharan S", title: "Founder & CEO" },
  cofounder: { name: "Maheshwaran S", title: "Co-Founder" },
};

export const PAYMENT = {
  upiId: "hariharanmahesh34@okhdfcbank",
  payeeName: "Hariharan Mahesh",
  amount: 100,
  currency: "INR",
};

export const DOMAINS = [
  { slug: "fullstack", name: "Full Stack Development", icon: "FS", description: "End-to-end web apps with React, Node.js, and databases.", color: "from-fuchsia-500 to-[#07284a]" },
  { slug: "frontend", name: "Frontend Development", icon: "FE", description: "Beautiful, responsive UIs with modern React and Tailwind.", color: "from-pink-500 to-rose-600" },
  { slug: "backend", name: "Backend Development", icon: "BE", description: "APIs, databases, and server architecture.", color: "from-blue-500 to-indigo-600" },
  { slug: "datascience", name: "Data Science", icon: "DS", description: "Turn raw data into actionable insights.", color: "from-cyan-500 to-blue-600" },
  { slug: "aiml", name: "AI & Machine Learning", icon: "AI", description: "Build intelligent systems with ML and LLMs.", color: "from-violet-500 to-[#07284a]" },
  { slug: "uiux", name: "UI / UX Design", icon: "UX", description: "Human-centered design that delights users.", color: "from-amber-500 to-orange-600" },
  { slug: "python", name: "Python Development", icon: "Py", description: "Versatile Python for web, automation, and data.", color: "from-emerald-500 to-teal-600" },
  { slug: "java", name: "Java Development", icon: "Jv", description: "Enterprise-grade backends with Spring Boot.", color: "from-red-500 to-orange-600" },
  { slug: "cybersecurity", name: "Cyber Security", icon: "CS", description: "Defend systems, hunt vulnerabilities.", color: "from-green-500 to-emerald-600" },
  { slug: "digitalmarketing", name: "Digital Marketing", icon: "DM", description: "SEO, ads, and growth strategy.", color: "from-yellow-500 to-amber-600" },
] as const;

export const DOMAIN_MAP = Object.fromEntries(DOMAINS.map((d) => [d.slug, d]));

export function getDomain(slug: string) {
  return DOMAIN_MAP[slug];
}

export const DURATIONS = [
  { value: 1, label: "1 Month", tasks: 5, desc: "5 tasks — perfect for a quick start" },
  { value: 2, label: "2 Months", tasks: 8, desc: "8 tasks — more depth and practice" },
  { value: 3, label: "3 Months", tasks: 10, desc: "10 tasks — build a solid portfolio" },
  { value: 6, label: "6 Months", tasks: 12, desc: "12 tasks — master the domain" },
] as const;

export function durationConfig(months?: number) {
  return DURATIONS.find((d) => d.value === months) ?? DURATIONS[0];
}

export function generateInternId() {
  const year = new Date().getFullYear();
  const n = Math.floor(1000 + Math.random() * 9000);
  return `SKX-${year}-${n}`;
}

export function generateCertId() {
  const year = new Date().getFullYear();
  const n = Math.floor(10000 + Math.random() * 90000);
  return `SKX-CERT-${year}-${n}`;
}
