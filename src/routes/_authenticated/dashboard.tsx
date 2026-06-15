import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DOMAINS, PAYMENT, COMPANY, generateInternId, getDomain } from "@/lib/constants";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { IDCard } from "@/components/IDCard";
import { OfferLetterDoc, CertificateDoc, downloadPdf } from "@/components/pdf-docs";
import { Copy, Download, FileText, CheckCircle2, Clock, XCircle, Upload, Award } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Skyrovix" }] }),
  component: Dashboard,
});

type Application = {
  id: string; user_id: string; domain: string; intern_id: string; full_name: string; email: string;
  phone: string | null; college: string | null; course: string | null; year: string | null;
  photo_url: string | null; offer_issued_at: string; created_at: string; status: string;
};

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: app, isLoading } = useQuery({
    queryKey: ["my-application", user?.id],
    queryFn: async (): Promise<Application | null> => {
      if (!user) return null;
      const { data } = await supabase.from("applications").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My <span className="brand-text">Dashboard</span></h1>
          <p className="mt-1 text-muted-foreground">Welcome back{user?.email ? `, ${user.email}` : ""}.</p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !app ? (
          <ApplyForm onCreated={() => qc.invalidateQueries({ queryKey: ["my-application"] })} />
        ) : (
          <ActiveDashboard app={app} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function ApplyForm({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      let photo_url: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, photoFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from("profile-photos").createSignedUrl(path, 60 * 60 * 24 * 365);
        photo_url = signed?.signedUrl ?? null;
      }
      const intern_id = generateInternId();
      const payload = {
        user_id: user.id,
        domain: String(fd.get("domain")),
        intern_id,
        full_name: String(fd.get("full_name")),
        email: user.email ?? "",
        phone: String(fd.get("phone")),
        college: String(fd.get("college")),
        course: String(fd.get("course")),
        year: String(fd.get("year")),
        photo_url,
        status: "approved" as const,
      };
      const { error } = await supabase.from("applications").insert(payload);
      if (error) throw error;
      // also update profile
      await supabase.from("profiles").update({
        full_name: payload.full_name, phone: payload.phone, college: payload.college,
        course: payload.course, year: payload.year, photo_url,
      }).eq("id", user.id);
      toast.success("Application approved! Your offer letter is ready.");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for an Internship</CardTitle>
        <CardDescription>Fill in your details. You'll get your offer letter and digital ID card instantly.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><Label>Full Name</Label><Input name="full_name" required /></div>
          <div><Label>Phone</Label><Input name="phone" type="tel" required /></div>
          <div>
            <Label>Domain</Label>
            <Select name="domain" required>
              <SelectTrigger><SelectValue placeholder="Select a domain" /></SelectTrigger>
              <SelectContent>
                {DOMAINS.map((d) => <SelectItem key={d.slug} value={d.slug}>{d.icon} {d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>College / University</Label><Input name="college" required /></div>
          <div><Label>Course / Branch</Label><Input name="course" required /></div>
          <div><Label>Year</Label><Input name="year" placeholder="e.g. 3rd year" required /></div>
          <div><Label>Profile Photo</Label><Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} /></div>
          <Button type="submit" className="md:col-span-2 brand-gradient text-white border-0" disabled={loading}>
            {loading ? "Submitting…" : "Submit Application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ActiveDashboard({ app }: { app: Application }) {
  const qc = useQueryClient();
  const domain = getDomain(app.domain);

  const { data: tasks } = useQuery({
    queryKey: ["domain-tasks", app.domain],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("*").eq("domain", app.domain).order("task_number");
      return data ?? [];
    },
  });
  const { data: submissions } = useQuery({
    queryKey: ["my-submissions", app.id],
    queryFn: async () => {
      const { data } = await supabase.from("submissions").select("*").eq("application_id", app.id);
      return data ?? [];
    },
  });
  const { data: payment } = useQuery({
    queryKey: ["my-payment", app.id],
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("*").eq("application_id", app.id).maybeSingle();
      return data;
    },
  });
  const { data: certificate } = useQuery({
    queryKey: ["my-cert", app.id],
    queryFn: async () => {
      const { data } = await supabase.from("certificates").select("*").eq("application_id", app.id).maybeSingle();
      return data;
    },
  });

  const approved = submissions?.filter((s) => s.status === "approved").length ?? 0;
  const total = tasks?.length ?? 5;
  const tasksComplete = approved === total && total > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Domain</p>
            <p className="font-semibold">{domain?.icon} {domain?.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Intern ID</p>
            <p className="font-mono font-semibold">{app.intern_id}</p>
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Progress</p>
            <Progress value={(approved / total) * 100} className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">{approved}/{total} tasks approved</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="onboarding">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="payment" disabled={!tasksComplete}>Payment {tasksComplete && "✓"}</TabsTrigger>
          <TabsTrigger value="certificate" disabled={payment?.status !== "verified"}>Certificate</TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding" className="grid gap-6 md:grid-cols-2 mt-6">
          <Card>
            <CardHeader><CardTitle>Offer Letter</CardTitle><CardDescription>Your official Skyrovix offer.</CardDescription></CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/60 bg-card/50 p-6 text-center">
                <FileText className="mx-auto size-12 text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">{app.full_name} · {domain?.name}</p>
                <Button className="mt-4 brand-gradient text-white border-0" onClick={() => downloadPdf(<OfferLetterDoc fullName={app.full_name} internId={app.intern_id} domain={domain?.name ?? app.domain} issuedAt={app.offer_issued_at} />, `OfferLetter_${app.intern_id}.pdf`)}>
                  <Download className="mr-1 size-4" /> Download Offer Letter
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Digital ID Card</CardTitle><CardDescription>Show this anywhere.</CardDescription></CardHeader>
            <CardContent>
              <IDCard internId={app.intern_id} fullName={app.full_name} domain={domain?.name ?? app.domain} photoUrl={app.photo_url} issuedAt={app.offer_issued_at} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6 space-y-4">
          {tasks?.map((t, i) => {
            const sub = submissions?.find((s) => s.task_id === t.id);
            const prevDone = i === 0 || submissions?.find((s) => s.task_id === tasks[i - 1].id)?.status === "approved";
            return <TaskCard key={t.id} task={t} submission={sub} appId={app.id} unlocked={!!prevDone} onChange={() => qc.invalidateQueries({ queryKey: ["my-submissions"] })} />;
          })}
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <PaymentPanel app={app} payment={payment} onChange={() => qc.invalidateQueries({ queryKey: ["my-payment"] })} />
        </TabsContent>

        <TabsContent value="certificate" className="mt-6">
          {certificate ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Award className="size-5 text-primary" /> Certificate Issued</CardTitle>
                <CardDescription>Cert ID: <span className="font-mono">{certificate.certificate_id}</span></CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="brand-gradient text-white border-0" onClick={() => downloadPdf(
                  <CertificateDoc fullName={app.full_name} internId={app.intern_id} domain={domain?.name ?? app.domain} certId={certificate.certificate_id} issuedAt={certificate.issued_at} verifyUrl={`${window.location.origin}/verify-certificate`} />,
                  `Certificate_${certificate.certificate_id}.pdf`
                )}><Download className="mr-1 size-4" /> Download Certificate</Button>
                <p className="mt-3 text-sm text-muted-foreground">Verify at <Link to="/verify-certificate" className="text-primary">/verify-certificate</Link></p>
              </CardContent>
            </Card>
          ) : <p className="text-muted-foreground">Your certificate will appear here once payment is verified.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TaskCard({ task, submission, appId, unlocked, onChange }: { task: { id: string; task_number: number; title: string; description: string }; submission: { id: string; status: string; github_url: string | null; deployed_url: string | null; notes: string | null; feedback: string | null } | undefined; appId: string; unlocked: boolean; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = { application_id: appId, task_id: task.id, github_url: String(fd.get("github_url")), deployed_url: String(fd.get("deployed_url")), notes: String(fd.get("notes")), status: "pending" as const };
    const { error } = submission
      ? await supabase.from("submissions").update({ ...payload, submitted_at: new Date().toISOString() }).eq("id", submission.id)
      : await supabase.from("submissions").insert(payload);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Submission sent for review");
    setOpen(false);
    onChange();
  };

  const statusBadge = !submission ? null
    : submission.status === "approved" ? <Badge className="bg-green-600">Approved</Badge>
    : submission.status === "rejected" ? <Badge variant="destructive">Rejected</Badge>
    : <Badge variant="secondary">Under review</Badge>;

  return (
    <Card className={!unlocked ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="grid size-9 place-items-center rounded-full brand-gradient font-bold text-white">{task.task_number}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">{task.title}</CardTitle>
              {statusBadge}
            </div>
            <CardDescription className="mt-1">{task.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!unlocked ? <p className="text-sm text-muted-foreground">Complete the previous task to unlock.</p>
          : submission?.status === "approved" ? <p className="text-sm text-green-500 flex items-center gap-1"><CheckCircle2 className="size-4" /> Approved on {submission.id && new Date().toLocaleDateString()}</p>
          : (
            <div className="space-y-3">
              {submission?.feedback && submission.status === "rejected" && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                  <p className="font-semibold text-destructive flex items-center gap-1"><XCircle className="size-4" /> Feedback</p>
                  <p className="mt-1">{submission.feedback}</p>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>{submission ? "Resubmit" : "Submit task"}</Button>
              {open && (
                <form onSubmit={submit} className="space-y-3 rounded-md border border-border bg-card/40 p-4">
                  <div><Label>GitHub URL</Label><Input name="github_url" type="url" defaultValue={submission?.github_url ?? ""} required /></div>
                  <div><Label>Deployed / Demo URL</Label><Input name="deployed_url" type="url" defaultValue={submission?.deployed_url ?? ""} /></div>
                  <div><Label>Notes</Label><Textarea name="notes" defaultValue={submission?.notes ?? ""} rows={3} /></div>
                  <Button type="submit" disabled={loading} className="brand-gradient text-white border-0">{loading ? "Sending…" : "Submit"}</Button>
                </form>
              )}
            </div>
          )}
      </CardContent>
    </Card>
  );
}

function PaymentPanel({ app, payment, onChange }: { app: Application; payment: { id: string; utr_number: string; status: string } | null | undefined; onChange: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const upiString = `upi://pay?pa=${encodeURIComponent(PAYMENT.upiId)}&pn=${encodeURIComponent(PAYMENT.payeeName)}&am=${PAYMENT.amount}&cu=${PAYMENT.currency}&tn=${encodeURIComponent("Skyrovix Certificate " + app.intern_id)}`;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      let screenshot_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("payment-screenshots").upload(path, file, { upsert: true });
        if (error) throw error;
        screenshot_url = path;
      }
      const { error } = await supabase.from("payments").insert({
        application_id: app.id, utr_number: String(fd.get("utr")), screenshot_url, amount: PAYMENT.amount,
      });
      if (error) throw error;
      toast.success("Payment submitted — awaiting admin verification.");
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally { setLoading(false); }
  };

  if (payment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {payment.status === "verified" ? <><CheckCircle2 className="size-5 text-green-500" /> Verified</> :
             payment.status === "rejected" ? <><XCircle className="size-5 text-destructive" /> Rejected</> :
             <><Clock className="size-5 text-amber-500" /> Awaiting verification</>}
          </CardTitle>
          <CardDescription>UTR: <span className="font-mono">{payment.utr_number}</span></CardDescription>
        </CardHeader>
        <CardContent>
          {payment.status === "pending" && <p className="text-sm text-muted-foreground">Our team will verify your payment shortly. Once verified, your certificate is issued automatically.</p>}
          {payment.status === "rejected" && <p className="text-sm text-destructive">Payment was rejected. Please contact support.</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certification Payment — ₹{PAYMENT.amount}</CardTitle>
        <CardDescription>Pay via GPay / any UPI app and submit your UTR + screenshot for verification.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card/40 p-6 text-center">
          <div className="inline-block rounded-md bg-white p-3"><QRCodeSVG value={upiString} size={180} /></div>
          <p className="mt-3 font-mono text-sm">{PAYMENT.upiId}</p>
          <Button variant="ghost" size="sm" className="mt-1" onClick={() => { navigator.clipboard.writeText(PAYMENT.upiId); toast.success("UPI ID copied"); }}>
            <Copy className="mr-1 size-3" /> Copy UPI ID
          </Button>
          <Separator className="my-3" />
          <p className="text-xs text-muted-foreground">Payee: {PAYMENT.payeeName}</p>
          <p className="text-xs text-muted-foreground">Amount: ₹{PAYMENT.amount}</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>UTR / Transaction ID</Label><Input name="utr" required /></div>
          <div>
            <Label>Payment Screenshot</Label>
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <p className="mt-1 text-xs text-muted-foreground"><Upload className="inline size-3" /> Helps us verify faster.</p>
          </div>
          <Button type="submit" disabled={loading} className="w-full brand-gradient text-white border-0">{loading ? "Submitting…" : "Submit Payment"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
