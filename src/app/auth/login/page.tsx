"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, ArrowRight, Loader2, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email confirmation helper state
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsEmailNotConfirmed(false);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (
          signInError.message.toLowerCase().includes("email not confirmed") ||
          signInError.message.toLowerCase().includes("not confirmed")
        ) {
          setIsEmailNotConfirmed(true);
        }
        throw signInError;
      }

      // Check if user already has an active workspace
      const { data: memberWorkspaces } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .limit(1);

      if (memberWorkspaces && memberWorkspaces.length > 0) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) return;
    setResending(true);
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
        },
      });
      setResendSuccess(true);
    } catch (err) {
      console.error(err);
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
          Welcome back to Conversa
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to manage your AI customer conversations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl backdrop-blur-md">
          {error && (
            <div className="mb-6 space-y-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>

              {isEmailNotConfirmed && (
                <div className="mt-3 pt-3 border-t border-red-500/20 text-xs text-slate-300">
                  <p>Your Supabase project requires email confirmation before signing in.</p>
                  {resendSuccess ? (
                    <div className="mt-2 flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Confirmation email resent! Check your inbox.
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={resending}
                      onClick={handleResendConfirmation}
                      className="mt-2 inline-flex items-center gap-1.5 font-semibold text-blue-400 hover:text-blue-300 underline"
                    >
                      <RefreshCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
                      Click here to resend confirmation email
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@business.com"
                className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-blue-400 hover:text-blue-300">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
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
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="font-semibold text-blue-400 hover:text-blue-300">
              Create an account free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
