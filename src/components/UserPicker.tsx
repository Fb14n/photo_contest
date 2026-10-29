"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Check, Users, User, X, CheckSquare, Square } from "lucide-react";

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserPickerProps {
  label: string;
  description?: string;
  selectedEmails: string[];
  onChange: (emails: string[]) => void;
  accentColor?: "sky" | "purple";
  excludeEmails?: string[];
}

export default function UserPicker({
  label,
  description,
  selectedEmails,
  onChange,
  accentColor = "sky",
  excludeEmails = [],
}: UserPickerProps) {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.users)) {
          setUsers(data.users);
        }
      })
      .catch((err) => console.error("Error loading users for picker:", err))
      .finally(() => setLoading(false));
  }, []);

  const normalizedExcluded = useMemo(
    () => new Set(excludeEmails.map((e) => e.toLowerCase())),
    [excludeEmails]
  );

  const availableUsers = useMemo(() => {
    return users.filter((u) => !normalizedExcluded.has(u.email.toLowerCase()));
  }, [users, normalizedExcluded]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableUsers;
    return availableUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [availableUsers, search]);

  const selectedSet = useMemo(
    () => new Set(selectedEmails.map((e) => e.toLowerCase())),
    [selectedEmails]
  );

  const toggleUser = (email: string) => {
    const lower = email.toLowerCase();
    if (selectedSet.has(lower)) {
      onChange(selectedEmails.filter((e) => e.toLowerCase() !== lower));
    } else {
      onChange([...selectedEmails, lower]);
    }
  };

  const selectAllFiltered = () => {
    const combined = new Set(selectedEmails.map((e) => e.toLowerCase()));
    filteredUsers.forEach((u) => combined.add(u.email.toLowerCase()));
    onChange(Array.from(combined));
  };

  const deselectAllFiltered = () => {
    const toRemove = new Set(filteredUsers.map((u) => u.email.toLowerCase()));
    onChange(selectedEmails.filter((e) => !toRemove.has(e.toLowerCase())));
  };

  const isAllFilteredSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedSet.has(u.email.toLowerCase()));

  const isPurple = accentColor === "purple";
  const activeBorder = isPurple ? "border-purple-500" : "border-sky-500";
  const activeBg = isPurple ? "bg-purple-500/10" : "bg-sky-500/10";
  const activeText = isPurple ? "text-purple-400" : "text-sky-400";
  const badgeBg = isPurple ? "bg-purple-500/20 text-purple-300" : "bg-sky-500/20 text-sky-300";

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-semibold text-neutral-200">
            {label}
          </label>
          {description && (
            <p className="text-[11px] text-neutral-400 mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium border ${
            selectedEmails.length > 0
              ? `${activeBg} ${activeText} ${activeBorder}`
              : "bg-neutral-900 border-neutral-800 text-neutral-400"
          }`}>
            <Users className="h-3.5 w-3.5" />
            {selectedEmails.length} ausgewählt
          </span>
        </div>
      </div>

      {/* Selected chips bar */}
      {selectedEmails.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80 max-h-24 overflow-y-auto">
          {selectedEmails.map((email) => {
            const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
            return (
              <span
                key={email}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium border border-neutral-700/60 ${badgeBg}`}
              >
                <span>{user ? user.name : email}</span>
                <button
                  type="button"
                  onClick={() => toggleUser(email)}
                  className="rounded hover:bg-neutral-800/60 p-0.5 text-neutral-400 hover:text-white transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Bestehende Nutzer nach Name oder E-Mail filtern..."
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={isAllFilteredSelected ? deselectAllFiltered : selectAllFiltered}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
          >
            {isAllFilteredSelected ? (
              <>
                <Square className="h-3.5 w-3.5" />
                Auswahl aufheben
              </>
            ) : (
              <>
                <CheckSquare className="h-3.5 w-3.5 text-sky-400" />
                Alle auswählen ({filteredUsers.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* User list */}
      <div className="max-h-48 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950/60 divide-y divide-neutral-900">
        {loading ? (
          <div className="p-4 text-center text-xs text-neutral-500">
            Lade registrierte Nutzer...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-xs text-neutral-500">
            {search ? "Keine passenden Nutzer gefunden." : "Keine weiteren Nutzer verfügbar."}
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isSelected = selectedSet.has(u.email.toLowerCase());
            return (
              <div
                key={u.id}
                onClick={() => toggleUser(u.email)}
                className={`flex items-center justify-between p-2.5 cursor-pointer transition select-none ${
                  isSelected ? `${activeBg}` : "hover:bg-neutral-900/50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                      isSelected
                        ? isPurple
                          ? "bg-purple-600 border-purple-600 text-white"
                          : "bg-sky-500 border-sky-500 text-white"
                        : "border-neutral-700 bg-neutral-900"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">
                        {u.name}
                      </span>
                      {u.role === "ADMIN" && (
                        <span className="rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1 py-0.2 text-[9px] font-semibold uppercase">
                          Admin
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-400 truncate block">
                      {u.email}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
