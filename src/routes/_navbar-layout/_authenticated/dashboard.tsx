import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
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
import { DOMAINS, PAYMENT, COMPANY, generateInternId, generateCertId, getDomain } from "@/lib/constants";
import { validateCoupon, calculateDiscountedAmount, formatDiscount } from "@/lib/coupons";
import type { CouponResult } from "@/lib/coupons";
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
  ListChecks, LayoutDashboard, Flag, AlertTriangle, Zap, Hash, Circle, Loader2,
  TrendingUp, Star, Lock, Eye, LogOut,
  Settings, Wallet, CreditCard, ScrollText, Briefcase,
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

function DashboardHero({ badge, title, description, icon: Icon }: {
  badge: string; title: string; description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#07284a]/8 via-[#07284a]/3 to-blue-400/8 p-8 sm:p-12">
      <div className="absolute -right-24 -top-24 size-64 rounded-full bg-[#07284a]/15 blur-[120px]" />
      <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-blue-400/10 blur-[100px]" />
      <div className="absolute right-1/4 bottom-0 size-32 rounded-full bg-emerald-400/5 blur-[80px]" />
      <div className="relative flex items-start gap-6">
        <div className="hidden sm:grid size-16 shrink-0 place-items-center rounded-2xl brand-gradient text-white shadow-lg shadow-[#07284a]/20">
          <Icon className="size-8" />
        </div>
        <div>
          <Badge variant="secondary" className="mb-4 px-3 py-1.5 text-xs"><Sparkles className="mr-1.5 size-3" />{badge}</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold font-display">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground/80 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_navbar-layout/_authenticated/dashboard")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  head: () => ({ meta: [{ title: "Dashboard — Skyrovix" }] }),
  component: Dashboard,
});

type Application = {
  id: string; user_id: string; domain: string; intern_id: string;
  full_name: string; email: string; phone: string | null;
  college: string | null; course: string | null; year: string | null;
  photo_url: string | null; offer_issued_at: string;
  created_at: string; status: string; completed_at?: string | null;
  duration?: number; total_tasks?: number;
  coupon_code?: string | null;
};

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: appsList, isLoading } = useQuery({
    queryKey: ["my-applications", user?.id],
    queryFn: async (): Promise<Application[]> => {
      if (!user) return [];
      const { data } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 10_000,
  });

  const app = useMemo(() => {
    if (!appsList?.length) return null;
    const active = appsList.find((a) => a.status === "ongoing" || a.status === "approved");
    return active ?? appsList[0];
  }, [appsList]);

  const completedApps = useMemo(() => {
    return appsList?.filter((a) => a.status === "completed") ?? [];
  }, [appsList]);

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
    refetchInterval: 10_000,
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
    refetchInterval: 10_000,
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
    refetchInterval: 10_000,
  });

  const { data: taskSubmissions } = useQuery({
    queryKey: ["my-course-subs", enrollments?.[0]?.id],
    enabled: !!enrollments?.length,
    queryFn: async () => {
      const { data } = await supabase.from("course_task_submissions").select("*, course_tasks(task_number, title)").eq("enrollment_id", enrollments![0].id);
      return data ?? [];
    },
    refetchInterval: 10_000,
  });

  const { data: quizAttempts } = useQuery({
    queryKey: ["my-quiz-attempts", enrollments?.[0]?.id],
    enabled: !!enrollments?.length,
    queryFn: async () => {
      const { data } = await supabase.from("quiz_attempts").select("*").eq("enrollment_id", enrollments![0].id).order("started_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 10_000,
  });

  const { data: tasks } = useQuery({
    queryKey: ["course-tasks-list", enrollments?.[0]?.course_id],
    enabled: !!enrollments?.length,
    queryFn: async () => {
      const { data } = await supabase.from("course_tasks").select("*").eq("course_id", enrollments![0].course_id).order("task_number");
      return data ?? [];
    },
  });

  const { data: allAppSubmissions } = useQuery({
    queryKey: ["all-submissions", appsList?.map((a) => a.id)],
    queryFn: async () => {
      if (!appsList?.length) return [];
      const ids = appsList.map((a) => a.id);
      const { data } = await supabase.from("submissions").select("*").in("application_id", ids);
      return data ?? [];
    },
    enabled: !!appsList?.length,
    refetchInterval: 10_000,
  });

  const { data: allAppCerts } = useQuery({
    queryKey: ["all-certs", appsList?.map((a) => a.id)],
    queryFn: async () => {
      if (!appsList?.length) return [];
      const ids = appsList.map((a) => a.id);
      const { data } = await supabase.from("certificates").select("*").in("application_id", ids);
      return data ?? [];
    },
    enabled: !!appsList?.length,
    refetchInterval: 10_000,
  });

  const { data: allTasksByDomain } = useQuery({
    queryKey: ["all-tasks-by-domain", appsList?.map((a) => a.domain)],
    queryFn: async () => {
      if (!appsList?.length) return {} as Record<string, any[]>;
      const domains = [...new Set(appsList.map((a) => a.domain))];
      const { data } = await supabase.from("tasks").select("*").in("domain", domains);
      const byDomain: Record<string, any[]> = {};
      for (const t of data ?? []) {
        if (!byDomain[t.domain]) byDomain[t.domain] = [];
        byDomain[t.domain].push(t);
      }
      return byDomain;
    },
    enabled: !!appsList?.length,
  });

  const internSubmissions = useMemo(() => {
    if (!app || !allAppSubmissions) return [];
    return allAppSubmissions.filter((s: any) => s.application_id === app.id);
  }, [allAppSubmissions, app]);

  const taskLimits: Record<number, number> = { 1: 5, 2: 8, 3: 10, 6: 12 };
  const { data: internTasks } = useQuery({
    queryKey: ["my-tasks", app?.domain, app?.duration],
    queryFn: async () => {
      if (!app) return [];
      const limit = taskLimits[app.duration ?? 1] ?? 5;
      const { data } = await supabase.from("tasks").select("id, task_number").eq("domain", app.domain).lte("task_number", limit).order("task_number");
      return data ?? [];
    },
    enabled: !!app,
  });

  const certificate = useMemo(() => {
    if (!app || !allAppCerts) return null;
    return allAppCerts.find((c: any) => c.application_id === app.id) ?? null;
  }, [allAppCerts, app]);

  const { data: allPayments } = useQuery({
    queryKey: ["all-payments", appsList?.map((a) => a.id)],
    queryFn: async () => {
      if (!appsList?.length) return [];
      const ids = appsList.map((a) => a.id);
      const { data } = await supabase.from("payments").select("*").in("application_id", ids);
      return data ?? [];
    },
    enabled: !!appsList?.length,
  });

  const payment = useMemo(() => {
    if (!app || !allPayments) return null;
    return allPayments.find((p: any) => p.application_id === app.id) ?? null;
  }, [allPayments, app]);

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
  const domain = app ? getDomain(app.domain) : null;
  const internTotal = internTasks?.length ?? 0;
  const internApproved = internSubmissions?.filter((s: any) => s.status === "approved").length ?? 0;
  const internPending = internSubmissions?.filter((s: any) => s.status === "pending").length ?? 0;
  const internCompleted = internApproved;

  // Auto-complete internships when all tasks approved + certificate exists
  useEffect(() => {
    if (!appsList || !allAppSubmissions || !allAppCerts || !allTasksByDomain) return;
    (async () => {
      for (const a of appsList) {
        if (a.status === "completed" || a.status === "pending") continue;
        try {
          const aSubs = allAppSubmissions.filter((s: any) => s.application_id === a.id);
          const aApproved = aSubs.filter((s: any) => s.status === "approved").length;
          const limit = taskLimits[a.duration ?? 1] ?? 5;
          const aCert = allAppCerts.find((c: any) => c.application_id === a.id);
          if (aApproved >= limit && aCert) {
            const { error: updErr } = await supabase.from("applications").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", a.id);
            if (updErr) { console.error("Auto-complete update failed:", updErr); continue; }
            qc.invalidateQueries({ queryKey: ["my-applications"] });
          }
        } catch (err) {
          console.error("Auto-complete error:", err);
        }
      }
    })();
  }, [appsList, allAppSubmissions, allAppCerts, allTasksByDomain, qc]);

  // Auto-complete enrollments when progress = 100 and quiz passed
  useEffect(() => {
    if (!enrollments || !quizAttempts || !taskSubmissions || !tasks) return;
    for (const e of enrollments) {
      if (e.status === "completed") continue;
      const approvedTasks = taskSubmissions.filter((s: any) => s.status === "approved").length;
      const allTasks = tasks.length;
      const passed = quizAttempts.some((q: any) => q.passed);
      if (e.progress_percent >= 100 && allTasks > 0 && approvedTasks >= allTasks && passed) {
        supabase.from("enrollments").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", e.id).then(() => {
          qc.invalidateQueries({ queryKey: ["my-lms-enrollments"] });
        });
      }
    }
  }, [enrollments, quizAttempts, taskSubmissions, tasks, qc]);

  const timelineSteps = [
    { label: "Application Submitted", done: !!app },
    { label: "Offer Letter Received", done: !!app },
    { label: "LMS Course Started", done: !!enrollment },
    { label: "Tasks Completed", done: totalTasks > 0 && completedTaskCount >= totalTasks },
    { label: "Quiz Passed", done: !!lastAttempt?.passed },
    { label: "Certificate Generated", done: !!cert },
  ];
  const currentStep = timelineSteps.findIndex((s) => !s.done);

  const searchParams = Route.useSearch();
  const active = searchParams.tab ?? "overview";
  const [detailView, setDetailView] = useState<{ type: "app"; id: string } | { type: "enrollment"; id: string } | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [autoApplied, setAutoApplied] = useState(false);
  const [certStatus, setCertStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const certTriggered = useRef(false);

  // Auto-apply coupon from application record
  useEffect(() => {
    if (app?.coupon_code && !autoApplied && !couponResult) {
      setAutoApplied(true);
      setCouponCode(app.coupon_code);
      validateCoupon(app.coupon_code, app.domain).then((result) => {
        if (result.valid) setCouponResult(result);
      });
    }
  }, [app?.coupon_code, app?.domain, autoApplied]);

  // Auto-generate certificate when all conditions met
  useEffect(() => {
    if (couponResult?.finalAmount === 0 && internApproved >= internTotal && app && !certTriggered.current) {
      certTriggered.current = true;
      doFreeCertificate(couponResult, app.id);
    }
  }, [couponResult, internApproved, internTotal, app]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const result = await validateCoupon(couponCode.trim(), app?.domain);
      if (result.valid) {
        setCouponResult(result);
        toast.success(`Coupon applied! You save ₹${result.discountAmount}`);
      } else {
        setCouponResult(null);
        toast.error(result.error || "Invalid coupon");
      }
    } catch {
      toast.error("Failed to validate coupon");
      setCouponResult(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponResult(null);
  };

  const handlePaymentSubmit = async () => {
    if (!app || !utrNumber.trim()) return;
    setSubmittingPayment(true);
    try {
      let screenshotUrl: string | null = null;
      if (paymentScreenshot) {
        try {
          const ext = paymentScreenshot.name.split(".").pop() ?? "png";
          const path = `${user.id}/${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage.from("payment-screenshots").upload(path, paymentScreenshot);
          if (uploadErr) throw uploadErr;
          const { data: urlData } = supabase.storage.from("payment-screenshots").getPublicUrl(path);
          screenshotUrl = urlData.publicUrl;
        } catch (uploadErr: any) {
          console.error("Screenshot upload failed:", uploadErr);
          toast.warning("Screenshot upload failed, but payment will still be submitted.");
        }
      }
      const { error } = await (supabase.from("payments" as any) as any).insert({
        application_id: app.id,
        utr_number: utrNumber.trim(),
        screenshot_url: screenshotUrl,
        amount: couponResult?.finalAmount ?? PAYMENT.amount,
        coupon_code: couponResult?.code ?? null,
        discount_amount: couponResult?.discountAmount ?? 0,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Payment submitted successfully! Awaiting verification.");
      setUtrNumber("");
      setPaymentScreenshot(null);
      setCouponCode("");
      setCouponResult(null);
      qc.invalidateQueries({ queryKey: ["all-payments"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const doFreeCertificate = async (coupon: CouponResult, applicationId: string) => {
    setCertStatus("generating");
    try {
      const { data: existingPay } = await (supabase.from("payments" as any) as any).select("id").eq("application_id", applicationId).maybeSingle();
      if (!existingPay) {
        const { error: payErr } = await (supabase.from("payments" as any) as any).insert({
          application_id: applicationId,
          utr_number: "FREE_COUPON",
          screenshot_url: null,
          amount: 0,
          coupon_code: coupon.code,
          discount_amount: coupon.discountAmount,
          status: "verified",
          verified_at: new Date().toISOString(),
        });
        if (payErr) throw payErr;
      }
      const { data: certId, error: certErr } = await supabase.rpc("generate_certificate", { p_application_id: applicationId });
      if (certErr || !certId) throw certErr || new Error("Failed to generate certificate");
      setCertStatus("done");
      qc.invalidateQueries({ queryKey: ["all-payments"] });
      qc.invalidateQueries({ queryKey: ["all-certs"] });
    } catch (err: any) {
      setCertStatus("error");
      toast.error(err.message || "Failed to generate certificate");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  if (authLoading || isLoading) return <LoadingSkeleton />;

  const renderContent = () => {
    if (!appsList?.length || !app) {
      if (active === "courses") {
        return (
          <div className="space-y-8">
            <DashboardHero badge="My Courses" title="Topic-Based Courses" description="Learn at your own pace with curated topic-based courses and earn certificates." icon={BookOpen} />
            <LmsCoursesSection
              enrollments={enrollments ?? []} courses={courses ?? []} lmsCerts={lmsCerts ?? []}
              completedTopics={completedTopics} topics={topics ?? []}
              taskSubmissions={taskSubmissions ?? []} tasks={tasks ?? []}
              quizAttempts={quizAttempts ?? []} course={course} enrollment={enrollment}
            />
            {enrollment && course && <CurrentTopicWidget topics={topics ?? []} completedTopics={completedTopics} enrollment={enrollment} course={course} />}
            {enrollment && <TasksSectionWidget tasks={tasks ?? []} submissions={taskSubmissions ?? []} enrollmentId={enrollment.id} courseSlug={course?.slug ?? ""} onChange={() => qc.invalidateQueries({ queryKey: ["my-course-subs"] })} />}
            {enrollment && <QuizSectionWidget course={course} lastAttempt={lastAttempt} enrollment={enrollment} completedTaskCount={completedTaskCount} totalTasks={totalTasks} />}
          </div>
        );
      }
      if (active === "profile") {
        return (
          <div className="space-y-8">
            <DashboardHero badge="Profile" title="Your Profile" description="Manage your personal details, photo, and internship information." icon={User} />
            <div className="rounded-2xl border border-dashed border-border/50 bg-white/70 p-6 sm:p-12 text-center backdrop-blur-xl dark:bg-[#1E293B]/70">
              <User className="size-10 mx-auto mb-3 opacity-40 text-muted-foreground" />
              <p className="font-semibold text-muted-foreground">Apply for an internship to set up your profile.</p>
              <Button size="sm" className="mt-4 brand-gradient text-white border-0 rounded-xl" onClick={() => navigate({ to: "/dashboard" })}>Go to Overview</Button>
            </div>
          </div>
        );
      }
      if (active === "tasks" || active === "certificates") {
        return (
          <div className="space-y-8">
            <DashboardHero
              badge={active === "tasks" ? "My Tasks" : "Certificates"}
              title={active === "tasks" ? "Internship Tasks" : "Your Certificates"}
              description={active === "tasks" ? "Track and complete your internship tasks with mentor feedback." : "View and download your verified internship and course certificates."}
              icon={active === "tasks" ? ListChecks : Award}
            />
            <div className="rounded-2xl border border-dashed border-border/50 bg-white/70 p-6 sm:p-12 text-center backdrop-blur-xl dark:bg-[#1E293B]/70">
              <Briefcase className="size-10 mx-auto mb-3 opacity-40 text-muted-foreground" />
              <p className="font-semibold text-muted-foreground">Apply for an internship to access this section.</p>
              <Button size="sm" className="mt-4 brand-gradient text-white border-0 rounded-xl" onClick={() => navigate({ to: "/dashboard" })}>Go to Overview</Button>
            </div>
          </div>
        );
      }
      return (
        <AnimatedSection>
          <WelcomeDashboard
            user={user}
            enrollments={enrollments ?? []}
            courses={courses ?? []}
            onCreated={() => qc.invalidateQueries()}
          />
        </AnimatedSection>
      );
    }

    if (active === "overview") {
      if (detailView?.type === "app") {
        const da = appsList!.find((a) => a.id === detailView.id)!;
        const dd = getDomain(da.domain);
        const daSubs = allAppSubmissions?.filter((s: any) => s.application_id === da.id) ?? [];
        const daApproved = daSubs.filter((s: any) => s.status === "approved").length;
        const daTotal = internTasks?.length ?? 0;
        const daCert = allAppCerts?.find((c: any) => c.application_id === da.id) ?? null;
        const daPayment = allPayments?.find((p: any) => p.application_id === da.id) ?? null;
        return (
          <div className="space-y-6">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setDetailView(null)}>
              <ChevronLeft className="size-4" /> Back to Dashboard
            </Button>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#07284a]/5 via-transparent to-blue-400/5 p-8 sm:p-10 mb-6">
              <div className="absolute -right-16 -top-16 size-48 rounded-full bg-[#07284a]/10 blur-[80px]" />
              <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-blue-400/10 blur-[60px]" />
              <Badge variant="secondary" className="mb-3"><Sparkles className="mr-1 size-3" /> {dd?.name ?? da.domain}</Badge>
              <h1 className="text-2xl sm:text-3xl font-bold">{dd?.name ?? da.domain}</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">{dd?.description ?? ""}</p>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-white/70 backdrop-blur-xl p-6 sm:p-8 dark:bg-[#1E293B]/70">
              <div className="absolute -right-16 -top-16 size-48 rounded-full bg-emerald-400/15 blur-[80px]" />
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                <div className={`grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${dd?.color ?? "from-[#07284a] to-blue-600"} text-white shadow-md`}>
                  <span className="text-2xl font-bold">{dd?.icon ?? "?"}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-2xl font-bold">{dd?.name ?? da.domain}</h2>
                    <Badge className={`text-xs px-3 py-1 rounded-lg ${
                      da.status === "completed" ? "bg-emerald-600 text-white" :
                      da.status === "ongoing" ? "bg-blue-600 text-white" :
                      da.status === "approved" ? "bg-amber-500 text-white" :
                      "bg-gray-500 text-white"
                    }`}>
                      {da.status === "completed" ? "Completed" :
                       da.status === "ongoing" ? "Ongoing" :
                       da.status === "approved" ? "Approved" :
                       da.status === "pending" ? "Pending" : da.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{da.intern_id} · {da.full_name} · {dd?.description ?? ""}</p>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="rounded-xl border border-border/40 bg-secondary/30 p-3"><p className="text-muted-foreground">Started</p><p className="font-semibold mt-0.5">{new Date(da.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p></div>
              <div className="rounded-xl border border-border/40 bg-secondary/30 p-3"><p className="text-muted-foreground">Completed</p><p className="font-semibold mt-0.5">{da.completed_at ? new Date(da.completed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p></div>
              <div className="rounded-xl border border-border/40 bg-secondary/30 p-3"><p className="text-muted-foreground">Tasks</p><p className="font-semibold mt-0.5">{daApproved}/{daTotal}</p></div>
              <div className="rounded-xl border border-border/40 bg-secondary/30 p-3"><p className="text-muted-foreground">Certificate</p><p className="font-semibold mt-0.5">{daCert ? "Generated" : "—"}</p></div>
            </div>

            {/* Payment */}
            <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
              <h3 className="flex items-center gap-2 font-bold mb-4 text-sm"><CreditCard className="size-4 text-primary" /> Payment Details</h3>
              {daPayment ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-muted-foreground text-xs">Status</p><Badge className={`mt-1 text-[10px] ${daPayment.status === "verified" ? "bg-emerald-600" : "bg-amber-500"} text-white`}>{daPayment.status === "verified" ? "Verified" : daPayment.status === "pending" ? "Pending" : daPayment.status}</Badge></div>
                  <div><p className="text-muted-foreground text-xs">UTR</p><p className="font-semibold mt-0.5 font-mono text-xs">{daPayment.utr_number ?? "—"}</p></div>
                  <div><p className="text-muted-foreground text-xs">Amount</p><p className="font-semibold mt-0.5">{daPayment.amount ? `₹${daPayment.amount}` : "—"}</p></div>
                  <div><p className="text-muted-foreground text-xs">Verified</p><p className="font-semibold mt-0.5">{daPayment.verified_at ? new Date(daPayment.verified_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p></div>
                </div>
              ) : <p className="text-sm text-muted-foreground">No payment record.</p>}
            </div>

            {/* Offer Letter */}
            <div className="group cursor-pointer rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl transition-all hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 dark:bg-[#1E293B]/70 dark:hover:border-blue-700 dark:hover:shadow-blue-900/20" onClick={() => downloadPdf(<OfferLetterDoc fullName={da.full_name} internId={da.intern_id} domain={dd?.name ?? da.domain} issuedAt={da.offer_issued_at} duration={da.duration ?? 1} />, `OfferLetter_${da.intern_id}.pdf`)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md transition-transform group-hover:scale-105"><FileText className="size-6" /></div>
                  <div><p className="font-semibold text-sm">Offer Letter</p><p className="text-xs text-muted-foreground">Issued {new Date(da.offer_issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p></div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 transition-all group-hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:group-hover:bg-blue-900/50"><Download className="size-3.5" /> Download</div>
              </div>
            </div>

            {/* ID Card */}
            <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
              <h3 className="flex items-center gap-2 font-bold mb-4 text-sm"><Shield className="size-4 text-primary" /> Digital ID Card</h3>
              <IDCard internId={da.intern_id} fullName={da.full_name} domain={dd?.name ?? da.domain} photoUrl={da.photo_url} issuedAt={da.offer_issued_at} duration={da.duration ?? 1} />
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs border-border/60" onClick={() => downloadPdf(<OfferLetterDoc fullName={da.full_name} internId={da.intern_id} domain={dd?.name ?? da.domain} issuedAt={da.offer_issued_at} duration={da.duration ?? 1} />, `OfferLetter_${da.intern_id}.pdf`)}><FileText className="mr-1 size-3" /> Offer Letter</Button>
                <Button size="sm" className="brand-gradient text-white border-0 rounded-lg h-8 text-xs" onClick={() => downloadPdf(<OfferLetterDoc fullName={da.full_name} internId={da.intern_id} domain={dd?.name ?? da.domain} issuedAt={da.offer_issued_at} duration={da.duration ?? 1} />, `IDCard_${da.intern_id}.pdf`)}><Download className="mr-1 size-3" /> Download ID</Button>
              </div>
            </div>

            {/* Tasks */}
            {daTotal > 0 && (
              <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
                <TasksSection
                  domainSlug={da.domain}
                  submissions={daSubs}
                  appId={da.id}
                  duration={da.duration}
                  onChange={() => { qc.invalidateQueries({ queryKey: ["all-submissions"] }); qc.invalidateQueries({ queryKey: ["my-applications"] }); }}
                />
              </div>
            )}

            {/* Certificate */}
            {daCert && (
              <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
                <h3 className="flex items-center gap-2 font-bold mb-4 text-sm"><Award className="size-4 text-primary" /> Certificate</h3>
                <div className="rounded-xl bg-gradient-to-br from-[#07284a]/10 to-blue-50 p-4 text-center dark:from-[#07284a]/40 dark:to-blue-950/30 border border-[#07284a]/20 dark:border-[#07284a]/50">
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl brand-gradient text-white shadow-md mb-3"><Award className="size-7" /></div>
                  <p className="font-bold text-sm">{dd?.name ?? da.domain}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">{daCert.certificate_id}</p>
                </div>
                <div className="mt-4 space-y-2">
                  <Button size="sm" className="w-full brand-gradient text-white border-0 rounded-xl h-9" onClick={() => downloadPdf(<CertificateDoc fullName={da.full_name} internId={da.intern_id} domain={dd?.name ?? da.domain} certId={daCert.certificate_id} issuedAt={daCert.issued_at} verifyUrl={`${window.location.origin}/verify-certificate`} />, `Certificate_${daCert.certificate_id}.pdf`)}><Download className="mr-1.5 size-4" /> Download PDF</Button>
                  <Button asChild size="sm" variant="outline" className="w-full rounded-xl border-border/60 h-9"><Link to="/verify-certificate"><ExternalLink className="mr-1.5 size-4" /> Verify Certificate</Link></Button>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
              <h3 className="flex items-center gap-2 font-bold mb-4 text-sm"><ScrollText className="size-4 text-primary" /> Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground text-xs">Name</p><p className="font-semibold mt-0.5">{da.full_name}</p></div>
                <div><p className="text-muted-foreground text-xs">Intern ID</p><p className="font-semibold mt-0.5 font-mono text-xs">{da.intern_id}</p></div>
                <div><p className="text-muted-foreground text-xs">Domain</p><p className="font-semibold mt-0.5">{dd?.name ?? da.domain}</p></div>
                <div><p className="text-muted-foreground text-xs">Duration</p><p className="font-semibold mt-0.5">{da.duration ? `${da.duration} Month${da.duration > 1 ? "s" : ""}` : "—"}</p></div>
              </div>
            </div>
          </div>
        );
      }

      if (detailView?.type === "enrollment") {
        const de = enrollments?.find((e: any) => e.id === detailView.id)!;
        const dc = courses?.find((c: any) => c.id === de?.course_id)!;
        const dcCert = lmsCerts?.find((c: any) => c.enrollment_id === de?.id) ?? null;
        return (
          <div className="space-y-6">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setDetailView(null)}>
              <ChevronLeft className="size-4" /> Back to Dashboard
            </Button>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#07284a]/5 via-transparent to-blue-400/5 p-8 sm:p-10 mb-6">
              <div className="absolute -right-16 -top-16 size-48 rounded-full bg-[#07284a]/10 blur-[80px]" />
              <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-blue-400/10 blur-[60px]" />
              <Badge variant="secondary" className="mb-3"><Sparkles className="mr-1 size-3" /> Course Detail</Badge>
              <h1 className="text-2xl sm:text-3xl font-bold">{dc?.name ?? "Course"}</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">{dc?.domain ? `${dc.domain} · ${dc.total_topics} topics · ${dc.total_tasks} tasks` : ""}</p>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-white/70 backdrop-blur-xl p-6 sm:p-8 dark:bg-[#1E293B]/70">
              <div className="absolute -right-16 -top-16 size-48 rounded-full bg-blue-400/15 blur-[80px]" />
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="grid size-16 shrink-0 place-items-center rounded-2xl brand-gradient text-white shadow-md"><GraduationCap className="size-8" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-2xl font-bold">{dc?.name ?? "Course"}</h2>
                    {dcCert ? (
                      <Badge className="bg-emerald-600 text-white text-xs rounded-lg px-3 py-1"><Award className="mr-1 size-3" /> Certified</Badge>
                    ) : de?.status === "completed" ? (
                      <Badge className="bg-emerald-600 text-white text-xs rounded-lg px-3 py-1"><CheckCircle2 className="mr-1 size-3" /> Completed</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs rounded-lg px-3 py-1">In Progress</Badge>
                    )}
                  </div>
                  {dc && <p className="text-sm text-muted-foreground mt-1">{dc.domain} · {dc.total_topics} topics · {dc.total_tasks} tasks</p>}
                </div>
                {dc && (
                  <Button asChild size="sm" className="brand-gradient text-white border-0 rounded-xl h-9">
                    <Link to="/courses/$slug" params={{ slug: dc.slug }}><Play className="mr-1.5 size-3.5" /> Continue</Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
              <h3 className="flex items-center gap-2 font-bold mb-4 text-sm"><Target className="size-4 text-primary" /> Progress</h3>
              <div className="flex items-center gap-3 mb-2"><Progress value={de?.progress_percent ?? 0} className="h-2.5 flex-1" /><span className="text-xs font-semibold">{de?.progress_percent ?? 0}%</span></div>
              {de && <Badge variant="outline" className="text-[10px]">{de?.status === "completed" ? "Completed" : "In Progress"}</Badge>}
            </div>

            {dcCert && (
              <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
                <h3 className="flex items-center gap-2 font-bold mb-4 text-sm"><Award className="size-4 text-primary" /> Certificate</h3>
                <div className="rounded-xl bg-gradient-to-br from-[#07284a]/10 to-blue-50 p-4 text-center dark:from-[#07284a]/40 dark:to-blue-950/30 border border-[#07284a]/20 dark:border-[#07284a]/50">
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl brand-gradient text-white shadow-md mb-3"><Award className="size-7" /></div>
                  <p className="font-bold text-sm">{dc?.name ?? "Course"}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">{dcCert.certificate_id}</p>
                  {dcCert.score != null && <Badge variant="secondary" className="mt-2 text-xs">{dcCert.score}/100</Badge>}
                </div>
                <div className="mt-4 space-y-2">
                  <Button size="sm" className="w-full brand-gradient text-white border-0 rounded-xl h-9" onClick={() => downloadPdf(<CourseCertificateDoc fullName={app!.full_name} courseName={dc?.name ?? "Course"} score={dcCert.score ?? 0} total={100} certId={dcCert.certificate_id} issuedAt={dcCert.issued_at} verifyUrl={`${window.location.origin}/verify-certificate`} />, `Certificate_${dcCert.certificate_id}.pdf`)}><Download className="mr-1.5 size-4" /> Download PDF</Button>
                  <Button asChild size="sm" variant="outline" className="w-full rounded-xl border-border/60 h-9"><Link to="/verify-certificate"><ExternalLink className="mr-1.5 size-4" /> Verify Certificate</Link></Button>
                </div>
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="space-y-6">
          <DashboardHero badge="Dashboard" title="Your Progress" description="Track your internships, courses, and achievements at a glance." icon={LayoutDashboard} />
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Internships", value: appsList?.length ?? 0, icon: Briefcase, color: "from-[#07284a] to-blue-600" },
              { label: "Completed", value: completedApps.length + (enrollments?.filter((e: any) => e.status === "completed").length ?? 0), icon: CheckCircle2, color: "from-emerald-500 to-teal-600" },
              { label: "Active Courses", value: enrollments?.filter((e: any) => e.status !== "completed").length ?? 0, icon: BookOpen, color: "from-amber-500 to-orange-600" },
              { label: "Certificates", value: (allAppCerts?.length ?? 0) + (lmsCerts?.length ?? 0), icon: Award, color: "from-[#07284a] to-[#07284a]" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl border border-border/50 bg-white/70 p-4 backdrop-blur-xl dark:bg-[#1E293B]/70">
                  <div className="flex items-center gap-3">
                    <div className={`grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-sm`}><Icon className="size-4" /></div>
                    <div><p className="text-2xl font-bold">{stat.value}</p><p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Internships List */}
          <AnimatedSection>
            <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2"><Briefcase className="size-5 text-primary" /> Internships</h2>
            {(!appsList || appsList.length === 0) ? (
              <div className="rounded-2xl border border-dashed border-border/50 bg-white/70 p-8 text-center backdrop-blur-xl dark:bg-[#1E293B]/70">
                <p className="text-muted-foreground text-sm">No internships yet. Apply for one to get started.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {appsList.map((a) => {
                  const d = getDomain(a.domain);
                  const aSubs = allAppSubmissions?.filter((s: any) => s.application_id === a.id) ?? [];
                  const aApproved = aSubs.filter((s: any) => s.status === "approved").length;
                  const aCert = allAppCerts?.find((c: any) => c.application_id === a.id) ?? null;
                  const appTaskCount = taskLimits[a.duration ?? 1] ?? 5;
                  return (
                    <button key={a.id} onClick={() => setDetailView({ type: "app", id: a.id })}
                      className="w-full text-left rounded-2xl border border-border/50 bg-white/70 p-4 backdrop-blur-xl transition-all hover:shadow-md hover:-translate-y-0.5 dark:bg-[#1E293B]/70 group">
                      <div className="flex items-center gap-4">
                        <div className={`grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${d?.color ?? "from-[#07284a] to-blue-600"} text-white shadow-sm`}>
                          <span className="text-lg font-bold">{d?.icon ?? "?"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{d?.name ?? a.domain}</p>
                            <Badge className={`text-[10px] px-2 py-0.5 rounded-md ${
                              a.status === "completed" ? "bg-emerald-600 text-white" :
                              a.status === "ongoing" ? "bg-blue-600 text-white" :
                              a.status === "approved" ? "bg-amber-500 text-white" :
                              "bg-gray-500 text-white"
                            }`}>
                              {a.status === "completed" ? "Completed" :
                               a.status === "ongoing" ? "Ongoing" :
                               a.status === "approved" ? "Approved" :
                               a.status === "pending" ? "Pending" : a.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{a.intern_id} · {new Date(a.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-4 text-xs text-center">
                          <div><p className="text-muted-foreground">Tasks</p><p className="font-semibold">{aApproved}/{appTaskCount}</p></div>
                          <div><p className="text-muted-foreground">Cert</p><p className={`font-semibold ${aCert ? "text-emerald-600" : "text-muted-foreground"}`}>{aCert ? "✓" : "—"}</p></div>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </AnimatedSection>

          {/* Courses List */}
          <AnimatedSection delay={100}>
            <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2"><BookOpen className="size-5 text-primary" /> Courses</h2>
            {(!enrollments || enrollments.length === 0) ? (
              <div className="rounded-2xl border border-dashed border-border/50 bg-white/70 p-8 text-center backdrop-blur-xl dark:bg-[#1E293B]/70">
                <p className="text-muted-foreground text-sm">No course enrollments yet. Browse courses to start learning.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {enrollments.map((e: any) => {
                  const c = courses?.find((co: any) => co.id === e.course_id);
                  const cCert = lmsCerts?.find((lc: any) => lc.enrollment_id === e.id) ?? null;
                  return (
                    <button key={e.id} onClick={() => setDetailView({ type: "enrollment", id: e.id })}
                      className="w-full text-left rounded-2xl border border-border/50 bg-white/70 p-4 backdrop-blur-xl transition-all hover:shadow-md hover:-translate-y-0.5 dark:bg-[#1E293B]/70 group">
                      <div className="flex items-center gap-4">
                        <div className="grid size-12 shrink-0 place-items-center rounded-xl brand-gradient text-white shadow-sm"><GraduationCap className="size-6" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{c?.name ?? "Course"}</p>
                            {cCert ? (
                              <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-md"><Award className="mr-0.5 size-2.5" /> Certified</Badge>
                            ) : e.status === "completed" ? (
                              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md">Completed</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-md">{e.progress_percent ?? 0}%</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{c?.domain ?? ""} · {c?.total_topics ?? 0} topics</p>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </AnimatedSection>
        </div>
      );
    }

    if (active === "courses") {
      return (
        <div className="space-y-8">
          <DashboardHero badge="My Courses" title="Topic-Based Courses" description="Learn at your own pace with curated topic-based courses and earn certificates." icon={BookOpen} />
          <LmsCoursesSection
            enrollments={enrollments ?? []} courses={courses ?? []} lmsCerts={lmsCerts ?? []}
            completedTopics={completedTopics} topics={topics ?? []}
            taskSubmissions={taskSubmissions ?? []} tasks={tasks ?? []}
            quizAttempts={quizAttempts ?? []} course={course} enrollment={enrollment}
          />
          {enrollment && course && <CurrentTopicWidget topics={topics ?? []} completedTopics={completedTopics} enrollment={enrollment} course={course} />}
          {enrollment && <TasksSectionWidget tasks={tasks ?? []} submissions={taskSubmissions ?? []} enrollmentId={enrollment.id} courseSlug={course?.slug ?? ""} onChange={() => qc.invalidateQueries({ queryKey: ["my-course-subs"] })} />}
          {enrollment && <QuizSectionWidget course={course} lastAttempt={lastAttempt} enrollment={enrollment} completedTaskCount={completedTaskCount} totalTasks={totalTasks} />}
        </div>
      );
    }

    if (active === "tasks") {
      const dd = getDomain(app.domain);
      const approvedCount = internSubmissions?.filter((s: any) => s.status === "approved").length ?? 0;
      const totalTasks = internTasks?.length ?? 0;
      return (
        <div className="space-y-6">
          <DashboardHero badge="My Tasks" title="Internship Tasks" description="Complete your internship tasks and get feedback from your mentor." icon={ListChecks} />
          {/* Internship Header */}
          <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-white/70 backdrop-blur-xl p-6 sm:p-8 dark:bg-[#1E293B]/70">
            <div className="absolute -right-16 -top-16 size-48 rounded-full bg-emerald-400/15 blur-[80px]" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className={`grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${dd?.color ?? "from-[#07284a] to-blue-600"} text-white shadow-md`}>
                <span className="text-2xl font-bold">{dd?.icon ?? "?"}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-2xl font-bold">{dd?.name ?? app.domain}</h2>
                  <Badge className={`text-xs px-3 py-1 rounded-lg ${
                    app.status === "completed" ? "bg-emerald-600 text-white" :
                    app.status === "ongoing" ? "bg-blue-600 text-white" :
                    app.status === "approved" ? "bg-amber-500 text-white" :
                    "bg-gray-500 text-white"
                  }`}>
                    {app.status === "completed" ? "Completed" :
                     app.status === "ongoing" ? "Ongoing" :
                     app.status === "approved" ? "Approved" :
                     app.status === "pending" ? "Pending" : app.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{app.intern_id} · {app.full_name} · {dd?.description ?? ""}</p>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="rounded-xl border border-border/40 bg-secondary/30 p-3"><p className="text-muted-foreground">Started</p><p className="font-semibold mt-0.5">{new Date(app.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p></div>
            <div className="rounded-xl border border-border/40 bg-secondary/30 p-3"><p className="text-muted-foreground">Completed</p><p className="font-semibold mt-0.5">{app.completed_at ? new Date(app.completed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p></div>
            <div className="rounded-xl border border-border/40 bg-secondary/30 p-3"><p className="text-muted-foreground">Tasks</p><p className="font-semibold mt-0.5">{approvedCount}/{totalTasks}</p></div>
            <div className="rounded-xl border border-border/40 bg-secondary/30 p-3"><p className="text-muted-foreground">Certificate</p><p className="font-semibold mt-0.5">{certificate ? "Generated" : "—"}</p></div>
          </div>

          {/* Payment */}
          <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
            <h3 className="flex items-center gap-2 font-bold mb-4 text-sm"><CreditCard className="size-4 text-primary" /> Payment Details</h3>
            {payment ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><p className="text-muted-foreground text-xs">Status</p><Badge className={`mt-1 text-[10px] ${payment.status === "verified" ? "bg-emerald-600" : "bg-amber-500"} text-white`}>{payment.status === "verified" ? "Verified" : payment.status === "pending" ? "Pending" : payment.status}</Badge></div>
                <div><p className="text-muted-foreground text-xs">UTR</p><p className="font-semibold mt-0.5 font-mono text-xs">{payment.utr_number ?? "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Amount</p><p className="font-semibold mt-0.5">{payment.amount ? `₹${payment.amount}` : "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Verified</p><p className="font-semibold mt-0.5">{payment.verified_at ? new Date(payment.verified_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p></div>
              </div>
            ) : <p className="text-sm text-muted-foreground">No payment record.</p>}
          </div>

          {/* Offer Letter */}
          <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"><FileText className="size-5" /></div>
                <div><p className="font-semibold text-sm">Offer Letter</p><p className="text-xs text-muted-foreground">Issued {new Date(app.offer_issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p></div>
              </div>
              <Button size="sm" className="brand-gradient text-white border-0 rounded-xl h-9" onClick={() => downloadPdf(<OfferLetterDoc fullName={app.full_name} internId={app.intern_id} domain={dd?.name ?? app.domain} issuedAt={app.offer_issued_at} duration={app.duration ?? 1} />, `OfferLetter_${app.intern_id}.pdf`)}><Download className="mr-1.5 size-3.5" /> Download</Button>
            </div>
          </div>

          {/* ID Card */}
          <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
            <h3 className="flex items-center gap-2 font-bold mb-4 text-sm"><Shield className="size-4 text-primary" /> Digital ID Card</h3>
            <IDCard internId={app.intern_id} fullName={app.full_name} domain={dd?.name ?? app.domain} photoUrl={app.photo_url} issuedAt={app.offer_issued_at} duration={app.duration ?? 1} />
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs border-border/60" onClick={() => downloadPdf(<OfferLetterDoc fullName={app.full_name} internId={app.intern_id} domain={dd?.name ?? app.domain} issuedAt={app.offer_issued_at} duration={app.duration ?? 1} />, `OfferLetter_${app.intern_id}.pdf`)}><FileText className="mr-1 size-3" /> Offer Letter</Button>
              <Button size="sm" className="brand-gradient text-white border-0 rounded-lg h-8 text-xs" onClick={() => downloadPdf(<OfferLetterDoc fullName={app.full_name} internId={app.intern_id} domain={dd?.name ?? app.domain} issuedAt={app.offer_issued_at} duration={app.duration ?? 1} />, `IDCard_${app.intern_id}.pdf`)}><Download className="mr-1 size-3" /> Download ID</Button>
            </div>
          </div>

          {/* Tasks */}
          {totalTasks > 0 && (
            <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
              <h3 className="flex items-center gap-2 font-bold mb-4 text-sm"><ListChecks className="size-4 text-primary" /> Internship Tasks</h3>
              <div className="flex items-center gap-3 mb-3">
                <Progress value={totalTasks > 0 ? Math.round((approvedCount / totalTasks) * 100) : 0} className="h-2 flex-1" />
                <span className="text-xs font-semibold whitespace-nowrap">{approvedCount}/{totalTasks} completed</span>
              </div>
            </div>
          )}

          {/* Task Cards */}
          <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
            <TasksSection
              domainSlug={app.domain}
              submissions={internSubmissions ?? []}
              appId={app.id}
              duration={app.duration}
              onChange={() => { qc.invalidateQueries({ queryKey: ["all-submissions"] }); qc.invalidateQueries({ queryKey: ["my-applications"] }); }}
            />
          </div>

          {/* Certificate */}
          {certificate && (
            <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
              <h3 className="flex items-center gap-2 font-bold mb-4 text-sm"><Award className="size-4 text-primary" /> Certificate</h3>
              <div className="rounded-xl bg-gradient-to-br from-[#07284a]/10 to-blue-50 p-4 text-center dark:from-[#07284a]/40 dark:to-blue-950/30 border border-[#07284a]/20 dark:border-[#07284a]/50">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl brand-gradient text-white shadow-md mb-3"><Award className="size-7" /></div>
                <p className="font-bold text-sm">{dd?.name ?? app.domain}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-1">{certificate.certificate_id}</p>
              </div>
              <div className="mt-4 space-y-2">
                <Button size="sm" className="w-full brand-gradient text-white border-0 rounded-xl h-9" onClick={() => downloadPdf(<CertificateDoc fullName={app.full_name} internId={app.intern_id} domain={dd?.name ?? app.domain} certId={certificate.certificate_id} issuedAt={certificate.issued_at} verifyUrl={`${window.location.origin}/verify-certificate`} />, `Certificate_${certificate.certificate_id}.pdf`)}><Download className="mr-1.5 size-4" /> Download PDF</Button>
                <Button asChild size="sm" variant="outline" className="w-full rounded-xl border-border/60 h-9"><Link to="/verify-certificate"><ExternalLink className="mr-1.5 size-4" /> Verify Certificate</Link></Button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (active === "certificates") {
      return (
        <div className="space-y-8">
          <DashboardHero badge="Certificates" title="Your Certificates" description="View and download your verified internship and course certificates." icon={Award} />
          {/* Internship completion header */}
          <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-white/70 backdrop-blur-xl p-6 sm:p-8 dark:bg-[#1E293B]/70">
            <div className="absolute -right-16 -top-16 size-48 rounded-full bg-emerald-400/15 blur-[80px]" />
            <div className="relative flex items-center gap-4">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl brand-gradient text-white shadow-md">
                <Award className="size-7" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Internship Documents</h2>
                <p className="text-sm text-muted-foreground">{domain?.name ?? app.domain} · {app.intern_id}</p>
              </div>
              <Badge className="ml-auto bg-emerald-600 text-white text-xs rounded-lg px-3 py-1.5">
                <CheckCircle2 className="mr-1 size-3.5" /> Completed
              </Badge>
            </div>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="rounded-xl border border-border/40 bg-secondary/30 p-3">
                <p className="text-muted-foreground">Started</p>
                <p className="font-semibold mt-0.5">{new Date(app.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-secondary/30 p-3">
                <p className="text-muted-foreground">Certificate</p>
                <p className="font-semibold mt-0.5">{cert?.issued_at ? new Date(cert.issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-secondary/30 p-3">
                <p className="text-muted-foreground">Payment</p>
                <p className="font-semibold mt-0.5 capitalize">{payment?.status ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-secondary/30 p-3">
                <p className="text-muted-foreground">Domain</p>
                <p className="font-semibold mt-0.5 capitalize">{domain?.name ?? app.domain}</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
            <h3 className="flex items-center gap-2 font-bold mb-4"><CreditCard className="size-4 text-primary" /> Payment Details</h3>
            {payment ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <Badge className={`mt-1 text-[10px] ${payment.status === "verified" ? "bg-emerald-600" : "bg-amber-500"} text-white`}>
                    {payment.status === "verified" ? "Verified" : payment.status === "pending" ? "Pending" : payment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">UTR Number</p>
                  <p className="font-semibold mt-0.5 font-mono text-xs">{payment.utr_number ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Amount</p>
                  <p className="font-semibold mt-0.5">{payment.amount ? `₹${payment.amount}` : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Verified On</p>
                  <p className="font-semibold mt-0.5">{payment.verified_at ? new Date(payment.verified_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p>
                </div>
              </div>
            ) : internTotal > 0 && internApproved >= internTotal ? (
              couponResult?.finalAmount === 0 ? (
                <div className="space-y-4">
                  {certStatus === "done" ? (
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30">
                      <CheckCircle2 className="size-5 text-green-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-green-800 dark:text-green-300">Certificate Generated!</p>
                        <p className="text-green-700 dark:text-green-400 mt-1">Your certificate has been issued. You can download it below.</p>
                      </div>
                    </div>
                  ) : certStatus === "generating" ? (
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30">
                      <Loader2 className="size-5 text-blue-600 shrink-0 mt-0.5 animate-spin" />
                      <div className="text-sm">
                        <p className="font-semibold text-blue-800 dark:text-blue-300">Generating Certificate...</p>
                        <p className="text-blue-700 dark:text-blue-400 mt-1">Please wait while we generate your certificate.</p>
                      </div>
                    </div>
                  ) : certStatus === "error" ? (
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30">
                      <AlertTriangle className="size-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-red-800 dark:text-red-300">Generation Failed</p>
                        <p className="text-red-700 dark:text-red-400 mt-1">Could not generate certificate. The SQL migration may not have been run in Supabase.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30">
                      <Award className="size-5 text-green-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-green-800 dark:text-green-300">Free with Coupon!</p>
                        <p className="text-green-700 dark:text-green-400 mt-1">
                          Coupon <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300 mx-1">{couponResult.code}</Badge>
                          applied — <span className="line-through">₹{PAYMENT.amount}</span> <span className="text-green-600 font-bold">₹0</span>. Generating certificate automatically...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                  <Wallet className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-800 dark:text-amber-300">Complete Payment to Get Certificate</p>
                    <p className="text-amber-700 dark:text-amber-400 mt-1">Pay {couponResult ? <><span className="line-through">₹{PAYMENT.amount}</span> <span className="text-green-600 font-bold">₹{couponResult.finalAmount}</span></> : <>₹{PAYMENT.amount}</>} via UPI and submit the details below.</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border/40 bg-secondary/30 p-4 flex flex-col items-center gap-3">
                    <p className="text-xs font-semibold text-muted-foreground">Scan to Pay</p>
                    <QRCodeSVG value={`upi://pay?pa=${PAYMENT.upiId}&pn=${encodeURIComponent(PAYMENT.payeeName)}&am=${couponResult?.finalAmount ?? PAYMENT.amount}&cu=${PAYMENT.currency}`} size={140} />
                    <div className="text-center">
                      <p className="text-xs font-mono font-bold">{PAYMENT.upiId}</p>
                      <p className="text-[10px] text-muted-foreground">{PAYMENT.payeeName}</p>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-lg h-7 text-[10px] gap-1"
                      onClick={() => {
                        navigator.clipboard.writeText(PAYMENT.upiId);
                        toast.success("UPI ID copied");
                      }}>
                      <Copy className="size-3" /> Copy UPI ID
                    </Button>
                  </div>
                  {/* Coupon Code */}
                  <div className="rounded-xl border border-border/40 bg-secondary/30 p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Have a coupon code?</p>
                    {couponResult ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-green-500" />
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400">{couponResult.code}</span>
                          <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300">
                            {couponResult.discountType === "percentage" ? `${couponResult.discountValue}% OFF` : `₹${couponResult.discountValue} OFF`}
                          </Badge>
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-muted-foreground" onClick={handleRemoveCoupon}>Remove</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter code" className="h-8 text-xs flex-1"
                          value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleApplyCoupon(); } }}
                        />
                        <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg gap-1" onClick={handleApplyCoupon} disabled={!couponCode.trim() || validatingCoupon}>
                          {validatingCoupon ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                          Apply
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs">UTR Number</Label>
                      <Input placeholder="e.g. HDFC123456789" className="mt-1 h-9 text-xs"
                        value={utrNumber} onChange={e => setUtrNumber(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Payment Screenshot (optional)</Label>
                      <Input type="file" accept="image/*" className="mt-1 h-9 text-xs file:text-xs"
                        onChange={e => setPaymentScreenshot(e.target.files?.[0] ?? null)} />
                    </div>
                    <Button className="w-full brand-gradient text-white border-0 rounded-xl h-9 text-xs gap-1.5"
                      disabled={!utrNumber.trim() || submittingPayment}
                      onClick={handlePaymentSubmit}>
                      {submittingPayment ? <Loader2 className="size-3.5 animate-spin" /> : <CreditCard className="size-3.5" />}
                      {submittingPayment ? "Submitting..." : `Pay ₹${couponResult?.finalAmount ?? PAYMENT.amount}`}
                    </Button>
                  </div>
                </div>
              </div>
              )
            ) : (
              <p className="text-sm text-muted-foreground">Complete all tasks to proceed with payment.</p>
            )}
          </div>

          {/* Offer Letter */}
          <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  <FileText className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Offer Letter</p>
                  <p className="text-xs text-muted-foreground">Issued {new Date(app.offer_issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </div>
              </div>
              <Button size="sm" className="brand-gradient text-white border-0 rounded-xl h-9"
                onClick={() => downloadPdf(
                  <OfferLetterDoc fullName={app.full_name} internId={app.intern_id} domain={domain?.name ?? app.domain} issuedAt={app.offer_issued_at} duration={app.duration ?? 1} />,
                  `OfferLetter_${app.intern_id}.pdf`
                )}>
                <Download className="mr-1.5 size-3.5" /> Download
              </Button>
            </div>
          </div>

          {/* ID Card */}
          <IDCardSection app={app} />

          {/* Certificates */}
          {(cert || (lmsCerts && lmsCerts.length > 0)) && (
            <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
              <h3 className="flex items-center gap-2 font-bold mb-4"><Award className="size-4 text-primary" /> Certificates</h3>

              {/* Internship Certificate */}
              {cert && <CertificateSection compact cert={cert} app={app} course={course} enrollment={enrollment} lastAttempt={lastAttempt} />}

              {/* Course Certificates */}
              {lmsCerts && lmsCerts.length > 0 && enrollments && (
                <>
                  {cert && <div className="border-t border-border/40 my-4" />}
                  <h4 className="text-sm font-semibold mb-3">Course Certificates</h4>
                  <div className="grid gap-3">
                    {lmsCerts.map((lc: any) => {
                      const ec = enrollments.find((e: any) => e.id === lc.enrollment_id);
                      const c = courses?.find((co: any) => co.id === ec?.course_id);
                      return (
                        <div key={lc.enrollment_id} className="flex items-center justify-between rounded-xl border border-border/40 bg-secondary/30 p-3">
                          <div className="flex items-center gap-3">
                            <div className="grid size-8 place-items-center rounded-lg bg-[#07284a]/10 text-[#07284a] dark:bg-[#07284a]/30 dark:text-[#07284a]/80">
                              <BookOpen className="size-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold">{c?.name ?? "Course"}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{lc.certificate_id} · {new Date(lc.issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="rounded-lg h-7 text-[10px] border-border/60"
                            onClick={() => downloadPdf(
                              <CourseCertificateDoc fullName={app.full_name} courseName={c?.name ?? "Course"}
                                score={lc.score ?? 0} total={100}
                                certId={lc.certificate_id} issuedAt={lc.issued_at}
                                verifyUrl={`${window.location.origin}/verify-certificate`} />,
                              `Certificate_${lc.certificate_id}.pdf`
                            )}>
                            <Download className="mr-1 size-3" /> PDF
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {(certificate || payment) && (
            <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
              <h3 className="flex items-center gap-2 font-bold mb-4"><ScrollText className="size-4 text-primary" /> Completion Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Intern ID</p>
                  <p className="font-semibold mt-0.5 font-mono text-xs">{app.intern_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Full Name</p>
                  <p className="font-semibold mt-0.5">{app.full_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Domain</p>
                  <p className="font-semibold mt-0.5">{domain?.name ?? app.domain}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Duration</p>
                  <p className="font-semibold mt-0.5">{app.duration ? `${app.duration} Month${app.duration > 1 ? "s" : ""}` : "—"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (active === "profile") {
      return (
        <div className="space-y-6">
          <DashboardHero badge="Profile" title="Your Profile" description="Manage your personal details, photo, and internship information." icon={User} />
          {/* Profile Header Card */}
          <ProfilePanel app={app} onChange={() => qc.invalidateQueries({ queryKey: ["my-applications", user?.id] })} />

          {/* Detail Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Info */}
            <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70 overflow-hidden">
              <h3 className="flex items-center gap-2 text-sm font-bold mb-4"><User className="size-4 text-primary" /> Personal Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0 gap-2">
              <span className="text-muted-foreground shrink-0">College</span>
              <span className="font-medium text-right min-w-0 truncate">{app.college || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0 gap-2">
                  <span className="text-muted-foreground shrink-0">Course</span>
                  <span className="font-medium text-right min-w-0 truncate">{app.course || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0 gap-2">
                  <span className="text-muted-foreground shrink-0">Year</span>
                  <span className="font-medium text-right min-w-0 truncate">{app.year || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0 gap-2">
                  <span className="text-muted-foreground shrink-0">Phone</span>
                  <span className="font-medium text-right min-w-0 truncate">{app.phone || "—"}</span>
                </div>
              </div>
            </div>

            {/* Internship Info */}
            <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70 overflow-hidden">
              <h3 className="flex items-center gap-2 text-sm font-bold mb-4"><Briefcase className="size-4 text-primary" /> Internship Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0 gap-2">
                  <span className="text-muted-foreground shrink-0">Domain</span>
                  <span className="font-medium text-right min-w-0 truncate">{domain?.name ?? app.domain}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0 gap-2">
                  <span className="text-muted-foreground shrink-0">Intern ID</span>
                  <span className="font-medium font-mono text-xs text-right min-w-0 truncate">{app.intern_id}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0 gap-2">
                  <span className="text-muted-foreground shrink-0">Duration</span>
                  <span className="font-medium text-right min-w-0 truncate">{app.duration ?? 1} month{app.duration !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={`text-[10px] px-2 py-0.5 rounded-md ${
                    app.status === "completed" ? "bg-emerald-600 text-white" :
                    app.status === "ongoing" ? "bg-blue-600 text-white" :
                    app.status === "approved" ? "bg-amber-500 text-white" :
                    "bg-gray-500 text-white"
                  }`}>{app.status}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* ID Card & Documents */}
          <IDCardSection app={app} />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="flex min-h-screen overflow-x-hidden bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF] dark:from-[#0B1120] dark:to-[#0F172A]">
        {/* Background blobs */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -left-40 size-96 rounded-full bg-[#07284a]/15 blur-[120px] dark:bg-[#07284a]/20" />
          <div className="absolute top-1/3 -right-32 size-80 rounded-full bg-blue-400/15 blur-[100px] dark:bg-blue-600/10" />
          <div className="absolute -bottom-48 left-1/3 size-[500px] rounded-full bg-violet-400/10 blur-[140px] dark:bg-violet-600/5" />
          <div className="absolute top-2/3 left-1/4 size-64 rounded-full bg-emerald-400/5 blur-[80px] dark:bg-emerald-600/5" />
        </div>

        <Confetti active={!!cert} />

        {/* ─── Main Area ─── */}
        <div className="flex-1">
          {/* Content */}
          <main className="mx-auto max-w-6xl px-4 py-8 space-y-8 min-w-0">
            {renderContent()}
          </main>
        </div>

        {/* Quick Actions FAB */}
        {app && (
          <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-40 flex flex-col items-end gap-3">
            {enrollment && course && (
              <>
                <Button size="sm" className="brand-gradient text-white border-0 shadow-lg shadow-[#07284a]/25 rounded-full px-5 h-11" asChild>
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
      <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[#07284a]/10 blur-[100px]" />
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
      sub: "Topics Completed", color: "from-[#07284a] to-[#07284a]", bg: "bg-violet-50 dark:bg-violet-950/30",
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
        if (upErr) {
          console.warn("Profile photo upload failed:", upErr.message);
          toast.warning("Photo upload failed, profile saved without photo.");
        } else {
          const { data: publicUrl } = supabase.storage.from("profile-photos").getPublicUrl(path);
          photo_url = publicUrl?.publicUrl ?? photo_url;
        }
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
        <div className="flex flex-wrap items-start justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            {app.photo_url ? (
              <img src={app.photo_url} alt="" className="size-16 rounded-2xl border-2 border-[#07284a]/20 object-cover dark:border-[#07284a]/40" />
            ) : (
              <div className="grid size-16 place-items-center rounded-2xl brand-gradient text-xl font-bold text-white shadow-md shadow-[#07284a]/20">
                {app.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold truncate">{app.full_name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 min-w-0"><Mail className="size-3.5 shrink-0" /><span className="truncate">{app.email}</span></p>
              <div className="mt-2 flex flex-wrap gap-2 sm:gap-3 text-xs text-muted-foreground min-w-0">
                {app.college && <span className="flex items-center gap-1 min-w-0"><Building className="size-3 shrink-0" /><span className="truncate">{app.college}</span></span>}
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
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#07284a] via-blue-500 to-emerald-500 dark:from-[#07284a]/80 dark:via-blue-400 dark:to-emerald-400" />
        <ul className="space-y-0">
          {steps.map((s, i) => {
            const isActive = i === currentStep;
            const isDone = s.done;
            return (
              <li key={i} className="relative flex items-center gap-4 pb-6 last:pb-0">
                <div className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full transition-all duration-500 ${
                  isDone ? "bg-emerald-500 text-white scale-100" :
                  isActive ? "bg-[#07284a] text-white ring-4 ring-[#07284a]/30 dark:ring-[#07284a]/50 animate-pulse-soft" :
                  "bg-gray-200 dark:bg-gray-700 text-gray-400"
                }`}>
                  {isDone ? <CheckCircle2 className="size-3.5" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                </div>
                <div className={`min-w-0 ${isActive ? "font-semibold text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                  <p className={`text-sm ${isActive ? "text-[#07284a] dark:text-[#07284a]/80" : ""}`}>{s.label}</p>
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
          <div className="grid size-16 place-items-center rounded-2xl bg-[#07284a]/10 dark:bg-[#07284a]/30">
            <GraduationCap className="size-8 text-[#07284a]" />
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
                <div className="grid size-14 shrink-0 place-items-center rounded-2xl brand-gradient text-white shadow-md shadow-[#07284a]/20">
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
              <Button size="sm" variant="outline" className="rounded-xl h-9"
                onClick={() => window.location.href = `/courses/${c.slug}/quiz`}>
                <Trophy className="mr-1.5 size-3.5" /> Quiz
              </Button>
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
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#07284a] to-blue-500 text-white shadow-md">
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
          <div key={t.id} className={`rounded-2xl border border-border/50 bg-white/70 backdrop-blur-xl transition-all dark:bg-[#1E293B]/70 ${open ? "ring-2 ring-[#07284a]/30 dark:ring-[#07284a]/50" : ""}`}>
            <button onClick={() => setExpanded(open ? null : t.id)} className="flex w-full items-center justify-between p-4 text-left">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                  st === "approved" ? "bg-emerald-100 dark:bg-emerald-900/40" :
                  st === "rejected" ? "bg-red-100 dark:bg-red-900/40" :
                  "bg-[#07284a]/10 dark:bg-[#07284a]/30"
                }`}>
                  <Tag className={`size-5 ${
                    st === "approved" ? "text-emerald-600 dark:text-emerald-400" :
                    st === "rejected" ? "text-red-600 dark:text-red-400" :
                    "text-[#07284a] dark:text-[#07284a]/80"
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
        <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#07284a] to-blue-500 text-white shadow-md">
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

function CertificateSection({ cert, app, course, enrollment, lastAttempt, compact }: any) {
  if (!cert) return null;
  const isInternCert = cert.certificate_id?.startsWith("SKX-");
  const domain = getDomain(app?.domain);
  const inner = (
    <>
      <div className="rounded-xl bg-gradient-to-br from-[#07284a]/10 to-blue-50 p-4 text-center dark:from-[#07284a]/40 dark:to-blue-950/30 border border-[#07284a]/20 dark:border-[#07284a]/50">
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
    </>
  );
  if (compact) return <div className="border-b border-border/40 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">{inner}</div>;
  return <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">{inner}</div>;
}

// ─── ID CARD ───

function IDCardSection({ app }: { app: Application | null }) {
  if (!app) return null;
  const domain = getDomain(app.domain);
  return (
    <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-xl dark:bg-[#1E293B]/70">
      <h3 className="flex items-center gap-2 font-bold mb-4"><Shield className="size-4 text-primary" /> Digital ID Card</h3>
      <IDCard internId={app.intern_id} fullName={app.full_name} domain={domain?.name ?? app.domain} photoUrl={app.photo_url} issuedAt={app.offer_issued_at} duration={app.duration ?? 1} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge className="bg-emerald-600 text-white text-[10px]"><CheckCircle2 className="mr-1 size-3" /> ACTIVE</Badge>
        <div className="flex flex-wrap gap-2 ml-auto">
          <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs border-border/60"
            onClick={() => downloadPdf(
              <OfferLetterDoc fullName={app.full_name} internId={app.intern_id} domain={domain?.name ?? app.domain} issuedAt={app.offer_issued_at} duration={app.duration ?? 1} />,
              `OfferLetter_${app.intern_id}.pdf`
            )}>
            <FileText className="mr-1 size-3" /> Offer Letter
          </Button>
          <Button size="sm" className="brand-gradient text-white border-0 rounded-lg h-8 text-xs"
            onClick={() => downloadPdf(
              <OfferLetterDoc fullName={app.full_name} internId={app.intern_id} domain={domain?.name ?? app.domain} issuedAt={app.offer_issued_at} duration={app.duration ?? 1} />,
              `IDCard_${app.intern_id}.pdf`
            )}>
            <Download className="mr-1 size-3" /> Download ID
          </Button>
        </div>
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
  if (lastAttempt) activities.push({ icon: Brain, text: `Passed quiz with ${lastAttempt.score}/${lastAttempt.total} marks`, time: lastAttempt.submitted_at ? new Date(lastAttempt.submitted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "", color: "text-[#07284a] bg-[#07284a]/10 dark:bg-[#07284a]/30 dark:text-[#07284a]/80" });
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
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[#07284a]/15 blur-[100px]" />
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
          <div className="grid size-11 place-items-center rounded-xl bg-[#07284a]/10 text-[#07284a] dark:bg-[#07284a]/30 dark:text-[#07284a]/80"><GraduationCap className="size-5" /></div>
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
  const [selectedDomain, setSelectedDomain] = useState("");

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
        if (upErr) {
          console.warn("Profile photo upload failed:", upErr.message);
        } else {
          const { data: publicUrl } = supabase.storage.from("profile-photos").getPublicUrl(path);
          photo_url = publicUrl?.publicUrl ?? null;
        }
      }
      const intern_id = generateInternId();
      const domain = selectedDomain || String(fd.get("domain") || "");
      if (!domain) throw new Error("Please select a domain");
      const payload = { user_id: user.id, domain, intern_id, full_name: String(fd.get("full_name")), email: user.email ?? "", phone: String(fd.get("phone")), college: String(fd.get("college")), course: String(fd.get("course")), year: String(fd.get("year")), photo_url, status: "approved" as const };
      const { data: inserted, error } = await supabase.from("applications").insert(payload).select().maybeSingle();
      if (error || !inserted) throw error ?? new Error("Failed to create application");
      await supabase.from("profiles").update({ full_name: payload.full_name, phone: payload.phone, college: payload.college, course: payload.course, year: payload.year, photo_url }).eq("id", user.id);
      qc.setQueryData(["my-applications", user.id], [inserted]);
      toast.success("Application approved! Your offer letter is ready.");
      onCreated();
      (async () => {
        try {
          const { getDomain } = await import("@/lib/constants");
          const { sendOfferLetterEmail } = await import("@/lib/email-helpers");
          const domainObj = getDomain(domain);
          const domainName = domainObj?.name ?? domain;
          const result = await sendOfferLetterEmail({ to: user.email ?? "", studentName: payload.full_name, studentId: user.id, internId: intern_id, domainName, duration: 1 });
          if (result.success) toast.success("Offer letter sent to your email!");
          else toast.error("Offer letter email delivery failed. Contact support.");
        } catch (e) {
          toast.error("Offer letter email could not be sent.");
          console.warn("[Email] Failed to send offer letter:", e);
        }
      })();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto rounded-2xl border-border/50 bg-white/70 backdrop-blur-xl dark:bg-[#1E293B]/70">
      <CardHeader><CardTitle>Apply for an Internship</CardTitle><CardDescription>Fill in your details. You'll get your offer letter and digital ID card instantly.</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><Label>Full Name</Label><Input name="full_name" required className="mt-1" /></div>
          <div><Label>Phone</Label><Input name="phone" type="tel" required className="mt-1" /></div>
          <div><Label>Domain</Label>
            <Select value={selectedDomain} onValueChange={setSelectedDomain} required>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select a domain" /></SelectTrigger>
              <SelectContent>
                {DOMAINS.map((d) => <SelectItem key={d.slug} value={d.slug}>{d.icon} {d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <input type="hidden" name="domain" value={selectedDomain} />
          </div>
          <div><Label>College</Label><Input name="college" required className="mt-1" /></div>
          <div><Label>Course / Branch</Label><Input name="course" required className="mt-1" /></div>
          <div><Label>Year</Label><Input name="year" placeholder="e.g. 3rd year" required className="mt-1" /></div>
          <div><Label>Profile Photo</Label><Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} className="mt-1 file:truncate" /></div>
          <Button type="submit" className="w-full md:col-span-2 brand-gradient text-white border-0 h-11 rounded-xl mt-2" disabled={loading}>{loading ? "Submitting…" : "Submit Application"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
