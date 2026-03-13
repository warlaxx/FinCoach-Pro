package com.fincoach.security;

import io.jsonwebtoken.Jwts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;
import java.util.Date;

/**
 * Generates the Apple OAuth2 client_secret JWT.
 *
 * Apple does NOT use a simple string as the client_secret.
 * Instead, it requires a short-lived JWT signed with your Apple private key (.p8 file)
 * using the ES256 (ECDSA with P-256 curve) algorithm.
 *
 * The JWT must contain:
 *  - kid (header): your Apple Key ID
 *  - iss: your Apple Team ID
 *  - aud: "https://appleid.apple.com"
 *  - sub: your Apple Services ID (= client_id)
 *  - iat / exp: issued at / expiry (max 6 months)
 *
 * Apple Developer Portal: https://developer.apple.com/account/resources/authkeys/list
 */
public class AppleClientSecretGenerator {

    private static final Logger log = LoggerFactory.getLogger(AppleClientSecretGenerator.class);

    // Apple allows up to 6 months (15777000 seconds) for the client_secret JWT
    private static final long EXPIRY_SECONDS = 15_777_000L;

    /**
     * Generates the Apple client_secret JWT.
     *
     * @param teamId      Apple Team ID (10-char string, e.g. "ABCD1234EF")
     * @param clientId    Apple Services ID (e.g. "com.example.fincoach")
     * @param keyId       Apple Key ID (10-char string, e.g. "ABCD1234EF")
     * @param privateKey  Content of the .p8 file (PKCS#8 PEM format)
     * @return signed JWT string to use as client_secret
     */
    public static String generate(String teamId, String clientId, String keyId, String privateKey) {
        try {
            PrivateKey pk = parsePrivateKey(privateKey);
            long now = System.currentTimeMillis() / 1000L;

            String jwt = Jwts.builder()
                    .header().keyId(keyId).and()
                    .issuer(teamId)
                    .subject(clientId)
                    .audience().add("https://appleid.apple.com").and()
                    .issuedAt(new Date(now * 1000L))
                    .expiration(new Date((now + EXPIRY_SECONDS) * 1000L))
                    .signWith(pk, Jwts.SIG.ES256)
                    .compact();

            log.info("Apple client_secret JWT generated for clientId={}", clientId);
            return jwt;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate Apple client_secret JWT: " + e.getMessage(), e);
        }
    }

    /**
     * Parses the PKCS#8 PEM private key provided by Apple in the .p8 file.
     * Java 11+ supports EC keys natively without Bouncy Castle.
     */
    private static PrivateKey parsePrivateKey(String pem) throws Exception {
        // Strip the PEM headers and whitespace to get raw Base64
        String base64 = pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s+", "");

        byte[] keyBytes = Base64.getDecoder().decode(base64);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory kf = KeyFactory.getInstance("EC");
        return kf.generatePrivate(spec);
    }
}
