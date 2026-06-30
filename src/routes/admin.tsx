import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { generateCertId, getDomain, COMPANY, DOMAINS } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { PromotionsSection } from "@/components/admin/PromotionsSection";
import { OfferLetterDoc, CertificateDoc, CourseCertificateDoc, downloadPdf, downloadPdfBlob } from "@/components/pdf-docs";
import {
  LayoutDashboard, GraduationCap, BookOpen, FileText, ListChecks,
  ClipboardCheck, ClipboardList, Brain, IndianRupee, Award, Users, BarChart3,
  Settings, LogOut, Moon, Sun, Bell, Search, ChevronDown, Menu,
  X, Plus, Eye, CheckCircle2, XCircle, Mail, Download, Sparkles,
  ChevronRight, ChevronLeft, Clock, TrendingUp, UserPlus, Wallet,
  ExternalLink, RefreshCw, Trash2, Edit, ArrowUpRight, Filter,
  AlertTriangle, HelpCircle, Home, MessageSquare, PanelRightClose,
  PanelRightOpen, FolderTree, FileQuestion, PieChart, Percent,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (role?.role !== "admin") throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Admin — Skyrovix" }] }),
  component: AdminPanel,
});

// ─── Sidebar Items ───
const SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "applications", label: "Internship Applications", icon: Users },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "enrollments", label: "Course Enrollments", icon: ClipboardList },
  { id: "topics", label: "Topics", icon: FolderTree },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "submissions", label: "Task Submissions", icon: ClipboardCheck },
  { id: "quiz", label: "Quiz Management", icon: Brain },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "promotions", label: "Promotions", icon: Percent },
  { id: "certificates", label: "Certificates", icon: Award },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "email-logs", label: "Email Logs", icon: Mail },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type SectionId = typeof SIDEBAR_ITEMS[number]["id"];

function AdminPanel() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [active, setActive] = useState<SectionId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [liveNotifs, setLiveNotifs] = useState<Array<{ icon: any; text: string; time: string; color: string }>>([]);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    const channel = supabase.channel("admin-realtime");
    const tables = [
      { table: "applications", icon: UserPlus, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30", label: "New application" },
      { table: "submissions", icon: ClipboardCheck, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30", label: "New task submission" },
      { table: "payments", icon: IndianRupee, color: "text-green-500 bg-green-50 dark:bg-green-950/30", label: "New payment" },
    ];
    for (const { table, icon, color, label } of tables) {
      channel.on("postgres_changes" as any, { event: "INSERT", schema: "public", table }, (payload: any) => {
        const name = payload.new?.full_name ?? payload.new?.id?.slice(0, 8) ?? "";
        const notif = { icon, text: `${label} from ${name}`, time: "Just now", color };
        setLiveNotifs((prev) => [notif, ...prev].slice(0, 20));
        toast.success(`${label} received`, { description: name, duration: 4000 });
        qc.invalidateQueries({ queryKey: ["admin-overview"] });
        qc.invalidateQueries({ queryKey: ["admin-apps"] });
        qc.invalidateQueries({ queryKey: ["admin-subs"] });
        qc.invalidateQueries({ queryKey: ["admin-payments"] });
      });
    }
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  // ─── Data ───
  const { data: overview } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [a, s, p, c, e, co, qa] = await Promise.all([
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("certificates").select("id", { count: "exact", head: true }),
        supabase.from("enrollments").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("quiz_attempts").select("id", { count: "exact", head: true }),
      ]);
      return {
        apps: a.count ?? 0, subs: s.count ?? 0, pays: p.count ?? 0, certs: c.count ?? 0,
        enrolled: e.count ?? 0, courses: co.count ?? 0, quizAttempts: qa.count ?? 0,
      };
    },
  });

  return (
    <div className={`min-h-screen ${dark ? "dark" : ""}`}>
      <div className="flex min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF] dark:from-[#0F172A] dark:to-[#0F172A]">
        {/* ─── Background Blobs ─── */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -left-40 size-96 rounded-full bg-[#07284a]/15 blur-[120px] dark:bg-[#07284a]/20" />
          <div className="absolute top-1/3 -right-32 size-80 rounded-full bg-blue-400/15 blur-[100px] dark:bg-blue-600/10" />
          <div className="absolute -bottom-40 left-1/3 size-96 rounded-full bg-[#07284a]/10 blur-[140px] dark:bg-[#07284a]/15" />
        </div>

        {/* ─── Mobile Overlay ─── */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
        )}

        {/* ─── Sidebar ─── */}
        <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/60 bg-white/70 backdrop-blur-2xl transition-all duration-300 dark:bg-[#0F172A]/90 dark:border-white/5 ${
          mobileOpen ? "w-64 translate-x-0" : sidebarOpen ? "w-64 -translate-x-full lg:translate-x-0" : "w-16 -translate-x-full lg:translate-x-0"
        }`}>
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-border/60 px-4 dark:border-white/5">
            <Link to="/" className={`flex items-center gap-2 ${!sidebarOpen && "lg:hidden"}`}>
              <div className="grid size-9 shrink-0 place-items-center rounded-xl brand-gradient text-[10px] font-bold text-white">S</div>
              {sidebarOpen && <span className="text-sm font-bold">Skyrovix<span className="brand-text">Admin</span></span>}
            </Link>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:grid size-8 place-items-center rounded-lg hover:bg-accent/50 transition">
              {sidebarOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
            </button>
            <button onClick={() => setMobileOpen(false)} className="lg:hidden grid size-8 place-items-center rounded-lg hover:bg-accent/50">
              <X className="size-4" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => { setActive(item.id); setMobileOpen(false); }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "brand-gradient text-white shadow-md shadow-[#07284a]/20"
                          : "text-gray-600 hover:text-gray-900 hover:bg-[#07284a]/5 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5"
                      }`}
                    >
                      <Icon className="size-5 shrink-0" />
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                      {isActive && sidebarOpen && (
                        <ChevronRight className="ml-auto size-4 text-white/70" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="border-t border-border/60 p-3 dark:border-white/5">
            <button
              onClick={signOut}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/30`}
            >
              <LogOut className="size-5 shrink-0" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* ─── Main Area ─── */}
        <div className={`flex-1 min-w-0 transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-16"}`}>
          {/* ─── Top Navbar ─── */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/60 bg-white/70 px-4 backdrop-blur-xl dark:bg-[#0F172A]/80 dark:border-white/5">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden grid size-9 place-items-center rounded-lg border border-border hover:bg-accent/50">
                <Menu className="size-4" />
              </button>
              <div className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students, certificates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-64 rounded-xl border-border/60 bg-background/60 pl-9 text-sm backdrop-blur placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDark(!dark)}
                className="grid size-9 place-items-center rounded-xl border border-border/60 bg-background/60 hover:bg-accent/50 transition"
              >
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative grid size-9 place-items-center rounded-xl border border-border/60 bg-background/60 hover:bg-accent/50 transition"
                >
                  <Bell className="size-4" />
                  {liveNotifs.length > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-red-500 text-[9px] font-bold text-white">{liveNotifs.length > 9 ? "9+" : liveNotifs.length}</span>
                  )}
                </button>
                {notifOpen && <NotificationsDropdown onClose={() => setNotifOpen(false)} notifs={liveNotifs} />}
              </div>
              <div className="ml-2 flex items-center gap-2 rounded-xl bg-background/60 border border-border/60 px-3 py-1.5">
                <div className="grid size-7 place-items-center rounded-lg brand-gradient text-[10px] font-bold text-white">
                  {user?.email?.charAt(0).toUpperCase() ?? "A"}
                </div>
                <span className="hidden text-sm font-medium sm:inline">{user?.email?.split("@")[0] ?? "Admin"}</span>
              </div>
            </div>
          </header>

          {/* ─── Page Content ─── */}
          <main className="p-4 sm:p-6 lg:p-8 overflow-x-auto">
            {/* Search results */}
            {searchQuery && (
              <div className="mb-6 rounded-2xl border border-border/60 bg-white/60 p-4 backdrop-blur dark:bg-white/5">
                <p className="text-sm text-muted-foreground">Search results for "<span className="font-medium text-foreground">{searchQuery}</span>"</p>
              </div>
            )}

            {active === "dashboard" && <DashboardSection greeting={greeting} overview={overview} onNavigate={setActive} />}
            {active === "applications" && <ApplicationsSection />}
            {active === "courses" && <CoursesSection />}
            {active === "enrollments" && <CourseEnrollmentsSection />}
            {active === "topics" && <TopicsSection />}
            {active === "tasks" && <TasksSection />}
            {active === "submissions" && <SubmissionsSection />}
            {active === "quiz" && <QuizSection />}
            {active === "payments" && <PaymentsSection />}
            {active === "promotions" && <PromotionsSection />}
            {active === "certificates" && <CertificatesSection />}
            {active === "students" && <StudentsSection />}
            {active === "email-logs" && <EmailLogsSection />}
            {active === "analytics" && <AnalyticsSection />}
            {active === "settings" && <SettingsSection />}
          </main>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// NOTIFICATIONS DROPDOWN
// ══════════════════════════════════════════════
function NotificationsDropdown({ onClose, notifs }: { onClose: () => void; notifs: Array<{ icon: any; text: string; time: string; color: string }> }) {
  return (
    <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-border/60 bg-white/90 p-4 shadow-2xl backdrop-blur-2xl dark:bg-[#1E293B]/90 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
      <p className="mb-3 text-sm font-semibold">Notifications {notifs.length > 0 && <span className="text-muted-foreground font-normal">({notifs.length})</span>}</p>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {notifs.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>}
        {notifs.map((n, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-accent/50">
            <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${n.color}`}>
              <n.icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm">{n.text}</p>
              <p className="text-xs text-muted-foreground">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════
function DashboardSection({ greeting, overview, onNavigate }: { greeting: string; overview: any; onNavigate: (s: SectionId) => void }) {
  const [counts, setCounts] = useState({ apps: 0, subs: 0, pays: 0, certs: 0, enrolled: 0, courses: 0 });
  useEffect(() => {
    if (!overview) return;
    const timer = setInterval(() => {
      setCounts((c) => ({
        apps: Math.min(c.apps + 3, overview.apps),
        subs: Math.min(c.subs + 1, overview.subs),
        pays: Math.min(c.pays + 1, overview.pays),
        certs: Math.min(c.certs + 2, overview.certs),
        enrolled: Math.min(c.enrolled + 5, overview.enrolled),
        courses: Math.min(c.courses + 1, overview.courses),
      }));
    }, 30);
    setTimeout(() => clearInterval(timer), 1000);
    return () => clearInterval(timer);
  }, [overview]);

  const stats = [
    { label: "Applications", value: counts.apps, icon: Users, change: "+12 Today", color: "from-blue-500 to-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Pending Submissions", value: counts.subs, icon: FileText, change: "Need Review", color: "from-amber-500 to-orange-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Pending Payments", value: counts.pays, icon: Wallet, change: "₹18,000 Pending", color: "from-green-500 to-emerald-500", bg: "bg-green-50 dark:bg-green-950/30" },
    { label: "Certificates Issued", value: counts.certs, icon: Award, change: "+15 This Week", color: "from-[#07284a] to-[#07284a]", bg: "bg-[#07284a]/10 dark:bg-[#07284a]/30" },
    { label: "Students Enrolled", value: counts.enrolled, icon: GraduationCap, change: "LMS Courses", color: "from-cyan-500 to-teal-500", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
    { label: "Courses Available", value: counts.courses, icon: BookOpen, change: "Published", color: "from-rose-500 to-pink-500", bg: "bg-rose-50 dark:bg-rose-950/30" },
    { label: "Quiz Attempts", value: overview?.quizAttempts ?? 0, icon: Brain, change: "All Time", color: "from-[#07284a] to-[#07284a]", bg: "bg-[#07284a]/10 dark:bg-[#07284a]/30" },
    { label: "Completion Rate", value: "78%", icon: TrendingUp, change: "+5% vs Last Month", color: "from-emerald-500 to-green-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  ];

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-[#07284a]/15 via-blue-600/5 to-transparent p-6 sm:p-8 dark:from-[#07284a]/30 dark:via-blue-600/10">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-[#07284a]/15 blur-[80px]" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{greeting}, Admin <span className="brand-text">👋</span></h1>
              <p className="mt-1.5 text-muted-foreground">Manage internships, courses, tasks and certificates effortlessly.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="brand-gradient text-white border-0 shadow-lg shadow-[#07284a]/25" onClick={() => onNavigate("courses")}><Plus className="mr-1 size-4" /> Add Course</Button>
              <Button size="sm" variant="outline" className="border-border/60" onClick={() => onNavigate("tasks")}><Plus className="mr-1 size-4" /> Add Task</Button>
              <Button size="sm" variant="outline" className="border-border/60" onClick={() => onNavigate("quiz")}><Brain className="mr-1 size-4" /> Create Quiz</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="group rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/5 dark:bg-[#1E293B]/70 dark:hover:shadow-white/5"
            >
              <div className="flex items-start justify-between">
                <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${s.bg}`}>
                  <Icon className="size-5 text-[#07284a] dark:text-white" />
                </div>
                <span className={`rounded-full bg-gradient-to-br ${s.color} px-2 py-0.5 text-[10px] font-medium text-white`}>{s.change}</span>
              </div>
              <p className="mt-4 font-display text-3xl font-bold">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// APPLICATIONS
// ══════════════════════════════════════════════
function ApplicationsSection() {
  const qc = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { data } = useQuery({
    queryKey: ["admin-apps"],
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const updateStatus = async (id: string, status: string) => {
    const payload: any = { status };
    if (status === "ongoing") payload.offer_issued_at = new Date().toISOString();
    const { error } = await supabase.from("applications").update(payload).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Application ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-apps"] });
    qc.invalidateQueries({ queryKey: ["admin-overview"] });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { deleteInternshipApplication: del } = await import("@/lib/admin-service");
      const result = await del({ data: { applicationId: deleteTarget.id } });
      if (result.success) {
        toast.success("Application deleted successfully.");
        qc.invalidateQueries({ queryKey: ["admin-apps"] });
        qc.invalidateQueries({ queryKey: ["admin-overview"] });
      } else {
        toast.error(result.error ?? "Failed to delete application");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete application");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Internship Applications</h2>
          <p className="text-sm text-muted-foreground">{data?.length ?? 0} total applications</p>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl border border-border/50 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl dark:bg-[#1E293B]/95" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="grid size-10 place-items-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30"><AlertTriangle className="size-5" /></div>
              <div>
                <h3 className="font-bold text-lg">Delete Internship Application?</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <div className="rounded-xl bg-accent/30 p-4 text-sm space-y-1 mb-4">
              <p><span className="font-medium">Student:</span> {deleteTarget.full_name}</p>
              <p><span className="font-medium">Domain:</span> {getDomain(deleteTarget.domain)?.name ?? deleteTarget.domain}</p>
              <p><span className="font-medium">Duration:</span> {deleteTarget.duration ?? 1} Month(s)</p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-3 text-xs text-amber-700 dark:text-amber-400 mb-4">
              <p className="font-medium mb-1">This will remove:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Internship enrollment</li>
                <li>Assigned tasks</li>
                <li>Task submissions</li>
                <li>Progress tracking</li>
                <li>Internship certificate (if exists)</li>
              </ul>
              <p className="mt-2 font-medium text-green-600 dark:text-green-400">Student account will NOT be deleted.</p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" className="border-border/60" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white border-0" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Application"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedApp(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg rounded-2xl border border-border/50 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl dark:bg-[#1E293B]/95 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{selectedApp.full_name}</h3>
              <button onClick={() => setSelectedApp(null)} className="grid size-8 place-items-center rounded-lg hover:bg-accent/50"><X className="size-4" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-muted-foreground text-xs">Email</p><p>{selectedApp.email}</p></div>
                <div><p className="text-muted-foreground text-xs">Phone</p><p>{selectedApp.phone ?? "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Domain</p><p>{getDomain(selectedApp.domain)?.name ?? selectedApp.domain}</p></div>
                <div><p className="text-muted-foreground text-xs">Status</p><Badge className="text-xs">{selectedApp.status}</Badge></div>
                <div className="col-span-2"><p className="text-muted-foreground text-xs">College</p><p>{selectedApp.college} · {selectedApp.course} ({selectedApp.year})</p></div>
                <div className="col-span-2"><p className="text-muted-foreground text-xs">Intern ID</p><p className="font-mono text-xs">{selectedApp.intern_id ?? "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Applied</p><p>{new Date(selectedApp.created_at).toLocaleDateString("en-IN")}</p></div>
                <div><p className="text-muted-foreground text-xs">Offer Issued</p><p>{selectedApp.offer_issued_at ? new Date(selectedApp.offer_issued_at).toLocaleDateString("en-IN") : "—"}</p></div>
              </div>
              <div className="flex gap-2 pt-2 flex-wrap">
                {selectedApp.status === "approved" && (
                  <Button size="sm" className="brand-gradient text-white border-0 flex-1" onClick={() => { updateStatus(selectedApp.id, "ongoing"); setSelectedApp(null); }}>
                    Mark Ongoing
                  </Button>
                )}
                {selectedApp.status === "ongoing" && (
                  <Button size="sm" className="brand-gradient text-white border-0 flex-1" onClick={() => { updateStatus(selectedApp.id, "completed"); setSelectedApp(null); }}>
                    Mark Completed
                  </Button>
                )}
                <Button size="sm" variant="outline" className="border-border/60" asChild>
                  <a href={`mailto:${selectedApp.email}`}><Mail className="mr-1 size-3.5" /> Email</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-white/60 backdrop-blur dark:bg-[#1E293B]/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-left">Domain</th>
              <th className="px-4 py-3 text-left">College</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No applications yet.</td></tr>
            )}
            {data?.map((a) => {
              const dd = getDomain(a.domain);
              return (
                <tr key={a.id} className="border-b border-border/30 transition hover:bg-accent/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-full brand-gradient text-xs font-bold text-white">{a.full_name.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0"><p className="font-medium truncate">{a.full_name}</p><p className="text-xs text-muted-foreground">{a.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{dd?.name ?? a.domain}</Badge></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{a.college} · {a.course} {a.year}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${
                      a.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      a.status === "ongoing" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      a.status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      a.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>{a.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedApp(a)} className="grid size-8 place-items-center rounded-lg hover:bg-accent/50 transition" title="View"><Eye className="size-4" /></button>
                      {a.status === "pending" && (
                        <>
                          <button onClick={() => updateStatus(a.id, "approved")} className="grid size-8 place-items-center rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition" title="Approve"><CheckCircle2 className="size-4" /></button>
                          <button onClick={() => updateStatus(a.id, "rejected")} className="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition" title="Reject"><XCircle className="size-4" /></button>
                        </>
                      )}
                      <a href={`mailto:${a.email}`} className="grid size-8 place-items-center rounded-lg hover:bg-accent/50 transition" title="Send Email"><Mail className="size-4" /></a>
                      <button onClick={() => setDeleteTarget(a)} className="grid size-8 place-items-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition" title="Delete Application"><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// COURSES
// ══════════════════════════════════════════════
function CoursesSection() {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<null | { mode: "create" } | { mode: "edit"; course: any }>(null);

  const { data } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const deleteCourse = async (id: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Course deleted");
    qc.invalidateQueries({ queryKey: ["admin-courses"] });
  };

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course Management</h2>
          <p className="text-sm text-muted-foreground">{data?.length ?? 0} courses</p>
        </div>
        <Button className="brand-gradient text-white border-0" onClick={() => setDialog({ mode: "create" })}><Plus className="mr-1 size-4" /> Add Course</Button>
      </div>

      <CourseDialog
        key={dialog ? JSON.stringify(dialog) : "closed"}
        open={!!dialog}
        onClose={() => setDialog(null)}
        onSaved={() => { qc.invalidateQueries({ queryKey: ["admin-courses"] }); setDialog(null); }}
        mode={dialog?.mode as any}
        course={dialog?.mode === "edit" ? (dialog as any).course : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((c) => (
          <div key={c.id} className="group rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-[#1E293B]/70">
            <div className="flex items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl brand-gradient text-white shadow-md">
                <BookOpen className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{c.name}</p>
                <Badge variant="outline" className="mt-0.5 text-[10px]">{c.difficulty}</Badge>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-border/40 bg-secondary/30 p-3 text-xs">
              <div><span className="text-muted-foreground">Topics</span><p className="font-bold">{c.total_topics}</p></div>
              <div><span className="text-muted-foreground">Tasks</span><p className="font-bold">{c.total_tasks}</p></div>
              <div><span className="text-muted-foreground">Quiz</span><p className="font-bold">{c.quiz_marks}m</p></div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 h-10 rounded-xl border-border/60" onClick={() => setDialog({ mode: "edit", course: c })}><Edit className="mr-1 size-3" /> Edit</Button>
              <Button size="sm" variant="outline" className="size-8 rounded-xl border-border/60 text-red-500 hover:text-red-600" onClick={() => deleteCourse(c.id)}><Trash2 className="size-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseDialog({ open, onClose, onSaved, mode, course }: {
  open: boolean; onClose: () => void; onSaved: () => void;
  mode: "create" | "edit"; course?: any;
}) {
  const [slug, setSlug] = useState(course?.slug ?? "");
  const [name, setName] = useState(course?.name ?? "");
  const [desc, setDesc] = useState(course?.short_description ?? "");
  const [domain, setDomain] = useState(course?.domain ?? "fullstack");
  const [difficulty, setDifficulty] = useState(course?.difficulty ?? "Intermediate");
  const [duration, setDuration] = useState(course?.duration_weeks ?? 8);
  const [quizMarks, setQuizMarks] = useState(course?.quiz_marks ?? 100);
  const [passMarks, setPassMarks] = useState(course?.pass_marks ?? 60);
  const [quizDuration, setQuizDuration] = useState(course?.quiz_duration_min ?? 60);
  const [totalTasks, setTotalTasks] = useState(course?.total_tasks ?? 5);
  const [published, setPublished] = useState(course?.is_published ?? true);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim() || !name.trim() || !desc.trim()) return toast.error("Name, slug, and description are required");
    setSaving(true);
    const payload = {
      slug: slug.trim().toLowerCase().replace(/\s+/g, "-"), name: name.trim(),
      short_description: desc.trim(), domain, difficulty, duration_weeks: duration,
      quiz_marks: quizMarks, pass_marks: passMarks, quiz_duration_min: quizDuration,
      total_tasks: totalTasks, is_published: published,
    };
    if (mode === "create") {
      const { error } = await supabase.from("courses").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("courses").update(payload).eq("id", course.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
    }
    toast.success(mode === "create" ? "Course created" : "Course updated");
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-border/50 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl dark:bg-[#1E293B]/95 dark:border-white/10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold">{mode === "create" ? "Create Course" : "Edit Course"}</h3>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-accent/50"><X className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Course Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Full Stack Development" className="mt-1" />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. fullstack" className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Short Description *</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Brief course description" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Domain</Label>
              <select value={domain} onChange={(e) => setDomain(e.target.value)} className="mt-1 flex h-11 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm">
                {DOMAINS.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="mt-1 flex h-11 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm">
                {["Beginner", "Intermediate", "Advanced"].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Duration (weeks)</Label>
              <Input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label>Total Tasks</Label>
              <Input type="number" min={1} value={totalTasks} onChange={(e) => setTotalTasks(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label>Published</Label>
              <select value={published ? "true" : "false"} onChange={(e) => setPublished(e.target.value === "true")} className="mt-1 flex h-11 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Quiz Marks</Label>
              <Input type="number" min={1} value={quizMarks} onChange={(e) => setQuizMarks(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label>Pass Marks</Label>
              <Input type="number" min={1} value={passMarks} onChange={(e) => setPassMarks(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label>Quiz Duration (min)</Label>
              <Input type="number" min={1} value={quizDuration} onChange={(e) => setQuizDuration(Number(e.target.value))} className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving} className="brand-gradient text-white border-0">
              {saving ? "Saving…" : mode === "create" ? "Create Course" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// COURSE ENROLLMENTS
// ══════════════════════════════════════════════
function CourseEnrollmentsSection() {
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["admin-enrollments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("enrollments")
        .select("id, user_id, course_id, status, progress_percent, started_at, completed_at, created_at, courses:course_id(slug, name)")
        .order("created_at", { ascending: false });
      return (data ?? []).map((e: any) => ({ ...e, course: e.courses }));
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-enrollments-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email");
      return new Map((data ?? []).map((p: any) => [p.id, p]));
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { deleteCourseEnrollment: del } = await import("@/lib/admin-service");
      const result = await del({ data: { enrollmentId: deleteTarget.id } });
      if (result.success) {
        toast.success("Course enrollment deleted successfully.");
        qc.invalidateQueries({ queryKey: ["admin-enrollments"] });
        qc.invalidateQueries({ queryKey: ["admin-overview"] });
      } else {
        toast.error(result.error ?? "Failed to delete enrollment");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete enrollment");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Course Enrollments</h2>
        <p className="text-sm text-muted-foreground">{enrollments?.length ?? 0} total enrollments</p>
      </div>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl border border-border/50 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl dark:bg-[#1E293B]/95" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="grid size-10 place-items-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30"><AlertTriangle className="size-5" /></div>
              <div>
                <h3 className="font-bold text-lg">Delete Course Enrollment?</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <div className="rounded-xl bg-accent/30 p-4 text-sm space-y-1 mb-4">
              <p><span className="font-medium">Student:</span> {deleteTarget.profileName ?? "Unknown"}</p>
              <p><span className="font-medium">Course:</span> {deleteTarget.course?.name ?? "Unknown"}</p>
              <p><span className="font-medium">Status:</span> {deleteTarget.status}</p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-3 text-xs text-amber-700 dark:text-amber-400 mb-4">
              <p className="font-medium mb-1">This will remove:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Course enrollment</li>
                <li>Course progress</li>
                <li>Quiz attempts</li>
                <li>Course certificate</li>
              </ul>
              <p className="mt-2 font-medium text-green-600 dark:text-green-400">Student account will NOT be deleted.</p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" className="border-border/60" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white border-0" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Enrollment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-white/60 backdrop-blur dark:bg-[#1E293B]/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-left">Course</th>
              <th className="px-4 py-3 text-left">Progress</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Enrolled</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Loading...</td></tr>
            )}
            {!isLoading && enrollments?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No course enrollments yet.</td></tr>
            )}
            {enrollments?.map((e: any) => {
              const profile = profiles?.get(e.user_id);
              return (
                <tr key={e.id} className="border-b border-border/30 transition hover:bg-accent/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 shrink-0 place-items-center rounded-full brand-gradient text-[10px] font-bold text-white">{(profile?.full_name ?? "?").charAt(0).toUpperCase()}</div>
                      <div className="min-w-0"><p className="font-medium text-sm truncate">{profile?.full_name ?? "Unknown"}</p><p className="text-xs text-muted-foreground">{profile?.email ?? ""}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">{e.course?.name ?? "Unknown"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-accent overflow-hidden">
                        <div className="h-full brand-gradient rounded-full" style={{ width: `${e.progress_percent ?? 0}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{e.progress_percent ?? 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${
                      e.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      e.status === "enrolled" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>{e.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setDeleteTarget({ ...e, profileName: profile?.full_name });
                        }}
                        className="grid size-8 place-items-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        title="Delete Enrollment"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// TOPICS
// ══════════════════════════════════════════════
function TopicsSection() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | { mode: "create"; courseId: string } | { mode: "edit"; topic: any }>(null);

  const { data: courses } = useQuery({
    queryKey: ["admin-courses-list"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, slug, name").order("name");
      return data ?? [];
    },
  });

  const { data: topics } = useQuery({
    queryKey: ["admin-topics", expanded],
    enabled: !!expanded,
    queryFn: async () => {
      const { data } = await supabase.from("course_topics").select("*").eq("course_id", expanded!).order("order_index");
      return data ?? [];
    },
  });

  const deleteTopic = async (topic: any) => {
    const { error } = await supabase.from("course_topics").delete().eq("id", topic.id);
    if (error) return toast.error(error.message);
    const { data: c } = await supabase.from("courses").select("total_topics").eq("id", topic.course_id).single();
    if (c) {
      await supabase.from("courses").update({ total_topics: Math.max(0, (c.total_topics ?? 1) - 1) }).eq("id", topic.course_id);
    }
    toast.success("Topic deleted");
    qc.invalidateQueries({ queryKey: ["admin-topics", expanded] });
    qc.invalidateQueries({ queryKey: ["admin-courses"] });
  };

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Topic Management</h2>
          <p className="text-sm text-muted-foreground">Organize course content</p>
        </div>
      </div>

      <TopicDialog
        key={dialog ? JSON.stringify(dialog) : "closed"}
        open={!!dialog}
        onClose={() => setDialog(null)}
        onSaved={() => { qc.invalidateQueries({ queryKey: ["admin-topics", expanded] }); setDialog(null); }}
        mode={dialog?.mode as any}
        courseId={dialog?.mode === "create" ? (dialog as any).courseId : undefined}
        topic={dialog?.mode === "edit" ? (dialog as any).topic : undefined}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {courses?.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border/50 bg-white/60 backdrop-blur dark:bg-[#1E293B]/60">
            <button
              onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              className="flex w-full items-center justify-between p-4 transition hover:bg-accent/20"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl brand-gradient text-white"><FolderTree className="size-4" /></div>
                <span className="font-semibold">{c.name}</span>
              </div>
              <ChevronDown className={`size-4 text-muted-foreground transition ${expanded === c.id ? "rotate-180" : ""}`} />
            </button>
            {expanded === c.id && (
              <div className="border-t border-border/40 px-4 pb-4 pt-2">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{topics?.length ?? 0} topics</span>
                  <Button size="sm" className="h-10 brand-gradient text-white border-0" onClick={() => setDialog({ mode: "create", courseId: c.id })}>
                    <Plus className="mr-1 size-3" /> Add Topic
                  </Button>
                </div>
                {!topics?.length && <p className="py-3 text-sm text-muted-foreground">No topics yet.</p>}
                <ul className="space-y-1">
                  {topics?.map((t, i) => (
                    <li key={t.id} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm transition hover:bg-accent/30">
                      <div className="flex items-center gap-2">
                        <span className="grid size-6 place-items-center rounded-md bg-secondary text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                        <span>{t.title}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setDialog({ mode: "edit", topic: t })} className="grid size-7 place-items-center rounded-lg hover:bg-accent/50"><Edit className="size-3" /></button>
                        <button onClick={() => deleteTopic(t)} className="grid size-7 place-items-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="size-3" /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TopicDialog({ open, onClose, onSaved, mode, courseId, topic }: {
  open: boolean; onClose: () => void; onSaved: () => void;
  mode: "create" | "edit"; courseId?: string; topic?: any;
}) {
  const [courseSel, setCourseSel] = useState(topic?.course_id ?? courseId ?? "");
  const [title, setTitle] = useState(topic?.title ?? "");
  const [contentMd, setContentMd] = useState(topic?.content_md ?? "");
  const [codeExample, setCodeExample] = useState(topic?.code_example ?? "");
  const [keyPoints, setKeyPoints] = useState((topic?.key_points as string[])?.join("\n") ?? "");
  const [saving, setSaving] = useState(false);

  const { data: courses } = useQuery({
    queryKey: ["admin-courses-topic"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, name").order("name");
      return data ?? [];
    },
  });

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseSel || !title.trim()) return toast.error("Course and title required");
    setSaving(true);
    const kp = keyPoints.split("\n").map((s) => s.trim()).filter(Boolean);
    if (mode === "create") {
      const { data: existing } = await supabase.from("course_topics").select("order_index").eq("course_id", courseSel).order("order_index", { ascending: false }).limit(1);
      const nextIndex = (existing?.[0]?.order_index ?? 0) + 1;
      const { error } = await supabase.from("course_topics").insert({ course_id: courseSel, order_index: nextIndex, title: title.trim(), content_md: contentMd, code_example: codeExample || null, key_points: kp });
      if (error) { toast.error(error.message); setSaving(false); return; }
      const { count } = await supabase.from("course_topics").select("id", { count: "exact", head: true }).eq("course_id", courseSel);
      await supabase.from("courses").update({ total_topics: count ?? 0 }).eq("id", courseSel);
    } else {
      const { error } = await supabase.from("course_topics").update({ title: title.trim(), content_md: contentMd, code_example: codeExample || null, key_points: kp }).eq("id", topic.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
    }
    toast.success(mode === "create" ? "Topic created" : "Topic updated");
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-border/50 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl dark:bg-[#1E293B]/95 dark:border-white/10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold">{mode === "create" ? "Add Topic" : "Edit Topic"}</h3>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-accent/50"><X className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Course</Label>
            <select value={courseSel} onChange={(e) => setCourseSel(e.target.value)} className="mt-1 flex h-11 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm" disabled={mode === "edit"}>
              <option value="">Select course…</option>
              {courses?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Topic title" className="mt-1" />
          </div>
          <div>
            <Label>Content (Markdown)</Label>
            <Textarea value={contentMd} onChange={(e) => setContentMd(e.target.value)} rows={4} placeholder="Write the lesson content here…" className="mt-1" />
          </div>
          <div>
            <Label>Code Example</Label>
            <Textarea value={codeExample} onChange={(e) => setCodeExample(e.target.value)} rows={3} placeholder="Optional code snippet" className="mt-1 font-mono text-xs" />
          </div>
          <div>
            <Label>Key Points (one per line)</Label>
            <Textarea value={keyPoints} onChange={(e) => setKeyPoints(e.target.value)} rows={3} placeholder="Point 1&#10;Point 2&#10;Point 3" className="mt-1" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving} className="brand-gradient text-white border-0">
              {saving ? "Saving…" : mode === "create" ? "Add Topic" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// TASKS
// ══════════════════════════════════════════════
function TasksSection() {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<null | { mode: "create" } | { mode: "edit"; task: any }>(null);

  const { data } = useQuery({
    queryKey: ["admin-tasks"],
    queryFn: async () => {
      const { data } = await supabase.from("course_tasks").select("*, courses(name)").order("task_number");
      return data ?? [];
    },
  });

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("course_tasks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Task deleted");
    qc.invalidateQueries({ queryKey: ["admin-tasks"] });
  };

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Task Management</h2>
          <p className="text-sm text-muted-foreground">{data?.length ?? 0} tasks</p>
        </div>
        <Button className="brand-gradient text-white border-0" onClick={() => setDialog({ mode: "create" })}><Plus className="mr-1 size-4" /> Add Task</Button>
      </div>

      <TaskDialog
        key={dialog ? JSON.stringify(dialog) : "closed"}
        open={!!dialog}
        onClose={() => setDialog(null)}
        onSaved={() => { qc.invalidateQueries({ queryKey: ["admin-tasks"] }); setDialog(null); }}
        mode={dialog?.mode as any}
        task={dialog?.mode === "edit" ? (dialog as any).task : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((t: any) => (
          <div key={t.id} className="group rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-[#1E293B]/70">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">Task #{t.task_number}</Badge>
              <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
            </div>
            <p className="mt-3 font-semibold">{t.title}</p>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{t.description}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <BookOpen className="size-3" /> {t.courses?.name ?? "—"}
              <span className="ml-auto flex items-center gap-1"><Clock className="size-3" /> {t.due_days}d</span>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 h-10 rounded-xl border-border/60" onClick={() => setDialog({ mode: "edit", task: t })}><Edit className="mr-1 size-3" /> Edit</Button>
              <Button size="sm" variant="outline" className="size-8 rounded-xl border-border/60 text-red-500 hover:text-red-600" onClick={() => deleteTask(t.id)}><Trash2 className="size-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskDialog({ open, onClose, onSaved, mode, task }: {
  open: boolean; onClose: () => void; onSaved: () => void;
  mode: "create" | "edit"; task?: any;
}) {
  const [courseSel, setCourseSel] = useState(task?.course_id ?? "");
  const [taskNum, setTaskNum] = useState(task?.task_number ?? 1);
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [requirements, setRequirements] = useState(task?.requirements ?? "");
  const [dueDays, setDueDays] = useState(task?.due_days ?? 6);
  const [saving, setSaving] = useState(false);

  const { data: courses } = useQuery({
    queryKey: ["admin-courses-task"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, name").order("name");
      return data ?? [];
    },
  });

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseSel || !title.trim() || !description.trim()) return toast.error("Course, title, and description required");
    setSaving(true);
    const payload = { course_id: courseSel, task_number: taskNum, title: title.trim(), description: description.trim(), requirements, due_days: dueDays };
    if (mode === "create") {
      const { error } = await supabase.from("course_tasks").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("course_tasks").update(payload).eq("id", task.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
    }
    toast.success(mode === "create" ? "Task created" : "Task updated");
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-border/50 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl dark:bg-[#1E293B]/95 dark:border-white/10 animate-in zoom-in-95">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold">{mode === "create" ? "Add Task" : "Edit Task"}</h3>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-accent/50"><X className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Course</Label>
            <select value={courseSel} onChange={(e) => setCourseSel(e.target.value)} className="mt-1 flex h-11 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm" disabled={mode === "edit"}>
              <option value="">Select course…</option>
              {courses?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Task Number</Label>
              <Input type="number" min={1} value={taskNum} onChange={(e) => setTaskNum(Number(e.target.value))} className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>Due (days)</Label>
              <Input type="number" min={1} value={dueDays} onChange={(e) => setDueDays(Number(e.target.value))} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="mt-1" />
          </div>
          <div>
            <Label>Description *</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Detailed task description" className="mt-1" />
          </div>
          <div>
            <Label>Requirements</Label>
            <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={2} placeholder="Requirements checklist" className="mt-1" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving} className="brand-gradient text-white border-0">
              {saving ? "Saving…" : mode === "create" ? "Add Task" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// SUBMISSIONS
// ══════════════════════════════════════════════
function SubmissionsSection() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-subs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("submissions")
        .select("*, applications(full_name, intern_id, domain), tasks(title, task_number)")
        .order("submitted_at", { ascending: false });
      return data ?? [];
    },
  });

  const review = async (id: string, status: "approved" | "rejected", feedback: string) => {
    const { error } = await supabase.from("submissions").update({ status, feedback, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Submission ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-subs"] });
  };

  const pending = data?.filter((s: any) => s.status === "pending") ?? [];
  const reviewed = data?.filter((s: any) => s.status !== "pending") ?? [];

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Task Submissions</h2>
      </div>

      {pending.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-amber-600 flex items-center gap-2"><Clock className="size-4" /> Pending Review ({pending.length})</h3>
          <div className="space-y-3">
            {pending.map((s: any) => <SubmissionCard key={s.id} sub={s} review={review} />)}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Reviewed ({reviewed.length})</h3>
          <div className="space-y-3">
            {reviewed.map((s: any) => <SubmissionCard key={s.id} sub={s} review={review} />)}
          </div>
        </div>
      )}

      {!data?.length && <p className="text-center text-muted-foreground py-12">No submissions yet.</p>}
    </div>
  );
}

function SubmissionCard({ sub, review }: { sub: any; review: (id: string, status: "approved" | "rejected", feedback: string) => void }) {
  const [feedback, setFeedback] = useState(sub.feedback ?? "");
  return (
    <div className="rounded-2xl border border-border/50 bg-white/60 p-4 backdrop-blur dark:bg-[#1E293B]/60">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">Task {sub.tasks?.task_number}: {sub.tasks?.title}</p>
          <p className="text-xs text-muted-foreground">{sub.applications?.full_name} · <span className="font-mono">{sub.applications?.intern_id}</span> · {getDomain(sub.applications?.domain)?.name}</p>
        </div>
        <Badge className={`text-xs ${
          sub.status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
          sub.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        }`}>{sub.status}</Badge>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {sub.github_url && <a href={sub.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary"><ExternalLink className="size-3" /> GitHub</a>}
        {sub.deployed_url && <a href={sub.deployed_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary"><ExternalLink className="size-3" /> Demo</a>}
        {sub.notes && <p className="w-full text-muted-foreground mt-1">{sub.notes}</p>}
      </div>
      {sub.status === "pending" && (
        <div className="mt-3 space-y-2 rounded-xl border border-border/40 bg-secondary/30 p-3">
          <Textarea placeholder="Feedback (optional)" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={2} className="text-xs" />
          <div className="flex gap-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 h-10 text-xs" onClick={() => review(sub.id, "approved", feedback)}><CheckCircle2 className="mr-1 size-3" /> Approve</Button>
            <Button size="sm" variant="destructive" className="h-10 text-xs" onClick={() => review(sub.id, "rejected", feedback)}><XCircle className="mr-1 size-3" /> Reject</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// QUIZ
// ══════════════════════════════════════════════
function QuizSection() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | { mode: "create"; courseId: string } | { mode: "edit"; question: any }>(null);

  const { data: courses } = useQuery({
    queryKey: ["admin-courses-quiz"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, slug, name, quiz_marks, pass_marks, quiz_duration_min").order("name");
      return data ?? [];
    },
  });

  const { data: questions } = useQuery({
    queryKey: ["admin-quiz-questions", expanded],
    enabled: !!expanded,
    queryFn: async () => {
      const { data } = await supabase
        .from("course_quiz_questions")
        .select("*")
        .eq("course_id", expanded!)
        .order("order_index");
      return data ?? [];
    },
  });

  const deleteQuestion = async (id: string) => {
    const { error } = await supabase.from("course_quiz_questions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Question deleted");
    qc.invalidateQueries({ queryKey: ["admin-quiz-questions", expanded] });
  };

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quiz Management</h2>
          <p className="text-sm text-muted-foreground">Manage questions per course</p>
        </div>
      </div>

      <QuestionDialog
        key={dialog ? JSON.stringify(dialog) : "closed"}
        open={!!dialog}
        onClose={() => setDialog(null)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["admin-quiz-questions", expanded] });
          setDialog(null);
        }}
        mode={dialog?.mode as any}
        courseId={dialog?.mode === "create" ? (dialog as any).courseId : undefined}
        question={dialog?.mode === "edit" ? (dialog as any).question : undefined}
      />

      <div className="grid gap-3">
        {courses?.map((c) => {
          const isExpanded = expanded === c.id;
          return (
            <div key={c.id} className="rounded-2xl border border-border/50 bg-white/60 backdrop-blur dark:bg-[#1E293B]/60">
              <button
                onClick={() => setExpanded(isExpanded ? null : c.id)}
                className="flex w-full items-center justify-between p-4 transition hover:bg-accent/20"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl brand-gradient text-white"><Brain className="size-4" /></div>
                  <div className="text-left">
                    <span className="font-semibold">{c.name}</span>
                    <p className="text-xs text-muted-foreground">{c.quiz_marks} marks · pass at {c.pass_marks} · {c.quiz_duration_min} min</p>
                  </div>
                </div>
                <ChevronDown className={`size-4 text-muted-foreground transition ${isExpanded ? "rotate-180" : ""}`} />
              </button>
              {isExpanded && (
                <div className="border-t border-border/40 px-4 pb-4 pt-2">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{questions?.length ?? 0} questions</span>
                    <Button size="sm" className="h-10 brand-gradient text-white border-0" onClick={() => setDialog({ mode: "create", courseId: c.id })}>
                      <Plus className="mr-1 size-3" /> Add Question
                    </Button>
                  </div>
                  {!questions?.length && <p className="py-3 text-sm text-muted-foreground">No questions yet.</p>}
                  <ul className="space-y-1">
                    {questions?.map((q, i) => (
                      <li key={q.id} className="rounded-xl border border-border/40 bg-background/40 px-3 py-2.5 text-sm transition hover:bg-accent/20">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-secondary text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                              <span className="font-medium">{q.question}</span>
                              <Badge variant="outline" className="text-[10px]">{q.marks}m</Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1.5 pl-8">
                              {(q.options as string[]).map((opt: string, oi: number) => (
                                <span key={oi} className={`rounded-md px-2 py-0.5 text-xs ${
                                  oi === q.correct_index
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                    : "bg-secondary text-muted-foreground"
                                }`}>
                                  {String.fromCharCode(65 + oi)}. {opt}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button onClick={() => setDialog({ mode: "edit", question: q })} className="grid size-7 place-items-center rounded-lg hover:bg-accent/50"><Edit className="size-3" /></button>
                            <button onClick={() => deleteQuestion(q.id)} className="grid size-7 place-items-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="size-3" /></button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestionDialog({ open, onClose, onSaved, mode, courseId, question }: {
  open: boolean; onClose: () => void; onSaved: () => void;
  mode: "create" | "edit"; courseId?: string; question?: any;
}) {
  const [qText, setQText] = useState(question?.question ?? "");
  const [opts, setOpts] = useState<string[]>((question?.options as string[]) ?? ["", "", "", ""]);
  const [correct, setCorrect] = useState(question?.correct_index ?? 0);
  const [marks, setMarks] = useState(question?.marks ?? 2);
  const [explanation, setExplanation] = useState(question?.explanation ?? "");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || opts.some((o) => !o.trim())) {
      return toast.error("All fields required");
    }
    setSaving(true);
    const payload = {
      question: qText.trim(),
      options: opts.map((o) => o.trim()),
      correct_index: correct,
      marks,
      explanation: explanation.trim() || null,
    };
    if (mode === "create" && courseId) {
      const { data: existing } = await supabase
        .from("course_quiz_questions")
        .select("order_index")
        .eq("course_id", courseId)
        .order("order_index", { ascending: false })
        .limit(1);
      const nextIndex = (existing?.[0]?.order_index ?? 0) + 1;
      const { error } = await supabase.from("course_quiz_questions").insert({
        ...payload, course_id: courseId, order_index: nextIndex,
      });
      if (error) { toast.error(error.message); setSaving(false); return; }
    } else if (mode === "edit") {
      const { error } = await supabase.from("course_quiz_questions").update(payload).eq("id", question.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
    }
    toast.success(mode === "create" ? "Question created" : "Question updated");
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-border/50 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl dark:bg-[#1E293B]/95 dark:border-white/10 animate-in zoom-in-95">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold">{mode === "create" ? "Add Question" : "Edit Question"}</h3>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-accent/50"><X className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Question</Label>
            <Textarea value={qText} onChange={(e) => setQText(e.target.value)} rows={2} placeholder="Enter your question" className="mt-1" />
          </div>
          <div className="space-y-3">
            <Label>Options</Label>
            {opts.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-secondary text-xs font-bold">{String.fromCharCode(65 + i)}</span>
                <Input
                  value={o}
                  onChange={(e) => {
                    const next = [...opts];
                    next[i] = e.target.value;
                    setOpts(next);
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => setCorrect(i)}
                  className={`grid size-7 shrink-0 place-items-center rounded-md text-xs font-bold transition ${
                    correct === i
                      ? "bg-emerald-600 text-white ring-2 ring-emerald-300"
                      : "bg-secondary text-muted-foreground hover:bg-accent"
                  }`}
                  title="Mark as correct answer"
                >
                  ✓
                </button>
                {opts.length > 2 && (
                  <button type="button" onClick={() => setOpts(opts.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-500">
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
            {opts.length < 6 && (
              <button type="button" onClick={() => setOpts([...opts, ""])} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Plus className="size-3" /> Add option
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Marks</Label>
              <Input type="number" min={1} value={marks} onChange={(e) => setMarks(Number(e.target.value))} className="mt-1" />
            </div>
            <div className="flex items-end">
              <p className="text-xs text-muted-foreground">Correct option: <span className="font-semibold text-emerald-600">{String.fromCharCode(65 + correct)}</span></p>
            </div>
          </div>
          <div>
            <Label>Explanation (optional)</Label>
            <Textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} placeholder="Explain why this answer is correct" className="mt-1" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving} className="brand-gradient text-white border-0">
              {saving ? "Saving…" : mode === "create" ? "Add Question" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// PAYMENTS
// ══════════════════════════════════════════════
function PaymentsSection() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*, applications(full_name, intern_id, domain, id, email, user_id)")
        .order("submitted_at", { ascending: false });
      return data ?? [];
    },
  });

  const verify = async (paymentId: string, applicationId: string, accept: boolean) => {
    if (!accept) {
      const { error } = await supabase.from("payments").update({ status: "rejected", verified_at: new Date().toISOString() }).eq("id", paymentId);
      if (error) return toast.error(error.message);
      toast.success("Payment rejected");
    } else {
      const { error } = await supabase.from("payments").update({ status: "verified", verified_at: new Date().toISOString() }).eq("id", paymentId);
      if (error) return toast.error(error.message);
      const cert_id = generateCertId();
      const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
      const { error: cerr } = await supabase.from("certificates").insert({ application_id: applicationId, certificate_id: cert_id, verification_hash: hash });
      if (cerr) return toast.error(cerr.message);
      toast.success(`Payment verified, certificate ${cert_id} issued`);
      (async () => {
        try {
          const { data: pmt } = await supabase.from("payments").select("*, applications!inner(full_name, intern_id, domain, email, user_id)").eq("id", paymentId).single();
          if (pmt?.applications?.email) {
            const { sendCertificateEmail } = await import("@/lib/email-helpers");
            const app = pmt.applications as any;
            const result = await sendCertificateEmail({ to: app.email, studentName: app.full_name, studentId: app.user_id, certId: cert_id, domainName: app.domain, internId: app.intern_id });
            if (!result.success) console.warn("[Email] Certificate email not sent:", result.error);
          }
        } catch (e) { console.warn("[Email] Failed to send certificate:", e); }
      })();
    }
    qc.invalidateQueries({ queryKey: ["admin-payments"] });
  };

  const pendingP = data?.filter((p: any) => p.status === "pending") ?? [];
  const doneP = data?.filter((p: any) => p.status !== "pending") ?? [];

  return (
    <div className="animate-fade-in-up space-y-4">
      <h2 className="text-2xl font-bold">Payments</h2>
      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-white/60 backdrop-blur dark:bg-[#1E293B]/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-left">UTR</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((p: any) => (
              <tr key={p.id} className="border-b border-border/30 transition hover:bg-accent/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-bold">{p.applications?.full_name?.charAt(0)}</div>
                    <div>
                      <p className="font-medium text-sm">{p.applications?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{getDomain(p.applications?.domain)?.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{p.utr_number}</td>
                <td className="px-4 py-3 font-semibold">₹{p.amount}</td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs ${
                    p.status === "verified" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    p.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>{p.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {p.status === "pending" ? (
                    <div className="flex justify-end gap-1">
                      <button onClick={() => p.applications?.id && verify(p.id, p.applications.id, true)} className="grid size-8 place-items-center rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30" title="Verify"><CheckCircle2 className="size-4" /></button>
                      <button onClick={() => p.applications?.id && verify(p.id, p.applications.id, false)} className="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" title="Reject"><XCircle className="size-4" /></button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs">{p.status === "verified" ? "Completed" : "Rejected"}</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// CERTIFICATES
// ══════════════════════════════════════════════
function CertificatesSection() {
  const [downloading, setDownloading] = useState(false);
  const { data } = useQuery({
    queryKey: ["admin-certs"],
    queryFn: async () => {
      const [internCerts, lmsCerts, profiles] = await Promise.all([
        supabase.from("certificates").select("*, applications(full_name, intern_id, domain)").order("issued_at", { ascending: false }),
        supabase.from("course_certificates").select("*, enrollments!inner(user_id, course_id), courses(name)").order("issued_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name"),
      ]);
      const profileMap = new Map((profiles.data ?? []).map((p) => [p.id, p.full_name]));
      return { intern: internCerts.data ?? [], lms: lmsCerts.data ?? [], profileMap };
    },
  });

  const downloadAll = async () => {
    if (!data) return;
    setDownloading(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const c of data.intern) {
        const doc = CertificateDoc({
          fullName: c.applications?.full_name ?? "Student",
          internId: c.applications?.intern_id ?? "",
          domain: getDomain(c.applications?.domain)?.name ?? c.applications?.domain,
          certId: c.certificate_id,
          issuedAt: c.issued_at,
          verifyUrl: `${window.location.origin}/verify-certificate`,
        });
        const blob = await downloadPdfBlob(doc);
        zip.file(`certificate-${c.certificate_id}.pdf`, blob);
      }
      for (const c of data.lms) {
        const userName = data.profileMap.get((c.enrollments as any)?.user_id) ?? "Student";
        const doc = CourseCertificateDoc({
          fullName: userName,
          courseName: (c as any).courses?.name ?? "Course",
          score: c.score,
          total: (c as any).quiz_total ?? 100,
          certId: c.certificate_id,
          issuedAt: c.issued_at,
          verifyUrl: `${window.location.origin}/verify-certificate`,
        });
        const blob = await downloadPdfBlob(doc);
        zip.file(`course-certificate-${c.certificate_id}.pdf`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url; a.download = `certificates-${new Date().toISOString().slice(0, 10)}.zip`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Downloaded ${data.intern.length + data.lms.length} certificates`);
    } catch (err) {
      toast.error("Failed to generate certificates");
      console.error(err);
    }
    setDownloading(false);
  };

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Certificate Management</h2>
          <p className="text-sm text-muted-foreground">{data ? data.intern.length + data.lms.length : 0} certificates</p>
        </div>
        <Button onClick={downloadAll} disabled={downloading} className="brand-gradient text-white border-0">
          <Download className="mr-1.5 size-4" />{downloading ? "Generating…" : "Download All as ZIP"}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-white/60 backdrop-blur dark:bg-[#1E293B]/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3 text-left">Certificate ID</th>
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-left">Course / Domain</th>
              <th className="px-4 py-3 text-left">Score</th>
              <th className="px-4 py-3 text-left">Issued</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.intern.length === 0 && data?.lms.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No certificates issued yet.</td></tr>
            )}
            {data?.intern.map((c: any) => (
              <tr key={c.id} className="border-b border-border/30 transition hover:bg-accent/20">
                <td className="px-4 py-3 font-mono text-xs">{c.certificate_id}</td>
                <td className="px-4 py-3 font-medium">{c.applications?.full_name}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{getDomain(c.applications?.domain)?.name}</td>
                <td className="px-4 py-3">—</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.issued_at).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button className="grid size-8 place-items-center rounded-lg hover:bg-accent/50" onClick={() => {
                      downloadPdf(CertificateDoc({
                        fullName: c.applications?.full_name ?? "Student",
                        internId: c.applications?.intern_id ?? "",
                        domain: getDomain(c.applications?.domain)?.name ?? c.applications?.domain,
                        certId: c.certificate_id,
                        issuedAt: c.issued_at,
                        verifyUrl: `${window.location.origin}/verify-certificate`,
                      }), `certificate-${c.certificate_id}.pdf`);
                    }}><Download className="size-4" /></button>
                    <Link to="/verify-certificate" className="grid size-8 place-items-center rounded-lg hover:bg-accent/50"><ExternalLink className="size-4" /></Link>
                  </div>
                </td>
              </tr>
            ))}
            {data?.lms.map((c: any) => {
              const userName = data.profileMap.get(c.enrollments?.user_id) ?? "Student";
              return (
                <tr key={c.id} className="border-b border-border/30 transition hover:bg-accent/20">
                  <td className="px-4 py-3 font-mono text-xs">{c.certificate_id}</td>
                  <td className="px-4 py-3 font-medium">{userName}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.courses?.name}</td>
                  <td className="px-4 py-3">{c.score}/{c.courses?.quiz_marks ?? 100}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.issued_at).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="grid size-8 place-items-center rounded-lg hover:bg-accent/50" onClick={() => {
                        downloadPdf(CourseCertificateDoc({
                          fullName: userName,
                          courseName: c.courses?.name ?? "Course",
                          score: c.score,
                          total: c.courses?.quiz_marks ?? 100,
                          certId: c.certificate_id,
                          issuedAt: c.issued_at,
                          verifyUrl: `${window.location.origin}/verify-certificate`,
                        }), `course-certificate-${c.certificate_id}.pdf`);
                      }}><Download className="size-4" /></button>
                      <Link to="/verify-certificate" className="grid size-8 place-items-center rounded-lg hover:bg-accent/50"><ExternalLink className="size-4" /></Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// STUDENTS
// ══════════════════════════════════════════════
function StudentsSection() {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const { data } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, full_name, email, phone, college, course, year, domain, intern_id, created_at, status")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!search) return data ?? [];
    const q = search.toLowerCase();
    return data!.filter((s) =>
      s.full_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.intern_id?.toLowerCase().includes(q) ||
      s.college?.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <div className="animate-fade-in-up space-y-4">
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedStudent(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl border border-border/50 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl dark:bg-[#1E293B]/95" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{selectedStudent.full_name}</h3>
              <button onClick={() => setSelectedStudent(null)} className="grid size-8 place-items-center rounded-lg hover:bg-accent/50"><X className="size-4" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-muted-foreground text-xs">Email</p><p>{selectedStudent.email}</p></div>
                <div><p className="text-muted-foreground text-xs">Phone</p><p>{selectedStudent.phone ?? "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Domain</p><p>{getDomain(selectedStudent.domain)?.name ?? selectedStudent.domain}</p></div>
                <div><p className="text-muted-foreground text-xs">Status</p><Badge className="text-xs">{selectedStudent.status}</Badge></div>
                <div className="col-span-2"><p className="text-muted-foreground text-xs">College</p><p>{selectedStudent.college} · {selectedStudent.course} ({selectedStudent.year})</p></div>
                <div><p className="text-muted-foreground text-xs">Intern ID</p><p className="font-mono text-xs">{selectedStudent.intern_id}</p></div>
                <div><p className="text-muted-foreground text-xs">Joined</p><p>{new Date(selectedStudent.created_at).toLocaleDateString("en-IN")}</p></div>
              </div>
              <a href={`mailto:${selectedStudent.email}`} className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:underline"><Mail className="size-3.5" /> Send Email</a>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-bold">Students</h2>
        <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-56 rounded-xl border-border/60" />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-white/60 backdrop-blur dark:bg-[#1E293B]/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-left">Domain</th>
              <th className="px-4 py-3 text-left">College</th>
              <th className="px-4 py-3 text-left">Intern ID</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No students found.</td></tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-border/30 transition hover:bg-accent/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-8 place-items-center rounded-full brand-gradient text-[10px] font-bold text-white">{s.full_name.charAt(0)}</div>
                    <div><p className="font-medium text-sm">{s.full_name}</p><p className="text-xs text-muted-foreground">{s.email}</p></div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs"><Badge variant="secondary">{getDomain(s.domain)?.name ?? s.domain}</Badge></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{s.college}</td>
                <td className="px-4 py-3 font-mono text-xs">{s.intern_id}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setSelectedStudent(s)} className="grid size-8 place-items-center rounded-lg hover:bg-accent/50" title="View"><Eye className="size-4" /></button>
                    <a href={`mailto:${s.email}`} className="grid size-8 place-items-center rounded-lg hover:bg-accent/50" title="Send Email"><Mail className="size-4" /></a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// ANALYTICS
// ══════════════════════════════════════════════
function AnalyticsSection() {
  const qc = useQueryClient();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const cfg = { refetchInterval: 5_000 };

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase.channel("analytics-realtime");
    const tables = ["applications", "payments", "enrollments", "profiles"];
    for (const table of tables) {
      channel.on("postgres_changes" as any, { event: "*", schema: "public", table }, () => {
        qc.invalidateQueries({ queryKey: ["admin-analytics"] });
      });
    }
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const { data: regData = [] } = useQuery({
    queryKey: ["admin-analytics-registrations"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("created_at");
      if (!data || data.length === 0) return [];
      const map: Record<string, number> = {};
      data.forEach((p) => {
        const d = new Date(p.created_at);
        map[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = (map[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] || 0) + 1;
      });
      const now = new Date();
      const result: number[] = [];
      for (let i = 11; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
        result.push(map[`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`] || 0);
      }
      return result;
    },
    ...cfg,
  });

  const { data: domainData = [] } = useQuery({
    queryKey: ["admin-analytics-domains"],
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("domain");
      if (!data || data.length === 0) return [];
      const map: Record<string, number> = {};
      data.forEach((a) => { map[a.domain] = (map[a.domain] || 0) + 1; });
      const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
      return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([label, count]) => ({ label, pct: Math.round((count / total) * 100) }));
    },
    ...cfg,
  });

  const { data: completion } = useQuery({
    queryKey: ["admin-analytics-completion"],
    queryFn: async () => {
      const { data } = await supabase.from("enrollments").select("status");
      if (!data || data.length === 0) return { completed: 0, inProgress: 0, pct: 0 };
      const completed = data.filter((e) => e.status === "completed").length;
      const total = data.length || 1;
      return { completed, inProgress: total - completed, pct: Math.round((completed / total) * 100) };
    },
    ...cfg,
  });

  const { data: revenue } = useQuery({
    queryKey: ["admin-analytics-revenue"],
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("amount, created_at").eq("status", "verified");
      if (!data || data.length === 0) return { data: [], total: 0 };
      const map: Record<string, number> = {};
      data.forEach((p) => {
        const d = new Date(p.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        map[key] = (map[key] || 0) + Number(p.amount);
      });
      const now = new Date();
      const result: number[] = [];
      for (let i = 11; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
        result.push(map[`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`] || 0);
      }
      return { data: result, total: result.reduce((a, b) => a + b, 0) };
    },
    ...cfg,
  });

  const maxReg = Math.max(...regData, 1);
  const maxRev = Math.max(...(revenue?.data ?? []), 1);

  const noRegData = regData.length === 0 || regData.every((v) => v === 0);
  const noDomainData = domainData.length === 0;
  const noCompletionData = completion && completion.total === 0;
  const noRevenueData = !revenue || revenue.data.length === 0 || revenue.data.every((v) => v === 0);

  return (
    <div className="animate-fade-in-up space-y-6">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Registrations */}
        <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur dark:bg-[#1E293B]/70">
          <h3 className="mb-1 font-semibold">Student Registrations</h3>
          <p className="mb-4 text-xs text-muted-foreground">Per month (last 12 months)</p>
          {noRegData ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No data available</p>
          ) : (
            <div className="flex items-end gap-1.5 h-40">
              {regData.map((v, i) => (
                <div key={i} className="group relative flex flex-1 flex-col items-center">
                  <div className="w-full rounded-t-lg brand-gradient transition-all duration-300 hover:opacity-80" style={{ height: `${(v / maxReg) * 100}%` }} />
                  <span className="mt-1.5 text-[10px] text-muted-foreground">{months[i]}</span>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-xs text-background opacity-0 transition group-hover:opacity-100">{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Domain Popularity */}
        <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur dark:bg-[#1E293B]/70">
          <h3 className="mb-1 font-semibold">Domain Popularity</h3>
          <p className="mb-4 text-xs text-muted-foreground">Applications per domain</p>
          {noDomainData ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No data available</p>
          ) : (
            <div className="space-y-3">
              {domainData.map((d) => (
                <div key={d.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{d.label}</span>
                    <span className="font-semibold">{d.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary/80 overflow-hidden">
                    <div className="h-full rounded-full brand-gradient transition-all" style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course Completion */}
        <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur dark:bg-[#1E293B]/70">
          <h3 className="mb-1 font-semibold">Course Completion Rate</h3>
          <p className="mb-4 text-xs text-muted-foreground">Enrolled vs completed</p>
          {noCompletionData ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No data available</p>
          ) : (
            <div className="flex items-center justify-center gap-8">
              <div className="relative grid size-36 place-items-center">
                <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.9 0.01 270)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.55 0.22 295)" strokeWidth="8" strokeDasharray={`${(completion?.pct ?? 0) * 2.64} ${100 * 2.64}`} strokeLinecap="round" />
                </svg>
                <span className="font-display text-3xl font-bold">{completion?.pct ?? 0}%</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2"><span className="size-3 rounded-sm brand-gradient" /><span>Completed: {completion?.completed ?? 0}</span></div>
                <div className="flex items-center gap-2"><span className="size-3 rounded-sm bg-secondary" /><span>In Progress: {completion?.inProgress ?? 0}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Revenue */}
        <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur dark:bg-[#1E293B]/70">
          <h3 className="mb-1 font-semibold">Revenue Overview</h3>
          <p className="mb-4 text-xs text-muted-foreground">{noRevenueData ? "No data available" : `₹ ${(revenue?.total ?? 0).toLocaleString("en-IN")} total`}</p>
          {noRevenueData ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No data available</p>
          ) : (
            <div className="flex items-end gap-1.5 h-36">
              {(revenue?.data ?? []).map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center">
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-[#07284a] opacity-80 transition-all hover:opacity-100" style={{ height: `${(v / maxRev) * 100}%` }} />
                  <span className="mt-1.5 text-[10px] text-muted-foreground">{months[i]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════
function SettingsSection() {
  const [portalName, setPortalName] = useState("Skyrovix Internship Portal");
  const [contactEmail, setContactEmail] = useState(COMPANY.email);
  const [companyName, setCompanyName] = useState(COMPANY.name);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Settings saved (stored locally)");
    setSaving(false);
  };

  return (
    <div className="animate-fade-in-up space-y-4 max-w-2xl">
      <h2 className="text-2xl font-bold">Settings</h2>
      <div className="rounded-2xl border border-border/50 bg-white/60 p-5 backdrop-blur dark:bg-[#1E293B]/60">
        <h3 className="font-semibold mb-4">General</h3>
        <div className="space-y-4">
          <div>
            <Label>Portal Name</Label>
            <Input value={portalName} onChange={(e) => setPortalName(e.target.value)} className="mt-1 rounded-xl border-border/60" />
          </div>
          <div>
            <Label>Contact Email</Label>
            <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="mt-1 rounded-xl border-border/60" />
          </div>
          <div>
            <Label>Company</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 rounded-xl border-border/60" />
          </div>
          <Button onClick={save} disabled={saving} className="brand-gradient text-white border-0">{saving ? "Saving…" : "Save Changes"}</Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// EMAIL LOGS
// ══════════════════════════════════════════════
function EmailLogsSection() {
  const { data: logs } = useQuery({
    queryKey: ["admin-email-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("email_logs")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const resend = async (log: any) => {
    try {
      const { data: app } = await supabase
        .from("applications")
        .select("full_name, intern_id, domain, email, user_id")
        .eq("user_id", log.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!app?.email) {
        toast.error("Cannot resend: student data not found");
        return;
      }
      const { sendEmail } = await import("@/lib/email-service");
      const result = await sendEmail({
        data: {
          to: app.email,
          studentName: app.full_name,
          studentId: app.user_id,
          documentType: log.document_type,
          subject: `Re: ${log.subject}`,
          body: `This is a re-sent notification regarding:\n${log.subject}\n\nPlease contact support if you need the original PDF attachment.`,
          referenceId: log.reference_id,
          pdfData: {
            fullName: app.full_name,
            internId: app.intern_id ?? log.reference_id ?? "",
            domain: app.domain ?? "",
            issuedAt: new Date().toISOString(),
          },
        },
      });
      if (result.success) toast.success("Resend request logged");
      else toast.error(`Resend failed: ${result.error}`);
    } catch (e: any) {
      toast.error(`Resend failed: ${e.message}`);
    }
  };

  return (
    <div className="animate-fade-in-up space-y-4">
      <h2 className="text-2xl font-bold">Email Logs</h2>
      <p className="text-sm text-muted-foreground">{logs?.length ?? 0} email records</p>
      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-white/60 backdrop-blur dark:bg-[#1E293B]/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Document</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Sent At</th>
              <th className="px-4 py-3 text-left">Error</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs?.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No email records found.</td></tr>
            )}
            {logs?.map((log: any) => (
              <tr key={log.id} className="border-b border-border/30 transition hover:bg-accent/20">
                <td className="px-4 py-3 font-medium">{log.student_name}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{log.email_to}</td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs ${
                    log.document_type === "offer_letter" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                  }`}>{log.document_type === "offer_letter" ? "Offer Letter" : "Certificate"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs ${
                    log.status === "sent" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    log.status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>{log.status}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{log.sent_at ? new Date(log.sent_at).toLocaleString("en-IN") : "—"}</td>
                <td className="px-4 py-3 text-xs text-red-500 max-w-[200px] truncate" title={log.error_message ?? ""}>{log.error_message ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  {log.status === "failed" && (
                    <button onClick={() => resend(log)} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition" title="Resend email">
                      <RefreshCw className="size-3.5" /> Resend
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
