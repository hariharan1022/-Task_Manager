import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { getDomainTasks, LINKEDIN_TASK } from "@/lib/tasks-data";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  BookOpen,
  Target,
  Sparkles,
  TrendingUp,
  Loader2,
} from "lucide-react";

const FEATURE_ICONS: Record<string, string> = {
  react: "⚛",
  node: "🚀",
  mongodb: "🗄",
  database: "🗄",
  auth: "🔐",
  responsive: "📱",
  deploy: "☁",
  api: "🔌",
  jwt: "🔑",
  tailwind: "🎨",
  crud: "📝",
  linkedin: "💼",
  network: "🤝",
  post: "📢",
  share: "📤",
};

function getFeatureIcon(feature: string): string {
  const lower = feature.toLowerCase();
  for (const [key, icon] of Object.entries(FEATURE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "▹";
}

type TaskStatus = "completed" | "ongoing" | "pending" | "overdue";

type Submission = {
  id: string;
  task_id: string;
  status: string;
  github_url: string | null;
  deployed_url: string | null;
  notes: string | null;
  feedback: string | null;
  submitted_at?: string;
};

function getTaskStatus(submission: Submission | undefined, dueDate: Date): TaskStatus {
  if (!submission) {
    const now = new Date();
    if (dueDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) return "overdue";
    return "pending";
  }
  if (submission.status === "approved") return "completed";
  return "ongoing";
}

function computeDueDate(taskNumber: number): Date {
  const d = new Date();
  if (taskNumber === 0) {
    d.setDate(d.getDate() + 3);
  } else {
    d.setDate(d.getDate() + taskNumber * 6);
  }
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function daysRemaining(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function generateId(): string {
  return `task-${Math.random().toString(36).slice(2, 9)}`;
}

/* ─────────── CONFETTI ─────────── */
function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
    }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }
    let frame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.003;
        if (p.opacity <= 0) continue;
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (alive) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
}

/* ─────────── SKELETON ─────────── */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-border/40 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="size-10 rounded-xl bg-muted" />
        <div className="h-6 w-24 rounded-full bg-muted" />
      </div>
      <div className="mt-4 h-4 w-32 rounded bg-muted" />
      <div className="mt-3 h-6 w-3/4 rounded bg-muted" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-5/6 rounded bg-muted" />
      </div>
      <div className="mt-4 h-3 w-1/3 rounded bg-muted" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-2/3 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
      </div>
      <div className="mt-4 h-10 w-full rounded-xl bg-muted" />
    </div>
  );
}

/* ─────────── MAIN COMPONENT ─────────── */
export function TasksSection({
  domainSlug,
  submissions: rawSubmissions,
  appId,
  onChange,
}: {
  domainSlug: string;
  submissions: Submission[];
  appId: string;
  onChange: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [sort, setSort] = useState<"default" | "due" | "number">("default");
  const [showSort, setShowSort] = useState(false);
  const [confettiTask, setConfettiTask] = useState<string | null>(null);
  const [taskIdMap, setTaskIdMap] = useState<Record<number, string>>({});
  const [tasksReady, setTasksReady] = useState(false);

  const domainData = getDomainTasks(domainSlug);
  const allTasks = domainData?.tasks ?? [];

  // Fetch task IDs from DB
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("tasks").select("id, task_number").eq("domain", domainSlug);
      if (cancelled) return;
      const map: Record<number, string> = {};
      for (const t of data ?? []) map[t.task_number] = t.id;
      if (!cancelled) { setTaskIdMap(map); setTasksReady(true); }
    })();
    return () => { cancelled = true; };
  }, [domainSlug]);

  const tasksWithMeta = useMemo(() => {
    const linkedinId = taskIdMap[0] ?? `${domainSlug}-0`;
    const linkedinSub = linkedinId
      ? rawSubmissions.find((s) => s.task_id === linkedinId)
      : undefined;
    const linkedinDue = computeDueDate(1);
    const linkedinStatus = getTaskStatus(linkedinSub, linkedinDue);
    const linkedinMeta = {
      ...LINKEDIN_TASK,
      id: linkedinId,
      submission: linkedinSub,
      dueDate: linkedinDue,
      status: linkedinStatus,
      remaining: daysRemaining(linkedinDue),
    };
    const linkedinDone = linkedinStatus === "completed";

    const domainTasks = allTasks.map((t) => {
      const id = taskIdMap[t.taskNumber] ?? `${domainSlug}-${t.taskNumber}`;
      const sub = rawSubmissions.find((s) => s.task_id === id);
      const dueDate = computeDueDate(t.taskNumber);
      const status = getTaskStatus(sub, dueDate);
      const remaining = daysRemaining(dueDate);
      return {
        ...t,
        id,
        submission: sub,
        dueDate,
        status,
        remaining,
        lockedByLinkedin: !linkedinDone,
      };
    });

    return [linkedinMeta, ...domainTasks];
  }, [allTasks, rawSubmissions, taskIdMap, domainSlug]);

  const stats = useMemo(() => {
    const completed = tasksWithMeta.filter((t) => t.status === "completed").length;
    const ongoing = tasksWithMeta.filter((t) => t.status === "ongoing").length;
    const pending = tasksWithMeta.filter((t) => t.status === "pending").length;
    const overdue = tasksWithMeta.filter((t) => t.status === "overdue").length;
    const total = tasksWithMeta.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, ongoing, pending, overdue, rate };
  }, [tasksWithMeta]);

  const filtered = useMemo(() => {
    let items = [...tasksWithMeta];
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      );
    }
    if (filter !== "all") items = items.filter((t) => t.status === filter);
    if (sort === "due") items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    else if (sort === "number") items.sort((a, b) => a.taskNumber - b.taskNumber);
    return items;
  }, [tasksWithMeta, search, filter, sort]);

  const handleChange = useCallback(() => {
    onChange();
  }, [onChange]);

  return (
    <div className="relative">
      <Confetti active={!!confettiTask} />

      {/* Floating BG blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="absolute -right-32 top-1/3 size-80 rounded-full bg-purple-400/10 blur-[100px]" />
        <div className="absolute -bottom-40 left-1/3 size-72 rounded-full bg-emerald-400/10 blur-[90px]" />
      </div>

      {/* Progress Summary */}
      <div className="sticky top-0 z-20 -mx-4 mb-8 rounded-2xl border border-border/40 bg-white/80 px-6 py-5 shadow-lg backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-primary to-primary/70 p-2.5 text-white shadow-sm">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{domainData?.name} Tasks</p>
              <p className="text-xs text-muted-foreground">
                {stats.completed}/{stats.total} completed
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <StatItem label="Total" value={stats.total} color="text-foreground" />
            <StatItem label="Done" value={stats.completed} color="text-green-600" />
            <StatItem label="In Progress" value={stats.ongoing} color="text-blue-600" />
            <StatItem label="Pending" value={stats.pending} color="text-orange-600" />
            {stats.overdue > 0 && (
              <StatItem label="Overdue" value={stats.overdue} color="text-red-600" />
            )}
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5 font-medium">
              <Sparkles className="size-3.5 text-primary" />
              <span>{stats.rate}%</span>
            </div>
          </div>
        </div>
        {/* Mini progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-primary to-green-500 transition-all duration-700 ease-out"
            style={{ width: `${stats.rate}%` }}
          />
        </div>
      </div>

      {/* Search + Filter + Sort */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="h-10 rounded-xl border-border/60 bg-white pl-9 text-sm shadow-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-white p-1 shadow-sm">
          {(["all", "completed", "ongoing", "pending", "overdue"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === f
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-white px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm transition hover:text-foreground"
          >
            <ArrowUpDown className="size-3.5" /> Sort
          </button>
          {showSort && (
            <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-xl border border-border/60 bg-white shadow-lg">
              {(["default", "due", "number"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSort(s);
                    setShowSort(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-xs transition hover:bg-muted/40 ${
                    sort === s
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {s === "default" ? "Default" : s === "due" ? "Due Date" : "Task Number"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-white/50 py-16 text-center">
          <Search className="mx-auto size-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">No tasks match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((task) => (
              <TaskCard
              key={task.id}
              task={task}
              domain={domainData}
              appId={appId}
              tasksReady={tasksReady}
              onSubmitted={() => {
                handleChange();
                if (task.submission?.status !== "approved") {
                  setConfettiTask(task.id);
                  setTimeout(() => setConfettiTask(null), 3000);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

/* ─────────── TASK CARD ─────────── */
function TaskCard({
  task,
  domain,
  appId,
  tasksReady,
  onSubmitted,
}: {
  task: {
    id: string;
    taskNumber: number;
    title: string;
    description: string;
    features: string[];
    outcome: string;
    submission: Submission | undefined;
    dueDate: Date;
    status: TaskStatus;
    remaining: number;
    lockedByLinkedin?: boolean;
  };
  domain: { slug: string; name: string; icon: string; color: string } | undefined;
  appId: string;
  tasksReady: boolean;
  onSubmitted: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { submission, status, dueDate, remaining, lockedByLinkedin } = task;
  const isOverdue = status === "overdue";
  const isLocked = lockedByLinkedin && task.taskNumber > 0;

  const borderColor = isOverdue
    ? "#EF4444"
    : status === "completed"
      ? "#16A34A"
      : status === "ongoing"
        ? "#2563EB"
        : "#D97706";

  const glowColor = isOverdue
    ? "#EF4444"
    : status === "completed"
      ? "#22C55E"
      : status === "ongoing"
        ? "#3B82F6"
        : "#F59E0B";

  const progressPct = status === "completed" ? 100 : status === "ongoing" ? 60 : isOverdue ? 0 : 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return toast.error("You must be logged in");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(task.id)) return toast.error("Task is still being prepared, please wait…");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const githubUrl = String(fd.get("github_url") || "");
    const pdfFile = fd.get("pdf") as File | null;
    const screenshotFile = fd.get("screenshot") as File | null;
    const notes = String(fd.get("notes") || "");

    if (!githubUrl && !pdfFile?.size && !screenshotFile?.size)
      return toast.error("Provide at least a GitHub link, a project PDF, or a screenshot"), setLoading(false);

    let pdfUrl = "";
    let screenshotUrl = "";

    if (pdfFile?.size) {
      const path = `${user.id}/${task.id}/${Date.now()}_${pdfFile.name}`;
      const { data: upload, error: uploadErr } = await supabase.storage.from("task-submissions").upload(path, pdfFile);
      if (uploadErr) { setLoading(false); return toast.error("Failed to upload PDF: " + uploadErr.message); }
      const { data: pub } = supabase.storage.from("task-submissions").getPublicUrl(upload.path);
      pdfUrl = pub.publicUrl;
    }

    if (screenshotFile?.size) {
      const path = `${user.id}/${task.id}/${Date.now()}_${screenshotFile.name}`;
      const { data: upload, error: uploadErr } = await supabase.storage.from("task-submissions").upload(path, screenshotFile);
      if (uploadErr) { setLoading(false); return toast.error("Failed to upload screenshot: " + uploadErr.message); }
      const { data: pub } = supabase.storage.from("task-submissions").getPublicUrl(upload.path);
      screenshotUrl = pub.publicUrl;
    }

    const payload: Record<string, any> = {
      application_id: appId,
      task_id: task.id,
      github_url: githubUrl,
      deployed_url: String(fd.get("deployed_url") || ""),
      notes,
      status: "pending" as const,
    };
    if (pdfUrl) payload.pdf_url = pdfUrl;
    if (screenshotUrl) payload.screenshot_url = screenshotUrl;
    const { error } = submission
      ? await supabase
          .from("submissions")
          .update({ ...payload, submitted_at: new Date().toISOString() })
          .eq("id", submission.id)
      : await supabase.from("submissions").insert(payload);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Task submitted for review!");
    setOpen(false);
    onSubmitted();
  };

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05),0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08),0_20px_48px_rgba(0,0,0,0.12)] ${
        isLocked ? "opacity-60 pointer-events-none" : ""
      }`}
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      {/* Hover glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: `0 0 60px ${glowColor}25, inset 0 0 60px ${glowColor}08` }}
      />

      {/* Progress bar at top */}
      <div className="h-1.5 w-full overflow-hidden bg-muted/30">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${glowColor}99, ${glowColor})`,
          }}
        />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white shadow-sm text-sm"
            style={{
              backgroundImage: `linear-gradient(135deg, ${domain?.color?.split(" ")[0]?.replace("from-", "") || "#7C3AED"}, ${domain?.color?.split(" ")[1]?.replace("to-", "") || "#6D28D9"})`,
            }}
          >
            {task.taskNumber}
          </div>
          <span className="rounded-lg bg-muted/60 px-2 py-1 text-[10px] font-medium text-muted-foreground">
            {domain?.icon}
          </span>
        </div>
        <StatusPill status={status} isOverdue={isOverdue} />
      </div>

      {/* Due Date */}
      <div className="mt-3 flex items-center gap-1.5 px-5 text-xs text-muted-foreground">
        <CalendarDays className="size-3.5" />
        <span>Due: {formatDate(dueDate)}</span>
        {status !== "completed" && remaining <= 3 && remaining >= 0 && (
          <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
            {remaining === 0 ? "Today" : `${remaining} day${remaining > 1 ? "s" : ""} left`}
          </span>
        )}
        {status === "completed" && submission?.submitted_at && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-green-600">
            <CheckCircle2 className="size-3" /> Submitted on time
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="mt-3 line-clamp-2 px-5 text-lg font-bold leading-snug transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent">
        {task.title}
      </h3>

      {/* Description */}
      <p className="mt-2 line-clamp-3 px-5 text-sm leading-relaxed text-muted-foreground">
        {task.description}
      </p>

      {/* Key Features */}
      <div className="mt-5 px-5">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 uppercase tracking-wider">
          <BookOpen className="size-3.5" /> Key Features
        </h4>
        <ul className="mt-2.5 space-y-1.5">
          {task.features.slice(0, 5).map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="shrink-0 text-sm">{getFeatureIcon(f)}</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Expected Outcome */}
      <div className="mt-5 px-5">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-green-600 uppercase tracking-wider">
          <Target className="size-3.5" /> Expected Outcome
        </h4>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{task.outcome}</p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="mt-6 border-t border-border/40 px-5 py-4">
        {status === "completed" ? (
          <div className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 ring-1 ring-green-200/60">
            <div className="flex size-8 items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-700">Completed Successfully</p>
              {submission?.submitted_at && (
                <p className="text-xs text-green-600">
                  Submitted on {formatDate(new Date(submission.submitted_at))}
                </p>
              )}
            </div>
          </div>
        ) : isLocked ? (
          <p className="text-center text-xs text-muted-foreground py-2">
            Complete the LinkedIn post task first to unlock.
          </p>
        ) : (
          <div className="space-y-3">
            {submission?.status === "rejected" && submission.feedback && (
              <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-3">
                <p className="mb-1 text-xs font-semibold text-red-700">Feedback</p>
                <p className="text-xs text-red-600">{submission.feedback}</p>
              </div>
            )}
            {!tasksReady ? (
              <Button disabled className="w-full text-sm h-10 rounded-xl opacity-60">
                <Loader2 className="mr-1.5 size-4 animate-spin" /> Syncing tasks…
              </Button>
            ) : (
              <Button
                onClick={() => setOpen(!open)}
                className="w-full text-sm h-10 rounded-xl"
                variant={status === "ongoing" ? "outline" : isOverdue ? "destructive" : "default"}
              >
                {status === "ongoing" ? (
                  <>
                    <ArrowRight className="mr-1.5 size-4" /> Continue Working
                  </>
                ) : isOverdue ? (
                  <>
                    <Clock className="mr-1.5 size-4" /> Submit Late
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-1.5 size-4" /> Submit Task
                  </>
                )}
              </Button>
            )}
            {open && (
              <form
                onSubmit={handleSubmit}
                className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-4"
              >
                {task.taskNumber === 0 ? (
                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      LinkedIn Post URL
                    </Label>
                    <Input
                      name="deployed_url"
                      type="url"
                      className="mt-1 h-9 text-sm"
                      defaultValue={submission?.deployed_url ?? ""}
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <Label className="text-[11px] font-medium text-muted-foreground">
                        GitHub Repo Link <span className="text-muted-foreground/60">(optional)</span>
                      </Label>
                      <Input
                        name="github_url"
                        type="url"
                        className="mt-1 h-9 text-sm"
                        defaultValue={submission?.github_url ?? ""}
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-medium text-muted-foreground">
                        Project PDF <span className="text-muted-foreground/60">(optional)</span>
                      </Label>
                      <Input
                        name="pdf"
                        type="file"
                        accept=".pdf"
                        className="mt-1 h-9 text-sm file:h-full file:border-0 file:bg-primary/10 file:px-3 file:text-xs file:font-medium file:text-primary"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-medium text-muted-foreground">
                        Screenshot <span className="text-muted-foreground/60">(optional)</span>
                      </Label>
                      <Input
                        name="screenshot"
                        type="file"
                        accept="image/*"
                        className="mt-1 h-9 text-sm file:h-full file:border-0 file:bg-primary/10 file:px-3 file:text-xs file:font-medium file:text-primary"
                      />
                    </div>
                  </>
                )}
                <div>
                  <Label className="text-[11px] font-medium text-muted-foreground">Notes</Label>
                  <Textarea
                    name="notes"
                    rows={3}
                    className="mt-1 text-sm"
                    defaultValue={submission?.notes ?? ""}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/70 text-center">
                  Provide at least one: GitHub link, project PDF, or screenshot
                </p>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl brand-gradient text-white border-0"
                >
                  {loading ? "Submitting…" : "Submit for Review"}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────── STATUS PILL ─────────── */
function StatusPill({ status, isOverdue }: { status: TaskStatus; isOverdue: boolean }) {
  const config = isOverdue
    ? {
        label: "Overdue",
        bg: "rgba(239,68,68,0.12)",
        color: "#DC2626",
        border: "#FCA5A5",
        icon: AlertCircle,
      }
    : status === "completed"
      ? {
          label: "Completed",
          bg: "rgba(22,163,74,0.12)",
          color: "#16A34A",
          border: "#86EFAC",
          icon: CheckCircle2,
        }
      : status === "ongoing"
        ? {
            label: "In Progress",
            bg: "rgba(37,99,235,0.12)",
            color: "#2563EB",
            border: "#93C5FD",
            icon: Clock,
          }
        : {
            label: "Pending",
            bg: "rgba(217,119,6,0.12)",
            color: "#D97706",
            border: "#FCD34D",
            icon: AlertCircle,
          };

  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold backdrop-blur-sm transition-all duration-300"
      style={{ backgroundColor: config.bg, color: config.color, borderColor: config.border }}
    >
      <Icon className="size-3" />
      {config.label}
    </span>
  );
}
