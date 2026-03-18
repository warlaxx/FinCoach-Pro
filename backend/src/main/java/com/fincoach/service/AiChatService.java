package com.fincoach.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fincoach.config.AppConstants;
import com.fincoach.model.ChatMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Sends user messages to the OpenAI chat-completions API and returns
 * AI-generated financial coaching responses.
 *
 * <p><strong>Demo mode:</strong> If {@code OPENAI_API_KEY} is not configured
 * (or equals "demo"), keyword-matched static responses are returned so the app
 * remains fully functional without an API key.
 *
 * <p><strong>Rate limiting &amp; timeouts:</strong> Each HTTP call to OpenAI
 * is bounded by {@link AppConstants#OPENAI_TIMEOUT_SECONDS}. Any exception
 * (network error, non-200 response, parse failure) falls back to demo mode.
 */
@Service
public class AiChatService {

    private static final Logger log = LoggerFactory.getLogger(AiChatService.class);

    /** Injected from OPENAI_API_KEY env var; defaults to "demo" when absent. */
    @Value("${openai.api.key:demo}")
    private String openAiKey;

    /**
     * System prompt that defines the FinCoach persona and output constraints.
     * Kept as a constant so the instructions are visible alongside the code
     * that sends them, rather than buried in application.properties.
     */
    private static final String SYSTEM_PROMPT = """
            Tu es FinCoach, un assistant financier personnel expert et bienveillant.
            Tu aides les utilisateurs français à améliorer leur santé financière.
            Tu donnes des conseils pratiques, concis et personnalisés sur :
            - La gestion du budget mensuel
            - Le remboursement des dettes (méthode avalanche, boule de neige)
            - L'épargne et les fonds d'urgence
            - Les placements adaptés aux débutants (livret A, PEL, assurance-vie)
            - La réduction des dépenses superflues

            Ton ton est encourageant, simple et concret. Tu utilises des chiffres et exemples réels.
            Tu réponds toujours en français. Tes réponses font 2-4 paragraphes maximum.
            """;

    /**
     * Pre-built demo responses keyed by a French keyword category.
     * Used when no API key is configured and as a fallback on API errors.
     */
    private static final Map<String, String> DEMO_RESPONSES = new LinkedHashMap<>();

    static {
        DEMO_RESPONSES.put("budget|dépense", """
                Pour maîtriser votre budget, appliquez la règle 50/30/20 : 50% pour les besoins essentiels \
                (loyer, alimentation, transport), 30% pour les envies personnelles, et 20% pour l'épargne.

                Commencez par noter toutes vos dépenses pendant 1 mois. Vous serez souvent surpris de voir où va \
                votre argent. Les abonnements oubliés et les achats impulsifs sont les premiers postes à optimiser.""");

        DEMO_RESPONSES.put("dette|crédit|rembours", """
                Il existe deux stratégies efficaces pour rembourser vos dettes :

                **Méthode Avalanche** : Payez d'abord la dette avec le taux d'intérêt le plus élevé. \
                C'est la plus économique mathématiquement.

                **Méthode Boule de neige** : Commencez par la plus petite dette pour avoir des victoires \
                rapides et rester motivé. Pour commencer, arrêtez de contracter de nouvelles dettes et \
                versez le minimum sur toutes sauf une.""");

        DEMO_RESPONSES.put("épargne|économiser", """
                Le secret de l'épargne est de vous payer en premier : dès réception de votre salaire, virez \
                automatiquement 10-20% sur un livret d'épargne avant de dépenser quoi que ce soit.

                Commencez par un fonds d'urgence équivalent à 3-6 mois de charges. Le Livret A (taux garanti) \
                est parfait pour cela. Une fois ce coussin constitué, explorez le PEL ou l'assurance-vie pour \
                faire fructifier votre épargne.""");

        DEMO_RESPONSES.put("placement|investir|investissement", """
                Pour débuter en investissement, voici la hiérarchie conseillée :

                1. **Fonds d'urgence** (Livret A) : 3-6 mois de charges, toujours accessible
                2. **Épargne retraite** (PER) : déductions fiscales avantageuses
                3. **Assurance-vie** en fonds euros : capital garanti, disponible
                4. **ETF World** en assurance-vie : exposition boursière diversifiée à faibles frais

                N'investissez en bourse que l'argent dont vous n'avez pas besoin avant 8-10 ans.""");
    }

    /** Fallback response used when no keyword matches in demo mode. */
    private static final String DEMO_DEFAULT_RESPONSE = """
            Excellente question ! La clé d'une bonne santé financière repose sur trois piliers : \
            **dépenser moins que vous ne gagnez**, **constituer une épargne de précaution**, \
            et **éliminer progressivement vos dettes**.

            Pour personnaliser mes conseils à votre situation, renseignez votre profil financier \
            dans le tableau de bord. Je pourrai alors vous donner des recommandations précises \
            adaptées à vos revenus et objectifs.""";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public AiChatService() {
        // Single shared HTTP client — thread-safe and reusable across requests
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(AppConstants.OPENAI_TIMEOUT_SECONDS))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Sends the user's message to the OpenAI chat-completions API, including
     * the last {@link AppConstants#CHAT_HISTORY_WINDOW} messages for context.
     *
     * @param history  All prior messages for this user (oldest first). Only the
     *                 last {@code CHAT_HISTORY_WINDOW} are sent to the API.
     * @param userMessage The new message from the user.
     * @return The assistant's text response, or a demo response if the API is
     *         unavailable.
     */
    public String chat(List<ChatMessage> history, String userMessage) {
        if (isDemoMode()) {
            log.info("OpenAI API key not configured — returning demo response");
            return buildDemoResponse(userMessage);
        }

        log.info("Calling OpenAI API (model={}, historyMessages={}, messageLength={})",
                AppConstants.OPENAI_MODEL, history.size(), userMessage.length());

        try {
            String requestBody = buildOpenAiRequestBody(history, userMessage);
            HttpRequest request = buildOpenAiHttpRequest(requestBody);

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.debug("OpenAI responded with HTTP {}", response.statusCode());

            if (response.statusCode() != 200) {
                log.warn("OpenAI non-200 response: status={}, body={}", response.statusCode(), response.body());
                return buildDemoResponse(userMessage);
            }

            String content = extractContentFromResponse(response.body());
            log.info("OpenAI response received ({} chars)", content.length());
            return content;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); // restore the interrupt flag
            log.error("OpenAI request was interrupted", e);
            return buildDemoResponse(userMessage);
        } catch (Exception e) {
            log.error("OpenAI request failed: {}", e.getMessage(), e);
            return buildDemoResponse(userMessage);
        }
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private boolean isDemoMode() {
        return "demo".equals(openAiKey) || openAiKey == null || openAiKey.isBlank();
    }

    /**
     * Builds the JSON request body for OpenAI's chat-completions endpoint.
     * Includes the system prompt + last N history messages + the new user message.
     */
    private String buildOpenAiRequestBody(List<ChatMessage> history, String userMessage) throws Exception {
        List<Map<String, String>> messages = new ArrayList<>();

        // System prompt instructs the model how to behave
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));

        // Include only the last CHAT_HISTORY_WINDOW messages to stay within token limits
        int historyStartIndex = Math.max(0, history.size() - AppConstants.CHAT_HISTORY_WINDOW);
        for (int i = historyStartIndex; i < history.size(); i++) {
            ChatMessage msg = history.get(i);
            messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
        }

        // Append the new user message last
        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", AppConstants.OPENAI_MODEL);
        requestBody.put("messages", messages);
        requestBody.put("max_tokens", AppConstants.OPENAI_MAX_TOKENS);
        requestBody.put("temperature", AppConstants.OPENAI_TEMPERATURE);

        return objectMapper.writeValueAsString(requestBody);
    }

    /**
     * Builds the HTTP request to the OpenAI API with a per-request timeout.
     * The timeout bounds the read phase (waiting for the response body), which
     * is separate from the connect timeout set on the HttpClient.
     */
    private HttpRequest buildOpenAiHttpRequest(String jsonBody) {
        return HttpRequest.newBuilder()
                .uri(URI.create(AppConstants.OPENAI_CHAT_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + openAiKey)
                .timeout(Duration.ofSeconds(AppConstants.OPENAI_TIMEOUT_SECONDS))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();
    }

    /**
     * Parses the text content out of an OpenAI chat-completions JSON response.
     * Uses TypeReference for type-safe deserialization instead of raw Map casts.
     *
     * @throws Exception if the response is malformed or missing expected fields.
     */
    private String extractContentFromResponse(String responseBody) throws Exception {
        // Parse with full type safety — no unchecked casts
        Map<String, Object> parsed = objectMapper.readValue(
                responseBody, new TypeReference<Map<String, Object>>() {});

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> choices = (List<Map<String, Object>>) parsed.get("choices");
        if (choices == null || choices.isEmpty()) {
            throw new IllegalStateException("OpenAI response contained no choices");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> firstMessage = (Map<String, Object>) choices.get(0).get("message");
        if (firstMessage == null) {
            throw new IllegalStateException("OpenAI choice had no message field");
        }

        String content = (String) firstMessage.get("content");
        if (content == null || content.isBlank()) {
            throw new IllegalStateException("OpenAI message content was empty");
        }
        return content;
    }

    /**
     * Returns a static demo response matched by keyword.
     * Iterates the demo response map in insertion order so more specific patterns
     * are checked before the generic fallback.
     *
     * @param question The user's raw message text.
     * @return A relevant pre-written financial tip, or the default fallback.
     */
    private String buildDemoResponse(String question) {
        String questionLower = question.toLowerCase();
        for (Map.Entry<String, String> entry : DEMO_RESPONSES.entrySet()) {
            // Each key is a "|"-delimited list of French keywords
            for (String keyword : entry.getKey().split("\\|")) {
                if (questionLower.contains(keyword)) {
                    log.debug("Demo response matched keyword: '{}'", keyword);
                    return entry.getValue();
                }
            }
        }
        log.debug("No keyword matched — returning default demo response");
        return DEMO_DEFAULT_RESPONSE;
    }
}
