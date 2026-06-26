type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        name: "Skyrovix",
        url: "https://skyrovix.online",
        logo: "https://skyrovix.online/logo.png",
        description:
          "MSME-registered virtual internship and training platform offering task-based internships in Full Stack, AI/ML, Data Science, UI/UX, Cyber Security and more.",
        email: "mailto:skyrovix@gmail.com",
        address: { "@type": "PostalAddress", addressCountry: "IN" },
        founder: [
          { "@type": "Person", name: "Hariharan S", jobTitle: "Founder & CEO" },
          { "@type": "Person", name: "Maheshwaran S", jobTitle: "Co-Founder" },
        ],
        areaServed: { "@type": "Country", name: "India" },
      }}
    />
  );
}

export function WebsiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Skyrovix",
        url: "https://skyrovix.online",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://skyrovix.online/courses?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
        publisher: {
          "@type": "Organization",
          name: "Skyrovix",
          logo: "https://skyrovix.online/logo.png",
        },
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

export function FAQJsonLd({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }}
    />
  );
}

export function CourseJsonLd({
  name,
  description,
  domain,
  duration,
}: {
  name: string;
  description: string;
  domain: string;
  duration: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Course",
        name,
        description,
        provider: {
          "@type": "EducationalOrganization",
          name: "Skyrovix",
          url: "https://skyrovix.online",
        },
        occupationalCredentialAwarded: {
          "@type": "EducationalOccupationalCredential",
          credentialCategory: "certificate",
        },
        educationalLevel: "Beginner",
        timeRequired: duration,
        about: domain,
        inLanguage: "en",
        isAccessibleForFree: false,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: duration,
        },
      }}
    />
  );
}

export function WebPageJsonLd({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title,
        description,
        url,
        publisher: {
          "@type": "Organization",
          name: "Skyrovix",
          logo: "https://skyrovix.online/logo.png",
        },
      }}
    />
  );
}
