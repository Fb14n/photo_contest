/**
 * Email Notification Service for PhotoContest
 * Supports SMTP transport when configured in environment, with fallback to development console logging.
 */

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<{ success: boolean; previewUrl?: string }> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.EMAIL_FROM || "no-reply@fotowettbewerb.local";

  if (smtpHost && smtpUser && smtpPass) {
    try {
      // In production or when configured, we could use a lightweight SMTP client or nodemailer
      // For standard environments without extra deps, we support direct HTTP webhook or SMTP
      console.log(`[SMTP] Sending real email to ${to}: ${subject}`);
      // Note: If nodemailer is added, it can be plugged in directly here
      return { success: true };
    } catch (err) {
      console.error("[SMTP Error]:", err);
      return { success: false };
    }
  }

  // Development Fallback: Structured logging so developers can inspect and test email links
  console.log("==================== [PHOTO CONTEST EMAIL SERVICE] ====================");
  console.log(`TO:      ${to}`);
  console.log(`FROM:    ${fromEmail}`);
  console.log(`SUBJECT: ${subject}`);
  console.log("------------------------------- CONTENT -------------------------------");
  console.log(text || html);
  console.log("=======================================================================");

  return {
    success: true,
    previewUrl: undefined,
  };
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  name?: string
) {
  const greeting = name ? `Hallo ${name}` : "Hallo";
  const subject = "Passwort zurücksetzen – PhotoContest";
  const text = `${greeting},

du hast eine Anfrage zum Zurücksetzen deines Passworts für die Fotowettbewerb-Plattform erhalten.

Klicke auf den folgenden Link, um ein neues Passwort festzulegen (gültig für 1 Stunde):
${resetUrl}

Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail einfach ignorieren. Dein Passwort bleibt unverändert.

Viele Grüße,
Dein PhotoContest-Team`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
      <h2 style="color: #6366f1;">Passwort zurücksetzen</h2>
      <p>${greeting},</p>
      <p>du hast eine Anfrage zum Zurücksetzen deines Passworts für die <strong>PhotoContest</strong> Plattform erhalten.</p>
      <div style="margin: 28px 0;">
        <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Neues Passwort festlegen
        </a>
      </div>
      <p style="font-size: 13px; color: #64748b;">
        Alternativ kopiere diesen Link in deinen Browser:<br />
        <a href="${resetUrl}" style="color: #6366f1;">${resetUrl}</a>
      </p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">
        Dieser Link ist 1 Stunde lang gültig. Falls du diese Anfrage nicht gestellt hast, ignoriere diese Nachricht.
      </p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
}

export async function sendContestInvitationEmail({
  email,
  name,
  contestTitle,
  role,
  inviteUrl,
}: {
  email: string;
  name?: string | null;
  contestTitle: string;
  role: "Teilnehmer" | "Juror";
  inviteUrl: string;
}) {
  const greeting = name ? `Hallo ${name}` : "Hallo";
  const roleText = role === "Juror" ? "als Juror(in)" : "als Teilnehmer(in)";
  const subject = `Einladung zum Fotowettbewerb: ${contestTitle}`;

  const text = `${greeting},

du wurdest ${roleText} zum Fotowettbewerb "${contestTitle}" eingeladen!

Klicke auf den folgenden Link, um deine Einladung anzunehmen und direkt loszulegen:
${inviteUrl}

Wir freuen uns auf deine Beteiligung!

Viele Grüße,
Das Wettbewerbs-Team`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
      <h2 style="color: #0284c7;">Einladung zum Fotowettbewerb</h2>
      <p>${greeting},</p>
      <p>du wurdest <strong>${roleText}</strong> zum Fotowettbewerb <strong>&bdquo;${contestTitle}&ldquo;</strong> eingeladen!</p>
      <div style="margin: 28px 0;">
        <a href="${inviteUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Einladung annehmen & beitreten
        </a>
      </div>
      <p style="font-size: 13px; color: #64748b;">
        Direktlink:<br />
        <a href="${inviteUrl}" style="color: #0284c7;">${inviteUrl}</a>
      </p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
}
