import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Search, Clock } from "lucide-react";
import { getDomain } from "@/lib/constants";
import seal from "@/assets/seal.jpg";

export const Route = createFileRoute("/verify-certificate")({
  head: () => ({ meta: [{ title: "Verify Certificate — Skyrovix" }, { name: "description", content: "Verify the authenticity of a Skyrovix internship certificate by ID." }] }),
  component: VerifyPage,
});

type FoundData = { full_name: string; domain: string; intern_id: string; status: string; cert_id?: string; issued_at?: string };
type Result =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "found"; data: FoundData }
  | { state: "notfound" };

function VerifyPage() {
  const [id, setId] = useState("");
  const [result, setResult] = useState<Result>({ state: "idle" });

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim()) return;
    setResult({ state: "loading" });

    const trimmed = id.trim();

    // Try certificate lookup first
    const { data: cert } = await supabase
      .from("certificates")
      .select("certificate_id, issued_at, applications!inner(full_name, domain, intern_id, status)")
      .eq("certificate_id", trimmed)
      .maybeSingle();

    if (cert?.applications) {
      const app = cert.applications as { full_name: string; domain: string; intern_id: string; status: string };
      return setResult({
        state: "found",
        data: { ...app, cert_id: cert.certificate_id, issued_at: cert.issued_at },
      });
    }

    // Try intern ID lookup
    const { data: app } = await supabase
      .from("applications")
      .select("full_name, domain, intern_id, status")
      .eq("intern_id", trimmed)
      .maybeSingle();

    if (app) {
      return setResult({
        state: "found",
        data: { full_name: app.full_name, domain: app.domain, intern_id: app.intern_id, status: app.status },
      });
    }

    setResult({ state: "notfound" });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-4xl font-bold">Verify <span className="brand-text">Certificate</span></h1>
        <p className="mt-3 text-muted-foreground">Enter a Certificate ID or Intern ID to verify.</p>

        <form onSubmit={verify} className="mt-8 flex gap-2">
          <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. SKX-CERT-2026-XXXXX or SKX-2026-XXXX" />
          <Button type="submit" className="brand-gradient text-white border-0"><Search className="size-4" /> Verify</Button>
        </form>

        {result.state === "loading" && <p className="mt-6 text-muted-foreground">Checking…</p>}

        {result.state === "found" && (() => {
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
                  {hasCert && <img src={seal} alt="Seal" className="ml-auto size-16 opacity-90" />}
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
