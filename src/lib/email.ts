import nodemailer from "nodemailer";

/**
 * Email Notification Service for PhotoContest
 * Supports SMTP transport via Nodemailer when configured, with fallback to development console logging.
 */

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  senderType?: "noreply" | "contest";
  replyTo?: string;
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  senderType = "noreply",
  replyTo,
}: EmailOptions): Promise<{ success: boolean; previewUrl?: string }> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

  // Primary noreply credentials
  const noreplyUser = process.env.SMTP_USER || "noreply@bergerdd.de";
  const noreplyPass = process.env.SMTP_PASS;
  const noreplyFrom = process.env.EMAIL_FROM || `PhotoContest <${noreplyUser}>`;

  // Contest-specific credentials (optional, fallback to noreply)
  const contestUser = process.env.SMTP_CONTEST_USER || "fotowettbewerb@bergerdd.de";
  const contestPass = process.env.SMTP_CONTEST_PASS || noreplyPass;
  const contestFrom = process.env.EMAIL_FROM_CONTEST || `Fotowettbewerb <${contestUser}>`;

  // Select sender based on email purpose
  const useContestSender = senderType === "contest" && contestPass;
  const selectedUser = useContestSender ? contestUser : noreplyUser;
  const selectedPass = useContestSender ? contestPass : noreplyPass;
  const selectedFrom = useContestSender ? contestFrom : noreplyFrom;
  const selectedReplyTo = replyTo || (senderType === "contest" ? contestUser : undefined);

  if (smtpHost && selectedPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: selectedUser,
          pass: selectedPass,
        },
        tls: {
          rejectUnauthorized: process.env.SMTP_IGNORE_TLS !== "true",
        },
      });

      const info = await transporter.sendMail({
        from: selectedFrom,
        to,
        subject,
        text,
        html,
        replyTo: selectedReplyTo,
      });

      console.log(`[SMTP] E-Mail gesendet von ${selectedFrom} an ${to} (MessageId: ${info.messageId})`);
      return { success: true };
    } catch (err) {
      console.error("[SMTP Error]:", err);
      return { success: false };
    }
  }

  // Development Fallback: Structured logging so developers can inspect and test email links
  console.log("==================== [PHOTO CONTEST EMAIL SERVICE] ====================");
  console.log(`TO:       ${to}`);
  console.log(`FROM:     ${selectedFrom}`);
  if (selectedReplyTo) console.log(`REPLY-TO: ${selectedReplyTo}`);
  console.log(`SUBJECT:  ${subject}`);
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

  return sendEmail({
    to: email,
    subject,
    text,
    html,
    senderType: "noreply",
  });
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

  return sendEmail({
    to: email,
    subject,
    text,
    html,
    senderType: "contest",
    replyTo: process.env.CONTEST_CONTACT_EMAIL || "fotowettbewerb@bergerdd.de",
  });
}

export async function sendExistingUserContestInvitationEmail({
  email,
  name,
  contestTitle,
  contestSlug,
  role,
}: {
  email: string;
  name?: string | null;
  contestTitle: string;
  contestSlug: string;
  role: "Teilnehmer" | "Juror";
}) {
  const greeting = name ? `Hallo ${name}` : "Hallo";
  const roleText = role === "Juror" ? "als Juror(in)" : "als Teilnehmer(in)";
  const subject = `Einladung zum Fotowettbewerb: ${contestTitle}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const contestUrl = `${appUrl}/contests/${contestSlug}`;

  const text = `${greeting},

du wurdest ${roleText} zum Fotowettbewerb "${contestTitle}" eingeladen!

Da du bereits ein registriertes Konto bei PhotoContest besitzt, ist keine Neuanmeldung oder Passwortvergabe nötig. Melde dich einfach wie gewohnt mit deinen Zugangsdaten an:
${contestUrl}

Wir freuen uns auf deine Teilnahme!

Viele Grüße,
Dein PhotoContest-Team`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
      <h2 style="color: #0284c7;">Einladung zum Fotowettbewerb</h2>
      <p>${greeting},</p>
      <p>du wurdest <strong>${roleText}</strong> zum Fotowettbewerb <strong>&bdquo;${contestTitle}&ldquo;</strong> eingeladen!</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 18px 0; font-size: 13px; color: #475569;">
        ℹ️ <strong>Bestehendes Konto:</strong> Da du bereits ein Nutzerkonto besitzt, ist kein neues Passwort erforderlich. Melde dich einfach mit deinen bekannten Zugangsdaten an.
      </div>
      <div style="margin: 28px 0;">
        <a href="${contestUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Direkt zum Wettbewerb
        </a>
      </div>
      <p style="font-size: 13px; color: #64748b;">
        Direktlink:<br />
        <a href="${contestUrl}" style="color: #0284c7;">${contestUrl}</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
    senderType: "contest",
    replyTo: process.env.CONTEST_CONTACT_EMAIL || "fotowettbewerb@bergerdd.de",
  });
}

export async function sendAccountRequestNotificationToAdmin({
  name,
  email,
  reason,
}: {
  name: string;
  email: string;
  reason?: string | null;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@fotowettbewerb.local";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const adminUsersUrl = `${appUrl}/admin/users`;

  const subject = `Neue Nutzerkonto-Anfrage von ${name}`;
  const text = `Hallo Admin,

es ist eine neue Anfrage für ein Nutzerkonto eingegangen:

Name: ${name}
E-Mail: ${email}
Begründung: ${reason || "Keine Begründung angegeben"}

Du kannst die Anfrage im Admin-Bereich einsehen und freigeben oder ablehnen:
${adminUsersUrl}

Viele Grüße,
Dein PhotoContest-System`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
      <h2 style="color: #0284c7;">Neue Konto-Anfrage</h2>
      <p>Es liegt eine neue Anfrage zur Registrierung vor:</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Name:</strong> ${name}</p>
        <p style="margin: 4px 0;"><strong>E-Mail:</strong> ${email}</p>
        <p style="margin: 4px 0;"><strong>Begründung:</strong> ${reason || "<em>Keine Begründung angegeben</em>"}</p>
      </div>
      <div style="margin: 24px 0;">
        <a href="${adminUsersUrl}" style="background-color: #0284c7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Im Admin-Panel prüfen & freigeben
        </a>
      </div>
    </div>
  `;

  return sendEmail({ to: adminEmail, subject, text, html });
}

export async function sendAccountApprovedEmail({
  email,
  name,
  role,
  setupUrl,
}: {
  email: string;
  name: string;
  role: string;
  setupUrl: string;
}) {
  const subject = "Dein Nutzerkonto wurde freigeschaltet – PhotoContest";
  const roleName = role === "JUROR" ? "Juror" : role === "ADMIN" ? "Administrator" : "Teilnehmer";

  const text = `Hallo ${name},

deine Anfrage für ein Nutzerkonto auf der Fotowettbewerb-Plattform wurde genehmigt!
Deine Rolle: ${roleName}

Klicke auf den folgenden Link, um dein Passwort festzulegen und dich anzumelden:
${setupUrl}

Viele Grüße,
Dein PhotoContest-Team`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
      <h2 style="color: #10b981;">Konto freigeschaltet!</h2>
      <p>Hallo ${name},</p>
      <p>deine Anfrage für ein Nutzerkonto wurde von einem Administrator genehmigt.</p>
      <p>Zugewiesene Rolle: <strong>${roleName}</strong></p>
      <div style="margin: 28px 0;">
        <a href="${setupUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Passwort festlegen & einloggen
        </a>
      </div>
      <p style="font-size: 13px; color: #64748b;">
        Alternativer Link:<br />
        <a href="${setupUrl}" style="color: #10b981;">${setupUrl}</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
    senderType: "contest",
    replyTo: process.env.CONTEST_CONTACT_EMAIL || "fotowettbewerb@bergerdd.de",
  });
}


