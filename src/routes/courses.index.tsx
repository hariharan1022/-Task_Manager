import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  BookOpen, Layers, Monitor, Server, BarChart3, Brain, Palette,
  Code2, Shield, TrendingUp, Database, GraduationCap, Trophy, Clock, Star, Users, ArrowRight, CheckCircle2, Sparkles, Search,
} from "lucide-react";
import { getLocalCourseContent, getLocalCourseSlugs, getLocalTopicCount } from "@/lib/course-content";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Layers, Monitor, Server, BarChart3, Brain, Palette, Code2, Shield, TrendingUp,
};

export const Route = createFileRoute("/courses/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Courses — Skyrovix Learning Platform" },
      { name: "description", content: "Interactive courses with live code editor, topic quizzes, and verified certificates." },
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
  Beginner: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300",
  Intermediate: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300",
  Advanced: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300",
};

const COURSE_HERO: Record<string, { gradient: string; icon: string }> = {
  python: { gradient: "from-blue-600 to-cyan-500", icon: "Py" },
  java: { gradient: "from-red-600 to-orange-500", icon: "Jv" },
  html: { gradient: "from-orange-500 to-red-500", icon: "</>" },
  css: { gradient: "from-blue-500 to-[#07284a]", icon: "#" },
  javascript: { gradient: "from-yellow-500 to-amber-600", icon: "JS" },
  php: { gradient: "from-indigo-500 to-[#07284a]", icon: "PHP" },
  sql: { gradient: "from-cyan-500 to-blue-600", icon: "SQL" },
  mysql: { gradient: "from-cyan-600 to-blue-700", icon: "SQL" },
  django: { gradient: "from-green-700 to-green-500", icon: "Dj" },
  numpy: { gradient: "from-blue-600 to-indigo-500", icon: "Np" },
  pandas: { gradient: "from-indigo-600 to-purple-600", icon: "Pd" },
  scipy: { gradient: "from-teal-600 to-cyan-500", icon: "Sc" },
  matplotlib: { gradient: "from-orange-500 to-rose-500", icon: "Mp" },
};

function CoursesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const handleEnroll = async (e: React.MouseEvent, courseId: string, courseSlug: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error("Please sign in to enroll"); return; }
    if (courseId.startsWith("local-")) {
      toast.success("Content available — start learning!");
      window.location.href = `/courses/${courseSlug}`;
      return;
    }
    const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: courseId });
    if (error && error.code !== "23505") { toast.error(error.message); return; }
    toast.success("Enrolled! Start learning.");
    qc.invalidateQueries({ queryKey: ["my-enrollments"] });
    window.location.href = `/courses/${courseSlug}`;
  };

  const localSlugs = useMemo(() => getLocalCourseSlugs(), []);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, slug, name, short_description, icon, domain, total_topics, total_tasks, quiz_marks, duration_weeks, difficulty")
        .eq("is_published", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const dbCourses = (data ?? []) as CourseRow[];
      const dbSlugs = new Set(dbCourses.map((c) => c.slug));
      for (const slug of localSlugs) {
        if (!dbSlugs.has(slug)) {
          const totalTopics = getLocalTopicCount(slug);
          dbCourses.push({
            id: `local-${slug}`, slug, name: slug.charAt(0).toUpperCase() + slug.slice(1),
            short_description: "Comprehensive course content included with your learning platform.",
            icon: "Database", domain: slug, total_topics: totalTopics, total_tasks: 5,
            quiz_marks: 100, duration_weeks: 6, difficulty: "Intermediate",
          });
        }
      }
      return dbCourses;
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

  const filtered = courses?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.short_description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:py-16">
        {/* Hero */}
        <header className="mx-auto mb-10 sm:mb-14 max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-medium rounded-full border border-border/60">
            <GraduationCap className="mr-1 size-3 sm:size-3.5" /> Interactive Learning Platform
          </Badge>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight">Master Coding with Interactive Courses</h1>
          <p className="mt-3 text-muted-foreground text-sm max-w-xl mx-auto">
            Topic-wise lessons with live code editor, quizzes, and verified certificates.
          </p>
          <div className="mt-6 relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text" placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-xl border border-border/60 bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur text-sm focus:outline-none focus:ring-2 focus:ring-[#07284a]/30"
            />
          </div>
        </header>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-white/60 dark:bg-[#1E293B]/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered?.map((course) => {
              const enrolled = enrollMap.get(course.id);
              const hero = COURSE_HERO[course.slug] ?? { gradient: "from-[#07284a] to-blue-600", icon: "CD" };
              const Icon = ICONS[course.icon] ?? BookOpen;
              return (
                <Link
                  key={course.id}
                  to="/courses/$slug" params={{ slug: course.slug }}
                  className="group block rounded-2xl border border-border/50 bg-white/60 dark:bg-[#0f172a]/60 overflow-hidden transition-all card-elevated hover:card-elevated-hover"
                >
                  <div className={`h-32 bg-gradient-to-br ${hero.gradient} p-5 flex items-end justify-between`}>
                    <div>
                      <div className="text-3xl font-bold text-white/90">{hero.icon}</div>
                      <h3 className="text-lg font-bold text-white mt-1">{course.name}</h3>
                    </div>
                    <div className="grid size-10 place-items-center rounded-xl bg-white/20 backdrop-blur text-white">
                      <Icon className="size-5" />
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">{course.short_description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] border rounded-full ${DIFFICULTY_COLORS[course.difficulty] ?? ""}`}>{course.difficulty}</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1"><BookOpen className="size-3" />{course.total_topics} topics</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="size-3" />{course.duration_weeks} weeks</span>
                    </div>
                    {enrolled ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{enrolled.status === "completed" ? "Completed" : "In Progress"}</span>
                          <span className="font-semibold">{enrolled.progress_percent}%</span>
                        </div>
                        <Progress value={enrolled.progress_percent} className="h-1.5" />
                        <div className="w-full rounded-xl h-9 text-xs gap-1 bg-[#07284a] dark:bg-[#1d4ed8] text-white flex items-center justify-center font-medium shadow-sm">
                          {enrolled.status === "completed" ? <CheckCircle2 className="size-3.5" /> : <ArrowRight className="size-3.5" />}
                          {enrolled.status === "completed" ? "Completed" : "Continue Learning"}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-1">
                        <Button size="sm" className="rounded-xl h-10 text-xs gap-1 bg-[#07284a] dark:bg-[#1d4ed8] text-white border-0 shadow-sm shadow-[#07284a]/20"
                          onClick={(e) => handleEnroll(e, course.id, course.slug)}>
                          <Sparkles className="size-3.5" /> Enroll Free
                        </Button>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Trophy className="size-3" />Certificate</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {filtered?.length === 0 && !isLoading && (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="size-10 mx-auto mb-3 opacity-40" />
            <p>No courses found for "{search}"</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
