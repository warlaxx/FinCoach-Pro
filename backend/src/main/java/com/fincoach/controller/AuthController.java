package com.fincoach.controller;

import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Provides authentication-related endpoints consumed by the Angular frontend.
 *
 * GET /api/auth/me — returns the current authenticated user's info from the JWT.
 * The frontend calls this on startup to know who is logged in and display
 * the user's name/avatar in the sidebar.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            log.warn("GET /api/auth/me called without valid authentication");
            return ResponseEntity.status(401).build();
        }

        // The JwtAuthenticationFilter stores the JWT Claims as the authentication details
        Claims claims = (Claims) ((UsernamePasswordAuthenticationToken) authentication).getDetails();

        String userId = authentication.getName(); // principal = userId (sub claim)
        String email = claims.get("email", String.class);
        String name = claims.get("name", String.class);
        String picture = claims.get("picture", String.class);

        log.debug("GET /api/auth/me - userId={}, email={}", userId, email);

        Map<String, Object> user = new LinkedHashMap<>();
        user.put("id", userId);
        user.put("email", email);
        user.put("name", name);
        user.put("picture", picture != null ? picture : "");

        return ResponseEntity.ok(user);
    }
}
