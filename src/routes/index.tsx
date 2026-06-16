import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { DOMAINS, COMPANY } from "@/lib/constants";
import { ArrowRight, Award, FileCheck, Rocket, ShieldCheck, GraduationCap, IndianRupee } from "lucide-react";
import logo from "@/assets/logo.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Skyrovix Internship Portal — Task-based virtual internships" },
      { name: "description", content: "Apply, complete 5 hands-on tasks, get a verified certificate. Internships in Full Stack, AI/ML, UI/UX, Cyber Security and more." },
      { property: "og:title", content: "Skyrovix Internship Portal" },
      { property: "og:description", content: "Task-based virtual internships with offer letters, digital ID cards, and verified certificates." },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { icon: Rocket, title: "Apply", desc: "Pick a domain and submit your details." },
  { icon: FileCheck, title: "Offer + ID", desc: "Instant offer letter & digital ID card." },
  { icon: GraduationCap, title: "5 Tasks", desc: "Build real, portfolio-grade projects." },
  { icon: IndianRupee, title: "Payment", desc: "Pay ₹100 certification fee via GPay." },
  { icon: Award, title: "Certificate", desc: "Verified certificate with QR code." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 brand-gradient opacity-30" />
        <div className="absolute -top-40 left-1/2 -z-10 size-[600px] -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 pt-20 pb-24 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <ShieldCheck className="size-3.5 text-primary" /> MSME Registered · Skyrovix IT Solutions
          </div>
          <h1 className="font-display text-5xl font-bold tracking-tight md:text-7xl">
            Build the future.<br />
            <span className="brand-text">Launch your career.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Task-based virtual internships designed for students. Get an instant offer letter,
            complete 5 industry-grade projects, and earn a verifiable certificate.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="brand-gradient text-white border-0 glow">
              <Link to="/auth">Start your internship <ArrowRight className="ml-1 size-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/domains">Browse domains</Link>
            </Button>
          </div>
          <div className="mt-16 flex items-center justify-center gap-8 text-xs text-muted-foreground">
            <Stat n="10" label="Domains" />
            <Stat n="50+" label="Projects" />
            <Stat n="100%" label="Online" />
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold md:text-4xl">How it works</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">A simple 5-step journey from application to certification.</p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <div key={i} className="group relative rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur transition hover:border-primary/60 hover:bg-card/80">
              <div className="absolute -top-3 left-5 grid size-7 place-items-center rounded-full brand-gradient text-xs font-bold text-white">{i + 1}</div>
              <s.icon className="mt-3 size-6 text-primary" />
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DOMAINS */}
      <section id="domains" className="mx-auto max-w-7xl px-4 py-20">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">Choose your domain</h2>
            <p className="mt-2 text-muted-foreground">10 industry-aligned tracks. Each ships with a 5-task curriculum.</p>
          </div>
          <Button asChild variant="ghost" className="hidden md:inline-flex"><Link to="/domains">View all <ArrowRight className="ml-1 size-4" /></Link></Button>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOMAINS.slice(0, 6).map((d) => (
            <Link key={d.slug} to="/domains/$slug" params={{ slug: d.slug }} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 transition hover:-translate-y-1 hover:border-primary/60">
              <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${d.color} opacity-0 transition group-hover:opacity-10`} />
              <div className={`grid size-12 place-items-center rounded-xl bg-gradient-to-br ${d.color} text-sm font-bold text-white`}>{d.icon}</div>
              <h3 className="mt-4 font-semibold">{d.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>
              <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">Explore <ArrowRight className="ml-1 size-4 transition group-hover:translate-x-1" /></div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 brand-gradient p-10 text-center text-white">
          <img src={logo} alt="" className="absolute right-6 top-6 size-20 opacity-20" />
          <h2 className="text-3xl font-bold md:text-4xl">Ready to build something real?</h2>
          <p className="mt-3 text-white/80">Get your offer letter in seconds. No application fee — pay only ₹100 at certification.</p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link to="/auth">Apply now <ArrowRight className="ml-1 size-4" /></Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-foreground">{n}</div>
      <div className="uppercase tracking-wider">{label}</div>
    </div>
  );
}
