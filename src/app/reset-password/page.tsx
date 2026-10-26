"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Lock } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-2">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Ungültiger Link</h2>
        <p className="text-xs text-neutral-400">
          Dieser Link enthält keinen gültigen Token zum Zurücksetzen deines Passworts.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block rounded-xl bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700 transition"
        >
          Neuen Link anfordern
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/contests");
          router.refresh();
        }, 2000);
      } else {
        setErrorMessage(data.error || "Zurücksetzen fehlgeschlagen.");
      }
    } catch {
      setErrorMessage("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4 animate-in fade-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-2 border border-emerald-500/20">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Passwort erfolgreich geändert!</h2>
        <p className="text-xs text-neutral-300">
          Du bist nun angemeldet. Du wirst automatisch weitergeleitet...
        </p>
        <Link
          href="/contests"
          className="inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
        >
          Direkt weiter
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20">
          <KeyRound className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Neues Passwort vergeben</h2>
        <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
          Wähle ein sicheres neues Passwort für deinen Zugang.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-neutral-300 mb-1.5">
          Neues Passwort (mind. 6 Zeichen)
        </label>
        <div className="relative">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 pl-10 text-sm text-white placeholder-neutral-500 focus:border-indigo-500 focus:outline-none transition"
            placeholder="••••••••"
          />
          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-300 mb-1.5">
          Passwort wiederholen
        </label>
        <div className="relative">
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 pl-10 text-sm text-white placeholder-neutral-500 focus:border-indigo-500 focus:outline-none transition"
            placeholder="••••••••"
          />
          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
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
            <span>Wird gespeichert...</span>
          </>
        ) : (
          "Passwort speichern & einloggen"
        )}
      </button>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zurück zur Anmeldung
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 backdrop-blur-xl shadow-2xl">
        <Suspense
          fallback={
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-neutral-500" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
