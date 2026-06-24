import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { CourseCertificateDoc, downloadPdf } from "@/components/pdf-docs";
import { getLocalQuizQuestions } from "@/lib/quiz-content.generated";
import {
  Clock, ChevronLeft, ChevronRight, Flag, XCircle, Trophy,
  AlertTriangle, Shuffle, Download, Award, RotateCcw, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/courses/$slug_/quiz")({
  ssr: false,
  head: ({ params }) => ({ meta: [{ title: `Final Quiz — ${params.slug} — Skyrovix` }] }),
  component: QuizPage,
});

type Q = { id: string; question: string; options: string[]; correct_index: number; marks: number };

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function QuizPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean; certId?: string; attemptNum: number } | null>(null);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [started, setStarted] = useState(false);
  const [shuffledIds, setShuffledIds] = useState<string[] | null>(null);
  const submitRef = useRef(false);
  const visibilityRef = useRef(0);
  const quizStartedRef = useRef(false);

  const localQuestions = useMemo(() => getLocalQuizQuestions(slug), [slug]);

  const { data: course } = useQuery({
    queryKey: ["course", slug],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle();
      if (data) return data;
      if (localQuestions.length > 0) {
        return { id: `local-${slug}`, slug, name: slug.charAt(0).toUpperCase() + slug.slice(1),
          quiz_marks: 100, pass_marks: 60, quiz_duration_min: 30, is_published: true };
      }
      return null;
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

  const { data: rawQuestions } = useQuery({
    queryKey: ["quiz-questions", course?.id || slug],
    enabled: !!course,
    queryFn: async () => {
      if (!course?.id?.startsWith?.("local-")) {
        const { data } = await supabase.from("course_quiz_questions")
          .select("id, question, options, correct_index, marks").eq("course_id", course!.id).order("order_index");
        if (data?.length) return data as Q[];
      }
      return localQuestions.length > 0 ? localQuestions : [];
    },
  });

  const { data: prevAttempts } = useQuery({
    queryKey: ["quiz-attempts", enrollment?.id],
    enabled: !!enrollment,
    queryFn: async () => {
      const { data } = await supabase.from("quiz_attempts").select("*")
        .eq("enrollment_id", enrollment!.id).order("submitted_at", { ascending: false });
      return data ?? [];
    },
  });

  const attemptCount = prevAttempts?.length ?? 0;
  const lastAttempt = prevAttempts?.[0] ?? null;
  const maxAttempts = 3;
  const attemptsLeft = maxAttempts - attemptCount;
  const passedBefore = prevAttempts?.some((a: any) => a.passed);

  const questions = useMemo(() => {
    if (!rawQuestions?.length) return [];
    if (!shuffledIds) return rawQuestions;
    const map = new Map(rawQuestions.map((q) => [q.id, q]));
    return shuffledIds.map((id) => map.get(id)!);
  }, [rawQuestions, shuffledIds]);

  const totalMarks = useMemo(() => questions.reduce((s, q) => s + q.marks, 0), [questions]);

  useEffect(() => {
    if (!course || quizStartedRef.current || !started) return;
    quizStartedRef.current = true;
    if (rawQuestions?.length) {
      setShuffledIds(shuffleArray(rawQuestions.map((q) => q.id)));
    }
  }, [course, rawQuestions, started]);

  useEffect(() => {
    if (!course) return;
    setSecondsLeft(course.quiz_duration_min * 60);
  }, [course]);

  useEffect(() => {
    if (secondsLeft === null || result || !started) return;
    if (secondsLeft <= 0) {
      toast.warning("Time is up! Auto-submitting.");
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, result, started]);

  useEffect(() => {
    if (!started || result) return;
    const handler = () => {
      if (document.hidden) {
        visibilityRef.current += 1;
        setTabWarnings(visibilityRef.current);
        if (visibilityRef.current >= 3) {
          toast.error("Tab switch limit reached. Auto-submitting.");
          handleSubmit();
        } else {
          toast.warning(`Warning ${visibilityRef.current}/3: Do not switch tabs during the quiz!`);
        }
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [started, questions, enrollment, course, result]);

  const handleSubmit = useCallback(async () => {
    if (submitRef.current || !questions.length || !course) return;
    submitRef.current = true;
    let score = 0;
    for (const q of questions) if (answers[q.id] === q.correct_index) score += q.marks;
    const passed = score >= course.pass_marks;

    if (course.id.startsWith?.("local-")) {
      setResult({ score, total: totalMarks, passed, attemptNum: 1 });
      return;
    }

    if (!enrollment) { submitRef.current = false; return; }
    const { data: att, error } = await supabase.from("quiz_attempts").insert({
      enrollment_id: enrollment.id, score, total: totalMarks, passed, answers, submitted_at: new Date().toISOString(),
    }).select().maybeSingle();
    if (error) { toast.error(error.message); submitRef.current = false; return; }

    let certId: string | undefined;
    if (passed) {
      await supabase.from("enrollments").update({ status: "completed", completed_at: new Date().toISOString(), progress_percent: 100 }).eq("id", enrollment.id);
      const year = new Date().getFullYear();
      certId = `SKY-${course.slug.toUpperCase().slice(0, 4)}-${year}-${String(Math.floor(100000 + Math.random() * 900000))}`;
      const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
      await supabase.from("course_certificates").insert({
        enrollment_id: enrollment.id, certificate_id: certId, verification_hash: hash, score,
      });
      await supabase.from("leaderboard" as any).upsert({
        user_id: user!.id, course_id: course.id, score, total: totalMarks, quiz_attempt_id: att?.id,
      }, { onConflict: "user_id, course_id" });
    }
    setResult({ score, total: totalMarks, passed, certId, attemptNum: attemptCount + 1 });
  }, [questions, answers, enrollment, course, totalMarks, user, attemptCount]);

  // Lobby screen - show before starting
  if (!started) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-16">
          <Card className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-[#07284a] to-blue-600" />
            <CardContent className="space-y-6 pt-8 text-center">
              <div className="mx-auto grid size-20 place-items-center rounded-full bg-gradient-to-br from-[#07284a]/10 to-blue-100 dark:from-[#07284a]/40 dark:to-blue-900/40">
                <Award className="size-10 text-[#07284a] dark:text-[#07284a]/80" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{course?.name} — Final Quiz</h1>
                <p className="mt-2 text-sm text-muted-foreground">Test your knowledge with {rawQuestions?.length ?? 0} questions.</p>
              </div>

              {passedBefore ? (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 p-4">
                  <CheckCircle2 className="size-6 text-emerald-600 mx-auto mb-2" />
                  <p className="font-semibold text-sm">You already passed this quiz!</p>
                  <p className="text-xs text-muted-foreground mt-1">Your certificate is available on your dashboard.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                      <p className="text-muted-foreground">Questions</p>
                      <p className="font-bold text-lg">{rawQuestions?.length ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                      <p className="text-muted-foreground">Pass Marks</p>
                      <p className="font-bold text-lg">{course?.pass_marks}/{course?.quiz_marks}</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                      <p className="text-muted-foreground">Attempts Left</p>
                      <p className={`font-bold text-lg ${attemptsLeft <= 0 ? "text-red-600" : attemptsLeft === 1 ? "text-amber-600" : ""}`}>{attemptsLeft}/{maxAttempts}</p>
                    </div>
                  </div>
                  {lastAttempt && (
                    <div className="text-xs text-muted-foreground">
                      Last attempt: {lastAttempt.score}/{lastAttempt.total} ({lastAttempt.passed ? "Passed" : "Failed"})
                    </div>
                  )}
                  <Button size="lg" className="brand-gradient text-white border-0 rounded-xl px-8 h-12 gap-2"
                    disabled={attemptsLeft <= 0}
                    onClick={() => setStarted(true)}>
                    <Trophy className="size-5" /> Start Quiz
                  </Button>
                  {attemptsLeft <= 0 && (
                    <p className="text-xs text-red-600">No attempts remaining. Contact support for assistance.</p>
                  )}
                </>
              )}

              <Button asChild variant="outline" size="sm"><Link to="/courses/$slug" params={{ slug }}>Back to course</Link></Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (result) return <ResultView result={result} course={course} slug={slug} user={user} />;

  if (!course || !rawQuestions?.length || !questions.length) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">Loading quiz…</main>
        <Footer />
      </div>
    );
  }

  const q = questions[current];
  const mm = String(Math.floor((secondsLeft ?? 0) / 60)).padStart(2, "0");
  const ss = String((secondsLeft ?? 0) % 60).padStart(2, "0");
  const answeredCount = Object.keys(answers).length;
  const isTimeout = (secondsLeft ?? 0) <= 60;
  const hasUnanswered = questions.length - answeredCount;

  return (
    <div className="min-h-screen">
      <Navbar />
      {tabWarnings > 0 && tabWarnings < 3 && (
        <div className="sticky top-0 z-50 bg-red-500 px-4 py-1.5 text-center text-sm font-medium text-white animate-in slide-in-from-top">
          <AlertTriangle className="mr-1.5 inline size-4" />
          Tab switch warning {tabWarnings}/3 — switching again will auto-submit!
        </div>
      )}
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold sm:text-2xl">{course.name} — Final Quiz</h1>
            <p className="text-sm text-muted-foreground">
              Attempt {attemptCount + 1}/{maxAttempts} · {answeredCount}/{questions.length} answered · {marked.size} marked
              {hasUnanswered > 0 && <span className="ml-2 text-amber-600">· {hasUnanswered} unanswered</span>}
            </p>
          </div>
          <div className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 font-mono text-lg font-bold transition-colors ${
            isTimeout ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400" : "border-border bg-card"
          }`}>
            <Clock className={`size-5 ${isTimeout ? "animate-pulse text-red-500" : "text-primary"}`} />
            {mm}:{ss}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Q{current + 1} / {questions.length}</Badge>
                  <span className="text-xs text-muted-foreground">{q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
                  {marked.has(q.id) && <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Marked</Badge>}
                </div>
                <Button size="sm" variant={marked.has(q.id) ? "default" : "outline"} onClick={() => {
                  const next = new Set(marked);
                  next.has(q.id) ? next.delete(q.id) : next.add(q.id);
                  setMarked(next);
                }}>
                  <Flag className="mr-1.5 size-4" />{marked.has(q.id) ? "Unmark" : "Mark"}
                </Button>
              </div>
              <CardTitle className="mt-3 text-lg leading-relaxed">{q.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {q.options.map((opt, i) => {
                const selected = answers[q.id] === i;
                const label = String.fromCharCode(65 + i);
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers({ ...answers, [q.id]: i })}
                    className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                      selected
                        ? "border-primary bg-accent/60 ring-1 ring-primary font-medium"
                        : "border-border hover:bg-secondary hover:border-muted-foreground/30"
                    }`}
                  >
                    <span className={`mr-3 inline-flex size-7 items-center justify-center rounded-md text-xs font-bold ${
                      selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}>
                      {label}
                    </span>
                    {opt}
                  </button>
                );
              })}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-5">
                <Button variant="outline" size="sm" className="h-10" disabled={current === 0} onClick={() => setCurrent((c) => Math.max(0, c - 1))}>
                  <ChevronLeft className="mr-1 size-4" />Previous
                </Button>
                <div className="flex gap-2">
                  {current < questions.length - 1 ? (
                    <Button size="sm" className="h-10 brand-gradient text-white border-0" onClick={() => setCurrent((c) => c + 1)}>
                      Next<ChevronRight className="ml-1 size-4" />
                    </Button>
                  ) : (
                    <Button size="sm" className="h-10 bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleSubmit}>
                      Submit Quiz
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <aside className="rounded-xl border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Questions</p>
              <Shuffle className="size-3 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((qq, i) => {
                const isCurrent = i === current;
                const answered = qq.id in answers;
                const isMarked = marked.has(qq.id);
                return (
                  <button
                    key={qq.id}
                    onClick={() => setCurrent(i)}
                    className={`grid h-9 w-full place-items-center rounded-md text-xs font-semibold transition-all ${
                      isCurrent ? "ring-2 ring-primary" : ""
                    } ${
                      isMarked ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300" :
                      answered ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300" :
                      "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                    title={`Question ${i + 1}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-xs">
              <div className="flex items-center gap-2"><span className="size-3 rounded-sm bg-emerald-100 dark:bg-emerald-900/40" /><span className="text-muted-foreground">Answered</span></div>
              <div className="flex items-center gap-2"><span className="size-3 rounded-sm bg-amber-100 dark:bg-amber-900/40" /><span className="text-muted-foreground">Marked</span></div>
              <div className="flex items-center gap-2"><span className="size-3 rounded-sm bg-secondary" /><span className="text-muted-foreground">Unanswered</span></div>
            </div>

            <Button size="sm" className="mt-4 w-full bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleSubmit}>
              Submit ({hasUnanswered} unanswered)
            </Button>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ResultView({ result, course, slug, user }: { result: { score: number; total: number; passed: boolean; certId?: string; attemptNum: number }; course: any; slug: string; user: any }) {
  const pct = Math.round((result.score / result.total) * 100);
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <Card className="overflow-hidden">
          <div className={`h-2 ${result.passed ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-red-400 to-red-600"}`} />
          <CardContent className="space-y-6 pt-8 text-center">
            <div className={`mx-auto grid size-24 place-items-center rounded-full ${
              result.passed
                ? "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 dark:from-emerald-900/40 dark:to-emerald-800/40 dark:text-emerald-400"
                : "bg-gradient-to-br from-red-100 to-red-200 text-red-700 dark:from-red-900/40 dark:to-red-800/40 dark:text-red-400"
            }`}>
              {result.passed ? <Trophy className="size-12" /> : <XCircle className="size-12" />}
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">{result.passed ? "Congratulations!" : "Not this time"}</h1>
              <p className="mt-1 text-muted-foreground">
                {result.passed
                  ? `You passed the ${course.name} final quiz!`
                  : "You did not reach the pass mark."}
              </p>
            </div>
            <div className="mx-auto inline-flex flex-col items-center rounded-xl border border-border bg-secondary/40 px-10 py-5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Your score</span>
              <span className="font-display text-5xl font-bold">
                {result.score} <span className="text-2xl text-muted-foreground">/ {result.total}</span>
              </span>
              <div className="mt-2 w-full max-w-[200px]">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1"><span>0%</span><span>100%</span></div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${result.passed ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <Badge className={`mt-2 px-3 py-1 text-sm ${
                result.passed ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
              }`}>
                {result.passed ? "PASSED" : "FAILED"} — Attempt {result.attemptNum}/3
              </Badge>
            </div>

            {result.passed && (
              <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/30 dark:bg-emerald-950/30">
                <div>
                  <p className="text-xs text-muted-foreground">Certificate ID</p>
                  <p className="font-mono text-lg font-bold text-emerald-900 dark:text-emerald-300">{result.certId}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button onClick={() => downloadPdf(
                    <CourseCertificateDoc
                      fullName={user?.user_metadata?.full_name ?? user?.email ?? "Student"}
                      courseName={course.name}
                      score={result.score}
                      total={result.total}
                      certId={result.certId ?? "N/A"}
                      issuedAt={new Date().toISOString()}
                      verifyUrl={`${window.location.origin}/verify-certificate`}
                    />,
                    `Certificate_${result.certId}.pdf`
                  )} className="brand-gradient text-white border-0 gap-1.5">
                    <Download className="size-4" /> Download Certificate
                  </Button>
                  <Button asChild variant="outline" className="gap-1.5">
                    <Link to="/verify-certificate"><Award className="size-4" /> Verify</Link>
                  </Button>
                  <Button asChild variant="outline" className="gap-1.5">
                    <Link to="/dashboard"><RotateCcw className="size-4" /> Dashboard</Link>
                  </Button>
                </div>
              </div>
            )}

            {!result.passed && result.attemptNum < 3 && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  You have {3 - result.attemptNum} attempt{3 - result.attemptNum !== 1 ? "s" : ""} remaining.
                </p>
                <Button onClick={() => window.location.reload()} variant="outline" className="gap-1.5">
                  <RotateCcw className="size-4" /> Try Again
                </Button>
              </div>
            )}

            {!result.passed && result.attemptNum >= 3 && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 p-4">
                <XCircle className="size-6 text-red-600 mx-auto mb-2" />
                <p className="font-semibold text-sm">No attempts remaining</p>
                <p className="text-xs text-muted-foreground mt-1">Please contact support for assistance.</p>
              </div>
            )}

            <Button asChild variant="ghost" size="sm"><Link to="/courses/$slug" params={{ slug }}>Back to course</Link></Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
