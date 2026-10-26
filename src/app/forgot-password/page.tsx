"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, KeyRound, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setErrorMessage(data.error || "Fehler beim Senden der Anfrage.");
      }
    } catch {
      setErrorMessage("Verbindung zum Server fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 backdrop-blur-xl shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20">
            <KeyRound className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Passwort vergessen?</h2>
          <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
            Gib deine E-Mail-Adresse ein. Wir senden dir einen sicheren Link, mit dem du ein neues Passwort vergeben kannst.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-6 animate-in fade-in">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
              <h3 className="text-sm font-semibold text-white">E-Mail wurde verschickt</h3>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                Falls ein Account für <strong className="text-white">{email}</strong> existiert, erhältst du in wenigen Augenblicken eine E-Mail mit dem Reset-Link.
              </p>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Zurück zur Anmeldung
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-neutral-300 mb-1.5">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@beispiel.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 pl-10 text-sm text-white placeholder-neutral-500 focus:border-indigo-500 focus:outline-none transition"
                />
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Wird gesendet...</span>
                </>
              ) : (
                "Reset-Link anfordern"
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Zurück zum Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
