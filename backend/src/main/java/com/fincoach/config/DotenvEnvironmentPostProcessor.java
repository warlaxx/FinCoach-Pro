package com.fincoach.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Loads variables from a .env file into the Spring Environment before any beans
 * are created. This allows ${VAR} placeholders in application.properties to
 * resolve against .env values when real OS environment variables are absent.
 *
 * Lookup order (first found wins):
 *   1. ./backend/.env   (run from project root)
 *   2. ./.env           (run from backend/)
 *
 * Existing OS environment variables are NOT overridden — .env only fills gaps.
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String PROPERTY_SOURCE_NAME = "dotenvProperties";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment,
                                       SpringApplication application) {

        Path dotenvFile = resolveDotenvPath();
        if (dotenvFile == null) {
            return; // no .env found — nothing to do
        }

        Map<String, Object> vars = parseDotenv(dotenvFile);
        if (vars.isEmpty()) {
            return;
        }

        // Add with lowest priority so real env vars and system properties win
        environment.getPropertySources()
                   .addLast(new MapPropertySource(PROPERTY_SOURCE_NAME, vars));
    }

    private Path resolveDotenvPath() {
        Path[] candidates = {
            Path.of("backend", ".env"),
            Path.of(".env"),
            Path.of("..", ".env")
        };
        for (Path candidate : candidates) {
            if (Files.isRegularFile(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    private Map<String, Object> parseDotenv(Path path) {
        Map<String, Object> vars = new LinkedHashMap<>();

        try (BufferedReader reader = Files.newBufferedReader(path)) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();

                // skip blanks and comments
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                int eq = line.indexOf('=');
                if (eq <= 0) {
                    continue;
                }

                // strip optional "export " prefix
                String keyPart = line.substring(0, eq).trim();
                if (keyPart.startsWith("export ")) {
                    keyPart = keyPart.substring(7).trim();
                }

                String value = line.substring(eq + 1).trim();

                // remove surrounding quotes (single or double)
                if (value.length() >= 2) {
                    char first = value.charAt(0);
                    char last = value.charAt(value.length() - 1);
                    if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                        value = value.substring(1, value.length() - 1);
                    }
                }

                // strip inline comment (only outside quotes)
                int hash = value.indexOf(" #");
                if (hash >= 0) {
                    value = value.substring(0, hash).trim();
                }

                vars.put(keyPart, value);
            }
        } catch (IOException e) {
            System.err.println("[DotenvLoader] Failed to read " + path + ": " + e.getMessage());
        }

        return vars;
    }
}
