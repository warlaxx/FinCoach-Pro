package com.fincoach.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/**
 * CORS configuration applied at two levels:
 *
 * 1. Spring Security level (corsConfigurationSource bean):
 *    Used in SecurityConfig via .cors(cors -> cors.configurationSource(...))
 *    This runs BEFORE any controller and is required for preflight OPTIONS
 *    requests to work when Spring Security is active.
 *
 * 2. Spring MVC level (WebMvcConfigurer):
 *    Handles CORS for endpoints that bypass the security filter chain.
 *
 * Security note: allowedHeaders is an explicit allowlist instead of "*".
 * Wildcards accept any request header, which can enable cache-poisoning and
 * other header-injection attacks. We only allow what Angular actually sends.
 */
@Configuration
public class CorsConfig {

    /** Request headers that Angular is allowed to send to the backend. */
    private static final List<String> ALLOWED_HEADERS = List.of(
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "X-Requested-With"
    );

    private static final List<String> ALLOWED_ORIGINS = List.of(
            "http://localhost:4200",
            "http://frontend:4200"
    );

    private static final List<String> ALLOWED_METHODS = List.of(
            "GET", "POST", "PUT", "DELETE", "OPTIONS"
    );

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(ALLOWED_ORIGINS);
        config.setAllowedMethods(ALLOWED_METHODS);
        config.setAllowedHeaders(ALLOWED_HEADERS);
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins(ALLOWED_ORIGINS.toArray(String[]::new))
                        .allowedMethods(ALLOWED_METHODS.toArray(String[]::new))
                        .allowedHeaders(ALLOWED_HEADERS.toArray(String[]::new))
                        .allowCredentials(true);
            }
        };
    }
}
