"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Shield, ArrowRight, AlertCircle, Camera } from "lucide-react";

export default function GatePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Ungültiges Zugangspasswort.");
        setIsSubmitting(false);
      } else {
        // Success: Redirect to login or home
        router.push("/login");
        router.refresh();
      }
    } catch {
      setErrorMessage("Netzwerkfehler. Bitte versuche es erneut.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-sky-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-sky-600/20 to-indigo-600/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center px-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-xl shadow-sky-500/20 mb-6">
          <Camera className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Geschützter Bereich
        </h1>
        <p className="mt-2 text-sm text-neutral-400 max-w-sm mx-auto">
          Diese Fotowettbewerb-Plattform ist passwortgeschützt. Bitte gib das Zugangspasswort ein, um fortzufahren.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {errorMessage && (
            <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Plattform-Zugangspasswort
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Zugangspasswort eingeben..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition disabled:opacity-50"
            >
              {isSubmitting ? "Wird überprüft..." : "Zugang entsperren"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="mt-6 border-t border-neutral-800/80 pt-4 flex items-center justify-center gap-2 text-xs text-neutral-500">
            <Shield className="h-3.5 w-3.5 text-sky-400" />
            <span>Nur für autorisierte Teilnehmer & Juroren</span>
          </div>
        </div>
      </div>
    </div>
  );
}
