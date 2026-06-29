import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import ReviewSection from "@/components/ReviewSection";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { FadeUp, Reveal, ScaleIn } from "@/components/motion";
import { COURSE_DETAILS } from "@/lib/course-detail-content";
import { getLocalCourseContent } from "@/lib/course-content";
import {
  BookOpen, Layers, Monitor, Server, BarChart3, Brain, Palette,
  Code2, Shield, TrendingUp, Database, GraduationCap, Trophy, Clock, Star,
  Users, ArrowRight, CheckCircle2, Sparkles, Search, Target, Award, FileText,
  ChevronRight, ListChecks, Github, Globe, Download, RotateCcw,
  BookMarked, PlayCircle, Lightbulb, Briefcase, Wrench,
} from "lucide-react";
import type { CourseRow } from "./courses.index";
import { DIFFICULTY_COLORS } from "./courses.index";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Layers, Monitor, Server, BarChart3, Brain, Palette, Code2, Shield, TrendingUp,
};

const COURSE_IMAGES: Record<string, string> = {
  python: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1200&h=600&fit=crop&auto=format",
  java: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=600&fit=crop&auto=format",
  html: "https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=1200&h=600&fit=crop&auto=format",
  css: "https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19?w=1200&h=600&fit=crop&auto=format",
  javascript: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=1200&h=600&fit=crop&auto=format",
  php: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600&fit=crop&auto=format",
  sql: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200&h=600&fit=crop&auto=format",
  mysql: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200&h=600&fit=crop&auto=format",
  django: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600&fit=crop&auto=format",
  numpy: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop&auto=format",
  pandas: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop&auto=format",
  scipy: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop&auto=format",
  matplotlib: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop&auto=format",
  fullstack: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=600&fit=crop&auto=format",
  frontend: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop&auto=format",
  backend: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=600&fit=crop&auto=format",
  datascience: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop&auto=format",
};

const COURSE_SLUGS = Object.keys(COURSE_DETAILS);

export const Route = createFileRoute("/courses/$slug_/details")({
  component: CourseDetailsPage,
});

function CourseDetailsPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [enrolling, setEnrolling] = useState(false);

  const detail = COURSE_DETAILS[slug];
  const heroImage = COURSE_IMAGES[slug];

  const { data: course } = useQuery({
    queryKey: ["course-detail", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, slug, name, short_description, icon, domain, total_topics, total_tasks, quiz_marks, duration_weeks, difficulty")
        .eq("slug", slug)
        .single();
      return data as CourseRow | null;
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

  const enrolled = enrollments?.find((e) => e.course_id === (course?.id ?? `local-${slug}`));
  const IconComp = course ? (ICONS[course.icon] ?? BookOpen) : BookOpen;

  const { data: enrolledCount = 0 } = useQuery({
    queryKey: ["enrollment-count", course?.id],
    enabled: !!course?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("count_course_enrollments", { p_course_id: course!.id });
      if (error) return 0;
      return data ?? 0;
    },
  });

  const { data: dbTopics } = useQuery({
    queryKey: ["course-topics", course?.id, slug],
    queryFn: async () => {
      if (course?.id) {
        const { data } = await supabase
          .from("course_topics")
          .select("title, order_index")
          .eq("course_id", course.id)
          .order("order_index");
        if (data && data.length > 0) return data;
      }
      const local = getLocalCourseContent(slug);
      return local?.length ? local.map((t, i) => ({ title: t.title, order_index: i + 1 })) : null;
    },
    enabled: !!course || getLocalCourseContent(slug).length > 0,
  });

  function groupIntoModules(
    topics: { title: string }[], perModule = 5,
  ): { title: string; lessons: string[] }[] {
    const modules: { title: string; lessons: string[] }[] = [];
    for (let i = 0; i < topics.length; i += perModule) {
      modules.push({
        title: `Module ${Math.floor(i / perModule) + 1}`,
        lessons: topics.slice(i, i + perModule).map((t) => t.title),
      });
    }
    return modules;
  }

  const computedModules = useMemo(
    () => (dbTopics ? groupIntoModules(dbTopics) : []),
    [dbTopics],
  );
  const totalLessons = computedModules.reduce((a, m) => a + m.lessons.length, 0);

  const handleEnroll = async () => {
    if (!user) { toast.error("Please sign in to enroll"); return; }
    if (!course) { window.location.href = `/courses/${slug}`; return; }
    setEnrolling(true);
    const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: course.id });
    if (error && error.code !== "23505") { toast.error(error.message); setEnrolling(false); return; }
    toast.success("Enrolled! Start learning.");
    qc.invalidateQueries({ queryKey: ["my-enrollments"] });
    setEnrolling(false);
    window.location.href = `/courses/${slug}`;
  };

  if (!detail) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <BookOpen className="size-12 mx-auto text-muted-foreground/50" />
            <h2 className="text-xl font-semibold">Course details not available</h2>
            <p className="text-muted-foreground">The course you're looking for doesn't have details yet.</p>
            <Link to="/courses"><Button variant="outline">Browse Courses</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) => (
    <Card className="bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur border-border/50">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="size-10 rounded-lg bg-[#07284a]/10 dark:bg-[#1d4ed8]/10 flex items-center justify-center shrink-0">
          <Icon className="size-5 text-[#07284a] dark:text-[#60a5fa]" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  const SectionHeading = ({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="size-10 rounded-xl bg-[#07284a]/10 dark:bg-[#1d4ed8]/10 flex items-center justify-center">
        <Icon className="size-5 text-[#07284a] dark:text-[#60a5fa]" />
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#07284a] via-[#0a3a5c] to-[#0d4a6e]">
          <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 pt-20 sm:pt-28 pb-12 sm:pb-16">
          <FadeUp className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-white/20 backdrop-blur text-white border-0">Course</Badge>
              {course?.difficulty && (
                <Badge className="bg-white/20 backdrop-blur text-white border-0">{course.difficulty}</Badge>
              )}
            </div>
            <div className="flex items-start gap-4 mb-4">
              <div className="size-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <IconComp className="size-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">{course?.name ?? slug.charAt(0).toUpperCase() + slug.slice(1)}</h1>
                <p className="mt-3 text-base sm:text-lg text-white/80 max-w-2xl">{detail.tagline}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/70 mt-4">
              <span className="flex items-center gap-1.5"><Clock className="size-4" /> {course?.duration_weeks ?? 6} weeks</span>
              <span className="flex items-center gap-1.5"><BookOpen className="size-4" /> {computedModules.length} modules</span>
              <span className="flex items-center gap-1.5"><ListChecks className="size-4" /> {totalLessons} lessons</span>
              <span className="flex items-center gap-1.5"><Globe className="size-4" /> {detail.mode}</span>
              <span className="flex items-center gap-1.5"><Users className="size-4" /> {enrolledCount.toLocaleString()} enrolled</span>
            </div>
          </FadeUp>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:py-16">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-10">

          {/* ---- Main Content ---- */}
          <div className="space-y-16">

            {/* Overview */}
            <Reveal>
              <SectionHeading icon={FileText} title="Overview" />
              <p className="text-muted-foreground leading-relaxed">{detail.longDescription}</p>
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                {detail.achievements.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{a}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Separator />

            {/* Learning Outcomes */}
            <Reveal>
              <SectionHeading icon={Target} title="What You Will Learn" />
              <div className="grid sm:grid-cols-2 gap-3">
                {detail.learningOutcomes.map((o, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/60 dark:bg-[#0f172a]/60 border border-border/50">
                    <div className="size-8 rounded-lg bg-[#07284a]/10 dark:bg-[#1d4ed8]/10 flex items-center justify-center shrink-0">
                      <Lightbulb className="size-4 text-[#07284a] dark:text-[#60a5fa]" />
                    </div>
                    <span className="text-sm">{o}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Separator />

            {/* Curriculum */}
            <Reveal>
              <SectionHeading icon={BookMarked} title="Curriculum" />
              {computedModules.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-4 mb-6">
                    <Badge variant="secondary" className="text-xs px-3 py-1.5">{computedModules.length} Modules</Badge>
                    <Badge variant="secondary" className="text-xs px-3 py-1.5">{totalLessons} Lessons</Badge>
                    <Badge variant="secondary" className="text-xs px-3 py-1.5">{course?.duration_weeks ?? 6} Weeks</Badge>
                  </div>
                  <Accordion type="multiple" className="w-full">
                    {computedModules.map((mod, i) => (
                      <AccordionItem key={i} value={`mod-${i}`} className="border border-border/50 rounded-xl mb-3 px-5 bg-white/60 dark:bg-[#0f172a]/60">
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-3 text-left">
                            <div className="size-8 rounded-lg bg-[#07284a]/10 dark:bg-[#1d4ed8]/10 flex items-center justify-center text-xs font-bold text-[#07284a] dark:text-[#60a5fa]">
                              {String(i + 1).padStart(2, "0")}
                            </div>
                            <div>
                              <span className="font-semibold">{mod.title}</span>
                              <p className="text-xs text-muted-foreground mt-0.5">{mod.lessons.length} lessons</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 pb-2">
                            {mod.lessons.map((lesson, j) => (
                              <li key={j} className="flex items-center gap-2.5 text-sm text-muted-foreground pl-11">
                                <PlayCircle className="size-3.5 shrink-0" />
                                {lesson}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Curriculum content is being prepared. Check back soon!</p>
              )}
            </Reveal>

            <Separator />

            {/* Projects */}
            <Reveal>
              <SectionHeading icon={Briefcase} title="Projects You Will Build" />
              <div className="grid sm:grid-cols-2 gap-4">
                {detail.projects.map((proj, i) => (
                  <ScaleIn key={i} delay={i * 0.05}>
                    <Card className="bg-white/60 dark:bg-[#0f172a]/60 border-border/50 h-full">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold">{proj.title}</h4>
                          <Badge variant="outline" className="text-[10px]">{proj.difficulty}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{proj.description}</p>
                      </CardContent>
                    </Card>
                  </ScaleIn>
                ))}
              </div>
            </Reveal>

            <Separator />

            {/* Skills */}
            <Reveal>
              <SectionHeading icon={Wrench} title="Skills You Will Gain" />
              <div className="flex flex-wrap gap-2">
                {detail.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1.5 text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Reveal>

            <Separator />

            {/* Prerequisites */}
            <Reveal>
              <SectionHeading icon={RotateCcw} title="Prerequisites" />
              <ul className="space-y-2">
                {detail.prerequisites.map((pr, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <ChevronRight className="size-4 text-[#07284a] dark:text-[#60a5fa] shrink-0 mt-0.5" />
                    {pr}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Separator />

            {/* Benefits */}
            <Reveal>
              <SectionHeading icon={Award} title="Benefits" />
              <div className="grid sm:grid-cols-2 gap-3">
                {detail.benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{b}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Separator />

            {/* Statistics */}
            <Reveal>
              <SectionHeading icon={BarChart3} title="Course Statistics" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard icon={Clock} label="Duration" value={`${course?.duration_weeks ?? 6} weeks`} />
                <StatCard icon={BookMarked} label="Modules" value={`${computedModules.length}`} />
                <StatCard icon={ListChecks} label="Lessons" value={`${totalLessons}`} />
                <StatCard icon={Award} label="Certificate" value={detail.certificate} />
                <StatCard icon={Target} label="Difficulty" value={course?.difficulty ?? detail.skills[0] ?? "Beginner"} />
                <StatCard icon={Users} label="Enrolled" value={enrolledCount.toLocaleString()} />
              </div>
            </Reveal>

            <Separator />

            <ReviewSection targetType="course" targetId={course?.id ?? slug} />

            <Separator />

            {/* FAQ */}
            <Reveal>
              <SectionHeading icon={FileText} title="Frequently Asked Questions" />
              <Accordion type="multiple" className="w-full">
                {detail.faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-xl mb-3 px-5 bg-white/60 dark:bg-[#0f172a]/60">
                    <AccordionTrigger className="hover:no-underline py-4 text-sm font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>

          </div>

          {/* ---- Sticky Sidebar ---- */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <Card className="border-border/50 shadow-lg bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur">
                <CardContent className="p-6 space-y-5">
                  <div className="relative h-36 rounded-xl overflow-hidden bg-gradient-to-br from-[#07284a] to-blue-900">
                    <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <div className="size-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-1">
                        <IconComp className="size-5 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{course?.duration_weeks ?? 6} weeks</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Certificate</span>
                      <span className="font-medium">Yes</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mode</span>
                      <span className="font-medium">{detail.mode}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Language</span>
                      <span className="font-medium">{detail.language}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Difficulty</span>
                      <span className="font-medium">{course?.difficulty ?? "All Levels"}</span>
                    </div>
                    {enrolled && (
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground">{enrolled.status === "completed" ? "Completed" : "In Progress"}</span>
                          <span className="font-semibold">{enrolled.progress_percent}%</span>
                        </div>
                        <Progress value={enrolled.progress_percent} className="h-1.5" />
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="text-center">
                    <p className="text-2xl font-bold">Free</p>
                    <p className="text-xs text-muted-foreground mt-0.5">No cost to enroll</p>
                  </div>

                  {enrolled ? (
                    <Button className="w-full h-11 rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                      <Link to="/courses/$slug" params={{ slug }}>
                        {enrolled.status === "completed" ? <RotateCcw className="size-4" /> : <PlayCircle className="size-4" />}
                        {enrolled.status === "completed" ? "Review Course" : "Continue Learning"}
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button className="w-full h-11 rounded-xl gap-2 bg-[#07284a] hover:bg-[#07284a]/90 dark:bg-[#1d4ed8] dark:hover:bg-[#1d4ed8]/90 text-white" onClick={handleEnroll} disabled={enrolling}>
                        <Sparkles className="size-4" />
                        {enrolling ? "Enrolling..." : "Enroll Free"}
                      </Button>
                      <Button variant="outline" className="w-full h-11 rounded-xl gap-2" asChild>
                        <Link to="/courses/$slug" params={{ slug }}>
                          <Download className="size-4" /> View Curriculum
                        </Link>
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

        </div>

        {/* ---- Mobile Sticky Bar ---- */}
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur border-t border-border/50 p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{course?.name ?? slug}</p>
            <p className="text-lg font-bold">Free</p>
          </div>
          {enrolled ? (
            <Button className="h-11 rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 px-6" asChild>
              <Link to="/courses/$slug" params={{ slug }}>
                <PlayCircle className="size-4" /> Continue
              </Link>
            </Button>
          ) : (
            <Button className="h-11 rounded-xl gap-2 bg-[#07284a] hover:bg-[#07284a]/90 dark:bg-[#1d4ed8] dark:hover:bg-[#1d4ed8]/90 text-white shrink-0 px-6" onClick={handleEnroll} disabled={enrolling}>
              <Sparkles className="size-4" /> {enrolling ? "..." : "Enroll Free"}
            </Button>
          )}
        </div>

        {/* ---- Related Courses ---- */}
        <Reveal className="mt-16">
          <SectionHeading icon={GraduationCap} title="Related Courses" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COURSE_SLUGS.filter((s) => s !== slug).slice(0, 3).map((s) => {
              const d = COURSE_DETAILS[s];
              const Icon = ICONS[Object.keys(ICONS)[Math.floor(Math.random() * Object.keys(ICONS).length)]] ?? BookOpen;
              if (!d) return null;
              return (
                <Link key={s} to="/courses/$slug/details" params={{ slug: s }} className="group block rounded-2xl border border-border/50 bg-white/60 dark:bg-[#0f172a]/60 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative h-28 overflow-hidden bg-gradient-to-br from-[#07284a] to-blue-900">
                    <img src={COURSE_IMAGES[s]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-2 left-3">
                      <div className="size-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                        <Icon className="size-4 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-1.5">
                    <h4 className="font-semibold text-sm">{s.charAt(0).toUpperCase() + s.slice(1)}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{d.tagline}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Reveal>

        <div className="pb-20 lg:pb-0" />

      </main>
      <Footer />
    </div>
  );
}
