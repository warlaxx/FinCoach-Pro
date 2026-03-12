package com.fincoach.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fincoach.model.ChatMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;

@Service
public class AiChatService {

    @Value("${openai.api.key:demo}")
    private String openAiKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

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

    public String chat(List<ChatMessage> history, String userMessage) {
        if ("demo".equals(openAiKey) || openAiKey.isBlank()) {
            return generateDemoResponse(userMessage);
        }

        try {
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));

            int start = Math.max(0, history.size() - 10);
            for (int i = start; i < history.size(); i++) {
                ChatMessage msg = history.get(i);
                messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
            }
            messages.add(Map.of("role", "user", "content", userMessage));

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", "gpt-4o-mini");
            body.put("messages", messages);
            body.put("max_tokens", 500);
            body.put("temperature", 0.7);

            String json = mapper.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + openAiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            Map<?, ?> resp = mapper.readValue(response.body(), Map.class);
            List<?> choices = (List<?>) resp.get("choices");
            Map<?, ?> first = (Map<?, ?>) choices.get(0);
            Map<?, ?> msg = (Map<?, ?>) first.get("message");
            return (String) msg.get("content");

        } catch (Exception e) {
            return generateDemoResponse(userMessage);
        }
    }

    private String generateDemoResponse(String question) {
        String q = question.toLowerCase();

        if (q.contains("budget") || q.contains("dépense")) {
            return "Pour maîtriser votre budget, appliquez la règle 50/30/20 : 50% pour les besoins essentiels (loyer, alimentation, transport), 30% pour les envies personnelles, et 20% pour l'épargne.\n\nCommencez par noter toutes vos dépenses pendant 1 mois. Vous serez souvent surpris de voir où va votre argent. Les abonnements oubliés et les achats impulsifs sont les premiers postes à optimiser.";
        }
        if (q.contains("dette") || q.contains("crédit") || q.contains("rembours")) {
            return "Il existe deux stratégies efficaces pour rembourser vos dettes :\n\n**Méthode Avalanche** : Payez d'abord la dette avec le taux d'intérêt le plus élevé. C'est la plus économique mathématiquement.\n\n**Méthode Boule de neige** : Commencez par la plus petite dette pour avoir des victoires rapides et rester motivé. Pour commencer, arrêtez de contracter de nouvelles dettes et versez le minimum sur toutes sauf une.";
        }
        if (q.contains("épargne") || q.contains("économiser")) {
            return "Le secret de l'épargne est de vous payer en premier : dès réception de votre salaire, virez automatiquement 10-20% sur un livret d'épargne avant de dépenser quoi que ce soit.\n\nCommencez par un fonds d'urgence équivalent à 3-6 mois de charges. Le Livret A (taux garanti) est parfait pour cela. Une fois ce coussin constitué, explorez le PEL ou l'assurance-vie pour faire fructifier votre épargne.";
        }
        if (q.contains("placement") || q.contains("investir") || q.contains("investissement")) {
            return "Pour débuter en investissement, voici la hiérarchie conseillée :\n\n1. **Fonds d'urgence** (Livret A) : 3-6 mois de charges, toujours accessible\n2. **Épargne retraite** (PER) : déductions fiscales avantageuses\n3. **Assurance-vie** en fonds euros : capital garanti, disponible\n4. **ETF World** en assurance-vie : exposition boursière diversifiée à faibles frais\n\nN'investissez en bourse que l'argent dont vous n'avez pas besoin avant 8-10 ans.";
        }
        return "Excellente question ! La clé d'une bonne santé financière repose sur trois piliers : **dépenser moins que vous ne gagnez**, **constituer une épargne de précaution**, et **éliminer progressivement vos dettes**.\n\nPour personnaliser mes conseils à votre situation, renseignez votre profil financier dans le tableau de bord. Je pourrai alors vous donner des recommandations précises adaptées à vos revenus et objectifs.";
    }
}
