"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function LoginClient() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignedIn = Boolean(session?.user);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "signin") {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/",
        });

        if (signInError) {
          setError(signInError.message || "Unable to sign in.");
          return;
        }
      } else {
        const { error: signUpError } = await authClient.signUp.email({
          email,
          password,
          name: name || email,
          callbackURL: "/",
        });

        if (signUpError) {
          setError(signUpError.message || "Unable to create account.");
          return;
        }
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Authentication request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: socialError } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });

      if (socialError) {
        setError(socialError.message || "Google sign-in failed.");
      }
    } catch {
      setError("Google sign-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="border border-foreground/10">
          <div className="border-b border-foreground/10 px-6 py-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
              Authentication
            </p>
            <h1 className="mt-1 text-base font-semibold text-foreground/90">
              {isSignedIn ? "ACCOUNT" : "LOGIN"}
            </h1>
          </div>

          {isSignedIn ? (
            <div className="space-y-4 px-6 py-6">
              <p className="text-sm text-foreground/70">
                Signed in as {session?.user?.email}
              </p>
              <button
                onClick={handleSignOut}
                className="border border-foreground/20 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/70 hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
              <div className="flex items-center gap-6 border-b border-foreground/10 pb-3">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`pb-2 text-[10px] font-mono uppercase tracking-widest ${
                    mode === "signin"
                      ? "text-foreground border-b-2 border-foreground"
                      : "text-foreground/40 hover:text-foreground/70"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`pb-2 text-[10px] font-mono uppercase tracking-widest ${
                    mode === "signup"
                      ? "text-foreground border-b-2 border-foreground"
                      : "text-foreground/40 hover:text-foreground/70"
                  }`}
                >
                  Sign up
                </button>
              </div>

              {mode === "signup" && (
                <div>
                  <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 w-full border border-foreground/20 bg-transparent px-3 text-sm outline-none focus:border-foreground"
                    placeholder="Your name"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full border border-foreground/20 bg-transparent px-3 text-sm outline-none focus:border-foreground"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full border border-foreground/20 bg-transparent px-3 text-sm outline-none focus:border-foreground"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-xs font-mono uppercase tracking-wider text-foreground/60">
                  {error}
                </p>
              )}

              <div className="space-y-3 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || sessionPending}
                  className="w-full border border-foreground px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-background bg-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {mode === "signin" ? "Sign in with email" : "Create account"}
                </button>

                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={isSubmitting || sessionPending}
                  className="w-full border border-foreground/20 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/70 hover:text-foreground disabled:opacity-50"
                >
                  Continue with Google
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
