"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Lock, Mail, ArrowRight, AlertCircle, Shield, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    setErrorMessage(null);
    setIsSubmitting(true);

    const targetEmail = loginEmail || email;
    const targetPassword = loginPassword || password;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Ungültige Anmeldedaten.");
        setIsSubmitting(false);
      } else {
        if (data.user?.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/contests");
        }
        router.refresh();
      }
    } catch {
      setErrorMessage("Netzwerkfehler beim Anmelden.");
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 mb-4">
            <Camera className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Willkommen zurück</h1>
          <p className="mt-1 text-xs text-neutral-400">
            Melde dich an, um Fotos einzureichen, zu bewerten oder Wettbewerbe zu verwalten.
          </p>
        </div>

        {/* 1-Click Demo Logins Box (Only shown if NEXT_PUBLIC_SHOW_DEMO=true) */}
        {process.env.NEXT_PUBLIC_SHOW_DEMO === "true" && (
          <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Schnellanmeldung (1-Klick Demo-Rollen)</span>
            </div>
            <p className="text-[11px] text-neutral-400 mb-3">
              Klicke auf einen Button, um dich ohne Passworteingabe sofort in der jeweiligen Rolle anzumelden:
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleLogin("admin@fotowettbewerb.local", "Admin123!")}
                className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-2 text-purple-300 hover:bg-purple-500/20 transition text-center font-medium"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => handleLogin("juror.anna@fotowettbewerb.local", "Jury123!")}
                className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-2 text-indigo-300 hover:bg-indigo-500/20 transition text-center font-medium"
              >
                ⚖️ Juror Anna
              </button>
              <button
                type="button"
                onClick={() => handleLogin("clara.fotografin@fotowettbewerb.local", "User123!")}
                className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-300 hover:bg-sky-500/20 transition text-center font-medium"
              >
                📷 Clara (Fotograf)
              </button>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 sm:p-8 backdrop-blur-xl">
          {errorMessage && (
            <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine.email@beispiel.de"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  Passwort
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-sky-400 hover:text-sky-300 transition"
                >
                  Passwort vergessen?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 transition disabled:opacity-50"
            >
              {isSubmitting ? "Wird angemeldet..." : "Anmelden"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="mt-6 border-t border-neutral-800/80 pt-4 text-center text-xs text-neutral-400">
            Noch kein Konto?{" "}
            <Link href="/request-account" className="text-sky-400 hover:underline font-medium">
              Nutzerkonto anfordern
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
