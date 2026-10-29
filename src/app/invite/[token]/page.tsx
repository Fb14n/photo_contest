"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Camera,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Lock,
  User,
} from "lucide-react";

export default function ClaimInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<{
    type: "PARTICIPANT" | "JUROR";
    contest: { title: string; slug: string; description: string };
    email: string;
    name: string;
    hasPassword: boolean;
  } | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/invites/${resolvedParams.token}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.valid) {
          setError(data.error || "Ungültiger oder abgelaufener Einladungslink.");
        } else {
          setInviteData(data);
          setName(data.name || "");
        }
      })
      .catch(() => setError("Fehler beim Prüfen des Einladungslinks"))
      .finally(() => setLoading(false));
  }, [resolvedParams.token]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/invites/${resolvedParams.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          password: password ? password : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setSubmitError(data.error || "Fehler beim Einlösen des Tokens");
        setIsSubmitting(false);
      } else {
        router.push(data.redirectUrl || `/contests/${inviteData?.contest.slug}`);
        router.refresh();
      }
    } catch {
      setSubmitError("Netzwerkfehler");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center animate-pulse">
        <div className="h-10 w-48 bg-neutral-900 rounded mx-auto mb-4" />
        <div className="h-64 bg-neutral-900/60 rounded-2xl" />
      </div>
    );
  }

  if (error || !inviteData) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Ungültige Einladung</h2>
        <p className="text-sm text-neutral-400 mb-6">{error || "Dieser Einladungslink ist ungültig oder abgelaufen."}</p>
        <Link
          href="/"
          className="rounded-xl bg-neutral-800 px-5 py-2 text-xs font-semibold text-white hover:bg-neutral-700 transition"
        >
          Zur Startseite
        </Link>
      </div>
    );
  }

  const isJuror = inviteData.type === "JUROR";

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg mb-4 ${
              isJuror
                ? "bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-600/20"
                : "bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-sky-500/20"
            }`}
          >
            {isJuror ? <ShieldCheck className="h-7 w-7" /> : <Camera className="h-7 w-7" />}
          </div>
          <span
            className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${
              isJuror ? "bg-purple-500/10 text-purple-400" : "bg-sky-500/10 text-sky-400"
            }`}
          >
            {isJuror ? "Jury-Einladung" : "Teilnehmer-Einladung"}
          </span>
          <h1 className="text-2xl font-bold text-white">{inviteData.contest.title}</h1>
          <p className="mt-1 text-xs text-neutral-400">
            Du wurdest eingeladen mit: <strong className="text-neutral-200">{inviteData.email}</strong>
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 sm:p-8 backdrop-blur-xl">
          {submitError && (
            <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{submitError}</span>
            </div>
          )}

          {inviteData.hasPassword && (
            <div className="mb-6 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3.5 text-xs text-sky-200">
              <p className="font-semibold text-white mb-1">
                ✓ Du hast bereits ein aktives Nutzerkonto!
              </p>
              <p className="text-sky-300 leading-relaxed">
                Deine E-Mail ist bereits im System registriert. Du musst kein neues Passwort vergeben. Klicke einfach unten auf „Einladung annehmen“ oder melde dich direkt mit deinem bestehenden Konto an.
              </p>
              <div className="mt-2.5">
                <Link
                  href={`/login?redirect=/contests/${inviteData.contest.slug}`}
                  className="font-semibold text-white underline hover:text-sky-300"
                >
                  Mit bestehendem Passwort anmelden &rarr;
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleClaim} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Dein Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dein Name"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-3.5 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                {inviteData.hasPassword
                  ? "Passwort (optional neu setzen)"
                  : "Passwort vergeben (mind. 6 Zeichen)"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="password"
                  required={!inviteData.hasPassword}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-3.5 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Damit kannst du dich später jederzeit wieder einloggen und deine Noten oder Bilder bearbeiten.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white shadow-lg transition disabled:opacity-50 ${
                isJuror
                  ? "bg-purple-600 hover:bg-purple-500 shadow-purple-600/20"
                  : "bg-sky-500 hover:bg-sky-400 shadow-sky-500/20"
              }`}
            >
              {isSubmitting
                ? "Wird aktiviert..."
                : isJuror
                ? "Einladung annehmen & zur Jurierung"
                : "Einladung annehmen & zum Wettbewerb"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
