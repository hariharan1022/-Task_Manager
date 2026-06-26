import { COMPANY, DOMAINS } from "./constants";

export const SITE_URL = "https://skyrovix.online";
export const SITE_NAME = "Skyrovix";
export const SITE_TITLE = "Skyrovix — Virtual Internship & Training Platform";
export const SITE_DESCRIPTION =
  "Join Skyrovix for task-based virtual internships in Full Stack, AI/ML, Data Science, UI/UX, Cyber Security and more. Get offer letters, digital ID cards, and QR-verified certificates. Apply in minutes — 100% online.";
export const SITE_KEYWORDS = [
  "virtual internship",
  "online internship",
  "internship with certificate",
  "free internship for students",
  "full stack development internship",
  "data science internship",
  "AI ML internship",
  "UI UX design internship",
  "cyber security internship",
  "python internship",
  "java internship",
  "frontend development course",
  "backend development course",
  "online training platform",
  "skill development for students",
  "career development platform",
  "internship for freshers",
  "engineering internship",
  "job ready program",
  "Skyrovix internship",
  "internship certificate online",
  "virtual training program",
  "learn programming online",
  "best internship platform India",
  "internship with offer letter",
];

export const OG_IMAGE = `${SITE_URL}/og-default.png`;
export const LOGO_URL = `${SITE_URL}/logo.png`;

export const ROUTE_SEO: Record<
  string,
  {
    title: string;
    description: string;
    canonical?: string;
    ogImage?: string;
    keywords?: string[];
    noindex?: boolean;
  }
> = {
  "/": {
    title: "Skyrovix — Virtual Internship & Training Platform for Students",
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS.slice(0, 20),
  },
  "/about": {
    title: "About Skyrovix — Empowering Future Innovators",
    description:
      "Learn about Skyrovix, an MSME-registered virtual internship and training platform helping college students, fresh graduates, and job seekers gain real-world skills through task-based projects.",
    keywords: ["about skyrovix", "skyrovix internship platform", "virtual internship company India", "MSME registered training"],
  },
  "/domains": {
    title: "Internship Domains — Full Stack, AI/ML, Data Science, UI/UX | Skyrovix",
    description:
      "Explore 10+ internship domains at Skyrovix: Full Stack Development, AI & Machine Learning, Data Science, UI/UX Design, Cyber Security, Python, Java, and more.",
    keywords: ["internship domains", "full stack internship", "AI ML internship", "data science internship", "cyber security training"],
  },
  "/courses": {
    title: "Online Courses — Learn Programming, Data Science, AI | Skyrovix",
    description:
      "Browse industry-aligned online courses at Skyrovix. Learn Full Stack Development, Python, Java, UI/UX Design, Data Science, and more with hands-on projects and certificates.",
    keywords: ["online courses", "learn programming", "data science course", "full stack course", "python course online"],
  },
  "/contact": {
    title: "Contact Skyrovix — Get in Touch",
    description:
      "Have questions about Skyrovix internships or courses? Contact our team for support with applications, payments, certificates, and general inquiries.",
    keywords: ["contact skyrovix", "internship support", "help skyrovix"],
  },
  "/privacy": {
    title: "Privacy Policy — Skyrovix",
    description:
      "Skyrovix privacy policy. Learn how we collect, use, and protect your personal information including name, email, phone, college details, and payment data.",
  },
  "/terms": {
    title: "Terms of Service — Skyrovix",
    description:
      "Skyrovix terms of service. Read the terms and conditions governing your use of the Skyrovix virtual internship and training platform.",
  },
  "/verify-certificate": {
    title: "Verify Certificate — Skyrovix",
    description:
      "Verify your Skyrovix internship or course certificate online. Enter your certificate ID or intern ID to confirm authenticity.",
    keywords: ["verify certificate", "certificate verification", "skyrovix certificate check"],
  },
  "/auth": {
    title: "Sign In / Sign Up — Skyrovix",
    description:
      "Create your Skyrovix account or sign in to access your internship dashboard, courses, certificates, and more.",
    noindex: true,
  },
  "/admin": {
    title: "Admin Dashboard — Skyrovix",
    description: "Skyrovix admin dashboard for managing applications, certificates, and platform operations.",
    noindex: true,
  },
  "/dashboard": {
    title: "My Dashboard — Skyrovix",
    description: "Your Skyrovix dashboard. Track internship progress, courses, certificates, and profile.",
    noindex: true,
  },
};

export const FAQ_DATA = [
  {
    question: "What is Skyrovix?",
    answer:
      "Skyrovix is an MSME-registered virtual internship and training platform offering task-based internships in Full Stack Development, AI/ML, Data Science, UI/UX Design, Cyber Security, Python, Java, and more. Students earn offer letters, digital ID cards, and QR-verified certificates.",
  },
  {
    question: "How do I apply for an internship at Skyrovix?",
    answer:
      "Visit skyrovix.online, browse available domains, select your preferred duration (1-6 months), complete the application form, and submit the one-time processing fee of ₹100 via UPI. You'll receive an instant offer letter.",
  },
  {
    question: "Is the Skyrovix internship certificate valid?",
    answer:
      "Yes. Skyrovix certificates are QR-verified and can be authenticated at skyrovix.online/verify-certificate. Each certificate has a unique certificate ID and intern ID for verification.",
  },
  {
    question: "What courses does Skyrovix offer?",
    answer:
      "Skyrovix offers online courses in Full Stack Development, Frontend Development, Backend Development, Python, Java, Data Science, AI & Machine Learning, UI/UX Design, Cyber Security, and Digital Marketing with hands-on projects and assessments.",
  },
  {
    question: "How much does the Skyrovix internship cost?",
    answer:
      "Skyrovix charges a one-time processing fee of ₹100 for internship registration. All courses and learning materials are included.",
  },
  {
    question: "Who can join Skyrovix internships?",
    answer:
      "Any college student, fresh graduate, engineering student, job seeker, or career switcher interested in tech skills can join. There are no specific eligibility requirements.",
  },
  {
    question: "Does Skyrovix provide offer letters?",
    answer:
      "Yes. Every Skyrovix intern receives a digital offer letter immediately after registration, along with a digital intern ID card.",
  },
  {
    question: "What is the duration of Skyrovix internships?",
    answer:
      "Skyrovix offers flexible internship durations: 1 Month (5 tasks), 2 Months (8 tasks), 3 Months (10 tasks), and 6 Months (12 tasks).",
  },
];

export const STRUCTURED_DATA_ORG = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: COMPANY.name,
  url: SITE_URL,
  logo: LOGO_URL,
  description: SITE_DESCRIPTION,
  email: `mailto:${COMPANY.email}`,
  address: {
    "@type": "PostalAddress",
    addressCountry: "IN",
  },
  sameAs: [],
  founder: [
    {
      "@type": "Person",
      name: COMPANY.founder.name,
      jobTitle: COMPANY.founder.title,
    },
    {
      "@type": "Person",
      name: COMPANY.cofounder.name,
      jobTitle: COMPANY.cofounder.title,
    },
  ],
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  makesOffer: DOMAINS.map((d) => ({
    "@type": "Offer",
    itemOffered: {
      "@type": "EducationalOccupationalProgram",
      name: d.name,
      description: d.description,
      provider: {
        "@type": "EducationalOrganization",
        name: COMPANY.name,
      },
    },
  })),
};

export const STRUCTURED_DATA_WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/courses?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    name: COMPANY.name,
    logo: LOGO_URL,
  },
};

export const STRUCTURED_DATA_ORG_LOCALE = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: COMPANY.name,
  url: SITE_URL,
  logo: LOGO_URL,
  description: SITE_DESCRIPTION,
  email: `mailto:${COMPANY.email}`,
  foundingDate: "2024",
  numberOfEmployees: {
    "@type": "QuantitativeValue",
    value: 10,
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: COMPANY.email,
    availableLanguage: "English",
  },
  sameAs: [],
};
