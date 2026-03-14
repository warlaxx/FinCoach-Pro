package com.fincoach.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends transactional emails (verification, notifications).
 *
 * When MAIL_HOST is not configured, the service logs the email content
 * instead of failing — useful for local development without an SMTP server.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${spring.mail.username:noreply@fincoach.pro}")
    private String fromAddress;

    /**
     * Sends an email verification link to the user's address.
     *
     * @param toEmail   recipient address
     * @param firstName user's first name for personalisation
     * @param token     the unique verification token stored on the User entity
     */
    public void sendVerificationEmail(String toEmail, String firstName, String token) {
        String verificationUrl = frontendUrl + "/verify-email?token=" + token;

        String subject = "FinCoach Pro — Vérifiez votre adresse e-mail";
        String body = String.format("""
                Bonjour %s,

                Merci de vous être inscrit sur FinCoach Pro !

                Cliquez sur le lien ci-dessous pour activer votre compte :

                %s

                Ce lien est valable 24 heures.

                Si vous n'avez pas créé de compte, ignorez simplement ce message.

                L'équipe FinCoach Pro
                """, firstName, verificationUrl);

        if (mailSender == null) {
            log.warn("JavaMailSender not configured — printing verification email to logs instead.");
            log.info("=== VERIFICATION EMAIL ===");
            log.info("To      : {}", toEmail);
            log.info("Subject : {}", subject);
            log.info("Body    :\n{}", body);
            log.info("=========================");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Verification email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
            // Do not rethrow — registration succeeds even if email fails;
            // the user can request a new verification email later.
        }
    }
}
