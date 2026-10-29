"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, Mail, User, Send, CheckCircle2, AlertCircle, ArrowLeft, Shield } from "lucide-react";

export default function RequestAccountPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/account-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, reason }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Anfrage konnte nicht übermittelt werden.");
        setIsSubmitting(false);
      } else {
        setIsSuccess(true);
        setIsSubmitting(false);
      }
    } catch {
      setErrorMessage("Netzwerkfehler. Bitte versuche es später noch einmal.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-sky-600/15 via-indigo-600/15 to-purple-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Camera className="h-6 w-6" />
          </div>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Nutzerkonto anfordern
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto">
          Die Registrierung erfolgt manuell durch die Wettbewerbsleitung. Fülle das Formular aus, um einen Zugang zu erhalten.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-semibold text-white">Anfrage erfolgreich übermittelt!</h2>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Vielen Dank, <strong>{name}</strong>. Deine Anfrage für die E-Mail-Adresse{" "}
                <span className="text-sky-400">{email}</span> wurde an die Administratoren gesendet.
              </p>
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-[11px] text-neutral-400 text-left">
                💡 Sobald dein Konto genehmigt wird, erhältst du eine E-Mail mit einem Einladungslink, um dein Passwort festzulegen.
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 px-5 py-2.5 text-xs font-semibold text-white transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Zurück zum Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Vollständiger Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="z. B. Max Mustermann"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    E-Mail-Adresse *
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
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Begründung / Notiz (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="z. B. Fotoclub-Mitglied, Fotografen-Info oder gewünschte Teilnahme..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs text-white placeholder-neutral-500 focus:border-sky-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Wird übermittelt..." : "Konto-Anfrage absenden"}
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>

              <div className="mt-6 border-t border-neutral-800/80 pt-4 flex items-center justify-between text-xs text-neutral-400">
                <Link href="/login" className="text-neutral-400 hover:text-white transition flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  Zum Login
                </Link>
                <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                  <Shield className="h-3 w-3 text-sky-400" />
                  <span>Admin-Freigabe</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
