"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, Shield, User as UserIcon, LogOut, Award, PlusCircle, KeyRound, Users, Settings } from "lucide-react";

interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Camera className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-white text-base">PhotoContest</span>
            <span className="text-[10px] text-neutral-400 -mt-1 font-mono tracking-wider uppercase">Plattform</span>
          </div>
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/contests"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname.startsWith("/contests") && !pathname.includes("/admin")
                ? "text-sky-400 bg-sky-500/10"
                : "text-neutral-300 hover:text-white hover:bg-neutral-900"
            }`}
          >
            Wettbewerbe
          </Link>

          {user?.role === "ADMIN" && (
            <>
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === "/admin"
                    ? "text-purple-400 bg-purple-500/10"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <Shield className="h-4 w-4" />
                Wettbewerbe
              </Link>
              <Link
                href="/admin/users"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname.startsWith("/admin/users")
                    ? "text-purple-400 bg-purple-500/10"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <Users className="h-4 w-4" />
                Nutzerverwaltung
              </Link>
              <Link
                href="/admin/settings"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === "/admin/settings"
                    ? "text-purple-400 bg-purple-500/10"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <Settings className="h-4 w-4" />
                Einstellungen
              </Link>
              <Link
                href="/admin/contests/new"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === "/admin/contests/new"
                    ? "text-purple-400 bg-purple-500/10"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <PlusCircle className="h-4 w-4" />
                Wettbewerb erstellen
              </Link>
            </>
          )}
        </nav>

        {/* Right side auth */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-24 bg-neutral-900 animate-pulse rounded-lg" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-200 hover:border-neutral-700 hover:bg-neutral-850 transition"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800 text-sky-400 font-semibold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-medium text-white leading-tight truncate max-w-[130px]">{user.name}</div>
                  <div className="text-[10px] text-neutral-400 capitalize">
                    {user.role === "ADMIN" ? "Administrator" : user.role === "JUROR" ? "Juror" : "Teilnehmer"}
                  </div>
                </div>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-neutral-800 bg-neutral-900/95 p-1.5 text-sm shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-neutral-800 mb-1">
                    <p className="text-xs text-neutral-400">Angemeldet als</p>
                    <p className="text-xs font-semibold text-white truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-sky-400">
                      Rolle: {user.role}
                    </span>
                  </div>

                  {user.role === "ADMIN" && (
                    <>
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
                      >
                        <Shield className="h-4 w-4 text-purple-400" />
                        Wettbewerbe verwalten
                      </Link>
                      <Link
                        href="/admin/users"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
                      >
                        <Users className="h-4 w-4 text-purple-400" />
                        Nutzerverwaltung
                      </Link>
                      <Link
                        href="/admin/settings"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
                      >
                        <Settings className="h-4 w-4 text-purple-400" />
                        Einstellungen & Gate
                      </Link>
                    </>
                  )}

                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
                  >
                    <KeyRound className="h-4 w-4 text-neutral-400" />
                    Passwort & Profil
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition text-left mt-1"
                  >
                    <LogOut className="h-4 w-4" />
                    Abmelden
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-1.5 text-sm font-medium text-white hover:border-neutral-700 hover:bg-neutral-800 transition"
              >
                <UserIcon className="h-4 w-4 text-sky-400" />
                Anmelden
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
