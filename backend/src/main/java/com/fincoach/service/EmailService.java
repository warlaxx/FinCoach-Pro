package com.fincoach.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${app.mail.from:noreply@fincoachpro.com}")
    private String fromAddress;

    public void sendVerificationEmail(String toEmail, String firstName, String token) {
        String verificationUrl = frontendUrl + "/verify-email?token=" + token;
        String subject = "FinCoach Pro \u2014 V\u00e9rifiez votre adresse e-mail";
        String html = buildVerificationHtml(firstName, verificationUrl);

        if (mailSender == null) {
            log.warn("JavaMailSender not configured \u2014 printing verification email to logs instead.");
            log.info("=== VERIFICATION EMAIL ===");
            log.info("To      : {}", toEmail);
            log.info("Subject : {}", subject);
            log.info("Link    : {}", verificationUrl);
            log.info("=========================");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, "FinCoach Pro");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Verification email sent to {}", toEmail);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildVerificationHtml(String firstName, String verificationUrl) {
        return "<!DOCTYPE html>\n"
            + "<html lang=\"fr\">\n"
            + "<head>\n"
            + "  <meta charset=\"UTF-8\">\n"
            + "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
            + "  <title>V\u00e9rification e-mail \u2014 FinCoach Pro</title>\n"
            + "</head>\n"
            + "<body style=\"margin:0;padding:0;background-color:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;\">\n"
            + "  <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#0f1117;padding:40px 20px;\">\n"
            + "    <tr>\n"
            + "      <td align=\"center\">\n"
            + "        <table role=\"presentation\" width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;width:100%;\">\n"
            + "\n"
            + "          <!-- Logo -->\n"
            + "          <tr>\n"
            + "            <td align=\"center\" style=\"padding-bottom:32px;\">\n"
            + "              <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\">\n"
            + "                <tr>\n"
            + "                  <td style=\"font-size:32px;line-height:1;vertical-align:middle;padding-right:12px;\">\uD83D\uDCB0</td>\n"
            + "                  <td style=\"vertical-align:middle;\">\n"
            + "                    <div style=\"font-size:22px;font-weight:800;color:#c9a84c;letter-spacing:-0.5px;line-height:1.2;\">FinCoach</div>\n"
            + "                    <div style=\"font-size:10px;letter-spacing:3px;color:#6b7280;text-transform:uppercase;\">PRO</div>\n"
            + "                  </td>\n"
            + "                </tr>\n"
            + "              </table>\n"
            + "            </td>\n"
            + "          </tr>\n"
            + "\n"
            + "          <!-- Main card -->\n"
            + "          <tr>\n"
            + "            <td style=\"background-color:#1a1d2e;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:48px 40px;\">\n"
            + "\n"
            + "              <!-- Icon -->\n"
            + "              <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">\n"
            + "                <tr>\n"
            + "                  <td align=\"center\" style=\"padding-bottom:24px;\">\n"
            + "                    <div style=\"width:72px;height:72px;border-radius:50%;background:rgba(201,168,76,0.1);border:2px solid rgba(201,168,76,0.3);display:inline-block;line-height:72px;text-align:center;\">\n"
            + "                      <span style=\"font-size:32px;line-height:72px;\">\u2709\uFE0F</span>\n"
            + "                    </div>\n"
            + "                  </td>\n"
            + "                </tr>\n"
            + "              </table>\n"
            + "\n"
            + "              <!-- Greeting -->\n"
            + "              <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">\n"
            + "                <tr>\n"
            + "                  <td align=\"center\" style=\"padding-bottom:8px;\">\n"
            + "                    <h1 style=\"margin:0;font-size:24px;font-weight:700;color:#f1f5f9;\">Bienvenue, " + escapeHtml(firstName) + " !</h1>\n"
            + "                  </td>\n"
            + "                </tr>\n"
            + "                <tr>\n"
            + "                  <td align=\"center\" style=\"padding-bottom:32px;\">\n"
            + "                    <p style=\"margin:0;font-size:15px;color:#94a3b8;line-height:1.7;max-width:420px;\">\n"
            + "                      Merci de vous \u00eatre inscrit sur <strong style=\"color:#c9a84c;\">FinCoach Pro</strong>.\n"
            + "                      Pour activer votre compte et commencer \u00e0 prendre le contr\u00f4le de vos finances,\n"
            + "                      cliquez sur le bouton ci-dessous.\n"
            + "                    </p>\n"
            + "                  </td>\n"
            + "                </tr>\n"
            + "              </table>\n"
            + "\n"
            + "              <!-- CTA Button -->\n"
            + "              <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">\n"
            + "                <tr>\n"
            + "                  <td align=\"center\" style=\"padding-bottom:32px;\">\n"
            + "                    <!--[if mso]>\n"
            + "                    <v:roundrect xmlns:v=\"urn:schemas-microsoft-com:vml\" xmlns:w=\"urn:schemas-microsoft-com:office:word\" href=\"" + verificationUrl + "\" style=\"height:50px;v-text-anchor:middle;width:240px;\" arcsize=\"24%\" fill=\"t\">\n"
            + "                    <v:fill type=\"tile\" color=\"#c9a84c\" />\n"
            + "                    <w:anchorlock/>\n"
            + "                    <center style=\"color:#0f1117;font-family:sans-serif;font-size:16px;font-weight:bold;\">V\u00e9rifier mon e-mail</center>\n"
            + "                    </v:roundrect>\n"
            + "                    <![endif]-->\n"
            + "                    <!--[if !mso]><!-->\n"
            + "                    <a href=\"" + verificationUrl + "\"\n"
            + "                       target=\"_blank\"\n"
            + "                       style=\"display:inline-block;padding:14px 40px;background-color:#c9a84c;color:#0f1117;font-size:16px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.3px;\">\n"
            + "                      V\u00e9rifier mon e-mail\n"
            + "                    </a>\n"
            + "                    <!--<![endif]-->\n"
            + "                  </td>\n"
            + "                </tr>\n"
            + "              </table>\n"
            + "\n"
            + "              <!-- Fallback link -->\n"
            + "              <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">\n"
            + "                <tr>\n"
            + "                  <td align=\"center\" style=\"padding-bottom:24px;\">\n"
            + "                    <p style=\"margin:0;font-size:13px;color:#6b7280;line-height:1.6;\">\n"
            + "                      Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur&nbsp;:\n"
            + "                    </p>\n"
            + "                    <p style=\"margin:8px 0 0;font-size:12px;color:#c9a84c;word-break:break-all;line-height:1.5;\">\n"
            + "                      " + verificationUrl + "\n"
            + "                    </p>\n"
            + "                  </td>\n"
            + "                </tr>\n"
            + "              </table>\n"
            + "\n"
            + "              <!-- Divider -->\n"
            + "              <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">\n"
            + "                <tr>\n"
            + "                  <td style=\"border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;\">\n"
            + "                    <p style=\"margin:0;font-size:13px;color:#6b7280;line-height:1.6;text-align:center;\">\n"
            + "                      Ce lien est valable <strong style=\"color:#94a3b8;\">24 heures</strong>.\n"
            + "                      Si vous n'avez pas cr\u00e9\u00e9 de compte sur FinCoach Pro, ignorez simplement ce message.\n"
            + "                    </p>\n"
            + "                  </td>\n"
            + "                </tr>\n"
            + "              </table>\n"
            + "\n"
            + "            </td>\n"
            + "          </tr>\n"
            + "\n"
            + "          <!-- Footer -->\n"
            + "          <tr>\n"
            + "            <td align=\"center\" style=\"padding-top:32px;\">\n"
            + "              <p style=\"margin:0 0 8px;font-size:13px;color:#6b7280;\">\n"
            + "                L'\u00e9quipe <strong style=\"color:#c9a84c;\">FinCoach Pro</strong>\n"
            + "              </p>\n"
            + "              <p style=\"margin:0;font-size:11px;color:#4b5563;line-height:1.6;\">\n"
            + "                Cet e-mail a \u00e9t\u00e9 envoy\u00e9 automatiquement. Merci de ne pas y r\u00e9pondre.<br>\n"
            + "                \u00a9 2025 FinCoach Pro \u2014 Votre coach financier intelligent.\n"
            + "              </p>\n"
            + "            </td>\n"
            + "          </tr>\n"
            + "\n"
            + "        </table>\n"
            + "      </td>\n"
            + "    </tr>\n"
            + "  </table>\n"
            + "</body>\n"
            + "</html>";
    }

    private static String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                     .replace("<", "&lt;")
                     .replace(">", "&gt;")
                     .replace("\"", "&quot;");
    }
}
