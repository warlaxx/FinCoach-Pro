import nodemailer from 'nodemailer';

/**
 * Email service — port of Java EmailService.java.
 *
 * Sends verification and password reset emails via SMTP (Nodemailer).
 * When MAIL_HOST is not configured, falls back to logging the email content
 * to the console so the app remains functional without an email server.
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    const host = process.env.MAIL_HOST;
    const port = parseInt(process.env.MAIL_PORT ?? '587', 10);
    const user = process.env.MAIL_USERNAME;
    const pass = process.env.MAIL_PASSWORD;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });
      this.isConfigured = true;
      console.log(`[EmailService] Configured with SMTP host=${host}:${port}`);
    } else {
      console.warn('[EmailService] MAIL_HOST/USERNAME/PASSWORD not set — emails will be logged to console only.');
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const from = process.env.MAIL_USERNAME ?? 'noreply@fincoach.pro';

    if (!this.isConfigured || !this.transporter) {
      console.log(`\n[EmailService] --- EMAIL (console fallback) ---`);
      console.log(`To: ${to}\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, '')}\n---`);
      return;
    }

    try {
      await this.transporter.sendMail({ from, to, subject, html });
      console.log(`[EmailService] Email sent to ${to} (${subject})`);
    } catch (err) {
      console.error(`[EmailService] Failed to send email to ${to}:`, err);
    }
  }

  async sendVerificationEmail(email: string, firstName: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4200';
    const verifyUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Bienvenue sur FinCoach Pro, ${firstName} !</h2>
        <p>Merci de vous être inscrit. Cliquez sur le lien ci-dessous pour vérifier votre adresse e-mail :</p>
        <a href="${verifyUrl}" style="
          display: inline-block;
          background-color: #4f46e5;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          margin: 16px 0;
        ">Vérifier mon e-mail</a>
        <p style="color: #6b7280; font-size: 14px;">
          Ce lien expire dans 24 heures.<br>
          Si vous n'avez pas créé de compte, ignorez cet e-mail.
        </p>
        <p style="color: #6b7280; font-size: 12px;">
          Lien direct : <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
      </div>
    `;

    await this.send(email, 'Vérifiez votre adresse e-mail — FinCoach Pro', html);
  }

  async sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4200';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Réinitialisation de mot de passe</h2>
        <p>Bonjour ${firstName},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe FinCoach Pro.</p>
        <a href="${resetUrl}" style="
          display: inline-block;
          background-color: #4f46e5;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          margin: 16px 0;
        ">Réinitialiser mon mot de passe</a>
        <p style="color: #6b7280; font-size: 14px;">
          Ce lien expire dans 1 heure.<br>
          Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail.
        </p>
      </div>
    `;

    await this.send(email, 'Réinitialisation de mot de passe — FinCoach Pro', html);
  }
}

export const emailService = new EmailService();
