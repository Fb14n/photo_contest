"use client";

import Link from "next/link";
import { Camera, Lock, Mail, ArrowRight, Shield, AlertCircle } from "lucide-react";

export default function RegisterClosedPage() {
  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Camera className="h-6 w-6" />
          </div>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Registrierung geschlossen
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto">
          Eine öffentliche Selbstregistrierung ist auf dieser Plattform deaktiviert. Neue Benutzerkonten werden durch Administratoren freigeschaltet.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-5">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-start gap-3">
            <Shield className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block text-white">Geschützter Fotowettbewerb</span>
              <span>
                Du möchtest als Fotograf oder Juror teilnehmen? Fordere jetzt ein persönliches Nutzerkonto bei der Wettbewerbsleitung an.
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/request-account"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 py-3 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition"
            >
              Nutzerkonto anfordern
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950/80 py-3 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-900 transition"
            >
              Bereits ein Konto? Zum Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
