"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  KeyRound,
  Mail,
  UserCheck,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  Copy,
  ExternalLink,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  mustSetPassword: boolean;
  createdAt: string;
  _count: {
    submissions: number;
    ratings: number;
    participants: number;
    jurorEntries: number;
  };
}

interface AccountRequestItem {
  id: string;
  name: string;
  email: string;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<"users" | "requests">("users");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [requests, setRequests] = useState<AccountRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createRole, setCreateRole] = useState("PARTICIPANT");
  const [createPassword, setCreatePassword] = useState("");
  const [createSendEmail, setCreateSendEmail] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Setup / Reset Link Modal
  const [activeLinkInfo, setActiveLinkInfo] = useState<{
    title: string;
    description: string;
    email: string;
    url: string;
    emailSent: boolean;
  } | null>(null);
  const [isSendingResetId, setIsSendingResetId] = useState<string | null>(null);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("PARTICIPANT");
  const [editPassword, setEditPassword] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Approve Request Modal
  const [approvingRequest, setApprovingRequest] = useState<AccountRequestItem | null>(null);
  const [approveRole, setApproveRole] = useState("PARTICIPANT");
  const [approvePassword, setApprovePassword] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [generatedSetupUrl, setGeneratedSetupUrl] = useState<string | null>(null);

  // Confirm Modals State
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [deleteUserSubmissions, setDeleteUserSubmissions] = useState(true);
  const [deleteUserRatings, setDeleteUserRatings] = useState(true);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [requestAction, setRequestAction] = useState<{ id: string; name: string; isDelete: boolean } | null>(null);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  const [userForResetLink, setUserForResetLink] = useState<UserItem | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, requestsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/account-requests"),
      ]);

      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData.users || []);
      }
      if (requestsRes.ok) {
        const rData = await requestsRes.json();
        setRequests(rData.requests || []);
      }
    } catch {
      showError("Fehler beim Laden der Benutzerdaten");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          email: createEmail,
          role: createRole,
          password: createPassword || undefined,
          sendInviteEmail: createSendEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        showError(data.error || "Fehler beim Anlegen");
      } else {
        showSuccess(`Benutzer ${createName} wurde erfolgreich angelegt!`);
        setIsCreateModalOpen(false);
        if (data.setupUrl) {
          setActiveLinkInfo({
            title: "Benutzerkonto angelegt",
            description: data.emailSent
              ? `Eine Aktivierungs-E-Mail wurde erfolgreich an ${createEmail} versendet.`
              : `Das Konto wurde angelegt. Du kannst den Einladungslink auch direkt teilen:`,
            email: createEmail,
            url: data.setupUrl,
            emailSent: !!data.emailSent,
          });
        }
        setCreateName("");
        setCreateEmail("");
        setCreatePassword("");
        setCreateRole("PARTICIPANT");
        setCreateSendEmail(true);
        await loadData();
      }
    } catch {
      showError("Netzwerkfehler beim Anlegen des Benutzers");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Send Password Reset / Activation Link
  const handleSendResetLink = (user: UserItem) => {
    setUserForResetLink(user);
  };

  const handleConfirmSendResetLink = async () => {
    if (!userForResetLink) return;
    const user = userForResetLink;
    setIsSendingResetId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) {
        showError(data.error || "Fehler beim Versenden des Links");
      } else {
        showSuccess(`Passwort-Link an ${user.email} versendet!`);
        setUserForResetLink(null);
        if (data.resetUrl) {
          setActiveLinkInfo({
            title: "Passwort-Link generiert & versendet",
            description: data.emailSent
              ? `Die E-Mail wurde erfolgreich an ${user.email} gesendet.`
              : `Link wurde erstellt (E-Mail konnte nicht zugestellt werden). Du kannst den Link kopieren:`,
            email: user.email,
            url: data.resetUrl,
            emailSent: !!data.emailSent,
          });
        }
      }
    } catch {
      showError("Netzwerkfehler beim Versenden des Links");
    } finally {
      setIsSendingResetId(null);
    }
  };

  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  // Handle Edit User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (editingUser.role === "ADMIN" && editRole !== "ADMIN" && adminCount <= 1) {
      showError("Dem einzigen Administrator kann die Admin-Rolle nicht entzogen werden. Es muss immer mindestens ein Admin existieren.");
      return;
    }

    setIsSavingEdit(true);

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
          password: editPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        showError(data.error || "Fehler beim Aktualisieren");
      } else {
        showSuccess(`Benutzer ${editName} wurde aktualisiert!`);
        setEditingUser(null);
        await loadData();
      }
    } catch {
      showError("Netzwerkfehler beim Aktualisieren");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = (user: UserItem) => {
    if (user.role === "ADMIN" && adminCount <= 1) {
      showError("Der letzte verbleibende Administrator-Account kann nicht gelöscht werden. Es muss immer mindestens ein Admin im System existieren.");
      return;
    }
    setDeleteUserSubmissions(user._count.submissions > 0);
    setDeleteUserRatings(user._count.ratings > 0);
    setUserToDelete(user);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);

    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deleteSubmissions: deleteUserSubmissions,
          deleteRatings: deleteUserRatings,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showError(data.error || "Fehler beim Löschen");
      } else {
        showSuccess(data.message || `Benutzer "${userToDelete.name}" wurde erfolgreich gelöscht.`);
        setUserToDelete(null);
        await loadData();
      }
    } catch {
      showError("Netzwerkfehler beim Löschen des Benutzers");
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Handle Approve Request
  const handleApproveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingRequest) return;
    setIsApproving(true);

    try {
      const res = await fetch(`/api/admin/account-requests/${approvingRequest.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE",
          role: approveRole,
          initialPassword: approvePassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        showError(data.error || "Fehler beim Genehmigen");
        setIsApproving(false);
      } else {
        showSuccess(`Anfrage von ${approvingRequest.name} wurde genehmigt!`);
        setGeneratedSetupUrl(data.setupUrl || null);
        await loadData();
        setIsApproving(false);
      }
    } catch {
      showError("Fehler bei der Genehmigung");
      setIsApproving(false);
    }
  };

  // Handle Reject Request
  const handleRejectRequest = (req: AccountRequestItem) => {
    setRequestAction({ id: req.id, name: req.name, isDelete: false });
  };

  // Handle Delete Request from History
  const handleDeleteRequest = (id: string, name: string) => {
    setRequestAction({ id, name, isDelete: true });
  };

  const handleConfirmRequestAction = async () => {
    if (!requestAction) return;
    setIsProcessingRequest(true);

    try {
      if (requestAction.isDelete) {
        const res = await fetch(`/api/admin/account-requests/${requestAction.id}`, { method: "DELETE" });
        if (res.ok) {
          showSuccess("Anfrage wurde aus dem Verlauf gelöscht.");
          setRequestAction(null);
          await loadData();
        } else {
          showError("Fehler beim Löschen der Anfrage");
        }
      } else {
        const res = await fetch(`/api/admin/account-requests/${requestAction.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "REJECT" }),
        });
        if (res.ok) {
          showSuccess(`Anfrage von "${requestAction.name}" wurde abgelehnt.`);
          setRequestAction(null);
          await loadData();
        } else {
          showError("Fehler beim Ablehnen der Anfrage");
        }
      }
    } catch {
      showError("Netzwerkfehler bei der Ausführung");
    } finally {
      setIsProcessingRequest(false);
    }
  };

  const pendingRequestsCount = requests.filter((r) => r.status === "PENDING").length;

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered requests
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-neutral-800 bg-neutral-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition mb-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Zurück zur Wettbewerbsverwaltung
              </Link>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <Users className="h-6 w-6 text-purple-400" />
                Nutzer- & Zugangsverwaltung
              </h1>
              <p className="text-xs text-neutral-400 mt-1">
                Verwalte Benutzer, weise Rollen zu (Admin, Juror, Teilnehmer) und bearbeite Registrierungs-Anfragen.
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition self-start sm:self-auto"
            >
              <UserPlus className="h-4 w-4" />
              Neuen Benutzer anlegen
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3.5">
              <span className="text-[11px] text-neutral-400 font-medium">Gesamt-Benutzer</span>
              <p className="text-xl font-bold text-white mt-0.5">{users.length}</p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3.5">
              <span className="text-[11px] text-purple-400 font-medium">Administratoren</span>
              <p className="text-xl font-bold text-purple-300 mt-0.5">
                {users.filter((u) => u.role === "ADMIN").length}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3.5">
              <span className="text-[11px] text-indigo-400 font-medium">Juroren</span>
              <p className="text-xl font-bold text-indigo-300 mt-0.5">
                {users.filter((u) => u.role === "JUROR").length}
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5">
              <span className="text-[11px] text-amber-400 font-medium">Offene Anfragen</span>
              <p className="text-xl font-bold text-amber-300 mt-0.5">{pendingRequestsCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        {/* Alerts */}
        {successMessage && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex border-b border-neutral-800 mb-6 gap-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === "users"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            Benutzerkonto-Übersicht ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === "requests"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Clock className="h-4 w-4" />
            Registrierungs-Anfragen
            {pendingRequestsCount > 0 && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Nach Name oder E-Mail suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 pl-10 pr-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {activeTab === "users" ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Rolle:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="ALL">Alle Rollen</option>
                <option value="ADMIN">Administrator</option>
                <option value="JUROR">Juror</option>
                <option value="PARTICIPANT">Teilnehmer</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="ALL">Alle Status</option>
                <option value="PENDING">Offen (Pending)</option>
                <option value="APPROVED">Genehmigt</option>
                <option value="REJECTED">Abgelehnt</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: USERS LIST */}
        {activeTab === "users" && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-xs text-neutral-400">Lade Benutzer...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-xs text-neutral-400">
                Keine Benutzer gefunden.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-800 bg-neutral-950/40 text-neutral-400 uppercase tracking-wider font-semibold text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Benutzer</th>
                      <th className="py-3.5 px-4">Rolle</th>
                      <th className="py-3.5 px-4">Aktivität</th>
                      <th className="py-3.5 px-4">Erstellt am</th>
                      <th className="py-3.5 px-4 text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-neutral-800/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{user.name}</div>
                          <div className="text-[11px] text-neutral-400">{user.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                              user.role === "ADMIN"
                                ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
                                : user.role === "JUROR"
                                ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                                : "border-sky-500/30 bg-sky-500/10 text-sky-300"
                            }`}
                          >
                            {user.role === "ADMIN" && "👑 Admin"}
                            {user.role === "JUROR" && "⚖️ Juror"}
                            {user.role === "PARTICIPANT" && "📷 Teilnehmer"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-300">
                          <div className="flex items-center gap-3 text-[11px]">
                            <span>
                              <strong>{user._count.submissions}</strong> Einreichungen
                            </span>
                            <span>•</span>
                            <span>
                              <strong>{user._count.ratings}</strong> Bewertungen
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-neutral-400 text-[11px]">
                          {new Date(user.createdAt).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleSendResetLink(user)}
                              disabled={isSendingResetId === user.id}
                              className="rounded-lg p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition disabled:opacity-50"
                              title="Passwort-Setzen / Reset-Mail senden"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setEditName(user.name);
                                setEditEmail(user.email);
                                setEditRole(user.role);
                                setEditPassword("");
                              }}
                              className="rounded-lg p-1.5 text-neutral-400 hover:text-sky-300 hover:bg-neutral-800 transition"
                              title="Benutzer bearbeiten / Passwort ändern"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {user.role === "ADMIN" && adminCount <= 1 ? (
                              <button
                                disabled
                                className="rounded-lg p-1.5 text-neutral-600 cursor-not-allowed opacity-40"
                                title="Letzter verbleibender Administrator-Account (geschützt)"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="rounded-lg p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="Benutzer löschen"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REQUESTS LIST */}
        {activeTab === "requests" && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-xs text-neutral-400">Lade Anfragen...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center text-xs text-neutral-400">
                Keine Registrierungs-Anfragen vorhanden.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-800 bg-neutral-950/40 text-neutral-400 uppercase tracking-wider font-semibold text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Antragsteller</th>
                      <th className="py-3.5 px-4">Notiz / Begründung</th>
                      <th className="py-3.5 px-4">Eingegangen am</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-neutral-800/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{req.name}</div>
                          <div className="text-[11px] text-neutral-400">{req.email}</div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="text-[11px] text-neutral-300 italic">
                            {req.reason || "Keine Notiz"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-400 text-[11px]">
                          {new Date(req.createdAt).toLocaleString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          {req.status === "PENDING" && (
                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-300">
                              <Clock className="h-3 w-3" />
                              Offen
                            </span>
                          )}
                          {req.status === "APPROVED" && (
                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                              <CheckCircle className="h-3 w-3" />
                              Genehmigt
                            </span>
                          )}
                          {req.status === "REJECTED" && (
                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border border-rose-500/30 bg-rose-500/10 text-rose-300">
                              <XCircle className="h-3 w-3" />
                              Abgelehnt
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {req.status === "PENDING" ? (
                              <>
                                <button
                                  onClick={() => {
                                    setApprovingRequest(req);
                                    setApproveRole("PARTICIPANT");
                                    setApprovePassword("");
                                    setGeneratedSetupUrl(null);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 transition"
                                >
                                  <UserCheck className="h-3.5 w-3.5" />
                                  Freigeben
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(req)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-neutral-300 hover:text-rose-400 hover:border-rose-500/30 transition"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  Ablehnen
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleDeleteRequest(req.id, req.name)}
                                className="rounded-lg p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="Anfrage aus Verlauf löschen"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: CREATE USER */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-purple-400" />
              Neuen Benutzer anlegen
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Erstelle manuell ein Benutzerkonto für einen Fotografen, Juror oder Administrator.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Max Mustermann"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">E-Mail *</label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="max@beispiel.de"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Rolle *</label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="PARTICIPANT">📷 Teilnehmer (Standard)</option>
                  <option value="JUROR">⚖️ Juror</option>
                  <option value="ADMIN">👑 Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Initiales Passwort (optional)
                </label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Leer lassen für Passwort-Setzen-Link"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Mind. 6 Zeichen oder leer lassen.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="createSendEmail"
                  checked={createSendEmail}
                  onChange={(e) => setCreateSendEmail(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-950 text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                <label htmlFor="createSendEmail" className="text-xs text-neutral-300 cursor-pointer">
                  Aktivierungs- / Einladungs-E-Mail mit Passwort-Link an Benutzer senden
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 disabled:opacity-50"
                >
                  {isCreating ? "Wird angelegt..." : "Benutzer anlegen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <Edit className="h-5 w-5 text-sky-400" />
              Benutzer bearbeiten
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Ändere Rolle, Stammdaten oder vergebe ein neues Passwort.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">E-Mail</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Rolle</label>
                {editingUser?.role === "ADMIN" && adminCount <= 1 ? (
                  <div>
                    <input
                      type="text"
                      disabled
                      value="👑 Administrator (Letzter Admin - geschützt)"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-3.5 py-2 text-xs text-neutral-400 cursor-not-allowed"
                    />
                    <p className="mt-1 text-[11px] text-amber-400">
                      Es muss immer mindestens ein Administrator im System existieren.
                    </p>
                  </div>
                ) : (
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="PARTICIPANT">📷 Teilnehmer</option>
                    <option value="JUROR">⚖️ Juror</option>
                    <option value="ADMIN">👑 Administrator</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Neues Passwort (optional)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leer lassen, um bestehendes Passwort beizubehalten"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 disabled:opacity-50"
                >
                  {isSavingEdit ? "Wird gespeichert..." : "Änderungen speichern"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APPROVE REQUEST */}
      {approvingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-400" />
              Konto-Anfrage freigeben
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Bestätige die Registrierung für <strong>{approvingRequest.name}</strong> (
              {approvingRequest.email}).
            </p>

            {generatedSetupUrl ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
                  ✓ Benutzerkonto wurde erfolgreich aktiviert!
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Persönlicher Aktivierungs-Link (falls E-Mail nicht zugestellt wird):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedSetupUrl}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedSetupUrl);
                        showSuccess("Link in die Zwischenablage kopiert!");
                      }}
                      className="rounded-lg bg-neutral-800 p-2 text-white hover:bg-neutral-700"
                      title="Kopieren"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setApprovingRequest(null);
                      setGeneratedSetupUrl(null);
                    }}
                    className="rounded-xl bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Schließen
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApproveRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Zuzuweisende Rolle *
                  </label>
                  <select
                    value={approveRole}
                    onChange={(e) => setApproveRole(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="PARTICIPANT">📷 Teilnehmer (Fotograf)</option>
                    <option value="JUROR">⚖️ Juror</option>
                    <option value="ADMIN">👑 Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Start-Passwort direkt festlegen (optional)
                  </label>
                  <input
                    type="password"
                    value={approvePassword}
                    onChange={(e) => setApprovePassword(e.target.value)}
                    placeholder="Leer lassen: Nutzer setzt Passwort über Aktivierungslink"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Wenn leer, wird automatisch ein Aktivierungslink zum Setzen des Passworts generiert.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setApprovingRequest(null)}
                    className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isApproving}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {isApproving ? "Wird freigeschaltet..." : "Konto freischalten"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: SETUP / RESET LINK DIALOG */}
      {activeLinkInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-purple-400" />
              {activeLinkInfo.title}
            </h3>
            <p className="text-xs text-neutral-300 mb-4">
              {activeLinkInfo.description}
            </p>

            <div className="space-y-3">
              {activeLinkInfo.emailSent && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>E-Mail wurde erfolgreich per Mailserver versendet.</span>
                </div>
              )}
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Direkter Zugangslink:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={activeLinkInfo.url}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeLinkInfo.url);
                      showSuccess("Link in die Zwischenablage kopiert!");
                    }}
                    className="rounded-lg bg-neutral-800 p-2 text-white hover:bg-neutral-700"
                    title="Kopieren"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-5">
              <button
                onClick={() => setActiveLinkInfo(null)}
                className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/20"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for User Deletion with Toggles */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl p-6 text-white space-y-5">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Benutzerkonto löschen</h3>
                <p className="text-xs text-neutral-400">Diese Aktion kann nicht rückgängig gemacht werden.</p>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-white block">{userToDelete.name}</span>
                  <span className="text-xs text-neutral-400 font-mono">{userToDelete.email}</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-neutral-700 bg-neutral-800 text-neutral-300">
                  {userToDelete.role}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1 border-t border-neutral-800/80">
                <span>📷 {userToDelete._count.submissions} Einreichungen</span>
                <span>⭐ {userToDelete._count.ratings} Bewertungen</span>
                <span>🏆 {userToDelete._count.participants} Wettbewerbe</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-neutral-300">Wähle die gewünschten Lösch-Optionen:</p>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/70 hover:bg-neutral-900/60 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={deleteUserSubmissions}
                  onChange={(e) => setDeleteUserSubmissions(e.target.checked)}
                  className="mt-0.5 rounded accent-red-500 h-4 w-4"
                />
                <div className="flex-1 text-xs">
                  <span className="font-semibold text-white block">
                    Eingereichte Fotos löschen ({userToDelete._count.submissions} Bilder)
                  </span>
                  <span className="text-neutral-400 block mt-0.5">
                    {deleteUserSubmissions
                      ? "Alle Einreichungen dieser Person werden aus allen Wettbewerben und von der Festplatte gelöscht."
                      : "Fotos bleiben in den Wettbewerben erhalten (Name wird als Fotograf beibehalten)."}
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/70 hover:bg-neutral-900/60 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={deleteUserRatings}
                  onChange={(e) => setDeleteUserRatings(e.target.checked)}
                  className="mt-0.5 rounded accent-red-500 h-4 w-4"
                />
                <div className="flex-1 text-xs">
                  <span className="font-semibold text-white block">
                    Abgegebene Bewertungen löschen ({userToDelete._count.ratings} Stimmen)
                  </span>
                  <span className="text-neutral-400 block mt-0.5">
                    {deleteUserRatings
                      ? "Alle vergebenen Punkte und Kommentare dieser Person werden vollständig entfernt."
                      : "Vergebene Punkte bleiben in den Wettbewerbsergebnissen erhalten (anonymisiert)."}
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={handleConfirmDeleteUser}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20 transition disabled:opacity-50"
              >
                {isDeletingUser ? "Wird gelöscht..." : "Benutzer endgültig löschen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Account Request Action */}
      <ConfirmModal
        isOpen={!!requestAction}
        title={requestAction?.isDelete ? "Anfrage aus Verlauf löschen?" : "Konto-Anfrage ablehnen?"}
        message={
          requestAction?.isDelete
            ? `Möchtest du den Anfrage-Eintrag von „${requestAction?.name}“ wirklich dauerhaft aus dem Verlauf entfernen?`
            : `Möchtest du die Registrierungs-Anfrage von „${requestAction?.name}“ wirklich ablehnen? Der Antragsteller erhält keinen Zugriff.`
        }
        confirmText={requestAction?.isDelete ? "Eintrag löschen" : "Anfrage ablehnen"}
        cancelText="Abbrechen"
        variant={requestAction?.isDelete ? "danger" : "warning"}
        isLoading={isProcessingRequest}
        onConfirm={handleConfirmRequestAction}
        onClose={() => {
          if (!isProcessingRequest) setRequestAction(null);
        }}
      />
      {/* Confirmation Modal for Reset Link */}
      <ConfirmModal
        isOpen={!!userForResetLink}
        title="Passwort-Link versenden?"
        message={`Möchtest du einen Zugangs- / Passwort-Zurücksetzen-Link an die Adresse „${userForResetLink?.email}“ (${userForResetLink?.name}) senden?`}
        confirmText="Link versenden"
        cancelText="Abbrechen"
        variant="warning"
        isLoading={isSendingResetId !== null}
        onConfirm={handleConfirmSendResetLink}
        onClose={() => {
          if (isSendingResetId === null) setUserForResetLink(null);
        }}
      />
    </div>
  );
}
