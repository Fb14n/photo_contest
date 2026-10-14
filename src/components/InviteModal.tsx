"use client";

import { useState } from "react";
import { X, Copy, Check, QrCode, Download, ExternalLink } from "lucide-react";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteData: {
    email: string;
    name?: string | null;
    inviteUrl: string;
    qrCode: string;
    role: "Teilnehmer" | "Juror";
  } | null;
}

export default function InviteModal({ isOpen, onClose, inviteData }: InviteModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !inviteData) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteData.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    const link = document.createElement("a");
    link.href = inviteData.qrCode;
    link.download = `QR-Code_${inviteData.email}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <QrCode className="h-5 w-5 text-sky-400" />
          <h3 className="text-lg font-bold text-white">Einladungszugang & QR-Code</h3>
        </div>
        <p className="text-xs text-neutral-400 mb-5">
          Für {inviteData.role}: <strong className="text-neutral-200">{inviteData.email}</strong>
        </p>

        {/* QR Code display */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-800 bg-white p-5 mb-5 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={inviteData.qrCode}
            alt="Einladungs-QR-Code"
            className="h-52 w-52 object-contain"
          />
          <span className="text-[10px] text-neutral-500 font-medium mt-2">
            Mit Smartphone-Kamera scannen für Sofort-Zugang
          </span>
        </div>

        {/* Direct Link Input with Copy */}
        <div className="space-y-2 mb-5">
          <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Direkter Magic-Link (Einladungslink)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteData.inviteUrl}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-300 font-mono focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-400 transition shrink-0 shadow-md shadow-sky-500/20"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Kopiert!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Kopieren
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
          <button
            onClick={handleDownloadQr}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
          >
            <Download className="h-3.5 w-3.5" />
            QR-Code als Bild speichern
          </button>

          <a
            href={inviteData.inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-sky-400 hover:underline"
          >
            Im neuen Tab testen
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
