# 📷 PhotoContest – Fotowettbewerb-Plattform

Eine moderne, selbstgehostete Web-Plattform zum **Erstellen, Verwalten und Bewerten von Fotowettbewerben**. Entwickelt mit Next.js 16, React 19, TypeScript, Tailwind CSS, Sharp für EXIF/Bildverarbeitung und Prisma mit SQLite.

---

## ✨ Features im Überblick

### 1. Admin-Verwaltung & Wettbewerbserstellung
- **Übersicht (`/admin`)**: Übersicht aller aktiven, geplanten und beendeten Wettbewerbe mit Kennzahlen zu Einreichungen, Teilnehmern und Juroren.
- **Wettbewerb anlegen (`/admin/contests/new`)**:
  - **Zugangstypen**:
    - *Offener Link*: Jeder kann teilnehmen und sich registrieren.
    - *Geschlossen (Invite-Only)*: Nur Teilnehmer auf der Einladungsliste erhalten Zugang.
  - **Teilnehmer-Begrenzung**: Optionale Obergrenze für Teilnehmer.
  - **Fristen**: Getrennte Zeiträume für Einreichung (*Submission*) und Bewertung (*Jurierung*).
  - **Bewertungsmodus**:
    - *Exklusive Fach-Jury*: Nur eingeteilte Juroren mit Jury-Account können bewerten.
    - *Peer-Review*: Nach Einreichungsende dürfen Teilnehmer alle fremden Bilder mitbewerten (eigenes Bild gesperrt).
  - **Themenkategorien (Themen)**: Beliebig viele Themen mit individueller Maximalanzahl an Bildern pro Fotograf.
  - **Strenge Bildregeln**:
    - Maximale Dateigröße (MB).
    - Mindest- & Maximalabmessungen (Breite / Höhe in Pixeln).
    - Erlaubte Dateiformate (JPEG, PNG, WebP).
    - Seitenverhältnis-Vorgaben (z. B. 3:2, 16:9, 1:1 oder frei).
    - Optionale Dateinamens-Muster.
  - **EXIF-Auslesung**: Automatisches Auslesen von Kameramodell, Objektiv, Brennweite, Blende, Verschlusszeit und ISO via Sharp.

### 2. Einladungsmanagement & E-Mail-Versand (`/admin/contests/[id]/invites`)
- Generierung personalisierter Einladungslinks für Teilnehmer und Juroren.
- Automatischer oder manueller **E-Mail-Versand** mit persönlichem Direktzugangslink.
- Anzeige und Download hochauflösender **QR-Codes** für Druck, Flyer oder E-Mail-Einladungen.
- Direkte Token-Aktivierung unter `/invite/[token]`.

### 3. Foto-Einreichung & Farbraumprüfung (`/contests/[slug]/submit`)
- Drag-and-Drop Upload-Zone mit Client- und Server-seitiger Vorab-Prüfung der Wettbewerbsregeln.
- Farbraum-Erkennung (sRGB-Prüfung und Schutz vor fehlerhaften CMYK-Druckfarben).
- Vorschau der Bilddimensionen und EXIF-Metadaten vor dem Upload.
- Galerie der eigenen eingereichten Bilder mit Option zum Löschen/Ersetzen bis zum Fristende.

### 4. Jurierungsraum & Zoom-Lupe (`/contests/[slug]/judge`)
- Fokussierter Vollbild-Bewertungsmodus für Juroren.
- **Interaktive Zoom- & Pan-Lupe** (bis zu 400% Zoom, Drag-to-Pan, Mausrad-Steuerung und Vollbild-Inspektion für Schärfe- und Rauschprüfung).
- Vergabe von **0 bis 10 Punkten** (inkl. Dezimalwerten) und optionalem Textkommentar.
- **Jederzeit änderbar**: Juroren können ihre Bewertungen bis zum Ende der Jurierungsphase beliebig oft korrigieren.
- Filter nach *Alle*, *Unbewertet* und *Bereits bewertet*.
- Tastatur- und Klick-Navigation durch alle Einreichungen.
- Optionale Anonymisierung (Fotografen-Namen werden vor der Jury verborgen).

### 5. Teilnehmer-Dashboard & Profil (`/profile`)
- Zentrale Galerie aller eigenen Foto-Einreichungen mit Status und Stimmzähler.
- Übersicht der eigenen aktiven Wettbewerbe und Jury-Aufgaben mit Direktlinks.
- Sichere Passwortänderung und vollständiger **Passwort-Vergessen / Zurücksetzen** Flow (`/forgot-password` & `/reset-password`).

### 6. Statistiken & Ranglisten (`/contests/[slug]/results` & `/admin/contests/[id]/stats`)
- **Podium & Gewinner**: Gold, Silber und Bronze für Gesamtsieger.
- **Themen-Ranglisten**: Platzierungen gefiltert nach einzelnen Wettbewerbsthemen.
- **Admin-Auswertung**:
  - Juror-Fortschritt in Prozent (wer hat wie viele Bilder bewertet).
  - Notenverteilung in Punkte-Intervallen (0-2, 2-4, 4-6, 6-8, 8-10).
  - Einzeleinsicht in alle Juroren-Noten und Begründungen.
  - CSV-Export aller Ergebnisse für Tabellenkalkulationen.

---

## 🚀 Schnellanleitung (Lokal starten)

### 1. Installation & Start
```bash
# Abhängigkeiten installieren
npm install

# Datenbank initialisieren & Demo-Daten generieren
npx tsx prisma/seed.ts
npx tsx prisma/seed-images.ts

# Entwicklungs-Server starten
npm run dev
```

Die Website ist anschließend unter **`http://localhost:3000`** erreichbar.

---

## 🔑 Vorkonfigurierte Test-Accounts

Für schnelles lokales Testen stehen auf der Startseite (`/`) und der Login-Seite (`/login`) **1-Klick-Demo-Buttons** bereit:

| Rolle | E-Mail | Passwort | Beschreibung |
|---|---|---|---|
| **Administrator** | `admin@fotowettbewerb.local` | `Admin123!` | Voller Zugriff auf Dashboard, Erstellung, Einladungen & Statistiken |
| **Jurorin** | `juror.anna@fotowettbewerb.local` | `Jury123!` | Bewertet Bilder (0-10 Punkte) im Architektur-Wettbewerb |
| **Juror** | `juror.bernd@fotowettbewerb.local` | `Jury123!` | Zweiter Juror zum Testen von Mehrfach-Bewertungen |
| **Teilnehmerin** | `clara.fotografin@fotowettbewerb.local` | `User123!` | Hat bereits Fotos eingereicht und kann weitere hochladen |

---

## 🛠️ Verwendete Technologien
- **Frontend / Fullstack Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Datenbank & ORM**: SQLite (`dev.db`), Prisma 6
- **Bildverarbeitung & EXIF**: Sharp
- **Authentifizierung**: Statelose HTTP-Only JWT Cookies (`jose`), Passwörter gehasht mit `bcryptjs`
- **QR-Codes**: `qrcode` (PNG & Data-URL Generator)
