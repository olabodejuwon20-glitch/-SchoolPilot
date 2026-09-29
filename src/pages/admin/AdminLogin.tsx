import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import SEO from "@/components/SEO";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || "/admin";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setErrorMsg(error.message || "Invalid credentials. Please try again.");
        toast.error(error.message || "Invalid admin credentials");
        setLoading(false);
        return;
      }

      if (data.session) {
        toast.success("Welcome back! Redirecting to Admin Dashboard…");
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="Admin Login — Legacyskool Lead Management"
        description="Secure admin login for Legacyskool waitlist management."
        path="/admin/login"
      />

      <header className="border-b border-border/60 bg-card/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid place-items-center size-8 rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4" />
          </div>
          <span className="font-display font-bold text-base tracking-tight">Legacyskool</span>
        </Link>
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          Back to website
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md p-6 sm:p-8 border border-border bg-card shadow-xl rounded-2xl">
          <div className="text-center mb-6">
            <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center mx-auto mb-3">
              <ShieldCheck className="size-6" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Admin Portal</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Sign in to manage waitlist submissions and school leads.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs font-semibold">
                Admin Email
              </Label>
              <div className="relative">
                <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@legacyskool.com"
                  className="pl-9 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-pass" className="text-xs font-semibold">
                Password
              </Label>
              <div className="relative">
                <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-pass"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-semibold mt-2 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in to Dashboard <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
            Protected by Legacyskool Row-Level Security & Role-Based Authorization.
          </div>
        </Card>
      </main>

      <footer className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Legacyskool. All rights reserved.
      </footer>
    </div>
  );
}
