package com.fincoach.controller;

import com.fincoach.dto.AuthResponse;
import com.fincoach.dto.LoginRequest;
import com.fincoach.dto.RegisterRequest;
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
 *  GET  /api/auth/me            — current user info from JWT (used by Angular on startup)
 *  POST /api/auth/register      — email/password registration
 *  POST /api/auth/login         — email/password login
 *  GET  /api/auth/verify-email  — email verification via token link
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

        log.debug("GET /api/auth/me - userId={}, email={}", userId, email);

        Map<String, Object> user = new LinkedHashMap<>();
        user.put("id",        userId);
        user.put("email",     email);
        user.put("name",      name);
        user.put("picture",   picture   != null ? picture   : "");
        user.put("role",      role      != null ? role      : "USER");
        user.put("firstName", firstName != null ? firstName : "");
        user.put("lastName",  lastName  != null ? lastName  : "");

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
}
