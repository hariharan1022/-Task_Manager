import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { COMPANY } from "@/lib/constants";
import { Mail, MapPin, Globe, Sparkles } from "lucide-react";
import { AuroraBackground } from "@/components/AuroraBackground";
import { FadeUp } from "@/components/motion";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Skyrovix Internship Portal" },
      { name: "description", content: "Get in touch with Skyrovix for support, partnerships, or internship questions." },
      { property: "og:title", content: "Contact Skyrovix" },
      { property: "og:description", content: "Reach the Skyrovix team for internship support and partnerships." },
    ],
  }),
  component: ContactPage,
});

const ITEMS = [
  { icon: Mail, label: "Email", value: COMPANY.email, href: `mailto:${COMPANY.email}` },
  { icon: Globe, label: "Website", value: COMPANY.website, href: `https://${COMPANY.website}` },
  { icon: MapPin, label: "Location", value: "India", href: null },
];

function ContactPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <AuroraBackground>
        <section className="relative pb-8 sm:pb-12 pt-12 sm:pt-20 md:pt-28">
          <div className="mx-auto max-w-5xl px-4">
            <FadeUp className="text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#07284a]/15 bg-white/60 dark:bg-[#0f172a]/60 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-medium text-[#07284a] dark:text-[#60a5fa] shadow-sm backdrop-blur">
                <Sparkles className="size-3 sm:size-3.5" /> Get in Touch
              </div>
              <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
                Talk to <span className="brand-text">Skyrovix</span>.
              </h1>
              <p className="mt-5 mx-auto max-w-2xl text-sm sm:text-base text-muted-foreground">
                Questions about your internship, certificate verification, or partnerships? Send
                us a message and our team will get back within 1–2 business days.
              </p>
            </FadeUp>
          </div>
        </section>
      </AuroraBackground>
      <main className="mx-auto max-w-5xl px-4 py-12 sm:pt-16 sm:pb-16">

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {ITEMS.map((it) => (
              <div key={it.label} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <it.icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{it.label}</p>
                  {it.href ? (
                    <a href={it.href} className="truncate font-medium text-foreground hover:text-primary">{it.value}</a>
                  ) : (
                    <p className="truncate font-medium">{it.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const subject = encodeURIComponent(`Skyrovix inquiry from ${fd.get("name")}`);
              const body = encodeURIComponent(`${fd.get("message")}\n\n— ${fd.get("name")} (${fd.get("email")})`);
              window.location.href = `mailto:${COMPANY.email}?subject=${subject}&body=${body}`;
            }}
            className="space-y-4 rounded-2xl border border-border bg-card p-6"
          >
            <div>
              <label className="text-sm font-medium">Name</label>
              <input name="name" required className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input name="email" type="email" required className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea name="message" rows={5} required className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <button type="submit" className="w-full rounded-md brand-gradient px-4 py-2.5 text-sm font-medium text-white">
              Send message
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
