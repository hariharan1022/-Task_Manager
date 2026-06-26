import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ReviewSection from "@/components/ReviewSection";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { DOMAINS, getDomain } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import { FadeUp, Reveal, ScaleIn } from "@/components/motion";
import { INTERNSHIP_DETAILS } from "@/lib/internship-detail-content";
import { getDomainTasks, getTasksByDuration } from "@/lib/tasks-data";
import {
  BookOpen, GraduationCap, Trophy, Clock, Star, BarChart3,
  Users, ArrowRight, CheckCircle2, Sparkles, Target, Award, FileText,
  ChevronRight, ListChecks, Globe, Download,
  BookMarked, PlayCircle, Lightbulb, Briefcase, Wrench, MapIcon, Shield,
} from "lucide-react";

const DOMAIN_IMAGES: Record<string, string> = {
  fullstack: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=600&fit=crop&auto=format",
  frontend: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop&auto=format",
  backend: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=600&fit=crop&auto=format",
  datascience: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop&auto=format",
  aiml: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop&auto=format",
  uiux: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=600&fit=crop&auto=format",
  python: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1200&h=600&fit=crop&auto=format",
  java: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=600&fit=crop&auto=format",
  cybersecurity: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=600&fit=crop&auto=format",
  digitalmarketing: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop&auto=format",
};

const INTERN_SLUGS = DOMAINS.map((d) => d.slug);

export const Route = createFileRoute("/domains/$slug")({
  ssr: false,
  head: ({ params }) => {
    const d = getDomain(params.slug);
    return { meta: [{ title: `${d?.name ?? "Domain"} Internship — Skyrovix` }, { name: "description", content: d?.description ?? "Skyrovix internship domain." }] };
  },
  component: InternshipDetailsPage,
});

function InternshipDetailsPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);

  const domain = getDomain(slug);
  const detail = INTERNSHIP_DETAILS[slug];
  const heroImage = DOMAIN_IMAGES[slug];

  const { data: userApplication } = useQuery({
    queryKey: ["my-application-duration", slug],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("applications")
        .select("duration")
        .eq("user_id", user.id)
        .eq("domain", slug)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const taskRoadmap = useMemo(() => {
    const tasks = userApplication?.duration
      ? getTasksByDuration(slug, userApplication.duration)
      : (getDomainTasks(slug)?.tasks ?? []);
    return tasks.map((task) => ({
      title: task.title,
      milestones: [...task.features, `Outcome: ${task.outcome}`],
    }));
  }, [slug, userApplication]);

  const { data: internCount = 0 } = useQuery({
    queryKey: ["intern-count", slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("count_domain_applications", { p_domain: slug });
      if (error) return 0;
      return data ?? 0;
    },
  });

  if (!detail || !domain) throw notFound();

  const handleApply = () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    navigate({ to: "/domains", search: { apply: slug } as any });
  };

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
      <section className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${domain.color}`}>
          <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 pt-20 sm:pt-28 pb-12 sm:pb-16">
          <FadeUp className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-white/20 backdrop-blur text-white border-0">Internship</Badge>
              <Badge className="bg-white/20 backdrop-blur text-white border-0">Remote</Badge>
            </div>
            <div className="flex items-start gap-4 mb-4">
              <div className="size-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold text-white shrink-0">{domain.icon}</div>
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">{domain.name} Internship</h1>
                <p className="mt-3 text-base sm:text-lg text-white/80 max-w-2xl">{detail.tagline}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/70 mt-4">
              <span className="flex items-center gap-1.5"><Clock className="size-4" /> {detail.duration}</span>
              <span className="flex items-center gap-1.5"><Globe className="size-4" /> {detail.mode}</span>
              <span className="flex items-center gap-1.5"><Users className="size-4" /> {internCount.toLocaleString()} interns</span>
              <span className="flex items-center gap-1.5"><FileText className="size-4" /> Certificate & Offer Letter</span>
            </div>
          </FadeUp>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:py-16">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-10">
          <div className="space-y-16">
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
            <Reveal>
              <SectionHeading icon={Shield} title="Your Responsibilities" />
              <div className="grid sm:grid-cols-2 gap-3">
                {detail.responsibilities.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/60 dark:bg-[#0f172a]/60 border border-border/50">
                    <div className="size-8 rounded-lg bg-[#07284a]/10 dark:bg-[#1d4ed8]/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    </div>
                    <span className="text-sm">{r}</span>
                  </div>
                ))}
              </div>
            </Reveal>
            <Separator />
            <Reveal>
              <SectionHeading icon={MapIcon} title="Internship Roadmap" />
              <div className="flex flex-wrap gap-3 mb-6">
                {[
                  { months: 1, tasks: 5, label: "Foundation", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300" },
                  { months: 2, tasks: 8, label: "Advanced", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300" },
                  { months: 3, tasks: 10, label: "Portfolio", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300" },
                  { months: 6, tasks: 12, label: "Capstone", color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300" },
                ].map((tier) => (
                  <div key={tier.months} className={`rounded-lg border px-3 py-2 text-xs ${tier.color}`}>
                    <span className="font-semibold">{tier.label}</span>
                    <span className="ml-1.5 opacity-80">· {tier.months}M · {tier.tasks} tasks</span>
                  </div>
                ))}
              </div>
              {taskRoadmap.length > 0 ? (
                <div className="space-y-2">
                  {taskRoadmap.map((phase, i) => {
                    const tier = i < 5 ? 1 : i < 8 ? 2 : i < 10 ? 3 : 4;
                    const tierMeta = [
                      { label: "Foundation", color: "border-emerald-400 bg-emerald-500" },
                      { label: "Advanced", color: "border-blue-400 bg-blue-500" },
                      { label: "Portfolio", color: "border-amber-400 bg-amber-500" },
                      { label: "Capstone", color: "border-purple-400 bg-purple-500" },
                    ][tier - 1];
                    return (
                      <div key={i} className="relative pl-8 border-l-2 border-[#07284a]/20 dark:border-[#1d4ed8]/20 group hover:border-[#07284a]/40 dark:hover:border-[#1d4ed8]/40 transition-colors">
                        <div className={`absolute -left-2.5 top-0 size-5 rounded-full ${tierMeta.color} flex items-center justify-center ring-2 ring-background`}>
                          <span className="text-[10px] font-bold text-white">{i + 1}</span>
                        </div>
                        <div className="mb-1">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border/40 text-muted-foreground">{tierMeta.label}</Badge>
                        </div>
                        <h4 className="font-semibold mb-2 text-sm">{phase.title}</h4>
                        <ul className="space-y-0.5 mb-4">
                          {phase.milestones.map((m, j) => (
                            <li key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="size-3 shrink-0 text-[#07284a]/40 dark:text-[#60a5fa]/40" /> {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Internship tasks are being prepared. Check back soon!</p>
              )}
            </Reveal>
            <Separator />
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
            <Reveal>
              <SectionHeading icon={ListChecks} title="Expected Deliverables" />
              <ul className="space-y-2">
                {detail.deliverables.map((d, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> {d}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Separator />
            <Reveal>
              <SectionHeading icon={Wrench} title="Tools & Technologies" />
              <div className="flex flex-wrap gap-2">
                {detail.toolsAndTechnologies.map((t) => (
                  <Badge key={t} variant="secondary" className="px-3 py-1.5 text-xs">{t}</Badge>
                ))}
                {detail.skills.slice(0, 12).map((s) => (
                  <Badge key={s} variant="secondary" className="px-3 py-1.5 text-xs">{s}</Badge>
                ))}
              </div>
            </Reveal>
            <Separator />
            <Reveal>
              <SectionHeading icon={Award} title="Skills You Will Gain" />
              <div className="flex flex-wrap gap-2">
                {detail.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1.5 text-xs">{skill}</Badge>
                ))}
              </div>
            </Reveal>
            <Separator />
            <Reveal>
              <SectionHeading icon={Trophy} title="Certificate Eligibility" />
              <ul className="space-y-2">
                {detail.certificateEligibility.map((c, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> {c}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Separator />
            <Reveal>
              <SectionHeading icon={BookOpen} title="Prerequisites" />
              <ul className="space-y-2">
                {detail.prerequisites.map((pr, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <ChevronRight className="size-4 text-[#07284a] dark:text-[#60a5fa] shrink-0 mt-0.5" /> {pr}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Separator />
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
            <Reveal>
              <SectionHeading icon={BarChart3} title="Internship Statistics" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard icon={Clock} label="Duration" value={detail.duration} />
                <StatCard icon={MapIcon} label="Tasks" value={`${taskRoadmap.length}`} />
                <StatCard icon={Briefcase} label="Projects" value={`${detail.projects.length}`} />
                <StatCard icon={Award} label="Certificate" value="Yes" />
                <StatCard icon={GraduationCap} label="Offer Letter" value="Provided" />
                <StatCard icon={Users} label="Interns" value={internCount.toLocaleString()} />
              </div>
            </Reveal>
            <Separator />
            <Reveal>
              <SectionHeading icon={Users} title="Your Mentors" />
              <div className="flex flex-wrap gap-4">
                {detail.mentors.map((mentor, i) => (
                  <Card key={i} className="bg-white/60 dark:bg-[#0f172a]/60 border-border/50 flex-1 min-w-[200px]">
                    <CardContent className="p-5 flex items-center gap-3">
                      <Avatar className="size-12">
                        <AvatarFallback className="bg-[#07284a]/10 dark:bg-[#1d4ed8]/10 text-[#07284a] dark:text-[#60a5fa] font-semibold">
                          {mentor.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{mentor.name}</p>
                        <p className="text-xs text-muted-foreground">{mentor.title}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Reveal>
            <Separator />
            <ReviewSection targetType="internship" targetId={slug} />
            <Separator />
            <Reveal>
              <SectionHeading icon={FileText} title="Frequently Asked Questions" />
              <Accordion type="multiple" className="w-full">
                {detail.faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-xl mb-3 px-5 bg-white/60 dark:bg-[#0f172a]/60">
                    <AccordionTrigger className="hover:no-underline py-4 text-sm font-medium">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <Card className="border-border/50 shadow-lg bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur">
                <CardContent className="p-6 space-y-5">
                  <div className={`relative h-36 rounded-xl overflow-hidden bg-gradient-to-br ${domain.color}`}>
                    <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <div className="size-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-lg font-bold text-white">{domain.icon}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{detail.duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mode</span>
                      <span className="font-medium">Remote</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Language</span>
                      <span className="font-medium">{detail.language}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Certificate</span>
                      <span className="font-medium">Yes</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Offer Letter</span>
                      <span className="font-medium">Provided</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Projects</span>
                      <span className="font-medium">{detail.projects.length}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="text-center">
                    <p className="text-2xl font-bold">Free</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Start your internship today</p>
                  </div>
                  <Button className="w-full h-11 rounded-xl gap-2 bg-[#07284a] hover:bg-[#07284a]/90 dark:bg-[#1d4ed8] dark:hover:bg-[#1d4ed8]/90 text-white" onClick={handleApply}>
                    <Sparkles className="size-4" /> Apply Now
                  </Button>
                  <Button variant="outline" className="w-full h-11 rounded-xl gap-2" asChild>
                    <Link to="/domains"><Download className="size-4" /> View All Internships</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur border-t border-border/50 p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{domain.name} Internship</p>
            <p className="text-lg font-bold">Free</p>
          </div>
          <Button className="h-11 rounded-xl gap-2 bg-[#07284a] hover:bg-[#07284a]/90 dark:bg-[#1d4ed8] dark:hover:bg-[#1d4ed8]/90 text-white shrink-0 px-6" onClick={handleApply}>
            <Sparkles className="size-4" /> Apply Now
          </Button>
        </div>

        <Reveal className="mt-16">
          <SectionHeading icon={GraduationCap} title="Related Internships" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTERN_SLUGS.filter((s) => s !== slug).slice(0, 3).map((s) => {
              const d = INTERNSHIP_DETAILS[s];
              const dom = getDomain(s);
              if (!d || !dom) return null;
              return (
                <Link key={s} to="/domains/$slug" params={{ slug: s }} className="group block rounded-2xl border border-border/50 bg-white/60 dark:bg-[#0f172a]/60 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className={`relative h-28 overflow-hidden bg-gradient-to-br ${dom.color}`}>
                    <img src={DOMAIN_IMAGES[s]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-2 left-3">
                      <div className="size-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center text-sm font-bold text-white">{dom.icon}</div>
                    </div>
                  </div>
                  <div className="p-4 space-y-1.5">
                    <h4 className="font-semibold text-sm">{dom.name}</h4>
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
