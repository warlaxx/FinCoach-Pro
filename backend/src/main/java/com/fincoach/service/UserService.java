package com.fincoach.service;

import com.fincoach.dto.AuthResponse;
import com.fincoach.dto.LoginRequest;
import com.fincoach.dto.RegisterRequest;
import com.fincoach.model.Role;
import com.fincoach.model.User;
import com.fincoach.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Handles email/password account registration, login, and email verification.
 */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    @Autowired private UserRepository userRepo;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;
    @Autowired private EmailService emailService;

    /**
     * Registers a new LOCAL user.
     *
     * Steps:
     * 1. Validate that the email is not already taken
     * 2. Hash the password
     * 3. Generate a verification token
     * 4. Persist the user
     * 5. Send the verification email
     *
     * @throws IllegalArgumentException if the email is already registered
     */
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepo.findByEmail(req.getEmail()).isPresent()) {
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
        // Display name for OAuth2SuccessHandler / JWT claims
        user.setName(req.getFirstName() + " " + req.getLastName());

        userRepo.save(user);
        log.info("New LOCAL user registered: {} (id={})", user.getEmail(), user.getId());

        emailService.sendVerificationEmail(user.getEmail(), user.getFirstName(), user.getEmailVerificationToken());

        AuthResponse response = new AuthResponse();
        response.setMessage("Inscription réussie ! Vérifiez votre boîte mail pour activer votre compte.");
        response.setEmailVerified(false);
        return response;
    }

    /**
     * Authenticates a LOCAL user with email + password.
     *
     * @throws IllegalArgumentException if credentials are wrong or account not found
     * @throws IllegalStateException    if the email has not been verified yet
     */
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

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setRole(user.getRole().name());
        response.setEmailVerified(true);
        return response;
    }

    /**
     * Verifies a user's email address using the token sent by email.
     *
     * @param token the UUID token from the verification link
     * @throws IllegalArgumentException if the token is unknown or already used
     */
    @Transactional
    public AuthResponse verifyEmail(String token) {
        User user = userRepo.findByEmailVerificationToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Lien de vérification invalide ou expiré."));

        if (user.isEmailVerified()) {
            throw new IllegalArgumentException("Ce compte est déjà activé.");
        }

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null); // invalidate the token after use
        userRepo.save(user);

        log.info("Email verified for userId={}", user.getId());

        // Issue a JWT so the user is logged in immediately after clicking the link
        String jwt = jwtService.generateToken(user);

        AuthResponse response = new AuthResponse();
        response.setToken(jwt);
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setRole(user.getRole().name());
        response.setEmailVerified(true);
        response.setMessage("E-mail vérifié avec succès. Bienvenue sur FinCoach Pro !");
        return response;
    }
}
