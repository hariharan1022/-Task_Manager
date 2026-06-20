import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  BookOpen, Layers, Monitor, Server, BarChart3, Brain, Palette,
  Code2, Shield, TrendingUp, ListChecks, GraduationCap, Trophy,
  Clock, Star, Users, ArrowRight,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Layers, Monitor, Server, BarChart3, Brain, Palette, Code2, Shield, TrendingUp,
};

export const Route = createFileRoute("/courses")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Courses & LMS — Skyrovix Internship Portal" },
      { name: "description", content: "Premium learning paths with topic-wise lessons, hands-on tasks, a final quiz and a verified certificate." },
    ],
  }),
  component: CoursesPage,
});

type CourseRow = {
  id: string; slug: string; name: string; short_description: string;
  icon: string; domain: string; total_topics: number; total_tasks: number;
  quiz_marks: number; duration_weeks: number; difficulty: string;
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Intermediate: "bg-amber-100 text-amber-700 border-amber-200",
  Advanced: "bg-red-100 text-red-700 border-red-200",
};

function CoursesPage() {
  const { user } = useAuth();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, slug, name, short_description, icon, domain, total_topics, total_tasks, quiz_marks, duration_weeks, difficulty")
        .eq("is_published", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CourseRow[];
    },
  });

  const { data: enrollments } = useQuery({
    queryKey: ["my-enrollments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("enrollments")
        .select("course_id, progress_percent, status")
        .eq("user_id", user!.id);
      return data ?? [];
    },
  });

  const enrollMap = new Map(enrollments?.map((e) => [e.course_id, e]) ?? []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <header className="mx-auto mb-12 max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-xs">
            <GraduationCap className="mr-1 size-3.5" /> Learning Management System
          </Badge>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Courses & <span className="brand-text">Learning Paths</span>
          </h1>
          <p className="mt-4 text-balance text-muted-foreground sm:text-lg">
            Pick a domain, learn topic-by-topic with code examples, complete 5 practical tasks, pass the final quiz, and earn a verified Skyrovix certificate.
          </p>
        </header>

        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-gradient-to-br from-purple-50 to-white p-5 dark:from-purple-950/20 dark:to-background">
            <div className="flex items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                <BookOpen className="size-5" />
              </div>
              <div>
                <p className="font-semibold">Topic Lessons</p>
                <p className="text-sm text-muted-foreground">Bite-sized, code-first explanations</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-gradient-to-br from-blue-50 to-white p-5 dark:from-blue-950/20 dark:to-background">
            <div className="flex items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                <ListChecks className="size-5" />
              </div>
              <div>
                <p className="font-semibold">5 Practical Tasks</p>
                <p className="text-sm text-muted-foreground">Build portfolio-ready projects</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-gradient-to-br from-emerald-50 to-white p-5 dark:from-emerald-950/20 dark:to-background">
            <div className="flex items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <Trophy className="size-5" />
              </div>
              <div>
                <p className="font-semibold">Verified Certificate</p>
                <p className="text-sm text-muted-foreground">Auto-issued on passing the final quiz</p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="flex flex-col gap-4 pt-6">
                  <div className="h-12 w-12 rounded-xl bg-muted" />
                  <div className="h-5 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-12 rounded bg-muted" />
                    <div className="h-12 rounded bg-muted" />
                    <div className="h-12 rounded bg-muted" />
                    <div className="h-12 rounded bg-muted" />
                  </div>
                  <div className="h-9 w-full rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses?.map((c) => {
              const Icon = ICONS[c.icon] ?? BookOpen;
              const e = enrollMap.get(c.id);
              const enrolled = !!e;
              const completed = e?.status === "completed";
              const diffColor = DIFFICULTY_COLORS[c.difficulty] ?? "bg-secondary text-muted-foreground border-border";
              return (
                <Card key={c.id} className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <CardContent className="flex h-full flex-col gap-4 pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid size-14 shrink-0 place-items-center rounded-2xl brand-gradient text-white shadow-lg shadow-primary/20">
                        <Icon className="size-7" />
                      </div>
                      <Badge className={`shrink-0 border text-xs font-medium ${diffColor}`}>{c.difficulty}</Badge>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-xl font-bold leading-tight">{c.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{c.short_description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-secondary/30 p-3.5 text-xs">
                      <div className="flex flex-col"><span className="text-muted-foreground">Topics</span><span className="font-bold">{c.total_topics}</span></div>
                      <div className="flex flex-col"><span className="text-muted-foreground">Tasks</span><span className="font-bold">{c.total_tasks}</span></div>
                      <div className="flex flex-col"><span className="text-muted-foreground">Quiz</span><span className="font-bold">{c.quiz_marks} Marks</span></div>
                      <div className="flex flex-col"><span className="text-muted-foreground">Duration</span><span className="font-bold">{c.duration_weeks} Weeks</span></div>
                    </div>

                    {enrolled && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-bold">{e?.progress_percent ?? 0}%</span>
                        </div>
                        <Progress value={e?.progress_percent ?? 0} className="h-2" />
                      </div>
                    )}

                    <div className="mt-auto pt-1">
                      <Button
                        asChild
                        className={enrolled ? "w-full" : "w-full brand-gradient text-white border-0"}
                        variant={enrolled ? "secondary" : "default"}
                      >
                        <Link to="/courses/$slug" params={{ slug: c.slug }}>
                          {completed ? "Review Course" : enrolled ? "Continue Learning" : "Enroll Now"}
                          <ArrowRight className="ml-1 size-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
