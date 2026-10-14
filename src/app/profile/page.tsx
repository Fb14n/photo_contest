"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, KeyRound, CheckCircle, AlertCircle, LogOut, ArrowLeft, Shield } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage("Das neue Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Die Passwörter stimmen nicht überein.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Fehler beim Ändern des Passworts.");
      } else {
        setSuccessMessage("Passwort erfolgreich geändert!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch {
      setErrorMessage("Netzwerkfehler");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center animate-pulse">
        <div className="h-8 w-48 bg-neutral-900 rounded mx-auto mb-4" />
        <div className="h-64 bg-neutral-900/60 rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <User className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Nicht angemeldet</h2>
        <p className="text-xs text-neutral-400 mb-6">Bitte melde dich an, um dein Profil zu verwalten.</p>
        <Link
          href="/login"
          className="rounded-xl bg-sky-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-sky-400 transition"
        >
          Zum Login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-12">
      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-6">
        <Link href="/" className="hover:text-white transition flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Startseite
        </Link>
        <span>/</span>
        <span className="text-neutral-200">Profil & Sicherheit</span>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8 backdrop-blur-xl">
        {/* User Card */}
        <div className="flex items-center gap-4 border-b border-neutral-800 pb-6 mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-800 text-sky-400 text-xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{user.name}</h1>
            <p className="text-xs text-neutral-400">{user.email}</p>
            <span className="inline-block mt-1.5 rounded-md bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-sky-400">
              Rolle: {user.role === "ADMIN" ? "Administrator" : user.role === "JUROR" ? "Juror" : "Teilnehmer"}
            </span>
          </div>
        </div>

        {/* Password Change */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Passwort ändern</h2>
          </div>

          {successMessage && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Aktuelles Passwort (falls vergeben)
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Neues Passwort
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Neues Passwort bestätigen
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition disabled:opacity-50"
            >
              {isSaving ? "Wird gespeichert..." : "Passwort aktualisieren"}
            </button>
          </form>
        </div>

        {/* Logout action */}
        <div className="mt-8 border-t border-neutral-800 pt-6 flex justify-between items-center">
          <span className="text-xs text-neutral-400">Sitzung beenden</span>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            Abmelden
          </button>
        </div>
      </div>
    </div>
  );
}
