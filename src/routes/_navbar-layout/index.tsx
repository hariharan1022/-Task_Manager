import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DOMAINS, COMPANY, DURATIONS, durationConfig, generateInternId } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRecentReviews, computeStats } from "@/lib/reviews";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { AuroraBackground } from "@/components/AuroraBackground";
import { FadeUp, Reveal, ScaleIn, FadeIn } from "@/components/motion";
import {
  BookOpen, Layers, Monitor, Server, BarChart3, Brain, Palette,
  Code2, Shield, TrendingUp, ArrowRight, Award, FileCheck, Rocket,
  ShieldCheck, GraduationCap, IndianRupee, HelpCircle, Trophy,
  Sparkles, ChevronRight, CheckCircle2, Quote, Star,
  ArrowUpRight, Globe, Zap, Users, Target, HeartHandshake,
  Clock, MessageSquare, Briefcase, Laptop, Building2,
  Loader2,
} from "lucide-react";
import { HeroVisual } from "@/components/HeroVisual";
import founderPhoto from "@/assets/founder.jpeg";
import cofounderPhoto from "@/assets/co founder.jpeg";

const COURSE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Layers, Monitor, Server, BarChart3, Brain, Palette, Code2, Shield, TrendingUp,
};

export const Route = createFileRoute("/_navbar-layout/")({
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applyDomain, setApplyDomain] = useState<string | null>(null);
  const [applyDuration, setApplyDuration] = useState(1);
  const [applying, setApplying] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const { data: courses } = useQuery({
    queryKey: ["home-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, slug, name, short_description, icon, domain, total_topics, total_tasks, quiz_marks, duration_weeks, difficulty")
        .eq("is_published", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

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

      const intern_id = generateInternId();
      const dur = durationConfig(applyDuration);
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
      {/* ─── HERO ─── */}
      <AuroraBackground>
        <section className="relative pt-4 sm:pt-6 pb-20 sm:pb-24 md:pb-32">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
              <FadeUp className="text-center md:text-left">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#07284a]/15 bg-white/60 dark:bg-[#0f172a]/60 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-medium text-[#07284a] dark:text-[#60a5fa] shadow-sm backdrop-blur">
                  <ShieldCheck className="size-3 sm:size-3.5" />
                  <span className="hidden sm:inline">MSME Registered · Skyrovix</span>
                  <span className="sm:hidden">MSME Registered</span>
                </div>

                <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                  Learn by building.<br />
                  <span className="brand-text">Get certified.</span>
                </h1>

                <div className="mt-4">
                  <p className="text-sm sm:text-lg text-muted-foreground">
                    Build in{" "}
                    <TypingText texts={["Full Stack Development", "Data Science", "Cyber Security", "UI/UX Design"]} />
                  </p>
                </div>

                <p className="mt-5 max-w-lg text-sm sm:text-base leading-relaxed text-muted-foreground mx-auto md:mx-0">
                  Task-based virtual internships — apply in minutes, get an instant offer letter and
                  ID card, complete real-world projects, and earn a QR-verified certificate.
                </p>

                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center md:justify-start gap-3">
                  <Link to="/auth" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto rounded-xl bg-[#07284a] hover:bg-[#07284a]/90 text-white border-0 px-7 py-5 sm:py-6 text-sm sm:text-base font-semibold shadow-lg shadow-[#07284a]/25 hover:shadow-xl transition-all btn-premium hover:btn-premium-hover active:btn-premium-active">
                      Start your internship <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </Link>
                  <Link to="/domains" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-xl border-2 border-border px-7 py-5 sm:py-6 text-sm sm:text-base font-semibold shadow-sm transition-all hover:border-[#07284a]/30 hover:bg-[#07284a]/5 hover:shadow-md btn-premium active:btn-premium-active">
                      Browse domains
                    </Button>
                  </Link>
                </div>

                <div className="mt-8 sm:mt-12 flex items-center justify-center md:justify-start gap-4 sm:gap-8">
                  <div>
                    <div className="text-xl sm:text-3xl font-bold brand-text">10</div>
                    <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">Domains</div>
                  </div>
                  <div className="h-6 sm:h-10 w-px bg-border" />
                  <div>
                    <div className="text-xl sm:text-3xl font-bold brand-text">50+</div>
                    <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">Projects</div>
                  </div>
                  <div className="h-6 sm:h-10 w-px bg-border" />
                  <div>
                    <div className="text-xl sm:text-3xl font-bold brand-text">100%</div>
                    <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">Online</div>
                  </div>
                </div>
              </FadeUp>

              <FadeUp delay={0.15} className="hidden md:block">
                <HeroVisual />
              </FadeUp>
            </div>
          </div>
        </section>
      </AuroraBackground>

      {/* ─── COMPACT ABOUT ─── */}
      <section className="py-20 sm:py-24 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <div className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-[#07284a]/5 via-blue-50/30 to-transparent dark:from-[#07284a]/8 dark:via-blue-950/15 p-8 sm:p-12">
              <div className="absolute -top-20 -right-20 size-60 rounded-full bg-[#07284a]/8 blur-3xl" />
              <div className="relative grid items-center gap-8 sm:grid-cols-2">
                <div>
                  <p className="inline-flex items-center gap-1.5 rounded-full border border-[#07284a]/30 bg-[#07284a]/10 px-3 py-1 text-xs font-semibold tracking-widest text-[#07284a] uppercase mb-4">About Skyrovix</p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    MSME-registered. <span className="brand-text">Student-built.</span>
                  </h2>
                  <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                    We run a task-based virtual internship program across 10 domains. Apply free, get
                    an instant offer letter and ID card, complete 5 real projects, earn a QR-verified
                    certificate.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "10+", label: "Domains" }, { value: "5", label: "Tasks per track" },
                    { value: "100%", label: "Online" }, { value: "₹100", label: "Cert fee" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-border/40 bg-white/50 dark:bg-[#0f172a]/50 p-3.5 text-center">
                      <div className="text-xl font-bold brand-text">{s.value}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="border-y border-border/40 bg-[#f8fafc]/50 dark:bg-[#020617]/50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-xs font-medium rounded-full border border-border/60">How it works</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Your journey to certification</h2>
              <p className="mt-3 text-muted-foreground">A simple 5-step journey from application to certification.</p>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <FadeUp key={i} delay={0.1 + i * 0.08}>
                <div className="group relative rounded-2xl border border-border/50 bg-white/60 dark:bg-[#0f172a]/60 p-6 backdrop-blur transition-all card-elevated hover:card-elevated-hover">
                  <div className="absolute -top-3 left-5 grid size-7 place-items-center rounded-full bg-[#07284a] dark:bg-[#1d4ed8] text-xs font-bold text-white shadow-md">{i + 1}</div>
                  <s.icon className="mt-2 size-6 text-[#07284a] dark:text-[#60a5fa]" />
                  <h3 className="mt-4 font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY SKYROVIX ─── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-xs font-medium rounded-full border border-border/60">Why Skyrovix</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Built differently</h2>
              <p className="mt-3 text-muted-foreground">Everything you need to launch your career — in one platform.</p>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Briefcase, title: "Real Projects", desc: "Build portfolio-grade work, not toy assignments. Every task ships production-quality code." },
              { icon: MessageSquare, title: "Mentor Reviews", desc: "Get detailed feedback on every submission. Revise, improve, and ship better work." },
              { icon: Clock, title: "Self-Paced", desc: "Learn on your schedule. Finish in 2 weeks or take 2 months — it's up to you." },
              { icon: Award, title: "Verified Certificate", desc: "Every certificate has a unique ID and QR code. Share it with recruiters instantly." },
              { icon: ShieldCheck, title: "MSME Registered", desc: "Issued by a registered IT company. Adds real weight to your resume and LinkedIn." },
              { icon: IndianRupee, title: "No Hidden Fees", desc: "Apply and start for free. Pay only ₹100 at certification — no strings attached." },
            ].map((b, i) => (
              <FadeUp key={b.title} delay={0.1 + i * 0.08}>
                <div className="group rounded-2xl border border-border/50 bg-white/60 dark:bg-[#0f172a]/60 p-6 transition-all card-elevated hover:card-elevated-hover">
                  <div className="grid size-10 place-items-center rounded-xl bg-[#07284a]/10 dark:bg-[#07284a]/20 text-[#07284a] dark:text-[#60a5fa] transition-all group-hover:bg-[#07284a] group-hover:text-white">
                    <b.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{b.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{b.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DOMAINS ─── */}
      <section className="border-y border-border/40 bg-[#f8fafc]/50 dark:bg-[#020617]/50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-xs font-medium rounded-full border border-border/60">Domains</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Choose your internship domain</h2>
              <p className="mt-3 text-muted-foreground">10 industry-aligned tracks. Each ships with a 5-task curriculum.</p>
            </div>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DOMAINS.slice(0, 6).map((d, i) => (
              <FadeUp key={d.slug} delay={0.1 + i * 0.06}>
                <button
                  onClick={() => setApplyDomain(d.slug)}
                  className="group relative w-full text-left overflow-hidden rounded-2xl border border-border/50 bg-white/60 dark:bg-[#0f172a]/60 transition-all card-elevated hover:card-elevated-hover"
                >
                  {/* Gradient top bar */}
                  <div className={`h-2 w-full bg-gradient-to-r ${d.color}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className={`grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${d.color} text-base font-bold text-white shadow-md transition-all group-hover:scale-110 group-hover:shadow-lg`}>
                        {d.icon}
                      </div>
                      <ArrowUpRight className="size-4 text-muted-foreground opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                    </div>
                    <h3 className="mt-4 font-bold">{d.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{d.description}</p>
                    <div className="mt-4 flex items-center gap-3 text-[10px] font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileCheck className="size-3" /> 5 Tasks
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="size-3" /> Certificate
                      </span>
                    </div>
                  </div>
                </button>
              </FadeUp>
            ))}
          </div>
          <Reveal>
            <div className="mt-8 text-center">
              <Button asChild variant="outline" className="rounded-xl h-11 transition-all hover:shadow-md border-border/60">
                <Link to="/domains">View all domains <ChevronRight className="ml-1 size-4" /></Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── COURSES ─── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-xs font-medium rounded-full border border-border/60">Learning Paths</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Explore Courses</h2>
              <p className="mt-3 text-muted-foreground">Topic-based learning paths with hands-on tasks and a final quiz.</p>
            </div>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses?.slice(0, 6).map((c, i) => {
              const Icon = COURSE_ICONS[c.icon] ?? BookOpen;
              const diffColor = c.difficulty === "Beginner" ? "text-green-600 bg-green-50 dark:text-green-300 dark:bg-green-950/30 border-green-200/50" :
                c.difficulty === "Intermediate" ? "text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30 border-amber-200/50" :
                "text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-950/30 border-red-200/50";
              const progress = Math.min(100, Math.round((c.total_tasks / (c.total_tasks + c.total_topics + c.quiz_marks / 10)) * 100));
              return (
                <FadeUp key={c.id} delay={0.1 + i * 0.08}>
                  <Card className="group overflow-hidden border border-border/50 bg-white/60 dark:bg-[#0f172a]/60 transition-all card-elevated hover:card-elevated-hover rounded-2xl">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-b from-[#07284a]/5 to-transparent dark:from-[#07284a]/10" />
                      <CardContent className="relative flex flex-col gap-4 p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#07284a] dark:bg-[#1d4ed8] text-white shadow-md transition-all group-hover:scale-110 group-hover:shadow-lg">
                            <Icon className="size-5" />
                          </div>
                          <Badge className={`shrink-0 text-[10px] font-semibold rounded-full border ${diffColor}`} variant="outline">
                            {c.difficulty}
                          </Badge>
                        </div>

                        {/* Content */}
                        <div className="space-y-1.5">
                          <h3 className="text-lg font-bold leading-tight">{c.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{c.short_description}</p>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>Course completion</span>
                            <span className="font-medium text-[#07284a] dark:text-[#60a5fa]">{progress}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-[#07284a]/10 dark:bg-[#07284a]/20">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#07284a] to-[#1d4ed8] transition-all duration-700" style={{ width: `${progress}%` }} />
                          </div>
                        </div>

                        {/* Stats grid */}
                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border border-border/50 bg-[#f8fafc]/50 dark:bg-[#020617]/30 p-3 text-[10px]">
                          <div className="text-center">
                            <dt className="text-muted-foreground">Topics</dt>
                            <dd className="mt-0.5 font-bold text-foreground">{c.total_topics}</dd>
                          </div>
                          <div className="text-center">
                            <dt className="text-muted-foreground">Tasks</dt>
                            <dd className="mt-0.5 font-bold text-foreground">{c.total_tasks}</dd>
                          </div>
                          <div className="text-center">
                            <dt className="text-muted-foreground">Quiz</dt>
                            <dd className="mt-0.5 font-bold text-foreground">{c.quiz_marks}m</dd>
                          </div>
                          <div className="text-center">
                            <dt className="text-muted-foreground">Weeks</dt>
                            <dd className="mt-0.5 font-bold text-foreground">{c.duration_weeks}</dd>
                          </div>
                        </dl>

                        {/* CTA */}
                        <Button asChild className="rounded-xl bg-[#07284a] hover:bg-[#07284a]/90 text-white border-0 h-11 shadow-sm shadow-[#07284a]/20 transition-all group-hover:shadow-md group-hover:shadow-[#07284a]/30">
                          <Link to="/courses/$slug" params={{ slug: c.slug }}>
                            <span className="flex items-center gap-1.5">
                              Start Learning <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                            </span>
                          </Link>
                        </Button>
                      </CardContent>
                    </div>
                  </Card>
                </FadeUp>
              );
            })}
          </div>
          <Reveal>
            <div className="mt-10 text-center">
              <Button asChild variant="outline" className="rounded-xl h-11 transition-all hover:shadow-md border-border/60">
                <Link to="/courses">View all courses <ChevronRight className="ml-1 size-4" /></Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── STATS BANNER ─── */}
      <section className="border-y border-border/40 bg-[#f8fafc]/50 dark:bg-[#020617]/50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: Briefcase, value: "10+", label: "Internship Domains", desc: "Industry-aligned tracks" },
              { icon: BookOpen, value: "435+", label: "Learning Topics", desc: "Comprehensive curriculum" },
              { icon: Trophy, value: "1200+", label: "Quiz Questions", desc: "Test your knowledge" },
            ].map((stat, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="group relative rounded-2xl border border-border/50 bg-white/60 dark:bg-[#0f172a]/60 p-8 text-center card-elevated hover:card-elevated-hover">
                  <div className="mx-auto grid size-12 place-items-center rounded-xl bg-[#07284a]/10 dark:bg-[#07284a]/20 text-[#07284a] dark:text-[#60a5fa] transition-all group-hover:bg-[#07284a] group-hover:text-white mb-4">
                    <stat.icon className="size-5" />
                  </div>
                  <div className="text-4xl sm:text-5xl font-bold brand-text">{stat.value}</div>
                  <div className="mt-2 text-sm font-semibold">{stat.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{stat.desc}</div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-xs font-medium rounded-full border border-border/60">Testimonials</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">What students say</h2>
              <p className="mt-3 text-muted-foreground">Hear from interns who've been through the program.</p>
            </div>
          </Reveal>
          <ReviewsGrid />
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="border-y border-border/40 bg-[#f8fafc]/50 dark:bg-[#020617]/50 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-xs font-medium rounded-full border border-border/60">FAQ</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
              <p className="mt-3 text-muted-foreground">Everything you need to know about the Skyrovix internship program.</p>
            </div>
          </Reveal>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <AccordionItem value={`faq-${i}`} className="rounded-2xl border border-border/50 bg-white/60 dark:bg-[#0f172a]/60 px-5 sm:px-6 transition-all hover:border-border">
                  <AccordionTrigger className="py-4 text-left text-sm sm:text-base font-medium hover:no-underline">{item.q}</AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              </Reveal>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-[#07284a]/20 bg-gradient-to-br from-[#07284a] via-[#0d3b66] to-[#1d4ed8] p-8 sm:p-12 md:p-16 text-center text-white shadow-2xl shadow-[#07284a]/25">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
              <div className="absolute -right-20 -top-20 size-80 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 size-60 rounded-full bg-white/5 blur-3xl" />
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Ready to build something real?</h2>
                <p className="mt-3 text-sm sm:text-base text-white/80 max-w-lg mx-auto">Get your offer letter in seconds. No application fee — pay only ₹100 at certification.</p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Button asChild size="lg" className="rounded-xl bg-white text-[#07284a] hover:bg-white/90 border-0 shadow-lg font-semibold h-12 px-8 btn-premium hover:btn-premium-hover active:btn-premium-active">
                    <Link to="/auth">Apply now <ArrowRight className="ml-1.5 size-4" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-xl bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:text-white h-12 px-8 btn-premium active:btn-premium-active">
                    <Link to="/courses">Explore courses</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── APPLY DIALOG ─── */}
      <Dialog open={!!applyDomain} onOpenChange={(o) => { if (!o) { setApplyDomain(null); setApplyDuration(1); setPhotoFile(null); } }}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Apply for {applyDomain && DOMAINS.find((d) => d.slug === applyDomain)?.name}</DialogTitle>
            <DialogDescription>Fill in your details. You'll get your offer letter and ID card instantly.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitApplication} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Full Name</Label>
              <Input name="full_name" defaultValue={user?.user_metadata?.full_name ?? ""} required className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" defaultValue={user?.email ?? ""} required={!user} disabled={!!user} className="mt-1 rounded-xl" />
            </div>
            {!user && (
              <div>
                <Label>Password</Label>
                <Input name="password" type="password" minLength={6} required={!user} className="mt-1 rounded-xl" />
              </div>
            )}
            <div>
              <Label>Phone</Label>
              <Input name="phone" type="tel" required className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label>College / University</Label>
              <Input name="college" required className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label>Course / Branch</Label>
              <Input name="course" required className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label>Year</Label>
              <Input name="year" placeholder="e.g. 3rd year" required className="mt-1 rounded-xl" />
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
              <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} className="mt-1 rounded-xl file:truncate" />
            </div>
            <Button type="submit" className="w-full md:col-span-2 rounded-xl bg-[#07284a] hover:bg-[#07284a]/90 text-white border-0 h-11" disabled={applying}>
              {applying ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const FAQ_ITEMS = [
  { q: "What is the Skyrovix internship program?", a: "It is a task-based virtual internship where you complete 5 real-world projects in your chosen domain. You get an instant offer letter, digital ID card, mentor reviews, and a verified certificate with QR code upon completion." },
  { q: "Is there any application fee?", a: "No. Applying and receiving the offer letter and ID card is completely free. A ₹100 certification fee is payable only after completing all 5 tasks, just before the certificate is issued." },
  { q: "How long does the internship take?", a: "The internship is self-paced. Most students complete it in 2–4 weeks, but you can finish faster or take more time depending on your schedule." },
  { q: "What domains are available?", a: "We offer 10 domains: Full Stack Development, Frontend, Backend, Data Science, AI & ML, UI/UX Design, Python, Java, Cyber Security, and Digital Marketing." },
  { q: "Will I get an offer letter and ID card?", a: "Yes. Immediately after applying, you receive an instant offer letter and a digital ID card with your name, domain, intern ID, and a QR code." },
  { q: "Is the certificate verifiable?", a: "Yes. Every certificate has a unique ID and QR code. Employers can verify its authenticity on our Verify Certificate page." },
  { q: "Who reviews my task submissions?", a: "Each task is reviewed by our mentor team. You'll receive feedback and can resubmit if needed. A task is marked approved once it meets the required standards." },
  { q: "Do I get a certificate if I don't complete all tasks?", a: "The certificate is issued only after you complete and get approval on all 5 tasks and pay the ₹100 certification fee." },
];

function ReviewsGrid() {
  const { data: reviews = [], isLoading } = useRecentReviews(6);
  const stats = computeStats(reviews);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <MessageSquare className="size-10 mx-auto text-muted-foreground/40" />
        <p className="text-muted-foreground">No reviews yet. Be the first student to share your experience.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-center">
        <div>
          <span className="text-3xl font-bold">{stats.average > 0 ? stats.average : "—"}</span>
          <div className="flex gap-0.5 mt-1 justify-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`size-4 ${i < Math.round(stats.average) ? "text-amber-400" : "text-muted-foreground/30"}`} fill={i < Math.round(stats.average) ? "currentColor" : "none"} />
            ))}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="text-2xl font-bold text-foreground">{stats.total}</span><br />
          review{stats.total !== 1 ? "s" : ""}
        </div>
      </div>
      {/* Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r, i) => {
          const name = r.profiles?.full_name ?? "Anonymous";
          const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
          const avatarUrl = r.profiles?.photo_url;
          const date = new Date(r.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
          return (
            <FadeUp key={r.id} delay={0.1 + i * 0.1}>
              <div className="group rounded-2xl border border-border/50 bg-white/60 dark:bg-[#0f172a]/60 p-6 transition-all card-elevated hover:card-elevated-hover">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} className={`size-4 ${si < r.rating ? "text-amber-400" : "text-muted-foreground/20"}`} fill={si < r.rating ? "currentColor" : "none"} />
                  ))}
                </div>
                <Quote className="size-5 text-[#07284a]/20 dark:text-[#60a5fa]/20 mb-2" />
                <p className="text-sm text-muted-foreground leading-relaxed italic">&ldquo;{r.content}&rdquo;</p>
                <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-3">
                  <Avatar className="size-8">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="size-full object-cover rounded-full" />
                    ) : (
                      <AvatarFallback className="text-[9px] bg-[#07284a]/10 dark:bg-[#1d4ed8]/10 text-[#07284a] dark:text-[#60a5fa]">{initials}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-[11px] text-muted-foreground">{date}</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          );
        })}
      </div>
    </div>
  );
}

function TypingText({ texts }: { texts: string[] }) {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = texts[index];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (display.length < current.length) {
        timer = setTimeout(() => setDisplay(current.slice(0, display.length + 1)), 50);
      } else {
        timer = setTimeout(() => setIsDeleting(true), 2000);
      }
    } else {
      if (display.length > 0) {
        timer = setTimeout(() => setDisplay(display.slice(0, -1)), 25);
      } else {
        setIsDeleting(false);
        setIndex((i) => (i + 1) % texts.length);
      }
    }

    return () => clearTimeout(timer);
  }, [display, isDeleting, index, texts]);

  return (
    <span className="font-semibold brand-text">
      {display}
      <span className="ml-0.5 animate-pulse">|</span>
    </span>
  );
}
