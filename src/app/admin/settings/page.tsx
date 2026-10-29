"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";

interface AdminSettings {
  gateEnabled: boolean;
  gatePassword: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [gateEnabled, setGateEnabled] = useState(true);
  const [gatePassword, setGatePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Status banners
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Fehler beim Laden der Einstellungen.");
      } else if (data.settings) {
        setSettings(data.settings);
        setGateEnabled(data.settings.gateEnabled);
        setGatePassword(data.settings.gatePassword);
      }
    } catch {
      setErrorMessage("Netzwerkfehler beim Laden der Einstellungen.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!#$*";
    let generated = "";
    for (let i = 0; i < 16; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGatePassword(generated);
  };

  const handleCopyPassword = () => {
    if (!gatePassword) return;
    navigator.clipboard.writeText(gatePassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (gateEnabled && (!gatePassword || gatePassword.trim().length === 0)) {
      setErrorMessage("Bitte gib ein Hauptpasswort ein, wenn der Website-Schutz aktiv ist.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateEnabled,
          gatePassword: gatePassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Fehler beim Speichern der Einstellungen.");
      } else {
        setSettings(data.settings);
        setGateEnabled(data.settings.gateEnabled);
        setGatePassword(data.settings.gatePassword);
        setSuccessMessage("Die Website-Einstellungen wurden erfolgreich gespeichert!");
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch {
      setErrorMessage("Netzwerkfehler beim Speichern der Einstellungen.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Title */}
      <div className="mb-6 flex flex-col gap-2">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white transition w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Admin-Übersicht
        </Link>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              Plattform-Einstellungen & Schutz
            </h1>
            <p className="text-xs text-neutral-400">
              Verwalte das globale Hauptpasswort und die Sicherheitsvorgaben der Plattform.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-8">
          {/* Section: Gate Toggle */}
          <div>
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-white">
                    Website-Hauptpasswort (Gate-Schutz)
                  </h2>
                  {gateEnabled ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                      <Lock className="h-3 w-3" />
                      Aktiviert
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
                      <Unlock className="h-3 w-3" />
                      Deaktiviert (Offen)
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 max-w-xl">
                  Bestimmt, ob vor dem Aufruf der Website (Startseite, Login, Registrierung) zunächst das globale Hauptpasswort eingegeben werden muss.
                </p>
              </div>

              {/* Switch Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={gateEnabled}
                onClick={() => setGateEnabled(!gateEnabled)}
                className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-neutral-900 ${
                  gateEnabled ? "bg-emerald-600" : "bg-neutral-700"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    gateEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Explanation Callout */}
            <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 text-xs leading-relaxed text-neutral-300">
              {gateEnabled ? (
                <div className="flex items-start gap-2.5">
                  <Info className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
                  <span>
                    <strong>Passwortschutz aktiv:</strong> Jeder Besucher muss auf der Vorschaltseite das unten stehende Hauptpasswort eingeben, bevor Inhalte sichtbar sind. Bereits autorisierte Besucher behalten ihren Zugang für 30 Tage.
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2.5">
                  <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    <strong>Passwortschutz deaktiviert:</strong> Die Plattform ist direkt öffentlich erreichbar. Besucher gelangen ohne Vorschaltseite direkt zur Startseite und zum Login.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section: Password Input (when enabled or setting up) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-neutral-300">
                Hauptpasswort für die Plattform
              </label>
              {gateEnabled && (
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Zufälliges Passwort generieren
                </button>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <KeyRound className="h-4 w-4" />
              </div>

              <input
                type={showPassword ? "text" : "password"}
                disabled={!gateEnabled}
                value={gatePassword}
                onChange={(e) => setGatePassword(e.target.value)}
                placeholder={gateEnabled ? "Hauptpasswort eingeben..." : "Schutz ist derzeit deaktiviert"}
                className={`w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-24 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-40 disabled:cursor-not-allowed font-mono`}
              />

              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                <button
                  type="button"
                  disabled={!gateEnabled || !gatePassword}
                  onClick={handleCopyPassword}
                  title="Passwort kopieren"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition disabled:opacity-30"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  disabled={!gateEnabled}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition disabled:opacity-30"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {settings?.updatedAt && (
              <p className="text-[11px] text-neutral-500">
                Zuletzt geändert am {new Date(settings.updatedAt).toLocaleString("de-DE")}
                {settings.updatedBy ? ` von ${settings.updatedBy}` : ""}.
              </p>
            )}
          </div>

          {/* Section: Additional Security Info Card */}
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/40 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-400" />
              Integrierter Systemschutz für Administrator-Accounts
            </h3>
            <p className="text-xs leading-relaxed text-neutral-400">
              Um eine versehentliche Aussperrung aus dem System zu verhindern, ist die Löschung oder Herabstufung des letzten verbleibenden Administrator-Accounts systemweit blockiert.
            </p>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
            <Link
              href="/admin"
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 hover:from-purple-500 hover:to-indigo-500 transition disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Wird gespeichert..." : "Einstellungen speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
