package com.fincoach.controller;

import com.fincoach.dto.AuthResponse;
import com.fincoach.dto.LoginRequest;
import com.fincoach.dto.RegisterRequest;
import com.fincoach.dto.UpdateProfileRequest;
import com.fincoach.service.UserService;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Authentication endpoints:
 *
 *  GET  /api/auth/me                  — current user info from JWT
 *  POST /api/auth/register            — email/password registration
 *  POST /api/auth/login               — email/password login
 *  GET  /api/auth/verify-email        — email verification via token link
 *  PUT  /api/auth/profile             — update profile info / password
 *  POST /api/auth/resend-verification — resend verification email
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private UserService userService;

    // ─── GET /api/auth/me ────────────────────────────────────────────────────

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            log.warn("GET /api/auth/me called without valid authentication");
            return ResponseEntity.status(401).build();
        }

        Claims claims = (Claims) ((UsernamePasswordAuthenticationToken) authentication).getDetails();

        String userId    = authentication.getName();
        String email     = claims.get("email",     String.class);
        String name      = claims.get("name",      String.class);
        String picture   = claims.get("picture",   String.class);
        String role      = claims.get("role",      String.class);
        String firstName = claims.get("firstName", String.class);
        String lastName  = claims.get("lastName",  String.class);
        Integer age      = claims.get("age",       Integer.class);
        Boolean emailVerified = claims.get("emailVerified", Boolean.class);

        log.debug("GET /api/auth/me - userId={}, email={}", userId, email);

        Map<String, Object> user = new LinkedHashMap<>();
        user.put("id",            userId);
        user.put("email",         email);
        user.put("name",          name);
        user.put("picture",       picture       != null ? picture       : "");
        user.put("role",          role          != null ? role          : "USER");
        user.put("firstName",     firstName     != null ? firstName     : "");
        user.put("lastName",      lastName      != null ? lastName      : "");
        user.put("age",           age);
        user.put("emailVerified", emailVerified != null ? emailVerified : false);

        return ResponseEntity.ok(user);
    }

    // ─── POST /api/auth/register ─────────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = userService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.warn("Registration failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ─── POST /api/auth/login ────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = userService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Login failed for {}: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Login blocked for {}: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ─── GET /api/auth/verify-email ──────────────────────────────────────────

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        try {
            AuthResponse response = userService.verifyEmail(token);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Email verification failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ─── PUT /api/auth/profile ───────────────────────────────────────────────

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String userId = authentication.getName();
        try {
            AuthResponse response = userService.updateProfile(userId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Profile update failed for userId={}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ─── POST /api/auth/forgot-password ───────────────────────────────────────

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "L'adresse e-mail est requise."));
        }

        try {
            userService.requestPasswordReset(email);
            return ResponseEntity.ok(Map.of("message",
                "Si un compte existe avec cette adresse, un e-mail de r\u00e9initialisation a \u00e9t\u00e9 envoy\u00e9."));
        } catch (IllegalArgumentException e) {
            // Return success even on error to prevent email enumeration
            log.warn("Forgot password failed for {}: {}", email, e.getMessage());
            return ResponseEntity.ok(Map.of("message",
                "Si un compte existe avec cette adresse, un e-mail de r\u00e9initialisation a \u00e9t\u00e9 envoy\u00e9."));
        }
    }

    // ─── POST /api/auth/reset-password ─────────────────────────────────────────

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");

        if (token == null || token.isBlank() || newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le token et le nouveau mot de passe sont requis."));
        }

        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le mot de passe doit contenir au moins 8 caract\u00e8res."));
        }

        try {
            userService.resetPassword(token, newPassword);
            return ResponseEntity.ok(Map.of("message", "Votre mot de passe a \u00e9t\u00e9 r\u00e9initialis\u00e9 avec succ\u00e8s."));
        } catch (IllegalArgumentException e) {
            log.warn("Password reset failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ─── POST /api/auth/resend-verification ──────────────────────────────────

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "L'adresse e-mail est requise."));
        }

        try {
            userService.resendVerificationEmail(email);
            return ResponseEntity.ok(Map.of("message", "E-mail de vérification renvoyé."));
        } catch (IllegalArgumentException e) {
            log.warn("Resend verification failed for {}: {}", email, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
