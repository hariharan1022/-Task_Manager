import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { COMPANY } from "@/lib/constants";
import { ShieldCheck, Target, Users, Award } from "lucide-react";
import sigFounder from "@/assets/sig-founder.jpg";
import sigCofounder from "@/assets/sig-cofounder.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Skyrovix IT Solutions" },
      { name: "description", content: "Learn about Skyrovix IT Solutions, our mission, founders, and the task-based internship platform." },
      { property: "og:title", content: "About Skyrovix" },
      { property: "og:description", content: "MSME-registered IT solutions company building real-world internship experiences for students." },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  { icon: Target, title: "Real Skills", desc: "Every task mirrors industry work — no toy projects." },
  { icon: ShieldCheck, title: "Verifiable", desc: "Every certificate carries a unique ID and QR for instant verification." },
  { icon: Users, title: "Student-First", desc: "Built for learners, with mentorship-style task reviews." },
  { icon: Award, title: "Recognised", desc: "Issued by an MSME-registered IT company." },
];

function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="mx-auto max-w-5xl px-4 pt-16 pb-12 sm:pt-24">
          <p className="text-sm font-medium text-primary">About us</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            We help students <span className="brand-text">build real things</span>.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {COMPANY.name} is an MSME-registered IT services company. We run a task-based
            virtual internship program that helps students gain genuine, portfolio-grade
            experience — not just a certificate.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-5">
                <v.icon className="size-6 text-primary" />
                <h3 className="mt-3 font-semibold">{v.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl font-bold sm:text-3xl">Our Mission</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            The gap between college coursework and the work students actually do on day one
            of a real job is huge. We close that gap with structured, mentor-reviewed
            internship tracks across 10 in-demand technology domains. Apply in minutes, get
            an offer letter and ID card instantly, ship 5 tasks, and walk away with a
            verifiable certificate you can share with recruiters.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl font-bold sm:text-3xl">Leadership</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="grid size-14 shrink-0 place-items-center rounded-full brand-gradient font-display text-lg font-bold text-white">HS</div>
                <div className="min-w-0">
                  <p className="font-semibold">{COMPANY.founder.name}</p>
                  <p className="text-sm text-muted-foreground">{COMPANY.founder.title}</p>
                </div>
              </div>
              <img src={sigFounder} alt="" className="mt-4 h-12 object-contain opacity-80" />
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="grid size-14 shrink-0 place-items-center rounded-full brand-gradient font-display text-lg font-bold text-white">MS</div>
                <div className="min-w-0">
                  <p className="font-semibold">{COMPANY.cofounder.name}</p>
                  <p className="text-sm text-muted-foreground">{COMPANY.cofounder.title}</p>
                </div>
              </div>
              <img src={sigCofounder} alt="" className="mt-4 h-12 object-contain opacity-80" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
