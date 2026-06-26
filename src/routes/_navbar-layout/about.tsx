import { createFileRoute, Link } from "@tanstack/react-router";
import { AuroraBackground } from "@/components/AuroraBackground";
import { FadeUp, Reveal } from "@/components/motion";
import { COMPANY } from "@/lib/constants";
import { ShieldCheck, Target, Award, Sparkles, ArrowRight, CheckCircle2, Quote } from "lucide-react";
import founderPhoto from "@/assets/founder.jpeg";
import cofounderPhoto from "@/assets/co founder.jpeg";

export const Route = createFileRoute("/_navbar-layout/about")({
  head: () => ({
    meta: [
      { title: "About — Skyrovix" },
      { name: "description", content: "Learn about Skyrovix, our mission, founders, and the task-based internship platform." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen">

      {/* ─── HERO ─── */}
      <AuroraBackground>
        <section className="mx-auto max-w-5xl px-4 pt-6 sm:pt-10 pb-16 sm:pb-20 md:pb-24 text-center">
          <FadeUp>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#07284a]/15 bg-white/60 dark:bg-[#0f172a]/60 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-medium text-[#07284a] dark:text-[#60a5fa] shadow-sm backdrop-blur mb-6">
              <Sparkles className="size-3 sm:size-3.5" /> About Skyrovix
            </div>
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
              Bridging <span className="brand-text">education &amp; industry</span>
            </h1>
            <p className="mt-5 mx-auto max-w-2xl text-sm sm:text-lg text-muted-foreground">
              We run a task-based virtual internship program that helps students gain genuine,
              portfolio-grade experience — not just a certificate.
            </p>
          </FadeUp>
        </section>
      </AuroraBackground>

      {/* ─── MISSION + STATS ─── */}
      <section className="border-y border-border/40 bg-[#f8fafc]/50 dark:bg-[#020617]/50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="inline-flex items-center gap-1.5 rounded-full border border-[#07284a]/30 bg-[#07284a]/10 px-3 py-1 text-xs font-semibold tracking-widest text-[#07284a] uppercase mb-4">
                  Our Mission
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.15]">
                  MSME-registered. <span className="brand-text">Student-built.</span>
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  The gap between college coursework and real-world work is huge. We close
                  that gap with structured, mentor-reviewed internship tracks across 10
                  in-demand technology domains.
                </p>
                <div className="mt-5 space-y-2">
                  {[
                    "Instant offer letter & digital ID card",
                    "5 real-world projects per track",
                    "QR-verified certificate on completion",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="size-4 shrink-0 text-green-500" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "10+", label: "Domains" },
                  { value: "5", label: "Tasks per track" },
                  { value: "100%", label: "Self-paced" },
                  { value: "₹100", label: "Certification fee" },
                ].map((s, i) => (
                  <FadeUp key={s.label} delay={0.1 + i * 0.08}>
                    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-white/60 dark:bg-[#0f172a]/60 p-6 text-center card-elevated hover:card-elevated-hover">
                      <div className="absolute -top-6 -right-6 size-20 rounded-full bg-[#07284a]/5 dark:bg-[#07284a]/10 blur-2xl" />
                      <div className="relative">
                        <div className="text-3xl font-bold brand-text">{s.value}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
                      </div>
                    </div>
                  </FadeUp>
                ))}
                <FadeUp delay={0.35}>
                  <div className="col-span-2 flex items-center gap-3 rounded-2xl border border-border/50 bg-white/60 dark:bg-[#0f172a]/60 p-4 card-elevated hover:card-elevated-hover">
                    <div className="flex -space-x-2">
                      <div className="size-10 overflow-hidden rounded-full border-2 border-white ring-1 ring-[#07284a]/20">
                        <img src={founderPhoto} alt={COMPANY.founder.name} className="size-full object-cover" />
                      </div>
                      <div className="size-10 overflow-hidden rounded-full border-2 border-white ring-1 ring-emerald-400/40">
                        <img src={cofounderPhoto} alt={COMPANY.cofounder.name} className="size-full object-cover" />
                      </div>
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold">{COMPANY.founder.name} &amp; {COMPANY.cofounder.name}</p>
                      <p className="text-muted-foreground">Founders, Skyrovix</p>
                    </div>
                  </div>
                </FadeUp>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── VALUES ─── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/50 dark:bg-[#0f172a]/50 px-4 py-1.5 text-xs font-medium text-muted-foreground mb-4">
                What We Stand For
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Our Values</h2>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Target, title: "Real Skills", desc: "Every task mirrors real industry work — no toy projects." },
              { icon: ShieldCheck, title: "Verifiable", desc: "Unique ID & QR on every certificate for instant verification." },
              { icon: Award, title: "Student-First", desc: "Built for learners with mentor-style task reviews." },
              { icon: Award, title: "Recognised", desc: "Issued by an MSME-registered IT company." },
            ].map((v, i) => (
              <FadeUp key={v.title} delay={0.1 + i * 0.1}>
                <div className="group rounded-2xl border border-border/50 bg-white/60 dark:bg-[#0f172a]/60 p-6 transition-all card-elevated hover:card-elevated-hover text-center sm:text-left">
                  <div className="mx-auto sm:mx-0 grid size-11 place-items-center rounded-xl bg-[#07284a]/10 dark:bg-[#07284a]/20 text-[#07284a] dark:text-[#60a5fa] transition-all group-hover:bg-[#07284a] group-hover:text-white">
                    <v.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{v.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{v.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LEADERSHIP ─── */}
      <section className="relative border-y border-border/40 bg-[#f8fafc]/50 dark:bg-[#020617]/50 overflow-hidden">
        {/* Section header */}
        <div className="mx-auto max-w-6xl px-4 pt-20 sm:pt-24 pb-14">
          <Reveal>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/50 dark:bg-[#0f172a]/50 px-4 py-1.5 text-xs font-medium text-muted-foreground mb-4">
                <Sparkles className="size-3.5" /> Leadership
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Built by <span className="brand-text">students</span>, for students
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                Driven by a shared passion for bridging the gap between education and industry.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Split layout */}
        <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 divide-border/40">

          {/* ─── LEFT: FOUNDER ─── */}
          <Reveal className="relative">
            <div className="relative h-full flex flex-col p-8 sm:p-10 lg:p-14">
              {/* Decorative glow */}
              <div className="absolute -top-40 -right-40 size-96 rounded-full bg-[#07284a]/8 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 size-72 rounded-full bg-blue-200/15 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex-1 flex flex-col">
                {/* Badge */}
                <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#07284a]/30 bg-[#07284a]/10 px-3 py-1 text-[10px] font-semibold tracking-widest text-[#07284a] uppercase mb-5">
                  Founder &amp; CEO
                </div>

                {/* Photo */}
                <div className="relative mb-6">
                  <div className="absolute -bottom-4 -left-4 w-4/5 h-3/4 rounded-full bg-[#07284a]/10 blur-3xl" />
                  <img
                    src={founderPhoto}
                    alt={COMPANY.founder.name}
                    className="relative z-10 h-[320px] sm:h-[380px] w-full object-cover object-top rounded-2xl border border-[#07284a]/15 shadow-lg"
                    style={{ maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)" }}
                  />
                  <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2.5 rounded-xl border border-[#07284a]/20 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl p-2.5 pr-4 shadow-lg">
                    <div className="grid size-9 place-items-center rounded-lg bg-[#07284a] text-white text-xs font-bold">CEO</div>
                    <div>
                      <p className="text-sm font-semibold">{COMPANY.founder.name}</p>
                      <p className="text-[10px] text-muted-foreground">B.Tech IT · Mount Zion College</p>
                    </div>
                  </div>
                </div>

                {/* Name + Title */}
                <h3 className="text-2xl sm:text-3xl font-bold">{COMPANY.founder.name}</h3>
                <p className="text-sm text-muted-foreground">B.Tech Information Technology · Mount Zion College of Engineering &amp; Technology</p>

                {/* Bio */}
                <div className="mt-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    A passionate entrepreneur, web developer, and technology enthusiast. As the
                    Founder &amp; CEO of Skyrovix, he leads initiatives focused on website
                    development, digital solutions, e-commerce services, professional training
                    programs, and internship opportunities for students.
                  </p>
                  <div className="flex items-start gap-2.5 rounded-xl border border-[#07284a]/10 bg-[#07284a]/5 dark:bg-[#07284a]/10 p-4">
                    <Quote className="mt-0.5 size-4 shrink-0 text-[#07284a]/50" />
                    <p className="text-xs italic text-muted-foreground">
                      &ldquo;Bridging high-speed code with cinematic design — building real-world
                      internship experiences from the 3rd Year of B.Tech IT.&rdquo;
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-6 border-t border-border/40" />

                {/* Detail boxes */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/40 bg-white/40 dark:bg-[#020617]/30 p-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Education</p>
                    <p className="mt-1 text-sm font-medium">B.Tech Information Technology</p>
                    <p className="text-xs text-muted-foreground">Mount Zion College of Engineering &amp; Technology</p>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-white/40 dark:bg-[#020617]/30 p-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Role</p>
                    <p className="mt-1 text-sm font-medium">Founder &amp; CEO</p>
                    <p className="text-xs text-muted-foreground">Skyrovix</p>
                  </div>
                </div>

                {/* Skills */}
                <div className="mt-5">
                  <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Technical Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["React.js", "TypeScript", "Node.js", "UI/UX Design", "Firebase", "Tailwind CSS", "Next.js", "Supabase", "JavaScript", "Git"].map((s) => (
                      <span key={s} className="rounded-lg border border-[#07284a]/20 bg-white/60 dark:bg-[#0f172a]/60 px-2.5 py-1 text-[10px] font-medium text-[#07284a] dark:text-[#60a5fa] transition-all hover:bg-[#07284a]/10 hover:border-[#07284a]/30">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ─── DIVIDER ─── */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-border/40 -translate-x-px" />

          {/* ─── RIGHT: CO-FOUNDER ─── */}
          <Reveal className="relative">
            <div className="relative h-full flex flex-col p-8 sm:p-10 lg:p-14">
              {/* Decorative glow */}
              <div className="absolute -top-40 -left-40 size-96 rounded-full bg-emerald-200/15 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-32 -right-32 size-72 rounded-full bg-teal-200/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex-1 flex flex-col">
                {/* Badge */}
                <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-100/50 dark:bg-emerald-950/30 px-3 py-1 text-[10px] font-semibold tracking-widest text-emerald-700 dark:text-emerald-300 uppercase mb-5">
                  Co-Founder
                </div>

                {/* Photo */}
                <div className="relative mb-6">
                  <div className="absolute -bottom-4 -right-4 w-4/5 h-3/4 rounded-full bg-emerald-300/15 blur-3xl" />
                  <img
                    src={cofounderPhoto}
                    alt={COMPANY.cofounder.name}
                    className="relative z-10 h-[320px] sm:h-[380px] w-full object-cover object-top rounded-2xl border border-emerald-300/30 shadow-lg"
                    style={{ maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)" }}
                  />
                  <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2.5 rounded-xl border border-emerald-200/60 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl p-2.5 pr-4 shadow-lg">
                    <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">COF</div>
                    <div>
                      <p className="text-sm font-semibold">{COMPANY.cofounder.name}</p>
                      <p className="text-[10px] text-muted-foreground">Co-Founder · Skyrovix</p>
                    </div>
                  </div>
                </div>

                {/* Name + Title */}
                <h3 className="text-2xl sm:text-3xl font-bold">{COMPANY.cofounder.name}</h3>
                <p className="text-sm text-muted-foreground">Co-Founder · Skyrovix</p>

                {/* Bio */}
                <div className="mt-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    A strategic thinker and operations leader who drives the business vision
                    behind Skyrovix. As Co-Founder, he oversees team management, partnerships,
                    and day-to-day operations — ensuring every initiative runs with precision
                    and purpose.
                  </p>
                  <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
                    <Quote className="mt-0.5 size-4 shrink-0 text-emerald-500/50" />
                    <p className="text-xs italic text-muted-foreground">
                      &ldquo;Building the operational backbone of Skyrovix — ensuring every
                      student gets a seamless, world-class internship experience.&rdquo;
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-6 border-t border-border/40" />

                {/* Detail boxes */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/40 bg-white/40 dark:bg-[#020617]/30 p-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Expertise</p>
                    <p className="mt-1 text-sm font-medium">Business Strategy &amp; Operations</p>
                    <p className="text-xs text-muted-foreground">Driving growth &amp; partnerships</p>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-white/40 dark:bg-[#020617]/30 p-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Role</p>
                    <p className="mt-1 text-sm font-medium">Co-Founder</p>
                    <p className="text-xs text-muted-foreground">Skyrovix</p>
                  </div>
                </div>

                {/* Skills */}
                <div className="mt-5">
                  <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Key Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Business Strategy", "Operations Management", "Growth Strategy", "Marketing", "Team Building", "Partnerships", "Leadership", "Project Management"].map((s) => (
                      <span key={s} className="rounded-lg border border-emerald-200/60 bg-white/60 dark:bg-[#0f172a]/60 px-2.5 py-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 transition-all hover:bg-emerald-100 dark:hover:bg-emerald-950/40 hover:border-emerald-300">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Bottom padding */}
        <div className="pb-20 sm:pb-24" />
      </section>

      {/* ─── CTA ─── */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-[#07284a]/20 bg-gradient-to-br from-[#07284a] via-[#0d3b66] to-[#1d4ed8] p-8 sm:p-12 md:p-16 text-center text-white shadow-2xl shadow-[#07284a]/25">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
              <div className="absolute -right-20 -top-20 size-80 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 size-60 rounded-full bg-white/5 blur-3xl" />
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Be part of the Skyrovix journey</h2>
                <p className="mt-3 text-sm sm:text-base text-white/80 max-w-lg mx-auto">Get your offer letter in seconds. No application fee.</p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link to="/domains">
                    <span className="group inline-flex items-center gap-2 rounded-xl bg-white text-[#07284a] px-7 py-3.5 text-sm font-semibold shadow-lg hover:bg-white/90 transition-all btn-premium hover:btn-premium-hover active:btn-premium-active cursor-pointer">
                      Browse Internships <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                  <Link to="/contact">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-transparent border-2 border-white/30 text-white px-7 py-3.5 text-sm font-semibold hover:bg-white/10 transition-all btn-premium active:btn-premium-active cursor-pointer">
                      Get in Touch
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  );
}
