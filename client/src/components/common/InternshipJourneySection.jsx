const steps = [
  {
    title: "Apply to an internship",
    desc: "Fill out the application form with your motivation, skills, and availability.",
  },
  {
    title: "Receive your offer letter",
    desc: "Once accepted, your PDF offer letter is generated instantly in your dashboard.",
  },
  {
    title: "Share on LinkedIn",
    desc: "Post your offer letter on LinkedIn, then paste the post URL on Skyrovix to verify.",
  },
  {
    title: "Complete 5 mentor-reviewed tasks",
    desc: "After your LinkedIn link is approved, all five sequenced tasks unlock one by one.",
  },
  {
    title: "Earn your certificate",
    desc: "When all 5 tasks are approved, your verifiable internship certificate is generated automatically.",
  },
];

export default function InternshipJourneySection() {
  return (
    <section id="how-it-works" className="bg-white border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20">
        <div className="max-w-3xl mb-10 sm:mb-12">
          <span className="chip bg-primary-light text-primary border border-primary/15 mb-4">
            Step-by-step
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-ink tracking-tight">
            How the internship journey works
          </h2>
          <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
            Apply → offer letter → LinkedIn post → upload link → 5 tasks → verified certificate.
            Every step is tracked in your dashboard.
          </p>
        </div>

        <ol className="space-y-4 sm:space-y-5 max-w-3xl">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="flex gap-4 sm:gap-5 rounded-2xl border border-border bg-surface/80 p-5 sm:p-6 shadow-card hover:border-primary/25 hover:shadow-glow transition"
            >
              <div className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-brand text-white flex items-center justify-center font-bold text-base shadow-glow">
                {i + 1}
              </div>
              <div className="min-w-0 pt-0.5">
                <h3 className="text-base sm:text-lg font-bold text-ink leading-snug break-words">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm sm:text-base text-text-secondary leading-relaxed break-words">
                  {step.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
