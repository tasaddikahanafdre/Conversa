"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email confirmation state
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName,
          },
          emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // Check if session was created immediately (meaning email confirmation is turned OFF)
      if (data.session) {
        // Store business name for onboarding
        if (typeof window !== "undefined") {
          localStorage.setItem("conversa_temp_business_name", businessName);
        }
        router.push("/onboarding");
        return;
      }

      // If user created but session is null, Supabase requires email confirmation
      if (data.user && !data.session) {
        setEmailSent(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign up";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMessage(null);
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
        },
      });
      if (resendError) throw resendError;
      setResendMessage("Verification email resent! Check your inbox and spam folder.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend confirmation email";
      setError(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-950 px-6 py-12 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Conversa<span className="text-blue-500">.</span>
          </span>
        </Link>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-white">
          {emailSent ? "Verify your email" : "Create your Conversa account"}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {emailSent
            ? "We sent a confirmation link to your email address"
            : "Get started in under 2 minutes. No credit card required."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl backdrop-blur-md">
          {emailSent ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
                <Mail className="h-7 w-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Check your inbox</h3>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  We sent a confirmation email to <strong className="text-blue-400">{email}</strong>.
                  Click the link inside to activate your account and start setting up your AI agent.
                </p>
              </div>

              {resendMessage && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400">
                  {resendMessage}
                </div>
              )}

              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResend}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
                >
                  {resending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Resend confirmation email
                </button>

                <Link
                  href="/auth/login"
                  className="block text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  Already confirmed? Sign in here
                </Link>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-left text-[11px] text-slate-400">
                <div className="font-bold text-slate-300 mb-1">💡 Note for Supabase Setup:</div>
                To skip email confirmation for instant testing, toggle OFF <em>&quot;Confirm email&quot;</em> in your{" "}
                <strong className="text-slate-300">Supabase Dashboard &gt; Authentication &gt; Providers &gt; Email</strong>.
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Dhaka Closet or ChicBD"
                    className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@yourshop.com"
                    className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="py-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Includes 100 free AI customer replies to test
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-400">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-semibold text-blue-400 hover:text-blue-300">
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
