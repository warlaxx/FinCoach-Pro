package com.fincoach.service;

import com.fincoach.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Manages our application's JWT tokens (NOT the provider's tokens).
 *
 * After a successful OAuth2 login, we generate our own JWT and send it to
 * the Angular frontend. The frontend then sends it back in every API request
 * via the "Authorization: Bearer {token}" header.
 *
 * The JWT contains:
 *  - sub    : our internal userId (UUID)
 *  - email  : user's email
 *  - name   : user's display name
 *  - picture: avatar URL (optional)
 *  - iat    : issued at timestamp
 *  - exp    : expiration timestamp (24h by default)
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    // Read from application.properties — must be a Base64-encoded 256-bit key
    @Value("${jwt.secret}")
    private String secret;

    // Expiration in milliseconds (default: 86400000 = 24 hours)
    @Value("${jwt.expiration:86400000}")
    private long expiration;

    /**
     * Derives the HMAC-SHA256 signing key from the Base64-encoded secret.
     * Keys.hmacShaKeyFor() validates that the key is long enough for HS256.
     */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }

    /**
     * Generates a signed JWT for the given user.
     * The token is valid for `jwt.expiration` milliseconds.
     */
    public String generateToken(User user) {
        Date now = new Date();
        Date expiresAt = new Date(now.getTime() + expiration);

        String token = Jwts.builder()
                .subject(user.getId())
                .claim("email", user.getEmail())
                .claim("name", user.getName())
                .claim("picture", user.getPictureUrl())
                .issuedAt(now)
                .expiration(expiresAt)
                .signWith(getSigningKey())
                .compact();

        log.debug("JWT generated for userId={}, expires={}", user.getId(), expiresAt);
        return token;
    }

    /**
     * Returns true if the token has a valid signature and is not expired.
     */
    public boolean isValid(String token) {
        try {
            getClaims(token);
            return true;
        } catch (Exception e) {
            log.debug("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Parses and returns the claims payload from a token.
     * Throws an exception if the token is invalid or expired.
     */
    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** Extracts the userId (sub) from the token. */
    public String getUserId(String token) {
        return getClaims(token).getSubject();
    }
}
