import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DOMAINS, PAYMENT, COMPANY, generateInternId, getDomain } from "@/lib/constants";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { IDCard } from "@/components/IDCard";
import { TasksSection } from "@/components/TasksSection";
import { OfferLetterDoc, CertificateDoc, CourseCertificateDoc, downloadPdf } from "@/components/pdf-docs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy, Download, FileText, CheckCircle2, Clock, XCircle, Upload, Award,
  BookOpen, GraduationCap, ArrowRight, Sparkles, User, Mail, Building,
  Phone, Calendar, ChevronRight, ExternalLink, Shield, Bell, Trophy,
  Target, BarChart3, Layers, Brain, Linkedin, Play, ChevronLeft,
  ListChecks, Flag, AlertTriangle, Zap, Hash, Circle, Loader2,
  TrendingUp, Star, Lock, Eye,
} from "lucide-react";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setInView(true); obs.unobserve(el); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<Array<{ id: number; x: number; color: string; delay: number; size: number }>>([]);
  useEffect(() => {
    if (!active) { setPieces([]); return; }
    const colors = ["#7c3aed", "#3b82f6", "#ec4899", "#10b981", "#f59e0b", "#ef4444"];
    const generated = Array.from({ length: 60 }, (_, i) => ({
      id: i, x: Math.random() * 100, color: colors[i % colors.length],
      delay: Math.random() * 0.5, size: 6 + Math.random() * 8,
    }));
    setPieces(generated);
    const t = setTimeout(() => setPieces([]), 4000);
    return () => clearTimeout(t);
  }, [active]);
  if (!pieces.length) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <div key={p.id} className="absolute animate-fall" style={{
          left: `${p.x}%`, top: "-10px", width: p.size, height: p.size,
          backgroundColor: p.color, borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          animationDelay: `${p.delay}s`, animationDuration: `${2.5 + Math.random() * 1.5}s`,
        }} />
      ))}
      <style>{`
        @keyframes fall { to { transform: translateY(105vh) rotate(720deg); opacity: 0; } }
        .animate-fall { animation: fall linear forwards; }
      `}</style>
    </div>
  );
}

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Skyrovix" }] }),
  component: Dashboard,
});

type Application = {
  id: string; user_id: string; domain: string; intern_id: string;
  full_name: string; email: string; phone: string | null;
  college: string | null; course: string | null; year: string | null;
  photo_url: string | null; offer_issued_at: string;
  created_at: string; status: string;
};

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  const { data: app, isLoading } = useQuery({
    queryKey: ["my-application", user?.id],
    queryFn: async (): Promise<Application | null> => {
      if (!user) return null;
      const { data } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: enrollments } = useQuery({
    queryKey: ["my-lms-enrollments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("enrollments")
        .select("id, course_id, status, progress_percent, completed_at, current_topic_id")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: courses } = useQuery({
    queryKey: ["all-lms-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, slug, name, domain, icon, total_topics, total_tasks, quiz_marks, pass_marks, quiz_duration_min").eq("is_published", true);
      return data ?? [];
    },
  });

  const { data: lmsCerts } = useQuery({
    queryKey: ["my-lms-certificates", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const enrollIds = (enrollments ?? []).map((e) => e.id);
      if (!enrollIds.length) return [];
      const { data } = await supabase.from("course_certificates").select("certificate_id, score, issued_at, enrollment_id").in("enrollment_id", enrollIds);
      return data ?? [];
    },
    enabled: !!user && (enrollments ?? []).length > 0,
  });

  const { data: topics } = useQuery({
    queryKey: ["my-topics", enrollments?.[0]?.course_id],
    enabled: !!enrollments?.length && !!enrollments[0].course_id,
    queryFn: async () => {
      const { data } = await supabase.from("course_topics").select("id, title, order_index").eq("course_id", enrollments![0].course_id).order("order_index");
      return data ?? [];
    },
  });

  const { data: completedTopics } = useQuery({
    queryKey: ["my-lesson-progress", enrollments?.[0]?.id],
    enabled: !!enrollments?.length,
    queryFn: async () => {
      const { data } = await supabase.from("lesson_progress").select("topic_id, completed_at").eq("enrollment_id", enrollments![0].id);
      return new Map((data ?? []).map((r) => [r.topic_id, r.completed_at]));
    },
  });

  const { data: taskSubmissions } = useQuery({
    queryKey: ["my-course-subs", enrollments?.[0]?.id],
    enabled: !!enrollments?.length,
    queryFn: async () => {
      const { data } = await supabase.from("course_task_submissions").select("*, course_tasks(task_number, title)").eq("enrollment_id", enrollments![0].id);
      return data ?? [];
    },
  });

  const { data: quizAttempts } = useQuery({
    queryKey: ["my-quiz-attempts", enrollments?.[0]?.id],
    enabled: !!enrollments?.length,
    queryFn: async () => {
      const { data } = await supabase.from("quiz_attempts").select("*").eq("enrollment_id", enrollments![0].id).order("started_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ["course-tasks-list", enrollments?.[0]?.course_id],
    enabled: !!enrollments?.length,
    queryFn: async () => {
      const { data } = await supabase.from("course_tasks").select("*").eq("course_id", enrollments![0].course_id).order("task_number");
      return data ?? [];
    },
  });

  const { data: internSubmissions } = useQuery({
    queryKey: ["my-submissions", app?.id],
    queryFn: async () => {
      if (!app) return [];
      const { data } = await supabase.from("submissions").select("*").eq("application_id", app.id);
      return data ?? [];
    },
    enabled: !!app,
  });

  const { data: certificate } = useQuery({
    queryKey: ["my-cert", app?.id],
    queryFn: async () => {
      if (!app) return null;
      const { data } = await supabase.from("certificates").select("*").eq("application_id", app.id).maybeSingle();
      return data;
    },
    enabled: !!app,
  });

  const { data: payment } = useQuery({
    queryKey: ["my-payment", app?.id],
    queryFn: async () => {
      if (!app) return null;
      const { data } = await supabase.from("payments").select("*").eq("application_id", app.id).maybeSingle();
      return data;
    },
    enabled: !!app,
  });

  const course = useMemo(() => {
    if (!enrollments?.length || !courses?.length) return null;
    return courses.find((c: any) => c.id === enrollments[0].course_id) ?? null;
  }, [enrollments, courses]);

  const enrollment = enrollments?.[0] ?? null;
  const lmsCert = useMemo(() => {
    if (!enrollment || !lmsCerts?.length) return null;
    return lmsCerts.find((c: any) => c.enrollment_id === enrollment.id) ?? null;
  }, [enrollment, lmsCerts]);

  const completedTopicCount = completedTopics?.size ?? 0;
  const totalTopics = topics?.length ?? 0;
  const completedTaskCount = taskSubmissions?.filter((s: any) => s.status === "approved").length ?? 0;
  const totalTasks = tasks?.length ?? 0;
  const lastAttempt = quizAttempts?.[0] ?? null;
  const cert = certificate ?? lmsCert;

  const timelineSteps = [
    { label: "Application Submitted", done: !!app },
    { label: "Offer Letter Received", done: !!app },
    { label: "LMS Course Started", done: !!enrollment },
    { label: "Tasks Completed", done: totalTasks > 0 && completedTaskCount >= totalTasks },
    { label: "Quiz Passed", done: !!lastAttempt?.passed },
    { label: "Certificate Generated", done: !!cert },
  ];
  const currentStep = timelineSteps.findIndex((s) => !s.done);

  if (authLoading || isLoading) return <LoadingSkeleton />;

  return (
    <div className={`min-h-screen ${dark ? "dark" : ""}`}>
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF] dark:from-[#0B1120] dark:to-[#0F172A]">
        {/* Background blobs */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -left-40 size-96 rounded-full bg-purple-400/20 blur-[120px] dark:bg-purple-600/10" />
          <div className="absolute top-1/3 -right-32 size-80 rounded-full bg-blue-400/15 blur-[100px] dark:bg-blue-600/10" />
          <div className="absolute -bottom-48 left-1/3 size-[500px] rounded-full bg-violet-400/10 blur-[140px] dark:bg-violet-600/5" />
          <div className="absolute top-2/3 left-1/4 size-64 rounded-full bg-emerald-400/5 blur-[80px] dark:bg-emerald-600/5" />
        </div>

        <Confetti active={!!cert} />
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">
          {!app ? (
            <AnimatedSection>
              <WelcomeDashboard
                user={user}
                enrollments={enrollments ?? []}
                courses={courses ?? []}
                onCreated={() => qc.invalidateQueries()}
              />
            </AnimatedSection>
          ) : (
            <div className="space-y-8">
              <AnimatedSection delay={0}>
                <HeroSection
                  app={app} enrollment={enrollment} course={course}
                  completedTopicCount={completedTopicCount} totalTopics={totalTopics}
                  completedTaskCount={completedTaskCount} totalTasks={totalTasks}
                  lastAttempt={lastAttempt} cert={cert}
                />
              </AnimatedSection>
              <AnimatedSection delay={100}>
                <StatsCards
                  totalTopics={totalTopics} completedTopicCount={completedTopicCount}
                  totalTasks={totalTasks} completedTaskCount={completedTaskCount}
                  lastAttempt={lastAttempt} cert={cert}
                />
              </AnimatedSection>
              <AnimatedSection delay={200}>
                <ProfilePanel app={app} onChange={() => qc.invalidateQueries({ queryKey: ["my-application"] })} />
              </AnimatedSection>
              <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                <div className="space-y-8">
                  <AnimatedSection delay={300}>
                    <TimelineSection steps={timelineSteps} currentStep={currentStep} />
                  </AnimatedSection>
                  <AnimatedSection delay={400}>
                    <LmsCoursesSection
                      enrollments={enrollments ?? []} courses={courses ?? []} lmsCerts={lmsCerts ?? []}
                      completedTopics={completedTopics} topics={topics ?? []}
                      taskSubmissions={taskSubmissions ?? []} tasks={tasks ?? []}
                      quizAttempts={quizAttempts ?? []} course={course} enrollment={enrollment}
                    />
                  </AnimatedSection>
                  {enrollment && course && (
                    <AnimatedSection delay={500}>
                      <CurrentTopicWidget topics={topics ?? []} completedTopics={completedTopics} enrollment={enrollment} course={course} />
                    </AnimatedSection>
                  )}
                  {enrollment && (
                    <AnimatedSection delay={600}>
                      <TasksSectionWidget tasks={tasks ?? []} submissions={taskSubmissions ?? []} enrollmentId={enrollment.id} courseSlug={course?.slug ?? ""} onChange={() => qc.invalidateQueries({ queryKey: ["my-course-subs"] })} />
                    </AnimatedSection>
                  )}
                  {enrollment && (
                    <AnimatedSection delay={700}>
                      <QuizSectionWidget course={course} lastAttempt={lastAttempt} enrollment={enrollment} completedTaskCount={completedTaskCount} totalTasks={totalTasks} />
                    </AnimatedSection>
                  )}
                </div>
                <div className="space-y-6">
                  <AnimatedSection delay={350}>
                    <CertificateSection cert={cert} app={app} course={course} enrollment={enrollment} lastAttempt={lastAttempt} />
                  </AnimatedSection>
                  <AnimatedSection delay={450}>
                    <IDCardSection app={app} />
                  </AnimatedSection>
                  <AnimatedSection delay={550}>
                    <ActivityFeed app={app} enrollment={enrollment} taskSubmissions={taskSubmissions ?? []} lastAttempt={lastAttempt} topics={topics ?? []} completedTopics={completedTopics} cert={cert} lmsCert={lmsCert} />
                  </AnimatedSection>
                </div>
              </div>
            </div>
          )}
        </main>
        <Footer />

        {/* Quick Actions FAB */}
        {app && (
          <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
            {enrollment && course && (
              <>
                <Button size="sm" className="brand-gradient text-white border-0 shadow-lg shadow-purple-500/25 rounded-full px-5 h-11" asChild>
                  <Link to="/courses/$slug" params={{ slug: course.slug }}><Play className="mr-1.5 size-4" /> Continue Course</Link>
                </Button>
                {cert && (
                  <Button size="sm" variant="outline" className="rounded-full px-5 h-11 border-border/60 bg-white/80 backdrop-blur dark:bg-[#1E293B]/80">
                    <Download className="mr-1.5 size-4" /> Download Certificate
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="space-y-6">
          <div className="h-40 animate-pulse rounded-3xl bg-white/60 dark:bg-[#1E293B]/60" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/60 dark:bg-[#1E293B]/60" />)}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-white/60 dark:bg-[#1E293B]/60" />
        </div>
      </main>
    </div>
  );
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let start = 0;
    const end = value;
    const dur = 800;
    const step = Math.max(1, Math.floor(end / 30));
    const t = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(t); }
      else setCount(start);
    }, dur / 30);
    return () => clearInterval(t);
  }, [value]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── HERO ───

function HeroSection({ app, enrollment, course, completedTopicCount, totalTopics, completedTaskCount, totalTasks, lastAttempt, cert }: any) {
  const domain = getDomain(app.domain);
  const pct = enrollment?.progress_percent ?? 0;
  const circ = 2 * Math.PI * 54;
  const offset = circ - (circ * pct) / 100;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-white/70 backdrop-blur-xl p-6 sm:p-8 dark:bg-[#1E293B]/70 dark:border-white/5">
      <div className="absolute -right-20 -top-20 size-64 rounded-full bg-purple-400/10 blur-[100px]" />
      <div className="relative flex flex-wrap items-start justify-between gap-8">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="grid size-10 place-items-center rounded-full brand-gradient text-sm font-bold text-white shadow-md">
              {app.full_name?.charAt(0).toUpperCase() ?? "S"}
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Welcome Back, <span className="brand-text">{app.full_name?.split(" ")[0] ?? "Student"}</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Continue your <span className="font-semibold text-foreground">{course?.name ?? domain?.name}</span> and complete your tasks to unlock certificates.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
              <Target className="size-3.5" /> {domain?.name ?? app.domain}
            </Badge>
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs">
              <Hash className="size-3.5" /> {app.intern_id}
            </Badge>
            {enrollment && (
              <Badge className="gap-1.5 px-3 py-1.5 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <CheckCircle2 className="size-3.5" /> Course Active
              </Badge>
            )}
          </div>
        </div>

        {/* Circular Progress */}
        <div className="flex shrink-0 flex-col items-center">
          <div className="relative grid size-32 place-items-center">
            <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="oklch(0.9 0.01 270)" strokeWidth="6" className="dark:stroke-white/10" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="url(#heroGrad)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease" }} />
              <defs>
                <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-center">
              <span className="font-display text-2xl font-bold">{pct}%</span>
              <p className="text-[10px] text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STATS CARDS ───

function StatsCards({ totalTopics, completedTopicCount, totalTasks, completedTaskCount, lastAttempt, cert }: any) {
  const stats = [
    {
      icon: BookOpen, label: "LMS Courses", value: `${completedTopicCount} / ${totalTopics}`,
      sub: "Topics Completed", color: "from-violet-500 to-purple-600", bg: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
      icon: CheckCircle2, label: "Tasks", value: `${completedTaskCount} / ${totalTasks}`,
      sub: "Completed", color: "from-emerald-500 to-green-600", bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      icon: Brain, label: "Quiz Score", sub: lastAttempt?.passed ? "PASSED" : "Not Taken",
      value: lastAttempt ? `${lastAttempt.score} / ${lastAttempt.total}` : "—",
      color: lastAttempt?.passed ? "from-blue-500 to-cyan-600" : "from-amber-500 to-orange-500",
      bg: lastAttempt?.passed ? "bg-blue-50 dark:bg-blue-950/30" : "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      icon: Award, label: "Certificates", value: cert ? "1 Earned" : "None",
      sub: cert ? "Download Available" : "Complete course to earn",
      color: "from-rose-500 to-pink-600", bg: "bg-rose-50 dark:bg-rose-950/30",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={i}
            className="group rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/5 dark:bg-[#1E293B]/70 dark:hover:shadow-white/5"
          >
            <div className="flex items-start justify-between">
              <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${s.bg}`}>
                <Icon className={`size-5 bg-gradient-to-br ${s.color} bg-clip-text text-transparent`} />
              </div>
              <span className={`rounded-full bg-gradient-to-br ${s.color} px-2.5 py-0.5 text-[10px] font-medium text-white`}>{s.sub}</span>
            </div>
            <p className="mt-3 font-display text-2xl font-bold">{s.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── PROFILE ───

function ProfilePanel({ app, onChange }: { app: Application; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const { user } = useAuth();
  const domain = getDomain(app.domain);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      let photo_url = app.photo_url;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, photoFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: publicUrl } = supabase.storage.from("profile-photos").getPublicUrl(path);
        photo_url = publicUrl?.publicUrl ?? photo_url;
      }
      const updates = {
        full_name: String(fd.get("full_name")),
        phone: String(fd.get("phone")),
        college: String(fd.get("college")),
        course: String(fd.get("course")),
        year: String(fd.get("year")),
        photo_url,
      };
      const { error } = await supabase.from("applications").update(updates).eq("id", app.id);
      if (error) throw error;
      await supabase.from("profiles").update(updates).eq("id", user.id);
      toast.success("Profile updated");
      setEditing(false);
      setPhotoFile(null);
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally { setSaving(false); }
  };

  if (editing) return (
    <Card className="rounded-2xl border-border/50 bg-white/70 backdrop-blur-xl dark:bg-[#1E293B]/70">
      <CardHeader><CardTitle>Edit Profile</CardTitle><CardDescription>Update your details.</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><Label>Full Name</Label><Input name="full_name" defaultValue={app.full_name} required className="mt-1" /></div>
          <div><Label>Phone</Label><Input name="phone" type="tel" defaultValue={app.phone ?? ""} required className="mt-1" /></div>
          <div><Label>Year</Label><Input name="year" defaultValue={app.year ?? ""} required className="mt-1" /></div>
          <div><Label>College</Label><Input name="college" defaultValue={app.college ?? ""} required className="mt-1" /></div>
          <div><Label>Course / Branch</Label><Input name="course" defaultValue={app.course ?? ""} required className="mt-1" /></div>
          <div className="md:col-span-2"><Label>Photo {app.photo_url && <span className="text-xs text-muted-foreground">(leave empty to keep current)</span>}</Label><Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} className="mt-1" /></div>
          <div className="md:col-span-2 flex gap-2">
            <Button type="submit" disabled={saving} className="brand-gradient text-white border-0">{saving ? "Saving…" : "Save Changes"}</Button>
            <Button type="button" variant="outline" onClick={() => { setEditing(false); setPhotoFile(null); }}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <Card className="overflow-hidden rounded-2xl border-border/50 bg-white/70 backdrop-blur-xl dark:bg-[#1E293B]/70">
      <div className="h-1.5 brand-gradient" />
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            {app.photo_url ? (
              <img src={app.photo_url} alt="" className="size-16 rounded-2xl border-2 border-purple-200/50 object-cover dark:border-purple-800/30" />
            ) : (
              <div className="grid size-16 place-items-center rounded-2xl brand-gradient text-xl font-bold text-white shadow-md shadow-purple-500/20">
                {app.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold">{app.full_name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Mail className="size-3.5" />{app.email}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {app.college && <span className="flex items-center gap-1"><Building className="size-3" />{app.college}</span>}
                {app.course && <span>{app.course}</span>}
                {app.year && <span className="flex items-center gap-1"><Calendar className="size-3" />{app.year}</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-xl border-border/60" onClick={() => setEditing(true)}><User className="mr-1 size-3.5" /> Edit Profile</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── TIMELINE ───

function TimelineSection({ steps, currentStep }: { steps: { label: string; done: boolean }[]; currentStep: number }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white/70 p-6 backdrop-blur-xl dark:bg-[#1E293B]/70">
      <h3 className="mb-5 flex items-center gap-2 font-bold"><Flag className="size-4 text-primary" /> Internship Progress</h3>
      <div className="relative">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-purple-500 via-blue-500 to-emerald-500 dark:from-purple-400 dark:via-blue-400 dark:to-emerald-400" />
        <ul className="space-y-0">
          {steps.map((s, i) => {
            const isActive = i === currentStep;
            const isDone = s.done;
            return (
              <li key={i} className="relative flex items-center gap-4 pb-6 last:pb-0">
                <div className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full transition-all duration-500 ${
                  isDone ? "bg-emerald-500 text-white scale-100" :
                  isActive ? "bg-purple-500 text-white ring-4 ring-purple-200 dark:ring-purple-900/40 animate-pulse-soft" :
                  "bg-gray-200 dark:bg-gray-700 text-gray-400"
                }`}>
                  {isDone ? <CheckCircle2 className="size-3.5" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                </div>
                <div className={`min-w-0 ${isActive ? "font-semibold text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                  <p className={`text-sm ${isActive ? "text-purple-700 dark:text-purple-300" : ""}`}>{s.label}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ─── LMS COURSES ───

function LmsCoursesSection({ enrollments, courses, lmsCerts, completedTopics, topics, taskSubmissions, tasks, quizAttempts, course, enrollment }: any) {
  const certMap = new Map((lmsCerts ?? []).map((c: any) => [c.enrollment_id, c]));

  if (!enrollments.length) {
    return (
      <Card className="rounded-2xl border-dashed border-border/50 bg-white/70 backdrop-blur-xl dark:bg-[#1E293B]/70">
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <div className="grid size-16 place-items-center rounded-2xl bg-purple-50 dark:bg-purple-950/30">
            <GraduationCap className="size-8 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No Enrollments Yet</h3>
            <p className="text-sm text-muted-foreground">Browse our catalog and enroll in a learning path.</p>
          </div>
          <Button asChild className="brand-gradient text-white border-0 rounded-xl">
            <Link to="/courses"><BookOpen className="mr-1.5 size-4" /> Browse Courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-bold"><BookOpen className="size-5 text-primary" /> My Courses</h3>
      {enrollments.map((enr: any) => {
        const c = courses?.find((co: any) => co.id === enr.course_id);
        if (!c) return null;
        const cert = certMap.get(enr.id);
        const completedTopicCount = completedTopics?.size ?? 0;
        const totalTopics = topics?.length ?? 0;
        const approvedTasks = taskSubmissions?.filter((s: any) => s.status === "approved").length ?? 0;
        const allTasks = tasks?.length ?? 0;
        const lastAttempt = quizAttempts?.[0] ?? null;
        const quizLocked = allTasks > 0 && approvedTasks < allTasks;

        return (
          <div key={enr.id} className="group rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-[#1E293B]/70">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid size-14 shrink-0 place-items-center rounded-2xl brand-gradient text-white shadow-md shadow-purple-500/20">
                  <GraduationCap className="size-7" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-lg">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.domain} · {c.total_topics} topics · {c.total_tasks} tasks</p>
                </div>
              </div>
              {cert ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white rounded-lg px-3 py-1.5"><Award className="mr-1 size-3.5" /> Certified</Badge>
              ) : enr.status === "completed" ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white rounded-lg px-3 py-1.5"><CheckCircle2 className="mr-1 size-3.5" /> Completed</Badge>
              ) : (
                <Badge variant="secondary" className="rounded-lg px-3 py-1.5">In Progress</Badge>
              )}
            </div>
            <div className="mt-4 max-w-md">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Progress</span><span className="font-semibold text-foreground">{enr.progress_percent}%</span>
              </div>
              <Progress value={enr.progress_percent} className="h-2.5" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border/40 bg-secondary/30 p-3 text-center text-xs">
                <span className="text-muted-foreground">Topics</span>
                <p className="font-bold text-sm mt-0.5">{completedTopicCount}/{totalTopics || c.total_topics}</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-secondary/30 p-3 text-center text-xs">
                <span className="text-muted-foreground">Tasks</span>
                <p className="font-bold text-sm mt-0.5">{approvedTasks}/{allTasks || c.total_tasks}</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-secondary/30 p-3 text-center text-xs">
                <span className="text-muted-foreground">Quiz</span>
                <p className="font-bold text-sm mt-0.5">{quizLocked ? "🔒" : lastAttempt?.passed ? `${lastAttempt.score}/${lastAttempt.total}` : "Ready"}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm" className="brand-gradient text-white border-0 rounded-xl h-9 flex-1">
                <Link to="/courses/$slug" params={{ slug: c.slug }}><Play className="mr-1.5 size-3.5" /> Continue Learning</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-xl border-border/60 h-9">
                <Link to="/courses/$slug" params={{ slug: c.slug }}><ArrowRight className="size-3.5" /></Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── CURRENT TOPIC ───

function CurrentTopicWidget({ topics, completedTopics, enrollment, course }: any) {
  if (!topics?.length) return null;
  const currentTopic = topics[completedTopics?.size ?? 0] ?? topics[0];
  const idx = topics.findIndex((t: any) => t.id === currentTopic.id);
  const done = completedTopics?.has(currentTopic.id);

  return (
    <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-md">
            <Play className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Continue Learning</p>
            <p className="font-bold text-lg">{done ? "Next: " : "Current: "}{currentTopic.title}</p>
            <p className="text-xs text-muted-foreground">Lesson {idx + 1} of {topics.length}</p>
          </div>
        </div>
        {enrollment && course ? (
          <Button asChild size="sm" className="brand-gradient text-white border-0 rounded-xl h-9">
            <Link to="/courses/$slug" params={{ slug: course.slug }}><Play className="mr-1.5 size-3.5" /> Resume Course</Link>
          </Button>
        ) : (
          <Button size="sm" className="brand-gradient text-white border-0 rounded-xl h-9" disabled>Resume Course</Button>
        )}
      </div>
      <Progress value={((completedTopics?.size ?? 0) / topics.length) * 100} className="mt-4 h-2" />
    </div>
  );
}

// ─── TASKS SECTION ───

function TasksSectionWidget({ tasks, submissions, enrollmentId, onChange, courseSlug }: any) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!tasks?.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-lg font-bold"><ListChecks className="size-5 text-primary" /> Course Tasks</h3>
      {tasks.map((t: any) => {
        const sub = submissions?.find((s: any) => s.task_id === t.id);
        const st = sub?.status ?? "pending";
        const statusConfig = ({
          approved: { label: "Completed", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: CheckCircle2 },
          pending: { label: "In Review", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", icon: Clock },
          rejected: { label: "Needs Revision", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", icon: XCircle },
        } as Record<string, { label: string; color: string; icon: any }>)[st] ?? { label: "Not Started", color: "bg-secondary text-muted-foreground", icon: Circle };

        const Tag = statusConfig.icon;
        const open = expanded === t.id;

        return (
          <div key={t.id} className={`rounded-2xl border border-border/50 bg-white/70 backdrop-blur-xl transition-all dark:bg-[#1E293B]/70 ${open ? "ring-2 ring-purple-200 dark:ring-purple-800/40" : ""}`}>
            <button onClick={() => setExpanded(open ? null : t.id)} className="flex w-full items-center justify-between p-4 text-left">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                  st === "approved" ? "bg-emerald-100 dark:bg-emerald-900/40" :
                  st === "rejected" ? "bg-red-100 dark:bg-red-900/40" :
                  "bg-purple-100 dark:bg-purple-900/40"
                }`}>
                  <Tag className={`size-5 ${
                    st === "approved" ? "text-emerald-600 dark:text-emerald-400" :
                    st === "rejected" ? "text-red-600 dark:text-red-400" :
                    "text-purple-600 dark:text-purple-400"
                  }`} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">Task {t.task_number}: {t.title}</p>
                  <p className="text-xs text-muted-foreground">Due: {t.due_days} days from start</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                <ChevronRight className={`size-4 text-muted-foreground transition ${open ? "rotate-90" : ""}`} />
              </div>
            </button>
            {open && (
              <div className="border-t border-border/40 px-4 pb-4">
                <p className="mt-3 text-sm text-foreground/80">{t.description}</p>
                {t.requirements && (
                  <div className="mt-2 rounded-xl border border-border/40 bg-secondary/30 p-3 text-xs">
                    <span className="font-semibold">Requirements:</span> {t.requirements}
                  </div>
                )}
                {sub?.feedback && (
                  <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900/30 dark:bg-blue-950/30 dark:text-blue-300">
                    <span className="font-semibold">Feedback:</span> {sub.feedback}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <TaskSubmitButton task={t} sub={sub} enrollmentId={enrollmentId} onChange={onChange} />
                  <Button asChild size="sm" variant="ghost" className="rounded-lg">
                    <Link to="/courses/$slug" params={{ slug: courseSlug }}><ExternalLink className="mr-1 size-3.5" /> View Details</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TaskSubmitButton({ task, sub, enrollmentId, onChange }: any) {
  const [open, setOpen] = useState(false);
  const [projectUrl, setProjectUrl] = useState(sub?.project_url ?? "");
  const [notes, setNotes] = useState(sub?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!projectUrl.trim()) return toast.error("Project URL is required");
    setSaving(true);
    const payload = { enrollment_id: enrollmentId, task_id: task.id, project_url: projectUrl, notes, status: "pending" as const };
    const { error } = sub
      ? await supabase.from("course_task_submissions").update(payload).eq("id", sub.id)
      : await supabase.from("course_task_submissions").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(sub ? "Submission updated" : "Submitted for review");
    onChange();
    setOpen(false);
  };

  if (sub?.status === "approved") {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-4" /> Completed Successfully
        {sub.submitted_at && <span>· {new Date(sub.submitted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>}
      </div>
    );
  }

  if (!open) return <Button size="sm" className="brand-gradient text-white border-0 rounded-lg h-8" onClick={() => setOpen(true)}>{sub ? "Update" : "Submit"}</Button>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input placeholder="Project URL" value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)} className="h-8 w-48 text-xs" />
      <Button size="sm" onClick={submit} disabled={saving} className="brand-gradient text-white border-0 h-8 text-xs">{saving ? "Saving…" : "Submit"}</Button>
      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setOpen(false)}>Cancel</Button>
    </div>
  );
}

// ─── QUIZ ───

function QuizSectionWidget({ course, lastAttempt, enrollment, completedTaskCount, totalTasks }: any) {
  if (!course) return null;
  const quizLocked = totalTasks > 0 && completedTaskCount < totalTasks;

  return (
    <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
      <div className="flex items-center gap-3 mb-4">
        <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-md">
          <Brain className="size-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{lastAttempt?.passed ? "Quiz Passed 🎉" : "Final Quiz"}</h3>
          <p className="text-xs text-muted-foreground">{lastAttempt?.passed ? "Great job! Check your certificate." : "Test your knowledge"}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-xl border border-border/40 bg-secondary/30 p-3 text-xs mb-4">
        <div className="text-center"><span className="text-muted-foreground">Questions</span><p className="font-bold text-sm mt-0.5">{course.quiz_marks / 2}</p></div>
        <div className="text-center"><span className="text-muted-foreground">Marks</span><p className="font-bold text-sm mt-0.5">{course.quiz_marks}</p></div>
        <div className="text-center"><span className="text-muted-foreground">Pass</span><p className="font-bold text-sm mt-0.5">{course.pass_marks}</p></div>
        <div className="text-center"><span className="text-muted-foreground">Time</span><p className="font-bold text-sm mt-0.5">{course.quiz_duration_min}m</p></div>
      </div>

      {lastAttempt && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/30 dark:bg-emerald-950/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Previous Score</span>
            <span className="font-bold">{lastAttempt.score}/{lastAttempt.total} · {lastAttempt.passed ? "PASSED" : "FAILED"}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {quizLocked ? (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            <Lock className="size-4" /> Complete all {totalTasks} tasks to unlock
          </div>
        ) : enrollment && course ? (
          <>
            <Button asChild size="sm" className="brand-gradient text-white border-0 rounded-xl h-9 flex-1">
              <Link to="/courses/$slug/quiz" params={{ slug: course.slug }}><Brain className="mr-1.5 size-4" /> {lastAttempt ? "Retake Quiz" : "Start Quiz"}</Link>
            </Button>
            {lastAttempt && (
              <Button asChild size="sm" variant="outline" className="rounded-xl border-border/60 h-9">
                <Link to="/courses/$slug" params={{ slug: course.slug }}><Eye className="mr-1.5 size-3.5" /> View Result</Link>
              </Button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── CERTIFICATES ───

function CertificateSection({ cert, app, course, enrollment, lastAttempt }: any) {
  if (!cert) return null;
  const isInternCert = cert.certificate_id?.startsWith("SKX-");
  const domain = getDomain(app?.domain);

  return (
    <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
      <h3 className="flex items-center gap-2 font-bold mb-4"><Award className="size-4 text-primary" /> Certificate</h3>
      <div className="rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 p-4 text-center dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200/50 dark:border-purple-800/30">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl brand-gradient text-white shadow-md mb-3">
          <Award className="size-7" />
        </div>
        <p className="font-bold text-sm">{isInternCert ? domain?.name : course?.name}</p>
        <p className="text-[10px] text-muted-foreground font-mono mt-1">{cert.certificate_id}</p>
        {cert.score != null && (
          <Badge variant="secondary" className="mt-2 text-xs">{cert.score}/{lastAttempt?.total ?? 100}</Badge>
        )}
      </div>
      <div className="mt-4 space-y-2">
        {isInternCert && app ? (
          <Button size="sm" className="w-full brand-gradient text-white border-0 rounded-xl h-9"
            onClick={() => downloadPdf(
              <CertificateDoc fullName={app.full_name} internId={app.intern_id} domain={domain?.name ?? app.domain}
                certId={cert.certificate_id} issuedAt={cert.issued_at}
                verifyUrl={`${window.location.origin}/verify-certificate`} />,
              `Certificate_${cert.certificate_id}.pdf`
            )}>
            <Download className="mr-1.5 size-4" /> Download PDF
          </Button>
        ) : (
          <Button size="sm" className="w-full brand-gradient text-white border-0 rounded-xl h-9"
            onClick={() => downloadPdf(
              <CourseCertificateDoc fullName={app?.full_name ?? "Student"} courseName={course?.name ?? "Course"}
                score={cert.score ?? 0} total={lastAttempt?.total ?? 100}
                certId={cert.certificate_id} issuedAt={cert.issued_at}
                verifyUrl={`${window.location.origin}/verify-certificate`} />,
              `Certificate_${cert.certificate_id}.pdf`
            )}>
            <Download className="mr-1.5 size-4" /> Download PDF
          </Button>
        )}
        <Button asChild size="sm" variant="outline" className="w-full rounded-xl border-border/60 h-9">
          <Link to="/verify-certificate"><ExternalLink className="mr-1.5 size-4" /> Verify Certificate</Link>
        </Button>
      </div>
    </div>
  );
}

// ─── ID CARD ───

function IDCardSection({ app }: { app: Application | null }) {
  if (!app) return null;
  const domain = getDomain(app.domain);
  return (
    <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
      <h3 className="flex items-center gap-2 font-bold mb-4"><Shield className="size-4 text-primary" /> Digital ID Card</h3>
      <div className="rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 p-4 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200/50 dark:border-purple-800/30">
        <div className="flex items-center gap-4">
          {app.photo_url ? (
            <img src={app.photo_url} alt="" className="size-12 rounded-xl border-2 border-white/50 object-cover shadow-sm" />
          ) : (
            <div className="grid size-12 place-items-center rounded-xl brand-gradient text-sm font-bold text-white shadow-sm">
              {app.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm">{app.full_name}</p>
            <p className="text-[10px] text-muted-foreground">{domain?.name ?? app.domain}</p>
            <p className="text-[10px] font-mono text-muted-foreground">{app.intern_id}</p>
          </div>
          <div className="ml-auto shrink-0">
            <QRCodeSVG value={`${window.location.origin}/verify-certificate?intern=${app.intern_id}`} size={48} />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Badge className="bg-emerald-600 text-white text-[10px]"><CheckCircle2 className="mr-1 size-3" /> ACTIVE</Badge>
        <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs border-border/60"
          onClick={() => downloadPdf(
            <OfferLetterDoc fullName={app.full_name} internId={app.intern_id} domain={domain?.name ?? app.domain} issuedAt={app.offer_issued_at} />,
            `IDCard_${app.intern_id}.pdf`
          )}>
          <Download className="mr-1 size-3" /> Download ID
        </Button>
      </div>
    </div>
  );
}

// ─── ACTIVITY FEED ───

function ActivityFeed({ app, enrollment, taskSubmissions, lastAttempt, topics, completedTopics, cert, lmsCert }: any) {
  const activities: { icon: any; text: string; time: string; color: string }[] = [];

  if (app) activities.push({ icon: CheckCircle2, text: "Application submitted and approved", time: new Date(app.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400" });
  if (enrollment) activities.push({ icon: BookOpen, text: "LMS course started", time: new Date(enrollment.started_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400" });
  if (taskSubmissions?.length) {
    const approved = taskSubmissions.filter((s: any) => s.status === "approved");
    approved.forEach((s: any) => {
      activities.push({ icon: CheckCircle2, text: `Completed Task ${s.task_number ?? ""}`, time: s.submitted_at ? new Date(s.submitted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400" });
    });
  }
  if (lastAttempt) activities.push({ icon: Brain, text: `Passed quiz with ${lastAttempt.score}/${lastAttempt.total} marks`, time: lastAttempt.submitted_at ? new Date(lastAttempt.submitted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400" });
  if (cert || lmsCert) activities.push({ icon: Award, text: "Certificate generated", time: (cert?.issued_at ?? lmsCert?.issued_at) ? new Date(cert?.issued_at ?? lmsCert?.issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400" });
  if (completedTopics?.size) activities.push({ icon: BookOpen, text: `Completed ${completedTopics.size} course topics`, time: "", color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30 dark:text-cyan-400" });

  if (!activities.length) return null;

  return (
    <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
      <h3 className="flex items-center gap-2 font-bold mb-4"><TrendingUp className="size-4 text-primary" /> Activity</h3>
      <div className="space-y-3">
        {activities.slice(0, 8).map((a, i) => {
          const Icon = a.icon;
          return (
            <div key={i} className="flex items-start gap-3">
              <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${a.color}`}>
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm">{a.text}</p>
                {a.time && <p className="text-xs text-muted-foreground">{a.time}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── APPLY FORM ───

function WelcomeDashboard({ user, enrollments, courses, onCreated }: { user: any; enrollments: any[]; courses: any[]; onCreated: () => void }) {
  const [showApply, setShowApply] = useState(false);
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
  const enrolledCourses = enrollments
    .map((e) => ({ ...e, course: courses.find((c) => c.id === e.course_id) }))
    .filter((e) => e.course);

  return (
    <div className="space-y-8">
      {/* Hero welcome */}
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-white/70 backdrop-blur-xl p-6 sm:p-10 dark:bg-[#1E293B]/70 dark:border-white/5">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-purple-400/15 blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-blue-400/15 blur-[100px]" />
        <div className="relative">
          <Badge variant="secondary" className="mb-3"><Sparkles className="mr-1 size-3" /> Welcome</Badge>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Hi {displayName} 👋</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Your Skyrovix learning hub. Browse courses, track your progress, and apply for an internship anytime.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild size="lg" className="brand-gradient text-white border-0">
              <Link to="/courses"><BookOpen className="mr-2 size-4" /> Explore Courses</Link>
            </Button>
            <Button size="lg" variant="outline" onClick={() => setShowApply((v) => !v)}>
              <FileText className="mr-2 size-4" /> {showApply ? "Hide application form" : "Apply for Internship"}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick action tiles */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/courses" className="group rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur transition hover:shadow-lg hover:-translate-y-0.5 dark:bg-[#1E293B]/70">
          <div className="grid size-11 place-items-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"><GraduationCap className="size-5" /></div>
          <p className="mt-3 font-semibold">Browse Courses</p>
          <p className="text-sm text-muted-foreground">Topic-wise lessons + verified certificates.</p>
        </Link>
        <Link to="/domains" className="group rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur transition hover:shadow-lg hover:-translate-y-0.5 dark:bg-[#1E293B]/70">
          <div className="grid size-11 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"><Layers className="size-5" /></div>
          <p className="mt-3 font-semibold">Internship Domains</p>
          <p className="text-sm text-muted-foreground">Pick a domain to specialise in.</p>
        </Link>
        <Link to="/verify-certificate" className="group rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur transition hover:shadow-lg hover:-translate-y-0.5 dark:bg-[#1E293B]/70">
          <div className="grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><Shield className="size-5" /></div>
          <p className="mt-3 font-semibold">Verify Certificate</p>
          <p className="text-sm text-muted-foreground">Check any Skyrovix certificate ID.</p>
        </Link>
      </div>

      {/* My courses if any */}
      {enrolledCourses.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-xl font-bold">My Courses</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {enrolledCourses.map((e) => (
              <Link key={e.id} to="/courses/$slug" params={{ slug: e.course.slug }} className="group rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur transition hover:shadow-lg dark:bg-[#1E293B]/70">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{e.course.name}</p>
                  <Badge variant="secondary" className="text-xs">{e.status === "completed" ? "Completed" : "In Progress"}</Badge>
                </div>
                <Progress value={e.progress_percent ?? 0} className="mt-3 h-2" />
                <p className="mt-2 text-xs text-muted-foreground">{e.progress_percent ?? 0}% complete · Continue →</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Inline apply form when toggled */}
      {showApply && (
        <AnimatedSection>
          <ApplyForm onCreated={onCreated} />
        </AnimatedSection>
      )}
    </div>
  );
}

function ApplyForm({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      let photo_url: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, photoFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: publicUrl } = supabase.storage.from("profile-photos").getPublicUrl(path);
        photo_url = publicUrl?.publicUrl ?? null;
      }
      const intern_id = generateInternId();
      const payload = { user_id: user.id, domain: String(fd.get("domain")), intern_id, full_name: String(fd.get("full_name")), email: user.email ?? "", phone: String(fd.get("phone")), college: String(fd.get("college")), course: String(fd.get("course")), year: String(fd.get("year")), photo_url, status: "approved" as const };
      const { data: inserted, error } = await supabase.from("applications").insert(payload).select().maybeSingle();
      if (error || !inserted) throw error ?? new Error("Failed to create application");
      await supabase.from("profiles").update({ full_name: payload.full_name, phone: payload.phone, college: payload.college, course: payload.course, year: payload.year, photo_url }).eq("id", user.id);
      qc.setQueryData(["my-application", user.id], inserted);
      toast.success("Application approved! Your offer letter is ready.");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <Card className="max-w-2xl mx-auto rounded-2xl border-border/50 bg-white/70 backdrop-blur-xl dark:bg-[#1E293B]/70">
      <CardHeader><CardTitle>Apply for an Internship</CardTitle><CardDescription>Fill in your details. You'll get your offer letter and digital ID card instantly.</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><Label>Full Name</Label><Input name="full_name" required className="mt-1" /></div>
          <div><Label>Phone</Label><Input name="phone" type="tel" required className="mt-1" /></div>
          <div><Label>Domain</Label>
            <Select name="domain" required>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select a domain" /></SelectTrigger>
              <SelectContent>
                {DOMAINS.map((d) => <SelectItem key={d.slug} value={d.slug}>{d.icon} {d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>College</Label><Input name="college" required className="mt-1" /></div>
          <div><Label>Course / Branch</Label><Input name="course" required className="mt-1" /></div>
          <div><Label>Year</Label><Input name="year" placeholder="e.g. 3rd year" required className="mt-1" /></div>
          <div><Label>Profile Photo</Label><Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} className="mt-1" /></div>
          <Button type="submit" className="md:col-span-2 brand-gradient text-white border-0 h-11 rounded-xl mt-2" disabled={loading}>{loading ? "Submitting…" : "Submit Application"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
