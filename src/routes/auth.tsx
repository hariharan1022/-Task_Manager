import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { GraduationCap, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Sign in — Skyrovix Internship Portal" }, { name: "description", content: "Sign in or create your Skyrovix internship account." }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const redirect = search.redirect ?? "/dashboard";
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Scrub any sensitive params that leaked into the URL (e.g. from a
    // pre-hydration native form submit or password manager autofill).
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      let dirty = false;
      for (const key of ["email", "password", "name"]) {
        if (url.searchParams.has(key)) { url.searchParams.delete(key); dirty = true; }
      }
      if (dirty) window.history.replaceState({}, "", url.pathname + (url.search ? url.search : "") + url.hash);
    }
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: redirect }); });
  }, [navigate, redirect]);

  const signIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: String(fd.get("email")), password: String(fd.get("password")) });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: redirect });
  };

  const signUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: { emailRedirectTo: window.location.origin, data: { full_name: String(fd.get("name")) } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);

    if (data?.session) {
      toast.success("Account created! You're signed in.");
      navigate({ to: redirect });
    } else {
      toast.success("Registration successful! Please check your email for the confirmation link to activate your account.", { duration: 10000 });
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 brand-gradient">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
        <div className="absolute inset-0 hero-grid opacity-20" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/"><Logo /></Link>
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="size-3.5" /> Task-based virtual internship
            </div>
            <h2 className="font-display text-4xl font-bold leading-tight">Build the future,<br />one task at a time.</h2>
            <p className="max-w-md text-white/80 leading-relaxed">
              Join hundreds of students gaining real, hands-on experience with Skyrovix. 
              Complete projects, get mentor reviews, and earn verified certificates.
            </p>
            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-2xl font-bold">10+</div>
                <div className="text-xs text-white/60">Domains</div>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <div className="text-2xl font-bold">50+</div>
                <div className="text-xs text-white/60">Projects</div>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <div className="text-2xl font-bold">100%</div>
                <div className="text-xs text-white/60">Online</div>
              </div>
            </div>
          </div>
          <div className="text-xs text-white/40">© {new Date().getFullYear()} Skyrovix IT Solutions</div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden"><Link to="/"><Logo /></Link></div>
          <Card className="border-border/60 shadow-xl shadow-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>Sign in or create an account to get started.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                  <form onSubmit={signIn} method="post" action="?" autoComplete="on" className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input name="email" type="email" required className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input name="password" type="password" required className="h-11" />
                    </div>
                    <Button type="submit" className="w-full brand-gradient text-white border-0 h-11" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="signup">
                  <form onSubmit={signUp} className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input name="name" required className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input name="email" type="email" required className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input name="password" type="password" minLength={6} required className="h-11" />
                    </div>
                    <Button type="submit" className="w-full brand-gradient text-white border-0 h-11" disabled={loading}>
                      {loading ? "Creating..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
