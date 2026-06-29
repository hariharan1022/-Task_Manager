import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect, type ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { CodeEditor } from "@/components/CodeEditor";
import { TopicQuiz } from "@/components/TopicQuiz";
import {
  CheckCircle2, Circle, ChevronLeft, ChevronRight, Lock, BookOpen,
  Clock, Code2, Search, Bookmark, FileText, Sparkles,
  GraduationCap, Trophy, Star, ListChecks, Brain,
  Lightbulb, Menu, X,
} from "lucide-react";
import { getLocalCourseContent } from "@/lib/course-content";

export const Route = createFileRoute("/courses/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())} Course — Learn Online | Skyrovix` },
      { name: "description", content: `Master ${params.slug.replace(/-/g, " ")} with Skyrovix's interactive online course. Topic-wise lessons, code editor, quizzes, and a verified certificate on completion.` },
      { name: "keywords", content: `${params.slug} course, learn ${params.slug} online, ${params.slug} tutorial, ${params.slug} training, Skyrovix ${params.slug}` },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())} Course — Skyrovix` },
      { property: "og:description", content: `Master ${params.slug.replace(/-/g, " ")} with interactive lessons and verified certificate.` },
      { property: "og:url", content: `https://skyrovix.online/courses/${params.slug}` },
      { property: "og:image", content: "https://skyrovix.online/og-default.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `${params.slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())} Course — Skyrovix` },
      { name: "twitter:image", content: "https://skyrovix.online/og-default.png" },
      { rel: "canonical", href: `https://skyrovix.online/courses/${params.slug}` },
    ],
  }),
  component: CourseDetail,
});

type Topic = {
  id: string; title: string; content_md: string; code_example: string | null;
  key_points: string[]; order_index: number;
};

type TopicQ = { id: string; question: string; options: string[]; correct_index: number; explanation?: string | null; topic_id: string };

function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let remaining = text;
  let idx = 0;
  const regex = /(`[^`]+`)|(\*\*[^*]+\*\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(remaining)) !== null) {
    if (match.index > last) parts.push(remaining.slice(last, match.index));
    if (match[1]) parts.push(<code key={idx++} className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">{match[1].slice(1, -1)}</code>);
    else if (match[2]) parts.push(<strong key={idx++}>{match[2].slice(2, -2)}</strong>);
    last = regex.lastIndex;
  }
  if (last < remaining.length) parts.push(remaining.slice(last));
  return parts.length ? parts : text;
}

function CourseDetail() {
  const { slug } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [topicSearch, setTopicSearch] = useState("");
  const [showQuiz, setShowQuiz] = useState(false);

  const localContent = useMemo(() => getLocalCourseContent(slug), [slug]);

  const { data: course } = useQuery({
    queryKey: ["course", slug],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle();
      if (data) return data;
      if (localContent.length > 0) {
        return { id: `local-${slug}`, slug, name: slug.charAt(0).toUpperCase() + slug.slice(1), total_topics: localContent.length, domain: slug, difficulty: "Intermediate", duration_weeks: 6, is_published: true };
      }
      return null;
    },
  });

  const { data: topics } = useQuery({
    queryKey: ["course-topics", course?.id || slug],
    enabled: !!course,
    queryFn: async () => {
      if (!course?.id?.startsWith?.("local-")) {
        const { data } = await supabase.from("course_topics").select("*").eq("course_id", course!.id).order("order_index");
        const dbTopics = (data ?? []) as Topic[];
        if (dbTopics.length > 0) {
          return dbTopics.map((t) => {
            const local = localContent.find((l) => l.order_index === t.order_index);
            if (local) {
              return { ...t, content_md: local.content_md, code_example: local.code_example ?? t.code_example };
            }
            return t;
          });
        }
      }
      return localContent.map((t) => ({
        id: `local-${t.order_index}`,
        title: t.title,
        content_md: t.content_md,
        code_example: t.code_example,
        key_points: [],
        order_index: t.order_index,
      })) as Topic[];
    },
  });

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", course?.id, user?.id],
    enabled: !!course && !!user,
    queryFn: async () => {
      const { data } = await supabase.from("enrollments").select("*")
        .eq("course_id", course!.id).eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: completedTopics } = useQuery({
    queryKey: ["lesson-progress", enrollment?.id],
    enabled: !!enrollment,
    refetchInterval: 10_000,
    queryFn: async () => {
      const { data } = await supabase.from("lesson_progress").select("topic_id").eq("enrollment_id", enrollment!.id);
      return new Set((data ?? []).map((r) => r.topic_id));
    },
  });

  const { data: topicQuizAttempts } = useQuery({
    queryKey: ["topic-quiz-attempts", enrollment?.id],
    enabled: !!enrollment,
    refetchInterval: 10_000,
    queryFn: async () => {
      const { data } = await supabase.from("topic_quiz_attempts" as any).select("topic_id, passed").eq("enrollment_id", enrollment!.id);
      return new Map((data ?? []).map((r: any) => [r.topic_id, r.passed]));
    },
  });

  const { data: topicQuestions } = useQuery({
    queryKey: ["topic-questions", topics?.map((t) => t.id)],
    enabled: !!topics?.length,
    queryFn: async () => {
      const ids = topics!.map((t) => t.id);
      const { data } = await supabase.from("topic_quiz_questions" as any).select("*").in("topic_id", ids).order("order_index");
      return (data ?? []) as unknown as TopicQ[];
    },
  });

  const { data: bookmarks } = useQuery({
    queryKey: ["my-bookmarks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("bookmarks" as any).select("topic_id").eq("user_id", user!.id);
      return new Set((data ?? []).map((r: any) => r.topic_id));
    },
  });

  const { data: userNotes } = useQuery({
    queryKey: ["my-notes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("notes" as any).select("topic_id, content").eq("user_id", user!.id);
      return new Map((data ?? []).map((r: any) => [r.topic_id, r.content]));
    },
  });

  useEffect(() => {
    if (enrollment?.current_topic_id && topics?.length) {
      const idx = topics.findIndex((t) => t.id === enrollment.current_topic_id);
      if (idx >= 0) setCurrentIdx(idx);
    }
  }, [enrollment?.current_topic_id, topics]);

  const qsByTopic = useMemo(() => {
    const m = new Map<string, TopicQ[]>();
    for (const q of topicQuestions ?? []) {
      if (!m.has(q.topic_id)) m.set(q.topic_id, []);
      m.get(q.topic_id)!.push(q);
    }
    return m;
  }, [topicQuestions]);

  const currentTopic = topics?.[currentIdx];
  const topicQs = currentTopic ? qsByTopic.get(currentTopic.id) ?? [] : [];
  const isLocked = (idx: number) => {
    if (idx === 0) return false;
    const prev = topics?.[idx - 1];
    if (!prev) return false;
    const prevQs = qsByTopic.get(prev.id) ?? [];
    if (prevQs.length === 0) return false; // Unlock if previous topic has no quiz
    const quizPassed = topicQuizAttempts?.get(prev.id);
    const completed = completedTopics?.has(prev.id);
    return !(quizPassed || completed);
  };
  const topicCompleted = (id: string) => completedTopics?.has(id);
  const topicBookmarked = (id: string) => bookmarks?.has(id);
  const topicNote = (id: string) => userNotes?.get(id) ?? "";

  const filteredTopics = useMemo(() => {
    if (!topicSearch) return topics;
    return topics?.filter((t) =>
      t.title.toLowerCase().includes(topicSearch.toLowerCase()) ||
      t.content_md.toLowerCase().includes(topicSearch.toLowerCase())
    );
  }, [topics, topicSearch]);

  const handleEnroll = async () => {
    if (!user || !course) return;
    if (course.id.startsWith?.("local-")) {
      toast.success("Content available — enrollment coming soon!");
      return;
    }
    const { error } = await supabase.from("enrollments").insert({
      user_id: user.id, course_id: course.id,
    });
    if (error && error.code !== "23505") {
      toast.error(error.message);
      return;
    }
    toast.success("Enrolled! Start learning.");
    qc.invalidateQueries({ queryKey: ["enrollment"] });
    qc.invalidateQueries({ queryKey: ["my-enrollments"] });
  };

  const markComplete = async () => {
    if (!enrollment || !currentTopic) return;
    const { error } = await supabase.from("lesson_progress").upsert({
      enrollment_id: enrollment.id, topic_id: currentTopic.id,
    }, { onConflict: "enrollment_id, topic_id" });
    if (error) { toast.error(error.message); return; }
    const pct = Math.round((((completedTopics?.size ?? 0) + 1) / (topics?.length ?? 1)) * 100);
    await supabase.from("enrollments").update({ progress_percent: pct, current_topic_id: currentTopic.id }).eq("id", enrollment.id);
    qc.invalidateQueries({ queryKey: ["lesson-progress", enrollment?.id] });
    qc.invalidateQueries({ queryKey: ["enrollment"] });
    toast.success("Topic completed!");
  };

  const toggleBookmark = async () => {
    if (!user || !currentTopic) return;
    if (topicBookmarked(currentTopic.id)) {
      await supabase.from("bookmarks" as any).delete().eq("user_id", user.id).eq("topic_id", currentTopic.id);
    } else {
      await supabase.from("bookmarks" as any).insert({ user_id: user.id, topic_id: currentTopic.id });
    }
    qc.invalidateQueries({ queryKey: ["my-bookmarks"] });
  };

  const saveNote = async (content: string) => {
    if (!user || !currentTopic) return;
    if (content.trim()) {
      await supabase.from("notes" as any).upsert({
        user_id: user.id, topic_id: currentTopic.id, content,
      }, { onConflict: "user_id, topic_id" });
    } else {
      await supabase.from("notes" as any).delete().eq("user_id", user.id).eq("topic_id", currentTopic.id);
    }
    qc.invalidateQueries({ queryKey: ["my-notes"] });
  };

  const handleQuizComplete = (score: number, total: number) => {
    if (!enrollment || !currentTopic) return;
    const passed = score >= total;
    supabase.from("topic_quiz_attempts" as any).upsert({
      enrollment_id: enrollment.id, topic_id: currentTopic.id,
      answers: {}, score, total, passed,
    }, { onConflict: "enrollment_id, topic_id" }).then(() => {
      qc.invalidateQueries({ queryKey: ["topic-quiz-attempts"] });
      if (passed) {
        markComplete();
        toast.success("Quiz passed! Topic unlocked.");
      } else {
        toast.error("Keep studying and try again!");
      }
    });
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Course not found</h1>
          <Button asChild className="mt-4"><Link to="/courses">Browse Courses</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navbar />
      <div className="flex">
        {/* Sidebar backdrop for mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        {/* ─── Topic Sidebar ─── */}
        <aside className={`fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] border-r border-border/60 bg-white/70 backdrop-blur-xl transition-all duration-300 dark:bg-[#0F172A]/90 ${
          sidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full lg:w-16 lg:translate-x-0"
        }`}>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border/60 px-3 h-12 shrink-0">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <ListChecks className="size-3.5" />
                {sidebarOpen && "Topics"}
              </span>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden grid size-7 place-items-center rounded-lg hover:bg-accent/50">
                <X className="size-3.5" />
              </button>
            </div>
            {sidebarOpen && (
              <div className="px-3 pt-2 pb-1">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                  <input
                    type="text" placeholder="Search topics..." value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                    className="w-full h-8 pl-7 pr-2 rounded-lg border border-border/40 bg-background/50 text-xs focus:outline-none focus:ring-1 focus:ring-[#07284a]/30"
                  />
                </div>
              </div>
            )}
            <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
              {(filteredTopics ?? topics)?.map((t, i) => {
                const locked = isLocked(i);
                const completed = topicCompleted(t.id);
                const bookmarked = topicBookmarked(t.id);
                const isActive = currentTopic?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => { if (!locked) { setCurrentIdx(i); setShowQuiz(false); setSidebarOpen(false); if (enrollment?.id) supabase.from("enrollments").update({ current_topic_id: t.id }).eq("id", enrollment.id); } }}
                    disabled={locked}
                    className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-left transition ${
                      isActive ? "bg-[#07284a]/10 text-[#07284a] dark:bg-[#07284a]/30 dark:text-[#07284a]/80" :
                      locked ? "opacity-40 cursor-not-allowed" :
                      "hover:bg-accent/50"
                    }`}
                  >
                    {locked ? <Lock className="size-3 shrink-0" /> :
                     completed ? <CheckCircle2 className="size-3 shrink-0 text-emerald-600" /> :
                     <Circle className="size-3 shrink-0 text-muted-foreground" />}
                    {sidebarOpen && (
                      <span className="truncate flex-1">
                        {t.title}
                        {bookmarked && <Star className="size-2.5 inline ml-1 text-amber-500" />}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            {sidebarOpen && enrollment && (
              <div className="border-t border-border/60 px-3 py-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                  <span>Progress</span>
                  <span>{enrollment.progress_percent}%</span>
                </div>
                <Progress value={enrollment.progress_percent} className="h-1.5" />
              </div>
            )}
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-16"}`}>
          {/* Course Header */}
          <div className="sticky top-14 z-20 border-b border-border/60 bg-white/70 backdrop-blur-xl dark:bg-[#0F172A]/80">
            <div className="flex items-center justify-between px-4 h-12">
              <div className="flex items-center gap-2">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="grid size-8 place-items-center rounded-lg hover:bg-accent/50">
                  <Menu className="size-4" />
                </button>
                <div className="hidden sm:flex items-center gap-2 text-xs">
                  <Link to="/courses" className="text-muted-foreground hover:text-foreground">Courses</Link>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-medium">{course.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-10 text-xs rounded-lg gap-1"
                  onClick={() => window.location.href = `/courses/${slug}/quiz`}>
                  <Trophy className="size-3.5" /> Final Quiz
                </Button>
                {!enrollment ? (
                  <Button size="sm" className="h-10 text-xs gap-1 brand-gradient text-white border-0 rounded-lg"
                    onClick={handleEnroll}>
                    <Sparkles className="size-3.5" /> Enroll Free
                  </Button>
                ) : (
                  <>
                    <Badge variant="secondary" className="text-[10px] gap-1 rounded-lg">
                      <GraduationCap className="size-3" /> {enrollment.progress_percent}%
                    </Badge>
                    {enrollment.status === "completed" && (
                      <Button size="sm" variant="outline" className="h-10 text-xs rounded-lg gap-1"
                        onClick={() => window.location.href = `/courses/${slug}/quiz`}>
                        <Trophy className="size-3.5" /> Certificate
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <main className="mx-auto max-w-4xl px-4 py-8">
            {currentTopic && (
              <div className="space-y-6">
                {/* Topic Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <BookOpen className="size-3" />
                      <span>Topic {currentTopic.order_index + 1} of {topics?.length}</span>
                    </div>
                    <h1 className="text-2xl font-bold">{currentTopic.title}</h1>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {user && (
                      <button onClick={toggleBookmark}
                        className={`grid size-8 place-items-center rounded-lg transition ${
                          topicBookmarked(currentTopic.id)
                            ? "text-amber-500 bg-amber-50 dark:bg-amber-950/30"
                            : "text-muted-foreground hover:bg-accent/50"
                        }`}
                        title={topicBookmarked(currentTopic.id) ? "Remove bookmark" : "Bookmark topic"}>
                        <Bookmark className="size-4" fill={topicBookmarked(currentTopic.id) ? "currentColor" : "none"} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                {(() => {
                  const lines = currentTopic.content_md.split("\n");
                  const elements: ReactNode[] = [];
                  let inCode = false;
                  let codeLines: string[] = [];
                  let codeLang = "";
                  for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.startsWith("```")) {
                      if (inCode) {
                        elements.push(<pre key={i} className="p-4 text-xs font-mono overflow-x-auto bg-[#1e1e1e] text-green-400 leading-relaxed rounded-xl my-3"><code>{codeLines.join("\n")}</code></pre>);
                        codeLines = [];
                        inCode = false;
                      } else {
                        inCode = true;
                        codeLang = line.slice(3).trim();
                      }
                      continue;
                    }
                    if (inCode) { codeLines.push(line); continue; }
                    if (line.startsWith("## ")) { elements.push(<h2 key={i} className="text-lg font-bold mt-6 mb-2">{line.slice(3)}</h2>); continue; }
                    if (line.startsWith("### ")) { elements.push(<h3 key={i} className="text-base font-semibold mt-4 mb-1">{line.slice(4)}</h3>); continue; }
                    if (line.match(/^- \*\*(.+?)\*\*(.*)/)) {
                      const m = line.match(/- \*\*(.+?)\*\*(.*)/);
                      if (m) { elements.push(<p key={i} className="text-sm"><strong>{m[1]}</strong>{m[2]}</p>); continue; }
                    }
                    if (line.startsWith("- ")) { elements.push(<li key={i} className="text-sm ml-4 list-disc">{renderInline(line.slice(2))}</li>); continue; }
                    if (line.trim()) { elements.push(<p key={i} className="text-sm leading-relaxed">{renderInline(line)}</p>); continue; }
                    elements.push(<div key={i} className="h-2" />);
                  }
                  return <div className="prose prose-sm dark:prose-invert max-w-none">{elements}</div>;
                })()}

                {/* Key Points */}
                {currentTopic.key_points?.length > 0 && (
                  <div className="rounded-xl border border-blue-200/50 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/30 p-4">
                    <h4 className="text-xs font-semibold flex items-center gap-1.5 mb-2"><Lightbulb className="size-3.5 text-blue-600" /> Key Points</h4>
                    <ul className="space-y-1">
                      {currentTopic.key_points.map((kp, i) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <CheckCircle2 className="size-3 mt-0.5 text-blue-600 shrink-0" />
                          <span>{kp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Interactive Code Editor */}
                {currentTopic.code_example && (
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Code2 className="size-3.5" />
                      <span>Edit the code and click <strong>Run</strong> to see the output</span>
                    </div>
                    <CodeEditor courseSlug={slug} code={currentTopic.code_example} />
                  </div>
                )}

                {/* Notes */}
                {user && (
                  <div className="rounded-xl border border-border/50 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <FileText className="size-3.5" />
                      <span>Your Notes</span>
                    </div>
                    <textarea
                      placeholder="Write your notes about this topic..."
                      value={topicNote(currentTopic.id)}
                      onChange={(e) => saveNote(e.target.value)}
                      className="w-full h-20 resize-none rounded-lg border border-border/40 bg-background/50 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#07284a]/30"
                    />
                  </div>
                )}

                {/* Topic Quiz or Fallback Complete */}
                {topicQs.length > 0 ? (
                  <div className="rounded-xl border border-border/50 p-4">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                      <Brain className="size-4 text-[#07284a]" />
                      Topic Quiz ({topicQs.length} questions)
                    </h3>
                    <TopicQuiz questions={topicQs} onComplete={handleQuizComplete} />
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/50 p-4 flex flex-col items-center justify-center gap-2 bg-emerald-500/5 text-center">
                    <CheckCircle2 className="size-8 text-emerald-500" />
                    <div>
                      <h4 className="text-sm font-semibold">No quiz for this topic</h4>
                      <p className="text-xs text-muted-foreground">You can proceed to the next lesson or mark this lesson as completed.</p>
                    </div>
                    {!topicCompleted(currentTopic.id) ? (
                      <Button size="sm" className="brand-gradient text-white border-0 rounded-lg mt-1" onClick={markComplete}>
                        Mark as Completed
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">✓ Completed</span>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                  <Button
                    variant="outline" size="sm" className="h-10 text-xs gap-1 rounded-xl"
                    disabled={currentIdx === 0}
                    onClick={() => { setCurrentIdx((i) => i - 1); setShowQuiz(false); if (enrollment?.id) supabase.from("enrollments").update({ current_topic_id: topics?.[currentIdx - 1]?.id }).eq("id", enrollment.id); }}
                  >
                    <ChevronLeft className="size-3.5" /> Previous
                  </Button>
                  <span className="text-[10px] text-muted-foreground">
                    {currentTopic.order_index + 1} / {topics?.length}
                  </span>
                  {currentIdx < (topics?.length ?? 1) - 1 ? (
                    <Button
                      size="sm" className="h-10 text-xs gap-1 rounded-xl brand-gradient text-white border-0"
                      disabled={isLocked(currentIdx + 1)}
                      onClick={() => { setCurrentIdx((i) => i + 1); setShowQuiz(false); if (enrollment?.id) supabase.from("enrollments").update({ current_topic_id: topics?.[currentIdx + 1]?.id }).eq("id", enrollment.id); }}
                    >
                      Next <ChevronRight className="size-3.5" />
                    </Button>
                  ) : (
                    <Button size="sm" className="h-10 text-xs gap-1 rounded-xl brand-gradient text-white border-0"
                      onClick={() => window.location.href = `/courses/${slug}/quiz`}>
                      <Trophy className="size-3.5" /> Final Quiz
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* No topic selected / empty state */}
            {!topics?.length && (
              <div className="text-center py-20 text-muted-foreground">
                <BookOpen className="size-10 mx-auto mb-3 opacity-40" />
                <p>No topics available yet.</p>
              </div>
            )}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
