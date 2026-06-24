import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Search, Clock, GraduationCap, Award } from "lucide-react";
import { getDomain } from "@/lib/constants";

export const Route = createFileRoute("/verify-certificate")({
  head: () => ({ meta: [{ title: "Verify Certificate — Skyrovix" }, { name: "description", content: "Verify the authenticity of a Skyrovix internship or course certificate by ID." }] }),
  component: VerifyPage,
});

type FoundData = {
  full_name: string; domain: string; intern_id?: string;
  status: string; cert_id?: string; issued_at?: string;
  // LMS fields
  course_name?: string; score?: number; verification_hash?: string;
};

type Result =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "found"; data: FoundData; type: "internship" | "course" }
  | { state: "notfound" };

function VerifyPage() {
  const [id, setId] = useState("");
  const [result, setResult] = useState<Result>({ state: "idle" });

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim()) return;
    setResult({ state: "loading" });

    const trimmed = id.trim();

    // 1. Try LMS course_certificates lookup (new system)
    const { data: courseCert, error: certErr } = await supabase
      .from("course_certificates")
      .select("certificate_id, verification_hash, score, issued_at, enrollment_id")
      .eq("certificate_id", trimmed)
      .maybeSingle();

    if (courseCert && !certErr) {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("user_id, course_id, status")
        .eq("id", courseCert.enrollment_id)
        .maybeSingle();

      if (enrollment) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", enrollment.user_id)
          .maybeSingle();

        const { data: course } = await supabase
          .from("courses")
          .select("name, domain")
          .eq("id", enrollment.course_id)
          .maybeSingle();

        if (profile && course) {
          return setResult({
            state: "found",
            type: "course",
            data: {
              full_name: profile.full_name ?? "Unknown",
              domain: course.domain,
              course_name: course.name,
              cert_id: courseCert.certificate_id,
              issued_at: courseCert.issued_at,
              status: enrollment.status,
              score: courseCert.score,
              verification_hash: courseCert.verification_hash,
            },
          });
        }
      }
    }

    // 2. Try old certificates table lookup
    const { data: cert, error: oldCertErr } = await supabase
      .from("certificates")
      .select("certificate_id, issued_at, application_id")
      .eq("certificate_id", trimmed)
      .maybeSingle();

    if (cert && !oldCertErr) {
      const { data: app } = await supabase
        .from("applications")
        .select("full_name, domain, intern_id, status")
        .eq("id", cert.application_id)
        .maybeSingle();

      if (app) {
        return setResult({
          state: "found",
          type: "internship",
          data: { ...app, cert_id: cert.certificate_id, issued_at: cert.issued_at },
        });
      }
    }

    // 3. Try intern ID lookup (old system)
    const { data: app, error: appErr } = await supabase
      .from("applications")
      .select("full_name, domain, intern_id, status")
      .eq("intern_id", trimmed)
      .maybeSingle();

    if (app && !appErr) {
      return setResult({
        state: "found",
        type: "internship",
        data: { full_name: app.full_name, domain: app.domain, intern_id: app.intern_id, status: app.status },
      });
    }

    setResult({ state: "notfound" });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold">Verify <span className="brand-text">Certificate</span></h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground">Enter a Certificate ID or Intern ID to verify authenticity.</p>

        <form onSubmit={verify} className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-2">
          <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. SKY-FULL-2026-123456 or SKX-2026-XXXX" className="w-full" />
          <Button type="submit" className="w-full sm:w-auto brand-gradient text-white border-0"><Search className="size-4" /> Verify</Button>
        </form>

        {result.state === "loading" && <p className="mt-6 text-muted-foreground">Checking…</p>}

        {result.state === "found" && result.type === "course" && (() => {
          const d = result.data;
          return (
            <Card className="mt-8 border-primary/40">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-8 text-green-500" />
                  <div>
                    <CardTitle>Verified ✓</CardTitle>
                    <p className="text-sm text-muted-foreground">This LMS course certificate is authentic.</p>
                  </div>
                  <div className="ml-auto grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Award className="size-6" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row k="Name" v={d.full_name} />
                <Row k="Course" v={d.course_name ?? "—"} />
                <Row k="Domain" v={d.domain} />
                <Row k="Score" v={d.score != null ? `${d.score} marks` : "—"} />
                <Row k="Status" v={<Badge className="bg-emerald-600 hover:bg-emerald-600">Completed</Badge>} />
                <Row k="Certificate ID" v={d.cert_id} />
                {d.issued_at && <Row k="Issued" v={new Date(d.issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} />}
              </CardContent>
            </Card>
          );
        })()}

        {result.state === "found" && result.type === "internship" && (() => {
          const d = result.data;
          const hasCert = !!d.cert_id;
          return (
            <Card className={`mt-8 ${hasCert ? "border-primary/40" : "border-amber-400/40"}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {hasCert ? <CheckCircle2 className="size-8 text-green-500" /> : <Clock className="size-8 text-amber-500" />}
                  <div>
                    <CardTitle>{hasCert ? "Verified ✓" : "Internship Found"}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {hasCert ? "This certificate is authentic." : "Certificate not yet issued."}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row k="Name" v={d.full_name} />
                <Row k="Domain" v={getDomain(d.domain)?.name ?? d.domain} />
                <Row k="Intern ID" v={d.intern_id} />
                <Row k="Status" v={<Badge variant={d.status === "approved" ? "default" : d.status === "rejected" ? "destructive" : "secondary"}>{d.status}</Badge>} />
                {d.cert_id && <Row k="Certificate ID" v={d.cert_id} />}
                {d.issued_at && <Row k="Issued" v={new Date(d.issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} />}
              </CardContent>
            </Card>
          );
        })()}

        {result.state === "notfound" && (
          <Card className="mt-8 border-destructive/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <XCircle className="size-8 text-destructive" />
                <div>
                  <CardTitle>Not Found</CardTitle>
                  <p className="text-sm text-muted-foreground">No certificate matches this ID.</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-border/40 py-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
