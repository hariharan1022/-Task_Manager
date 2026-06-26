import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DOMAINS, DURATIONS, durationConfig, generateInternId, getDomain } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { ArrowRight, ShieldCheck, Clock, Users, Eye, Sparkles } from "lucide-react";
import { AuroraBackground } from "@/components/AuroraBackground";
import { FadeUp } from "@/components/motion";

export const Route = createFileRoute("/domains/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Internship Domains — Skyrovix" }, { name: "description", content: "Browse 10 internship domains: Full Stack, Frontend, Backend, Data Science, AI/ML, UI/UX, Python, Java, Cyber Security, Digital Marketing." }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    apply: typeof search.apply === "string" ? search.apply : undefined,
  }),
  component: DomainsPage,
});

const DOMAIN_IMAGES: Record<string, string> = {
  fullstack: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=338&fit=crop&auto=format",
  frontend: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=338&fit=crop&auto=format",
  backend: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=338&fit=crop&auto=format",
  datascience: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=338&fit=crop&auto=format",
  aiml: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=338&fit=crop&auto=format",
  uiux: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=338&fit=crop&auto=format",
  python: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&h=338&fit=crop&auto=format",
  java: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=338&fit=crop&auto=format",
  cybersecurity: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=338&fit=crop&auto=format",
  digitalmarketing: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=338&fit=crop&auto=format",
};

function DomainsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [applyDomain, setApplyDomain] = useState<string | null>(search.apply ?? null);
  const [applyDuration, setApplyDuration] = useState(1);
  const [applying, setApplying] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Auto-open dialog from search param (e.g. navigating from detail page)
  useEffect(() => {
    if (search.apply && DOMAINS.some((d) => d.slug === search.apply)) {
      setApplyDomain(search.apply);
    }
  }, [search.apply]);

  const { data: applications } = useQuery({
    queryKey: ["my-applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("domain")
        .eq("user_id", user!.id);
      return data ?? [];
    },
  });

  const appliedDomains = new Set(applications?.map((a) => a.domain) ?? []);

  const submitApplication = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!applyDomain) return;
    const fd = new FormData(e.currentTarget);
    setApplying(true);
    try {
      let currentUser = user;
      if (!currentUser) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: String(fd.get("email")),
          password: String(fd.get("password")),
          options: { data: { full_name: String(fd.get("full_name")) } },
        });
        if (signUpError) throw signUpError;
        currentUser = signUpData.user;
        if (!currentUser) throw new Error("Account creation failed");
      }

      let photo_url: string | null = null;
      if (photoFile && currentUser) {
        const ext = photoFile.name.split(".").pop();
        const path = `${currentUser.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, photoFile, { upsert: true });
        if (!upErr) {
          const { data: signed } = await supabase.storage.from("profile-photos").createSignedUrl(path, 60 * 60 * 24 * 365);
          photo_url = signed?.signedUrl ?? null;
        }
      }

      const dur = durationConfig(applyDuration);
      const intern_id = generateInternId();
      const payload = {
        user_id: currentUser.id,
        domain: applyDomain,
        duration: applyDuration,
        total_tasks: dur?.tasks ?? 5,
        intern_id,
        full_name: String(fd.get("full_name")),
        email: currentUser.email ?? "",
        phone: String(fd.get("phone")),
        college: String(fd.get("college")),
        course: String(fd.get("course")),
        year: String(fd.get("year")),
        photo_url,
        status: "approved" as const,
      };
      const { error: insertError } = await supabase.from("applications").insert(payload);
      if (insertError) throw insertError;

      await supabase.from("profiles").upsert({
        id: currentUser.id,
        full_name: payload.full_name,
        phone: payload.phone,
        college: payload.college,
        course: payload.course,
        year: payload.year,
        photo_url,
      });

      toast.success("Application submitted! Your internship has started.");
      console.log("[Email] Application Created — now sending offer letter email...");
      try {
        const { sendOfferLetterEmail } = await import("@/lib/email-helpers");
        const domainObj = getDomain(applyDomain!);
        const domainName = domainObj?.name ?? applyDomain!;
        console.log("[Email] Calling sendOfferLetterEmail...");
        const result = await sendOfferLetterEmail({ to: currentUser.email ?? "", studentName: payload.full_name, studentId: currentUser.id, internId: intern_id, domainName, duration: applyDuration });
        console.log("[Email] Result:", JSON.stringify(result));
        if (result.success) toast.success("Offer letter sent to your email!");
        else toast.error(`Offer letter email failed: ${result.error || "Unknown error"}`);
      } catch (e: any) {
        const msg = e?.message || e?.toString() || "Unknown error";
        toast.error(`Offer letter email failed: ${msg}`);
        console.error("[Email] Failed to send offer letter:", e);
      }
      setApplyDomain(null);
      if (user) navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = (err as any)?.message || (err as any)?.error_description || "Something went wrong. Check that duration & total_tasks columns exist in the applications table.";
      toast.error(msg);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <AuroraBackground>
        <section className="relative pb-6 sm:pb-10 pt-8 sm:pt-16 md:pt-24">
          <div className="mx-auto max-w-7xl px-4">
            <FadeUp className="text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#07284a]/15 bg-white/60 dark:bg-[#0f172a]/60 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-medium text-[#07284a] dark:text-[#60a5fa] shadow-sm backdrop-blur">
                <ShieldCheck className="size-3 sm:size-3.5" /> Internship Programs
              </div>
              <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
                All <span className="brand-text">Domains</span>
              </h1>
              <p className="mt-5 mx-auto max-w-2xl text-sm sm:text-base text-muted-foreground">
                Each domain offers a 5-task curriculum designed to build real, portfolio-ready skills.
              </p>
            </FadeUp>
          </div>
        </section>
      </AuroraBackground>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DOMAINS.map((d) => {
            const isEnrolled = appliedDomains.has(d.slug);
            return (
            <div key={d.slug} className="group block rounded-2xl border border-border/50 bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5">
              {/* Banner Image */}
              <Link to="/domains/$slug" params={{ slug: d.slug }} className={`block relative h-36 overflow-hidden bg-gradient-to-br ${d.color}`}>
                <img
                  src={DOMAIN_IMAGES[d.slug]}
                  alt={d.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <div className="absolute top-3 right-3">
                  <Badge className="bg-white/20 backdrop-blur text-white border-0 text-[10px] px-2.5 py-1">Internship</Badge>
                </div>
              </Link>
              {/* Content */}
              <div className="p-5 space-y-4">
                <Link to="/domains/$slug" params={{ slug: d.slug }}>
                  <h3 className="text-lg font-bold transition-colors hover:text-[#07284a] dark:hover:text-[#60a5fa]">{d.name}</h3>
                </Link>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{d.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="size-3.5" /> 1-6 months</span>
                  <span className="flex items-center gap-1"><Users className="size-3.5" /> Remote</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto">Free</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-10 rounded-xl text-sm gap-1.5 border-border/60" asChild>
                    <Link to="/domains/$slug" params={{ slug: d.slug }}>
                      <Eye className="size-4" /> View Details
                    </Link>
                  </Button>
                  {isEnrolled ? (
                    <Button className="flex-1 h-10 rounded-xl text-sm gap-1.5 bg-[#07284a] hover:bg-[#07284a]/90 dark:bg-[#1d4ed8] dark:hover:bg-[#1d4ed8]/90 text-white border-0 shadow-sm" asChild>
                      <Link to="/dashboard">
                        <ArrowRight className="size-4" /> Continue Internship
                      </Link>
                    </Button>
                  ) : (
                    <Button className="flex-1 h-10 rounded-xl text-sm gap-1.5 bg-[#07284a] hover:bg-[#07284a]/90 dark:bg-[#1d4ed8] dark:hover:bg-[#1d4ed8]/90 text-white border-0 shadow-sm transition-all hover:shadow-md hover:shadow-[#07284a]/30"
                      onClick={() => setApplyDomain(d.slug)}>
                      <Sparkles className="size-4" /> Apply Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
      <Footer />

      <Dialog open={!!applyDomain} onOpenChange={(o) => { if (!o) { setApplyDomain(null); setApplyDuration(1); setPhotoFile(null); navigate({ to: "/domains", search: {} }); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for {applyDomain && DOMAINS.find((d) => d.slug === applyDomain)?.name}</DialogTitle>
            <DialogDescription>Fill in your details. You'll get your offer letter and ID card instantly.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitApplication} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Full Name</Label>
              <Input name="full_name" defaultValue={user?.user_metadata?.full_name ?? ""} required className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" defaultValue={user?.email ?? ""} required={!user} disabled={!!user} className="mt-1" />
            </div>
            {!user && (
              <div>
                <Label>Password</Label>
                <Input name="password" type="password" minLength={6} required={!user} className="mt-1" />
              </div>
            )}
            <div>
              <Label>Phone</Label>
              <Input name="phone" type="tel" required className="mt-1" />
            </div>
            <div>
              <Label>College / University</Label>
              <Input name="college" required className="mt-1" />
            </div>
            <div>
              <Label>Course / Branch</Label>
              <Input name="course" required className="mt-1" />
            </div>
            <div>
              <Label>Year</Label>
              <Input name="year" placeholder="e.g. 3rd year" required className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label>Duration</Label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setApplyDuration(d.value)}
                    className={`rounded-xl border p-2.5 sm:p-3 text-left transition-all ${
                      applyDuration === d.value
                        ? "border-[#07284a] bg-[#07284a]/10 dark:border-[#60a5fa] dark:bg-[#60a5fa]/10 ring-1 ring-[#07284a]/20"
                        : "border-border/60 bg-white/50 dark:bg-[#0f172a]/50 hover:border-border"
                    }`}
                  >
                    <p className="text-xs sm:text-sm font-semibold">{d.label}</p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{d.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Profile Photo</Label>
              <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} className="mt-1 file:truncate" />
            </div>
            <Button type="submit" className="w-full md:col-span-2 brand-gradient text-white border-0 h-11" disabled={applying}>
              {applying ? "Submitting…" : "Submit Application"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
