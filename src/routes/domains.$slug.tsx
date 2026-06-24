import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getDomain, DURATIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/domains/$slug")({
  head: ({ params }) => {
    const d = getDomain(params.slug);
    return { meta: [{ title: `${d?.name ?? "Domain"} — Skyrovix Internship` }, { name: "description", content: d?.description ?? "Skyrovix internship domain." }] };
  },
  component: DomainPage,
});

function DomainPage() {
  const { slug } = Route.useParams();
  const d = getDomain(slug);
  if (!d) throw notFound();

  const { data: tasks } = useQuery({
    queryKey: ["tasks", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").eq("domain", slug).order("task_number");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16">
        <Link to="/domains" className="text-sm text-muted-foreground hover:text-foreground">← All domains</Link>
        <div className="mt-6 flex items-start gap-6">
          <div className={`grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${d.color} text-lg font-bold text-white sm:size-20`}>{d.icon}</div>
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold">{d.name}</h1>
            <p className="mt-2 text-muted-foreground">{d.description}</p>
          </div>
        </div>

        <Button asChild size="lg" className="mt-8 brand-gradient text-white border-0">
          <Link to="/auth">Apply for this domain <ArrowRight className="ml-1 size-4" /></Link>
        </Button>

        <div className="mt-12">
          <h2 className="text-2xl font-bold">Curriculum</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose your internship duration — more tasks = deeper learning.</p>

          <div className="mt-4 mb-8 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DURATIONS.map((d) => (
              <div key={d.value} className="rounded-xl border border-border/50 bg-white/60 dark:bg-[#0f172a]/60 p-3 text-center text-xs card-elevated">
                <p className="font-bold text-[#07284a] dark:text-[#60a5fa]">{d.label}</p>
                <p className="text-muted-foreground mt-0.5">{d.tasks} tasks</p>
              </div>
            ))}
          </div>

          <ol className="mt-6 space-y-4">
            {tasks?.map((t) => (
              <li key={t.id} className="rounded-2xl border border-border/60 bg-card/40 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-full brand-gradient text-sm font-bold text-white">{t.task_number}</div>
                  <h3 className="font-semibold">{t.title}</h3>
                </div>
                <p className="mt-2 ml-11 text-sm text-muted-foreground">{t.description}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-12 rounded-2xl border border-primary/40 bg-primary/5 p-6">
          <h3 className="font-semibold flex items-center gap-2"><CheckCircle2 className="size-5 text-primary" /> What you'll get</h3>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <li>✓ Instant offer letter</li>
            <li>✓ Digital ID card with QR</li>
            <li>✓ Mentor feedback on submissions</li>
            <li>✓ Verified certificate (₹100 fee)</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
