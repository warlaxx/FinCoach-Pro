package com.fincoach.service;

import com.fincoach.dto.AuthResponse;
import com.fincoach.dto.LoginRequest;
import com.fincoach.dto.RegisterRequest;
import com.fincoach.dto.UpdateProfileRequest;
import com.fincoach.model.Role;
import com.fincoach.model.User;
import com.fincoach.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Handles email/password account registration, login, email verification,
 * profile updates, and resend verification.
 */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    @Autowired private UserRepository userRepo;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;
    @Autowired private EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepo.findByEmail(req.getEmail().toLowerCase().trim()).isPresent()) {
            throw new IllegalArgumentException("Cette adresse e-mail est déjà utilisée.");
        }

        User user = new User();
        user.setEmail(req.getEmail().toLowerCase().trim());
        user.setFirstName(req.getFirstName().trim());
        user.setLastName(req.getLastName().trim());
        user.setAge(req.getAge());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setProvider("LOCAL");
        user.setRole(Role.USER);
        user.setEmailVerified(false);
        user.setEmailVerificationToken(UUID.randomUUID().toString());
        // Verification links expire after 24 hours
        user.setEmailVerificationTokenExpiry(LocalDateTime.now().plusHours(24));
        user.setName(req.getFirstName() + " " + req.getLastName());

        userRepo.save(user);
        log.info("New LOCAL user registered: {} (id={})", user.getEmail(), user.getId());

        emailService.sendVerificationEmail(user.getEmail(), user.getFirstName(), user.getEmailVerificationToken());

        AuthResponse response = new AuthResponse();
        response.setMessage("Inscription réussie ! Vérifiez votre boîte mail pour activer votre compte.");
        response.setEmailVerified(false);
        return response;
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepo.findByEmail(req.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("E-mail ou mot de passe incorrect."));

        if (!"LOCAL".equals(user.getProvider())) {
            throw new IllegalArgumentException(
                    "Ce compte utilise la connexion via " + user.getProvider() +
                    ". Utilisez le bouton correspondant sur la page de connexion.");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("E-mail ou mot de passe incorrect.");
        }

        if (!user.isEmailVerified()) {
            throw new IllegalStateException("Veuillez vérifier votre adresse e-mail avant de vous connecter.");
        }

        String token = jwtService.generateToken(user);
        log.info("LOCAL login success for userId={}", user.getId());

        return buildAuthResponse(user, token);
    }

    @Transactional
    public AuthResponse verifyEmail(String token) {
        User user = userRepo.findByEmailVerificationToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Lien de vérification invalide ou expiré."));

        if (user.isEmailVerified()) {
            throw new IllegalArgumentException("Ce compte est déjà activé.");
        }

        // Reject expired tokens (24-hour window)
        if (user.getEmailVerificationTokenExpiry() != null
                && user.getEmailVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Ce lien de vérification a expiré. Veuillez en demander un nouveau.");
        }

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationTokenExpiry(null);
        userRepo.save(user);

        log.info("Email verified for userId={}", user.getId());

        String jwt = jwtService.generateToken(user);

        AuthResponse response = buildAuthResponse(user, jwt);
        response.setMessage("E-mail vérifié avec succès. Bienvenue sur FinCoach Pro !");
        return response;
    }

    @Transactional
    public AuthResponse updateProfile(String userId, UpdateProfileRequest req) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable."));

        // Update basic info
        user.setFirstName(req.getFirstName().trim());
        user.setLastName(req.getLastName().trim());
        user.setAge(req.getAge());
        user.setName(req.getFirstName().trim() + " " + req.getLastName().trim());

        // Password change (optional)
        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            if (req.getCurrentPassword() == null || req.getCurrentPassword().isBlank()) {
                throw new IllegalArgumentException("Le mot de passe actuel est requis pour changer de mot de passe.");
            }
            if (user.getPasswordHash() == null) {
                throw new IllegalArgumentException("Ce compte utilise la connexion sociale. Le mot de passe ne peut pas être modifié ici.");
            }
            if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
                throw new IllegalArgumentException("Le mot de passe actuel est incorrect.");
            }
            user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
            log.info("Password changed for userId={}", userId);
        }

        userRepo.save(user);
        log.info("Profile updated for userId={}", userId);

        // Generate a fresh JWT with updated claims
        String token = jwtService.generateToken(user);
        return buildAuthResponse(user, token);
    }

    @Transactional
    public void resendVerificationEmail(String email) {
        User user = userRepo.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("Aucun compte trouvé avec cette adresse e-mail."));

        if (user.isEmailVerified()) {
            throw new IllegalArgumentException("Ce compte est déjà activé. Vous pouvez vous connecter.");
        }

        // Generate new token with a fresh 24-hour expiry
        user.setEmailVerificationToken(UUID.randomUUID().toString());
        user.setEmailVerificationTokenExpiry(LocalDateTime.now().plusHours(24));
        userRepo.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getFirstName(), user.getEmailVerificationToken());
        log.info("Verification email resent to {}", email);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepo.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("Aucun compte trouv\u00e9 avec cette adresse e-mail."));

        if (!"LOCAL".equals(user.getProvider())) {
            throw new IllegalArgumentException(
                    "Ce compte utilise la connexion via " + user.getProvider() +
                    ". La r\u00e9initialisation du mot de passe n'est pas disponible.");
        }

        String token = UUID.randomUUID().toString();
        user.setPasswordResetToken(token);
        user.setPasswordResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepo.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), token);
        log.info("Password reset requested for userId={}", user.getId());
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepo.findByPasswordResetToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Lien de r\u00e9initialisation invalide ou expir\u00e9."));

        if (user.getPasswordResetTokenExpiry() == null || user.getPasswordResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Ce lien de r\u00e9initialisation a expir\u00e9. Veuillez en demander un nouveau.");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiry(null);
        userRepo.save(user);

        log.info("Password reset completed for userId={}", user.getId());
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setRole(user.getRole().name());
        response.setEmailVerified(user.isEmailVerified());
        return response;
    }
}
