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
  Code2, Shield, TrendingUp, Database, GraduationCap, Trophy, Clock, Star, Users, ArrowRight, CheckCircle2, Sparkles, Search, Eye, RotateCcw,
} from "lucide-react";
import { getLocalCourseContent, getLocalCourseSlugs, getLocalTopicCount } from "@/lib/course-content";
import { AuroraBackground } from "@/components/AuroraBackground";
import { FadeUp } from "@/components/motion";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Layers, Monitor, Server, BarChart3, Brain, Palette, Code2, Shield, TrendingUp,
};

export const Route = createFileRoute("/courses/")({
  head: () => ({
    meta: [
      { title: "Online Courses — Learn Programming, Data Science, AI | Skyrovix" },
      { name: "description", content: "Browse industry-aligned online courses at Skyrovix. Learn Full Stack Development, Python, Java, UI/UX Design, Data Science, and more with hands-on projects and verified certificates." },
      { name: "keywords", content: "online courses, learn programming, data science course, full stack course, python course online, java course, UI UX course, AI ML course, cyber security course" },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Online Courses — Learn Programming, Data Science, AI | Skyrovix" },
      { property: "og:description", content: "Industry-aligned online courses with hands-on projects and verified certificates." },
      { property: "og:url", content: "https://skyrovix.online/courses" },
      { property: "og:image", content: "https://skyrovix.online/og-default.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Online Courses — Skyrovix" },
      { name: "twitter:image", content: "https://skyrovix.online/og-default.png" },
      { rel: "canonical", href: "https://skyrovix.online/courses" },
    ],
  }),
  component: CoursesPage,
});

export type CourseRow = {
  id: string; slug: string; name: string; short_description: string;
  icon: string; domain: string; total_topics: number; total_tasks: number;
  quiz_marks: number; duration_weeks: number; difficulty: string;
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300",
  Intermediate: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300",
  Advanced: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300",
};

const COURSE_IMAGES: Record<string, string> = {
  python: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&h=338&fit=crop&auto=format",
  java: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=338&fit=crop&auto=format",
  html: "https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=600&h=338&fit=crop&auto=format",
  css: "https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19?w=600&h=338&fit=crop&auto=format",
  javascript: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600&h=338&fit=crop&auto=format",
  php: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=338&fit=crop&auto=format",
  sql: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&h=338&fit=crop&auto=format",
  mysql: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&h=338&fit=crop&auto=format",
  django: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=338&fit=crop&auto=format",
  numpy: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=338&fit=crop&auto=format",
  pandas: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=338&fit=crop&auto=format",
  scipy: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=338&fit=crop&auto=format",
  matplotlib: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=338&fit=crop&auto=format",
  fullstack: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=338&fit=crop&auto=format",
  frontend: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=338&fit=crop&auto=format",
  backend: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=338&fit=crop&auto=format",
  datascience: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=338&fit=crop&auto=format",
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
      try {
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
      } catch {
        const fallback: CourseRow[] = localSlugs.map((slug) => ({
          id: `local-${slug}`, slug, name: slug.charAt(0).toUpperCase() + slug.slice(1),
          short_description: "Comprehensive course content included with your learning platform.",
          icon: "Database", domain: slug, total_topics: getLocalTopicCount(slug), total_tasks: 5,
          quiz_marks: 100, duration_weeks: 6, difficulty: "Intermediate",
        }));
        return fallback;
      }
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
    <div className="min-h-screen">
      <Navbar />
      <AuroraBackground>
        <section className="relative pb-6 sm:pb-10 pt-8 sm:pt-16 md:pt-24">
          <div className="mx-auto max-w-7xl px-4">
            <FadeUp className="text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#07284a]/15 bg-white/60 dark:bg-[#0f172a]/60 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-medium text-[#07284a] dark:text-[#60a5fa] shadow-sm backdrop-blur">
                <GraduationCap className="size-3 sm:size-3.5" /> Interactive Learning Platform
              </div>
              <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
                Master Coding with Interactive Courses
              </h1>
              <p className="mt-5 mx-auto max-w-2xl text-sm sm:text-base text-muted-foreground">
                Topic-wise lessons with live code editor, quizzes, and verified certificates.
              </p>
            </FadeUp>
          </div>
        </section>
      </AuroraBackground>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:py-16">
        {/* Search */}
        <div className="mx-auto max-w-md mb-10 sm:mb-14 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text" placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-xl border border-border/60 bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur text-sm focus:outline-none focus:ring-2 focus:ring-[#07284a]/30"
          />
        </div>

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
              const Icon = ICONS[course.icon] ?? BookOpen;
              return (
                <div
                  key={course.id}
                  className="group block rounded-2xl border border-border/50 bg-white/60 dark:bg-[#0f172a]/60 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5"
                >
                  {/* Banner Image */}
                  <Link to="/courses/$slug/details" params={{ slug: course.slug }} className="block relative h-36 overflow-hidden bg-gradient-to-br from-[#07284a] to-blue-900">
                    <img
                      src={COURSE_IMAGES[course.slug]}
                      alt={course.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {course.difficulty && (
                        <Badge className={`text-[10px] px-2.5 py-1 border-0 ${DIFFICULTY_COLORS[course.difficulty] ?? "bg-white/20 text-white"}`}>
                          {course.difficulty}
                        </Badge>
                      )}
                      <Badge className="bg-white/20 backdrop-blur text-white border-0 text-[10px] px-2.5 py-1">Course</Badge>
                    </div>
                  </Link>
                  {/* Content */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#07284a]/10 dark:bg-[#1d4ed8]/10 text-[#07284a] dark:text-[#60a5fa]">
                        <Icon className="size-5" />
                      </div>
                      <Link to="/courses/$slug/details" params={{ slug: course.slug }}>
                        <h3 className="text-lg font-bold transition-colors hover:text-[#07284a] dark:hover:text-[#60a5fa]">{course.name}</h3>
                      </Link>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{course.short_description}</p>
                    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><BookOpen className="size-3.5" />{course.total_topics} topics</span>
                      <span className="flex items-center gap-1"><Clock className="size-3.5" />{course.duration_weeks} weeks</span>
                      <span className="flex items-center gap-1"><Trophy className="size-3.5" />Certificate</span>
                    </div>
                    {enrolled ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{enrolled.status === "completed" ? "Completed" : "In Progress"}</span>
                          <span className="font-semibold">{enrolled.progress_percent}%</span>
                        </div>
                        <Progress value={enrolled.progress_percent} className="h-1.5" />
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1 h-10 rounded-xl text-sm gap-1.5 border-border/60" asChild>
                            <Link to="/courses/$slug/details" params={{ slug: course.slug }}>
                              <Eye className="size-4" /> View Course
                            </Link>
                          </Button>
                          <Button className="flex-1 h-10 rounded-xl text-sm gap-1.5 bg-[#07284a] hover:bg-[#07284a]/90 dark:bg-[#1d4ed8] dark:hover:bg-[#1d4ed8]/90 text-white border-0 shadow-sm" asChild>
                            <Link to={`/courses/${course.slug}`}>
                              {enrolled.status === "completed" ? <RotateCcw className="size-4" /> : <ArrowRight className="size-4" />}
                              {enrolled.status === "completed" ? "Review Course" : "Continue Learning"}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 h-10 rounded-xl text-sm gap-1.5 border-border/60" asChild>
                          <Link to="/courses/$slug/details" params={{ slug: course.slug }}>
                            <Eye className="size-4" /> View Course
                          </Link>
                        </Button>
                        <Button className="flex-1 h-10 rounded-xl text-sm gap-1.5 bg-[#07284a] hover:bg-[#07284a]/90 dark:bg-[#1d4ed8] dark:hover:bg-[#1d4ed8]/90 text-white border-0 shadow-sm transition-all hover:shadow-md hover:shadow-[#07284a]/30"
                          onClick={(e) => handleEnroll(e, course.id, course.slug)}>
                          <Sparkles className="size-4" /> Enroll Now
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
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
