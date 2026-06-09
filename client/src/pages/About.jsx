import { Link } from "react-router-dom";
import { assetUrl } from "../utils/paths.js";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Code2,
  Globe2,
  GraduationCap,
  Layers,
  Package,
  Palette,
  Rocket,
  Server,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";

const ecommerceCards = [
  {
    icon: Truck,
    title: "E-Commerce Innovations",
    subtitle: "Operations & logistics",
    desc: "From design optimization to global shipping API channels, we manage and operate scaled e-commerce businesses with automated fulfillment and analytics-driven growth.",
    tag: "Global shipping / Custom APIs",
    highlight: "Multi-channel analytics",
  },
  {
    icon: Store,
    title: "Etsy Storefront",
    subtitle: "Handcrafted & personalized",
    desc: "Handcrafted designs and custom-tailored customer experiences, optimized through search query analytics and custom product personalization engines.",
    tag: "Explore strategy",
    highlight: "Automated order logs",
  },
  {
    icon: ShoppingBag,
    title: "eBay Marketplace",
    subtitle: "Cross-border trade",
    desc: "Dynamic product sales and cross-border trade pipelines utilizing high-ranking listing strategy and real-time inventory management practices.",
    tag: "Explore strategy",
    highlight: "Fully automated pipeline",
  },
  {
    icon: Package,
    title: "Print on Demand (POD)",
    subtitle: "Zero-inventory scale",
    desc: "Custom art print logistics integrated directly with production APIs for instant fulfillment. Scaled automatically to zero-inventory overhead.",
    tag: "Explore strategy",
    highlight: "Production API sync",
  },
  {
    icon: Layers,
    title: "Custom Web Platforms",
    subtitle: "Self-hosted commerce",
    desc: "Self-hosted, highly optimized e-commerce platforms engineered from scratch using modern React frameworks and ultra-fast payment processing.",
    tag: "Explore strategy",
    highlight: "Custom CMS & checkout",
  },
];

const platformPillars = [
  {
    icon: Rocket,
    title: "Internship platform",
    desc: "SKYROVIX connects students to mentor-reviewed tasks, verifiable certificates, and LinkedIn-ready milestones — built for hiring outcomes.",
  },
  {
    icon: Code2,
    title: "Engineering first",
    desc: "High-performance architectures, clean APIs, and premium UI/UX across every product surface we ship.",
  },
  {
    icon: Globe2,
    title: "Global commerce",
    desc: "Parallel e-commerce operations across Etsy, eBay, POD, and bespoke storefronts — unified by data and automation.",
  },
];

export default function About() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero / Founder */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-soft -z-10" />
        <div className="absolute inset-0 hero-grid -z-10 opacity-80" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] gap-10 lg:gap-14 items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="min-w-0 order-2 lg:order-1"
            >
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Founder &amp; CEO
              </p>
              <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-ink tracking-tight break-words">
                Hariharan S
              </h1>

              <blockquote className="mt-5 border-l-4 border-primary pl-4 sm:pl-5">
                <p className="text-base sm:text-lg text-ink font-medium leading-relaxed break-words">
                  &ldquo;Bridging high-speed code with cinematic design — from the 3rd Year of
                  B.Tech IT at Mount Zion College of Engineering and Technology.&rdquo;
                </p>
              </blockquote>

              <p className="mt-6 text-base sm:text-lg text-text-secondary leading-relaxed break-words">
                I am <strong>Hariharan S</strong>, an entrepreneur and web developer, currently in
                my <strong>3rd Year of B.Tech IT</strong> at Mount Zion College of Engineering and
                Technology. I founded Skyrovix to build technology-driven solutions for businesses,
                students, and aspiring professionals.
              </p>

              <p className="mt-4 text-base text-text-secondary leading-relaxed break-words">
                My work spans website development, e-commerce, training programs, and internships.
                I believe education should go beyond theory — that&apos;s why Skyrovix internships
                deliver structured learning paths, verifiable credentials, and production-grade
                tooling so students graduate with proof of work employers trust.
              </p>

              <div className="mt-6">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-2.5">
                  Core Areas of Expertise
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Website Design & Development",
                    "Frontend Engineering",
                    "Responsive & Mobile-First Design",
                    "UI/UX Design",
                    "E-Commerce Websites",
                    "Digital Business Solutions",
                    "Technology Training Programs",
                    "Internship Program Management",
                    "AI-Assisted Development",
                  ].map((skill) => (
                    <span
                      key={skill}
                      className="chip bg-white border border-border text-ink text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1 sm:py-1.5"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/internships" className="btn-primary text-base px-5 py-3 justify-center">
                  Browse internships <ArrowRight size={16} />
                </Link>
                <Link to="/register" className="btn-secondary text-base px-5 py-3 justify-center bg-white">
                  Join the platform
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="min-w-0 order-1 lg:order-2 lg:sticky lg:top-24"
            >
              <div className="relative rounded-3xl overflow-hidden border border-border shadow-glow-lg bg-ink aspect-[4/5] max-w-md mx-auto lg:max-w-none">
                <img
                  src={assetUrl("/founder-hariharan.png")}
                  alt="Hariharan S — Founder & CEO of Skyrovix"
                  className="w-full h-full object-cover object-top"
                  loading="eager"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/90 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-purple-200">
                    Founder &amp; CEO
                  </p>
                  <p className="text-lg font-display font-bold mt-0.5">Hariharan S</p>
                  <p className="text-sm text-slate-300 mt-1">B.Tech IT · Mount Zion College</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Info cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="card p-5 sm:p-6 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-4">
              <GraduationCap size={22} />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Alma Mater
            </h2>
            <p className="mt-2 text-lg font-bold text-ink break-words">3rd Year, B.Tech IT</p>
            <p className="mt-1 text-text-secondary break-words">Mount Zion College of Engineering &amp; Technology</p>
          </div>

          <div className="card p-5 sm:p-6 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-4">
              <Server size={22} />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Speciality
            </h2>
            <p className="mt-2 text-lg font-bold text-ink break-words">Full Stack Engineering</p>
            <p className="mt-1 text-text-secondary break-words">React &amp; Node.js</p>
          </div>

          <div className="card p-5 sm:p-6 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-4">
              <Building2 size={22} />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Founded
            </h2>
            <p className="mt-2 text-lg font-bold text-ink">Est. 2024</p>
            <p className="mt-1 text-text-secondary break-words">Skyrovix · Internships &amp; commerce</p>
          </div>
        </div>
      </section>

      {/* Platform pillars */}
      <section className="bg-white border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="chip bg-primary-light text-primary border border-primary/15 mb-4">
              <Sparkles size={14} /> What we build
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink">
              Two founders. Two high-growth ecosystems.
            </h2>
            <p className="mt-3 text-text-secondary text-base leading-relaxed break-words">
              Education technology and e-commerce — unified by the same obsession with speed,
              design, and measurable outcomes.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {platformPillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="card p-6 min-w-0"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-brand text-white flex items-center justify-center mb-4 shadow-glow">
                  <p.icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-ink break-words">{p.title}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed break-words">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* E-commerce ecosystem */}
      <section id="ecosystem" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="mb-10 sm:mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Business Ecosystem</p>
          <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-ink break-words">
            E-Commerce Innovations
          </h2>
          <p className="mt-3 text-base sm:text-lg text-text-secondary max-w-3xl leading-relaxed break-words">
            From design optimization to global shipping API channels, we manage and operate
            scaled e-commerce businesses — each channel tuned for automation, conversion, and
            long-term brand equity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {ecommerceCards.map((card, i) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="card p-6 sm:p-7 flex flex-col min-w-0 hover:shadow-glow hover:border-primary/20 transition"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary-light text-primary flex items-center justify-center">
                  <card.icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  {card.subtitle && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1 break-words">
                      {card.subtitle}
                    </p>
                  )}
                  <h3 className="text-xl font-bold text-ink break-words">{card.title}</h3>
                </div>
              </div>
              <p className="mt-4 text-sm sm:text-base text-text-secondary leading-relaxed break-words flex-1">
                {card.desc}
              </p>
              {card.highlight && (
                <p className="mt-3 text-xs font-semibold text-primary bg-primary-light inline-flex self-start px-2.5 py-1 rounded-lg break-words">
                  {card.highlight}
                </p>
              )}
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                <span className="text-sm font-semibold text-ink">{card.tag}</span>
                <span className="text-sm text-primary font-medium inline-flex items-center gap-1">
                  Learn more <ArrowRight size={14} />
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Design philosophy */}
      <section className="section-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl font-display font-bold break-words text-white">
                Cinematic design meets production code
              </h2>
              <p className="mt-4 text-slate-200 leading-relaxed break-words">
                Every Skyrovix surface — internship dashboards, certificates, storefronts — is
                built with the same principles: clarity first, motion with purpose, and
                accessibility on every breakpoint.
              </p>
              <ul className="mt-6 space-y-3 text-white text-sm sm:text-base">
                {[
                  "Mobile-first layouts with readable type at every size",
                  "Verifiable certificates and offer letters employers recognize",
                  "Automated e-commerce pipelines with real-time inventory sync",
                  "Custom APIs for shipping, payments, and fulfillment partners",
                ].map((item) => (
                  <li key={item} className="flex gap-3 break-words">
                    <Palette size={18} className="shrink-0 text-purple-200 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4 min-w-0">
              {[
                { label: "Channels", value: "4+" },
                { label: "Stack", value: "MERN+" },
                { label: "Focus", value: "UI/UX" },
                { label: "Since", value: "2024" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-slate-900/40 border border-white/25 p-5 text-center"
                >
                  <div className="text-2xl sm:text-3xl font-display font-bold text-white">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-slate-200 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TEAM / LEADERSHIP */}

      {/* Hero / Co-Founder — Maheshwaran S (mirrors the Founder hero above) */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-soft -z-10" />
        <div className="absolute inset-0 hero-grid -z-10 opacity-80" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)] gap-10 lg:gap-14 items-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="min-w-0 lg:sticky lg:top-24"
            >
              <div className="relative rounded-3xl overflow-hidden border border-border shadow-glow-lg bg-ink aspect-[4/5] max-w-md mx-auto lg:max-w-none">
                <img
                  src={assetUrl("/co-founder.jpg")}
                  alt="Maheshwaran S — Co-Founder of Skyrovix"
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fb = e.currentTarget.nextElementSibling;
                    if (fb) fb.style.display = "flex";
                  }}
                />
                <div
                  className="absolute inset-0 hidden flex-col items-center justify-center bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 p-6"
                  aria-hidden="true"
                >
                  <div className="absolute inset-0 opacity-30 hero-grid" />
                  <div className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-5xl sm:text-6xl font-display font-extrabold shadow-glow border-4 border-white/40">
                    MS
                  </div>
                  <div className="relative mt-5 text-center text-white">
                    <p className="text-xs font-semibold uppercase tracking-widest text-cyan-100">
                      Co-Founder
                    </p>
                    <p className="mt-1 text-xl font-display font-bold">Maheshwaran S</p>
                    <p className="text-xs text-cyan-50/90 mt-1">B.Tech IT · Mookambigai College</p>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/90 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 text-white pointer-events-none">
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200">
                    Co-Founder
                  </p>
                  <p className="text-lg font-display font-bold mt-0.5">Maheshwaran S</p>
                  <p className="text-sm text-slate-300 mt-1">B.Tech IT · Mookambigai College</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="min-w-0"
            >
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Co-Founder
              </p>
              <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-ink tracking-tight break-words">
                Maheshwaran S
              </h2>

              <blockquote className="mt-5 border-l-4 border-primary pl-4 sm:pl-5">
                <p className="text-base sm:text-lg text-ink font-medium leading-relaxed break-words">
                  &ldquo;Committed to learning, driven by innovation, and focused on building
                  technology solutions that create lasting impact in the digital world.&rdquo;
                </p>
              </blockquote>

              <p className="mt-6 text-base sm:text-lg text-text-secondary leading-relaxed break-words">
                I am <strong>Maheshwaran S</strong>, Co-Founder of Skyrovix. I&apos;m currently in my
                <strong> 1st Year of B.Tech IT</strong> at Mookambigai College of Engineering and
                Technology, building a strong foundation in software development, web technologies,
                and digital innovation.
              </p>

              <p className="mt-4 text-base text-text-secondary leading-relaxed break-words">
                I support Skyrovix&apos;s web projects, training programs, and internship
                activities. My focus is on website development, UI/UX design, and creating digital
                experiences that are functional, engaging, and accessible.
              </p>

              <div className="mt-6">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-2.5">
                  Technical Interests
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Web Development",
                    "HTML, CSS, JavaScript",
                    "Responsive Design",
                    "UI/UX Design",
                    "Modern Frameworks",
                    "AI Tools",
                    "Digital Innovation",
                    "Technology Entrepreneurship",
                  ].map((skill) => (
                    <span
                      key={skill}
                      className="chip bg-white border border-border text-ink text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1 sm:py-1.5"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/internships" className="btn-primary text-base px-5 py-3 justify-center">
                  Browse internships <ArrowRight size={16} />
                </Link>
                <Link to="/register" className="btn-secondary text-base px-5 py-3 justify-center bg-white">
                  Join the platform
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="card p-8 sm:p-10 text-center border-primary/15 shadow-glow">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink break-words">
            Ready to learn with Skyrovix?
          </h2>
          <p className="mt-3 text-text-secondary max-w-lg mx-auto leading-relaxed break-words">
            Explore internship programs, earn verified certificates, and share your progress on
            LinkedIn — all on one platform.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/internships" className="btn-primary text-base px-6 py-3 justify-center min-h-[48px]">
              View internships
            </Link>
            <Link to="/" className="btn-secondary text-base px-6 py-3 justify-center min-h-[48px] bg-white">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
