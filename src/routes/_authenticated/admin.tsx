import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { generateCertId, getDomain, COMPANY } from "@/lib/constants";
import { FileText, IndianRupee, Award, Users, CheckCircle2, XCircle, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (role?.role !== "admin") throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Admin — Skyrovix" }] }),
  component: AdminPanel,
});

function AdminPanel() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin <span className="brand-text">Control</span></h1>
          <p className="mt-1 text-muted-foreground">Manage applications, review submissions, verify payments and issue certificates.</p>
        </div>
        <Overview />
        <Tabs defaultValue="applications" className="mt-8">
          <TabsList>
            <TabsTrigger value="applications"><Users className="mr-1 size-4" /> Applications</TabsTrigger>
            <TabsTrigger value="submissions"><FileText className="mr-1 size-4" /> Submissions</TabsTrigger>
            <TabsTrigger value="payments"><IndianRupee className="mr-1 size-4" /> Payments</TabsTrigger>
            <TabsTrigger value="certificates"><Award className="mr-1 size-4" /> Certificates</TabsTrigger>
          </TabsList>
          <TabsContent value="applications" className="mt-4"><ApplicationsTab /></TabsContent>
          <TabsContent value="submissions" className="mt-4"><SubmissionsTab /></TabsContent>
          <TabsContent value="payments" className="mt-4"><PaymentsTab /></TabsContent>
          <TabsContent value="certificates" className="mt-4"><CertificatesTab /></TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

function Overview() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [a, s, p, c] = await Promise.all([
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("certificates").select("id", { count: "exact", head: true }),
      ]);
      return { apps: a.count ?? 0, subs: s.count ?? 0, pays: p.count ?? 0, certs: c.count ?? 0 };
    },
  });
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Applications" n={data?.apps ?? 0} icon={Users} />
      <StatCard title="Pending Submissions" n={data?.subs ?? 0} icon={FileText} />
      <StatCard title="Pending Payments" n={data?.pays ?? 0} icon={IndianRupee} />
      <StatCard title="Certificates Issued" n={data?.certs ?? 0} icon={Award} />
    </div>
  );
}

function StatCard({ title, n, icon: Icon }: { title: string; n: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <div>
          <p className="text-xs uppercase text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold">{n}</p>
        </div>
        <div className="grid size-12 place-items-center rounded-xl brand-gradient text-white"><Icon className="size-6" /></div>
      </CardContent>
    </Card>
  );
}

function ApplicationsTab() {
  const { data } = useQuery({
    queryKey: ["admin-apps"],
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  return (
    <div className="grid gap-3">
      {data?.length === 0 && <p className="text-muted-foreground">No applications yet.</p>}
      {data?.map((a) => (
        <Card key={a.id}>
          <CardContent className="flex flex-wrap items-center gap-4 pt-6">
            <div className="flex-1 min-w-[220px]">
              <p className="font-semibold">{a.full_name}</p>
              <p className="text-xs text-muted-foreground">{a.email} · {a.phone}</p>
              <p className="text-xs text-muted-foreground">{a.college} · {a.course} · {a.year}</p>
            </div>
            <div><Badge variant="secondary">{getDomain(a.domain)?.name ?? a.domain}</Badge></div>
            <div className="font-mono text-xs">{a.intern_id}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SubmissionsTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-subs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("submissions")
        .select("*, applications(full_name, intern_id, domain), tasks(title, task_number)")
        .order("submitted_at", { ascending: false });
      return data ?? [];
    },
  });

  const review = async (id: string, status: "approved" | "rejected", feedback: string) => {
    const { error } = await supabase.from("submissions").update({ status, feedback, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Submission ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-subs"] });
    qc.invalidateQueries({ queryKey: ["admin-overview"] });
  };

  return (
    <div className="grid gap-3">
      {data?.length === 0 && <p className="text-muted-foreground">No submissions yet.</p>}
      {data?.map((s) => <SubmissionRow key={s.id} sub={s} review={review} />)}
    </div>
  );
}

function SubmissionRow({ sub, review }: { sub: any; review: (id: string, status: "approved" | "rejected", feedback: string) => void }) {
  const [feedback, setFeedback] = useState(sub.feedback ?? "");
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Task {sub.tasks?.task_number}: {sub.tasks?.title}</CardTitle>
            <CardDescription>{sub.applications?.full_name} · <span className="font-mono">{sub.applications?.intern_id}</span> · {getDomain(sub.applications?.domain)?.name}</CardDescription>
          </div>
          <Badge variant={sub.status === "approved" ? "default" : sub.status === "rejected" ? "destructive" : "secondary"}>{sub.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {sub.github_url && <p>🔗 <a href={sub.github_url} target="_blank" rel="noreferrer" className="text-primary underline">GitHub</a></p>}
        {sub.deployed_url && <p>🌐 <a href={sub.deployed_url} target="_blank" rel="noreferrer" className="text-primary underline">Demo</a></p>}
        {sub.notes && <p className="text-muted-foreground">{sub.notes}</p>}
        {sub.status === "pending" && (
          <div className="space-y-2 pt-2">
            <Textarea placeholder="Feedback (optional for approval, required for rejection)" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={2} />
            <div className="flex gap-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => review(sub.id, "approved", feedback)}><CheckCircle2 className="mr-1 size-4" /> Approve</Button>
              <Button size="sm" variant="destructive" onClick={() => review(sub.id, "rejected", feedback)}><XCircle className="mr-1 size-4" /> Reject</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentsTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*, applications(full_name, intern_id, domain, id)")
        .order("submitted_at", { ascending: false });
      return data ?? [];
    },
  });

  const verify = async (paymentId: string, applicationId: string, accept: boolean) => {
    if (!accept) {
      const { error } = await supabase.from("payments").update({ status: "rejected", verified_at: new Date().toISOString() }).eq("id", paymentId);
      if (error) return toast.error(error.message);
      toast.success("Payment rejected");
    } else {
      const { error } = await supabase.from("payments").update({ status: "verified", verified_at: new Date().toISOString() }).eq("id", paymentId);
      if (error) return toast.error(error.message);
      const cert_id = generateCertId();
      const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
      const { error: cerr } = await supabase.from("certificates").insert({ application_id: applicationId, certificate_id: cert_id, verification_hash: hash });
      if (cerr) return toast.error(cerr.message);
      toast.success(`Payment verified, certificate ${cert_id} issued`);
    }
    qc.invalidateQueries({ queryKey: ["admin-payments"] });
    qc.invalidateQueries({ queryKey: ["admin-overview"] });
  };

  return (
    <div className="grid gap-3">
      {data?.length === 0 && <p className="text-muted-foreground">No payments yet.</p>}
      {data?.map((p) => <PaymentRow key={p.id} p={p} verify={verify} />)}
    </div>
  );
}

function PaymentRow({ p, verify }: { p: any; verify: (paymentId: string, applicationId: string, accept: boolean) => void }) {
  const [shotUrl, setShotUrl] = useState<string | null>(null);
  const showShot = async () => {
    if (!p.screenshot_url) return;
    const { data } = await supabase.storage.from("payment-screenshots").createSignedUrl(p.screenshot_url, 60 * 5);
    setShotUrl(data?.signedUrl ?? null);
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">{p.applications?.full_name} <span className="ml-1 font-mono text-xs text-muted-foreground">{p.applications?.intern_id}</span></CardTitle>
            <CardDescription>UTR: <span className="font-mono">{p.utr_number}</span> · ₹{p.amount} · {getDomain(p.applications?.domain)?.name}</CardDescription>
          </div>
          <Badge variant={p.status === "verified" ? "default" : p.status === "rejected" ? "destructive" : "secondary"}>{p.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {p.screenshot_url && (
          <div>
            <Button size="sm" variant="outline" onClick={showShot}><Eye className="mr-1 size-4" /> View screenshot</Button>
            {shotUrl && <img src={shotUrl} alt="payment" className="mt-2 max-h-72 rounded-md border border-border" />}
          </div>
        )}
        {p.status === "pending" && (
          <div className="flex gap-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => verify(p.id, p.applications.id, true)}><CheckCircle2 className="mr-1 size-4" /> Verify & Issue Certificate</Button>
            <Button size="sm" variant="destructive" onClick={() => verify(p.id, p.applications.id, false)}><XCircle className="mr-1 size-4" /> Reject</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CertificatesTab() {
  const { data } = useQuery({
    queryKey: ["admin-certs"],
    queryFn: async () => {
      const { data } = await supabase.from("certificates").select("*, applications(full_name, intern_id, domain)").order("issued_at", { ascending: false });
      return data ?? [];
    },
  });
  return (
    <div className="grid gap-3">
      {data?.length === 0 && <p className="text-muted-foreground">No certificates issued yet.</p>}
      {data?.map((c: any) => (
        <Card key={c.id}>
          <CardContent className="flex flex-wrap items-center gap-4 pt-6">
            <Award className="size-6 text-primary" />
            <div className="flex-1">
              <p className="font-semibold">{c.applications?.full_name}</p>
              <p className="text-xs text-muted-foreground">{getDomain(c.applications?.domain)?.name} · <span className="font-mono">{c.applications?.intern_id}</span></p>
            </div>
            <div className="font-mono text-sm">{c.certificate_id}</div>
            <Link to="/verify-certificate" className="text-xs text-primary underline">Verify</Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
