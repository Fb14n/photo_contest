"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  requiredKeyword?: string;
  keywordPlaceholder?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Löschen bestätigen",
  cancelText = "Abbrechen",
  variant = "danger",
  isLoading = false,
  requiredKeyword,
  keywordPlaceholder,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const [enteredKeyword, setEnteredKeyword] = useState("");

  useEffect(() => {
    if (isOpen) {
      setEnteredKeyword("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isKeywordMatching = !requiredKeyword || enteredKeyword.trim().toLowerCase() === requiredKeyword.trim().toLowerCase();
  const canConfirm = isKeywordMatching && !isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isLoading) onClose();
        }}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-left shadow-2xl transition-all sm:my-8 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              variant === "danger"
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            {variant === "danger" ? (
              <Trash2 className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-base font-semibold text-white leading-6">
              {title}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-300">
              {message}
            </p>

            {requiredKeyword && (
              <div className="mt-4">
                <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">
                  Tippe zur Bestätigung <span className="font-mono font-semibold text-white bg-neutral-800 px-1.5 py-0.5 rounded">„{requiredKeyword}“</span> ein:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={enteredKeyword}
                  onChange={(e) => setEnteredKeyword(e.target.value)}
                  placeholder={keywordPlaceholder || requiredKeyword}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto rounded-xl border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed ${
              variant === "danger"
                ? "bg-rose-600 shadow-rose-600/20 hover:bg-rose-500"
                : "bg-amber-600 shadow-amber-600/20 hover:bg-amber-500"
            }`}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
