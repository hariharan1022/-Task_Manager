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

export const Route = createFileRoute("/auth")({
  validateSearch: (search: { redirect?: string }) => search,
  head: () => ({ meta: [{ title: "Sign in — Skyrovix Internship Portal" }, { name: "description", content: "Sign in or create your Skyrovix internship account." }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const redirect = search.redirect ?? "/dashboard";
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
      toast.success("Registration successful! Please check your email for the confirmation link to activate your account.", {
        duration: 10000,
      });
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden brand-gradient lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/"><Logo /></Link>
          <div>
            <h2 className="font-display text-4xl font-bold leading-tight">Build the future,<br />one task at a time.</h2>
            <p className="mt-4 max-w-md text-white/80">Join hundreds of students gaining real, hands-on experience with Skyrovix.</p>
          </div>
          <div className="text-xs text-white/60">© {new Date().getFullYear()} Skyrovix IT Solutions</div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden"><Link to="/"><Logo /></Link></div>
          <Card>
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
              <CardDescription>Sign in or create an account to apply for your internship.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                  <form onSubmit={signIn} className="space-y-4 mt-4">
                    <div><Label>Email</Label><Input name="email" type="email" required /></div>
                    <div><Label>Password</Label><Input name="password" type="password" required /></div>
                    <Button type="submit" className="w-full brand-gradient text-white border-0" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
                  </form>
                </TabsContent>
                <TabsContent value="signup">
                  <form onSubmit={signUp} className="space-y-4 mt-4">
                    <div><Label>Full Name</Label><Input name="name" required /></div>
                    <div><Label>Email</Label><Input name="email" type="email" required /></div>
                    <div><Label>Password</Label><Input name="password" type="password" minLength={6} required /></div>
                    <Button type="submit" className="w-full brand-gradient text-white border-0" disabled={loading}>{loading ? "Creating..." : "Create Account"}</Button>
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
