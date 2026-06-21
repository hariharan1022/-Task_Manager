import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  CheckCircle2, Circle, ChevronLeft, ChevronRight, Lock, ListChecks,
  Brain, BookOpen, Award, FileText, UploadCloud, Clock, Code2,
  ArrowUpRight, ExternalLink, Sparkles, GraduationCap,
} from "lucide-react";

export const Route = createFileRoute("/courses/$slug")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} Course — Skyrovix` },
      { name: "description", content: "Topic-wise lessons, practical tasks, and a final quiz to earn your verified certificate." },
    ],
  }),
  component: CourseDetail,
});

function CourseDetail() {
  const { slug } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  
  const [currentIdx, setCurrentIdx] = useState(0);

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: topics } = useQuery({
    queryKey: ["course-topics", course?.id],
    enabled: !!course,
    queryFn: async () => {
      const { data } = await supabase.from("course_topics").select("*").eq("course_id", course!.id).order("order_index");
      return data ?? [];
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ["course-tasks", course?.id],
    enabled: !!course,
    queryFn: async () => {
      const { data } = await supabase.from("course_tasks").select("*").eq("course_id", course!.id).order("task_number");
      return data ?? [];
    },
  });

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", course?.id, user?.id],
    enabled: !!course && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("enrollments")
        .select("*")
        .eq("course_id", course!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: completedTopics } = useQuery({
    queryKey: ["lesson-progress", enrollment?.id],
    enabled: !!enrollment,
    queryFn: async () => {
      const { data } = await supabase.from("lesson_progress").select("topic_id").eq("enrollment_id", enrollment!.id);
      return new Set((data ?? []).map((r) => r.topic_id));
    },
  });

  const { data: submissions } = useQuery({
    queryKey: ["course-submissions", enrollment?.id],
    enabled: !!enrollment,
    queryFn: async () => {
      const { data } = await supabase.from("course_task_submissions").select("*").eq("enrollment_id", enrollment!.id);
      return data ?? [];
    },
  });

  const { data: attempts } = useQuery({
    queryKey: ["course-attempts", enrollment?.id],
    enabled: !!enrollment,
    queryFn: async () => {
      const { data } = await supabase.from("quiz_attempts").select("*").eq("enrollment_id", enrollment!.id).order("started_at", { ascending: false });
      return data ?? [];
    },
  });

  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = async () => {
    if (!user) {
      window.location.href = `/auth?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (!course || enrolling) return;
    setEnrolling(true);
    try {
      const { data: existing } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", course.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing) {
        toast.success("You're already enrolled — let's continue!");
        qc.invalidateQueries({ queryKey: ["enrollment", course.id, user.id] });
        qc.invalidateQueries({ queryKey: ["my-enrollments", user.id] });
        return;
      }
      const { error } = await supabase
        .from("enrollments")
        .insert({ user_id: user.id, course_id: course.id, status: "in_progress" });
      if (error) {
        console.error("Enrollment insert error:", error);
        toast.error(error.message);
        return;
      }
      toast.success(`Enrolled in ${course.name}! Start your first lesson.`);
      qc.invalidateQueries({ queryKey: ["enrollment", course.id, user.id] });
      qc.invalidateQueries({ queryKey: ["my-enrollments", user.id] });
    } catch (err) {
      console.error("Enrollment error:", err);
      toast.error(err instanceof Error ? err.message : "Enrollment failed. Try again.");
    } finally {
      setEnrolling(false);
    }
  };

  const completeTopic = async (topicId: string) => {
    if (!enrollment || !topics) return;
    const { error } = await supabase.from("lesson_progress").insert({ enrollment_id: enrollment.id, topic_id: topicId });
    if (error && !error.message.includes("duplicate")) return toast.error(error.message);
    const completedCount = (completedTopics?.size ?? 0) + 1;
    const pct = Math.min(100, Math.round((completedCount / topics.length) * 100));
    await supabase.from("enrollments").update({ progress_percent: pct, current_topic_id: topicId }).eq("id", enrollment.id);
    qc.invalidateQueries({ queryKey: ["lesson-progress", enrollment.id] });
    qc.invalidateQueries({ queryKey: ["enrollment", course?.id, user?.id] });
    qc.invalidateQueries({ queryKey: ["my-enrollments", user?.id] });
  };

  if (isLoading || authLoading) return <Loading />;
  if (!course) return <NotFound />;

  const enrolled = !!enrollment;
  const currentTopic = topics?.[currentIdx];
  const completedCount = completedTopics?.size ?? 0;
  const totalTopics = topics?.length ?? 0;
  const allLessonsDone = totalTopics > 0 && completedCount >= totalTopics;
  const approvedTasks = submissions?.filter((s) => s.status === "approved").length ?? 0;
  const submittedTasks = submissions?.length ?? 0;
  const allTasksDone = (tasks?.length ?? 0) > 0 && submittedTasks >= (tasks?.length ?? 0);
  const lastPassed = attempts?.find((a) => a.passed);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Back link */}
        <div className="mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/courses"><ChevronLeft className="mr-1 size-4" />Back to courses</Link>
          </Button>
        </div>

        {/* Course header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">{course.difficulty}</Badge>
                <Badge variant="outline" className="text-xs">{course.duration_weeks} weeks</Badge>
                <Badge variant="outline" className="text-xs">{course.total_topics} lessons</Badge>
              </div>
              <h1 className="font-display text-3xl font-bold sm:text-4xl lg:text-5xl">{course.name}</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">{course.short_description}</p>
            </div>
            {enrolled ? (
              <div className="w-full max-w-xs space-y-1.5 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Your progress</span>
                  <span className="font-semibold text-foreground">{enrollment.progress_percent}%</span>
                </div>
                <Progress value={enrollment.progress_percent} className="h-2.5" />
                <p className="text-xs text-muted-foreground">
                  {completedCount}/{totalTopics} lessons · {approvedTasks}/{tasks?.length ?? 0} tasks approved
                </p>
              </div>
            ) : (
              <Button onClick={handleEnroll} disabled={enrolling} size="lg" className="brand-gradient text-white border-0 shadow-lg shadow-primary/25">
                <Sparkles className="mr-2 size-5" />{enrolling ? "Enrolling…" : "Enroll Now — Free"}
              </Button>
            )}
          </div>
        </div>

        {/* Main layout: sidebar + content */}
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <nav className="rounded-xl border border-border bg-card p-2">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <BookOpen className="mr-1.5 inline size-3.5" />Lessons
              </p>
              <ul className="space-y-0.5">
                {topics?.map((t, i) => {
                  const done = completedTopics?.has(t.id);
                  const active = i === currentIdx;
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => setCurrentIdx(i)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                          active
                            ? "bg-primary/10 font-medium text-primary shadow-sm"
                            : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {done ? (
                          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                            <CheckCircle2 className="size-4" />
                          </span>
                        ) : (
                          <span className="grid size-5 shrink-0 place-items-center rounded-full border border-border text-muted-foreground">
                            <Circle className="size-3" />
                          </span>
                        )}
                        <span className="truncate">{t.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Quick stats */}
            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course Stats</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Lessons</span>
                  <span className="font-bold">{completedCount}/{totalTopics}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tasks</span>
                  <span className="font-bold">{approvedTasks}/{tasks?.length ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Quiz</span>
                  <span className="font-bold">{lastPassed ? `${lastPassed.score}/${lastPassed.total}` : `${course.quiz_marks} marks`}</span>
                </div>
              </div>
            </div>

            {/* Task quick-nav */}
            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ListChecks className="mr-1.5 inline size-3.5" />Tasks
              </p>
              <ul className="space-y-1">
                {(tasks ?? []).map((t) => {
                  const sub = submissions?.find((s) => s.task_id === t.id);
                  const status = sub?.status ?? "not_started";
                  return (
                    <li key={t.id} className="flex items-center gap-2 text-sm">
                      <span className={`size-1.5 shrink-0 rounded-full ${
                        status === "approved" ? "bg-emerald-500" :
                        status === "pending" ? "bg-amber-500" :
                        status === "rejected" ? "bg-red-500" : "bg-muted-foreground/30"
                      }`} />
                      <span className="truncate text-muted-foreground">Task {t.task_number}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* Main content area */}
          <div className="min-w-0">
            {/* Lesson content */}
            {currentTopic ? (
              <Card className="overflow-hidden">
                <CardHeader className="border-b border-border bg-secondary/20 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Lesson {currentIdx + 1} / {totalTopics}</Badge>
                    {completedTopics?.has(currentTopic.id) && (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
                        <CheckCircle2 className="mr-1 size-3" />Completed
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2 text-2xl">{currentTopic.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{currentTopic.content_md}</p>
                  </div>

                  {currentTopic.code_example && (
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                        <Code2 className="size-3.5" />Code Example
                      </div>
                      <div className="rounded-lg border border-border bg-[#1e1e2e] p-4 shadow-inner">
                        <pre className="overflow-x-auto text-sm leading-relaxed text-[#cdd6f4]">
                          <code>{currentTopic.code_example}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {currentTopic.key_points?.length ? (
                    <div className="rounded-lg border border-border bg-accent/40 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        <Sparkles className="mr-1.5 inline size-3.5" />Key Points
                      </p>
                      <ul className="space-y-2">
                        {currentTopic.key_points.map((kp: string, idx: number) => (
                          <li key={idx} className="flex gap-2.5 text-sm">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                            <span>{kp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentIdx === 0}
                      onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    >
                      <ChevronLeft className="mr-1 size-4" />Previous
                    </Button>
                    <div className="flex gap-2">
                      {enrolled && !completedTopics?.has(currentTopic.id) && (
                        <Button size="sm" onClick={() => completeTopic(currentTopic.id)} className="brand-gradient text-white border-0">
                          <CheckCircle2 className="mr-1.5 size-4" />Mark Complete
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={completedTopics?.has(currentTopic.id) ? "default" : "secondary"}
                        disabled={currentIdx >= totalTopics - 1}
                        onClick={() => setCurrentIdx((i) => Math.min(totalTopics - 1, i + 1))}
                      >
                        Next<ChevronRight className="ml-1 size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {!totalTopics ? "Lesson content is being prepared." : "Select a lesson from the sidebar."}
                </CardContent>
              </Card>
            )}

            {/* Tasks section */}
            <section className="mt-8">
              <div className="mb-4 flex items-center gap-2">
                <ListChecks className="size-5 text-primary" />
                <h2 className="font-display text-xl font-bold">Practical Tasks</h2>
                <Badge variant="outline" className="ml-auto">{approvedTasks}/{tasks?.length ?? 0} approved</Badge>
              </div>
              <TasksSection
                tasks={tasks ?? []}
                enrollment={enrollment}
                submissions={submissions ?? []}
                allLessonsDone={allLessonsDone}
                onEnroll={handleEnroll}
                user={user}
                onChange={() => qc.invalidateQueries({ queryKey: ["course-submissions", enrollment?.id] })}
              />
            </section>

            {/* Quiz section */}
            <section className="mt-8 mb-8">
              <div className="mb-4 flex items-center gap-2">
                <Brain className="size-5 text-primary" />
                <h2 className="font-display text-xl font-bold">Final Quiz</h2>
              </div>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                        <Brain className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Questions</p>
                        <p className="text-lg font-bold">{totalTopics > 0 ? 50 : "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        <Award className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pass marks</p>
                        <p className="text-lg font-bold">{course.pass_marks}/{course.quiz_marks}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        <Clock className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-lg font-bold">{course.quiz_duration_min} min</p>
                      </div>
                    </div>
                  </div>

                  {lastPassed ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-300">
                      <p className="flex items-center gap-2 font-semibold">
                        <Award className="size-5" />
                        Passed with {lastPassed.score} / {lastPassed.total}
                      </p>
                      <p className="mt-1 text-sm">Your certificate is ready in the dashboard.</p>
                    </div>
                  ) : !enrolled ? (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Lock className="size-4" />Enroll to unlock the quiz.
                    </p>
                  ) : !allTasksDone ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300">
                      <p className="flex items-center gap-2 font-medium">
                        <Lock className="size-4" />
                        Submit all {tasks?.length ?? 0} tasks to unlock the final quiz
                      </p>
                      <p className="mt-1 text-sm">({submittedTasks}/{tasks?.length ?? 0} submitted)</p>
                    </div>
                  ) : (
                    <Button asChild size="lg" className="brand-gradient text-white border-0 shadow-lg shadow-primary/25">
                      <Link to="/courses/$slug/quiz" params={{ slug: course.slug }}>
                        <Brain className="mr-2 size-5" />Start Final Quiz
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function TasksSection({
  tasks, enrollment, submissions, allLessonsDone, onEnroll, user, onChange,
}: {
  tasks: any[]; enrollment: any; submissions: any[]; allLessonsDone: boolean;
  onEnroll: () => void; user: any; onChange: () => void;
}) {
  if (!user) return (
    <Card><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
      <p className="text-muted-foreground">Sign in to access practical tasks.</p>
      <Button asChild><Link to="/auth">Sign in</Link></Button>
    </CardContent></Card>
  );
  if (!enrollment) return (
    <Card><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
      <p className="text-muted-foreground">Enroll to unlock practical tasks.</p>
      <Button onClick={onEnroll} className="brand-gradient text-white border-0">Enroll Now</Button>
    </CardContent></Card>
  );
  if (!tasks.length) return (
    <Card><CardContent className="pt-6 text-center text-muted-foreground">No tasks configured yet.</CardContent></Card>
  );

  return (
    <div className="space-y-4">
      {!allLessonsDone && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300">
          <span className="font-medium">Tip:</span> Finish all lessons first to get the most out of these tasks.
        </div>
      )}
      {tasks.map((t) => {
        const sub = submissions.find((s) => s.task_id === t.id);
        return <TaskRow key={t.id} task={t} sub={sub} enrollmentId={enrollment.id} onChange={onChange} />;
      })}
    </div>
  );
}

function TaskRow({ task, sub, enrollmentId, onChange }: { task: any; sub: any; enrollmentId: string; onChange: () => void }) {
  const [open, setOpen] = useState(!sub);
  const [projectUrl, setProjectUrl] = useState(sub?.project_url ?? "");
  const [notes, setNotes] = useState(sub?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!projectUrl.trim()) return toast.error("Project URL is required");
    setSaving(true);
    const payload = { enrollment_id: enrollmentId, task_id: task.id, project_url: projectUrl, notes, status: "pending" };
    const { error } = sub
      ? await supabase.from("course_task_submissions").update(payload).eq("id", sub.id)
      : await supabase.from("course_task_submissions").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(sub ? "Submission updated" : "Submitted for review");
    onChange();
    setOpen(false);
  };

  const status = sub?.status ?? "not_started";
  const badge = status === "approved"
    ? <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">Completed</Badge>
    : status === "pending"
    ? <Badge variant="secondary" className="text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40">In Review</Badge>
    : status === "rejected"
    ? <Badge variant="destructive">Needs Revision</Badge>
    : <Badge variant="outline">Pending</Badge>;

  const statusColor = status === "approved" ? "border-l-emerald-500"
    : status === "pending" ? "border-l-amber-500"
    : status === "rejected" ? "border-l-red-500"
    : "border-l-muted-foreground/20";

  return (
    <Card className={`border-l-4 ${statusColor}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task {task.task_number}</p>
            <CardTitle className="text-lg">{task.title}</CardTitle>
          </div>
          {badge}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="leading-relaxed text-foreground/90">{task.description}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {task.requirements && (
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Requirements</p>
              <p className="mt-1">{task.requirements}</p>
            </div>
          )}
          {task.due_days && (
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due</p>
              <p className="mt-1">{task.due_days} days from start</p>
            </div>
          )}
        </div>
        {sub?.feedback && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900/30 dark:bg-blue-950/30 dark:text-blue-300">
            <p className="text-xs font-semibold uppercase tracking-wider">Reviewer feedback</p>
            <p className="mt-1">{sub.feedback}</p>
          </div>
        )}

        {!open ? (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <FileText className="mr-1.5 size-4" />{sub ? "Update submission" : "Submit project"}
          </Button>
        ) : (
          <div className="space-y-3 rounded-lg border border-border bg-secondary/20 p-4">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Project URL (GitHub / live demo)</p>
              <Input
                placeholder="https://github.com/..."
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Notes (optional)</p>
              <Textarea placeholder="Any notes for the reviewer…" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={submit} disabled={saving} className="brand-gradient text-white border-0">
                <UploadCloud className="mr-1.5 size-4" />{saving ? "Saving…" : "Submit for review"}
              </Button>
              {sub && <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Loading() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">Loading course…</main>
      <Footer />
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Course not found</h1>
        <Button asChild className="mt-4"><Link to="/courses">Browse all courses</Link></Button>
      </main>
      <Footer />
    </div>
  );
}
