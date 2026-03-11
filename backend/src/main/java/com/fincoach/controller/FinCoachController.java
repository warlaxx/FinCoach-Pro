package com.fincoach.controller;

import com.fincoach.model.ActionPlan;
import com.fincoach.model.ChatMessage;
import com.fincoach.model.FinancialProfile;
import com.fincoach.repository.ActionPlanRepository;
import com.fincoach.repository.ChatMessageRepository;
import com.fincoach.repository.FinancialProfileRepository;
import com.fincoach.service.AiChatService;
import com.fincoach.service.FinancialScoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class FinCoachController {

    @Autowired private FinancialProfileRepository profileRepo;
    @Autowired private ActionPlanRepository actionRepo;
    @Autowired private ChatMessageRepository chatRepo;
    @Autowired private FinancialScoringService scoringService;
    @Autowired private AiChatService aiChatService;

    @GetMapping("/dashboard/{userId}")
    public ResponseEntity<Map<String, Object>> getDashboard(@PathVariable String userId) {
        Map<String, Object> dashboard = new LinkedHashMap<>();
        Optional<FinancialProfile> profileOpt = profileRepo.findTopByUserIdOrderByUpdatedAtDesc(userId);
        if (profileOpt.isPresent()) {
            dashboard.put("profile", buildProfileSummary(profileOpt.get()));
        } else {
            dashboard.put("profile", null);
        }
        List<ActionPlan> actions = actionRepo.findByUserIdAndStatusOrderByCreatedAtDesc(userId, "EN_COURS");
        dashboard.put("topActions", actions.stream().limit(4).map(this::buildActionResponse).collect(Collectors.toList()));
        dashboard.put("stats", buildStats(userId));
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable String userId) {
        return profileRepo.findTopByUserIdOrderByUpdatedAtDesc(userId)
                .map(p -> ResponseEntity.ok(buildProfileSummary(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/profile")
    public ResponseEntity<Map<String, Object>> saveProfile(@RequestBody FinancialProfile profile) {
        scoringService.computeScores(profile);
        FinancialProfile saved = profileRepo.save(profile);
        generateActionPlans(saved);
        return ResponseEntity.ok(buildProfileSummary(saved));
    }

    @GetMapping("/actions/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getActions(@PathVariable String userId) {
        List<ActionPlan> actions = actionRepo.findByUserIdOrderByPriorityAscCreatedAtDesc(userId);
        return ResponseEntity.ok(actions.stream().map(this::buildActionResponse).collect(Collectors.toList()));
    }

    @PostMapping("/actions")
    public ResponseEntity<Map<String, Object>> createAction(@RequestBody ActionPlan action) {
        ActionPlan saved = actionRepo.save(action);
        return ResponseEntity.ok(buildActionResponse(saved));
    }

    @PutMapping("/actions/{id}/status")
    public ResponseEntity<Map<String, Object>> updateActionStatus(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        return actionRepo.findById(id).map(action -> {
            action.setStatus(body.get("status"));
            if (body.containsKey("currentAmount")) {
                action.setCurrentAmount(Double.parseDouble(body.get("currentAmount")));
            }
            return ResponseEntity.ok(buildActionResponse(actionRepo.save(action)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/actions/{id}")
    public ResponseEntity<Void> deleteAction(@PathVariable Long id) {
        actionRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/chat/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getChatHistory(@PathVariable String userId) {
        List<ChatMessage> messages = chatRepo.findByUserIdOrderByCreatedAtAsc(userId);
        return ResponseEntity.ok(messages.stream().map(this::buildChatResponse).collect(Collectors.toList()));
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        String message = body.get("message");
        ChatMessage userMsg = new ChatMessage(null, userId, "user", message, null);
        chatRepo.save(userMsg);
        List<ChatMessage> history = chatRepo.findTop20ByUserIdOrderByCreatedAtDesc(userId);
        Collections.reverse(history);
        String aiResponse = aiChatService.chat(history, message);
        ChatMessage assistantMsg = new ChatMessage(null, userId, "assistant", aiResponse, null);
        chatRepo.save(assistantMsg);
        return ResponseEntity.ok(buildChatResponse(assistantMsg));
    }

    @DeleteMapping("/chat/{userId}")
    public ResponseEntity<Void> clearChat(@PathVariable String userId) {
        List<ChatMessage> all = chatRepo.findByUserIdOrderByCreatedAtAsc(userId);
        chatRepo.deleteAll(all);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> buildProfileSummary(FinancialProfile p) {
        double income = safe(p.getMonthlyIncome()) + safe(p.getOtherIncome());
        double fixed = safe(p.getRent()) + safe(p.getUtilities()) + safe(p.getInsurance())
                + safe(p.getLoans()) + safe(p.getSubscriptions());
        double variable = safe(p.getFood()) + safe(p.getTransport()) + safe(p.getLeisure())
                + safe(p.getClothing()) + safe(p.getHealth());
        double total = fixed + variable;
        double surplus = income - total;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("userId", p.getUserId());
        m.put("monthlyIncome", income);
        m.put("totalFixedExpenses", fixed);
        m.put("totalVariableExpenses", variable);
        m.put("totalExpenses", total);
        m.put("monthlySurplus", surplus);
        m.put("savingsRate", p.getSavingsRate());
        m.put("debtRatio", p.getDebtRatio());
        m.put("financialScore", p.getFinancialScore());
        m.put("currentSavings", p.getCurrentSavings());
        m.put("totalDebt", p.getTotalDebt());
        m.put("insights", scoringService.generateInsights(p));
        m.put("breakdown", Map.of(
                "housing", safe(p.getRent()),
                "food", safe(p.getFood()),
                "transport", safe(p.getTransport()),
                "leisure", safe(p.getLeisure()),
                "loans", safe(p.getLoans()),
                "other", safe(p.getUtilities()) + safe(p.getInsurance()) + safe(p.getSubscriptions()) + safe(p.getClothing()) + safe(p.getHealth())
        ));
        m.put("updatedAt", p.getUpdatedAt());
        return m;
    }

    private Map<String, Object> buildActionResponse(ActionPlan a) {
        double progress = 0;
        if (a.getTargetAmount() != null && a.getTargetAmount() > 0 && a.getCurrentAmount() != null) {
            progress = Math.min(100, (a.getCurrentAmount() / a.getTargetAmount()) * 100);
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", a.getId());
        m.put("userId", a.getUserId());
        m.put("title", a.getTitle());
        m.put("description", a.getDescription());
        m.put("category", a.getCategory());
        m.put("priority", a.getPriority());
        m.put("status", a.getStatus());
        m.put("targetAmount", a.getTargetAmount());
        m.put("currentAmount", a.getCurrentAmount());
        m.put("progressPercent", Math.round(progress * 10.0) / 10.0);
        m.put("deadline", a.getDeadline());
        m.put("createdAt", a.getCreatedAt());
        return m;
    }

    private Map<String, Object> buildChatResponse(ChatMessage msg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", msg.getId());
        m.put("userId", msg.getUserId());
        m.put("role", msg.getRole());
        m.put("content", msg.getContent());
        m.put("createdAt", msg.getCreatedAt());
        return m;
    }

    private Map<String, Object> buildStats(String userId) {
        List<ActionPlan> all = actionRepo.findByUserIdOrderByPriorityAscCreatedAtDesc(userId);
        long total = all.size();
        long done = all.stream().filter(a -> "TERMINE".equals(a.getStatus())).count();
        long inProgress = all.stream().filter(a -> "EN_COURS".equals(a.getStatus())).count();
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalActions", total);
        stats.put("completedActions", done);
        stats.put("inProgressActions", inProgress);
        stats.put("completionRate", total > 0 ? Math.round((done * 100.0 / total) * 10) / 10.0 : 0);
        return stats;
    }

    private void generateActionPlans(FinancialProfile p) {
        double income = safe(p.getMonthlyIncome()) + safe(p.getOtherIncome());
        List<ActionPlan> actions = new ArrayList<>();
        if (safe(p.getSavingsRate()) < 10 && income > 0) {
            ActionPlan a = new ActionPlan();
            a.setUserId(p.getUserId());
            a.setTitle("Atteindre 10% de taux d'épargne");
            a.setDescription("Mettez en place un virement automatique dès réception du salaire. Objectif : épargner " + (int)(income * 0.10) + " €/mois.");
            a.setCategory("EPARGNE");
            a.setPriority("HAUTE");
            a.setTargetAmount(income * 0.10 * 12);
            a.setCurrentAmount(0.0);
            a.setDeadline(LocalDate.now().plusMonths(6));
            actions.add(a);
        }
        if (safe(p.getCurrentSavings()) < income * 3) {
            ActionPlan a = new ActionPlan();
            a.setUserId(p.getUserId());
            a.setTitle("Constituer un fonds d'urgence (3 mois)");
            a.setDescription("Objectif : " + (int)(income * 3) + " € sur Livret A. Ce coussin vous protège des imprévus.");
            a.setCategory("EPARGNE");
            a.setPriority("HAUTE");
            a.setTargetAmount(income * 3);
            a.setCurrentAmount(safe(p.getCurrentSavings()));
            a.setDeadline(LocalDate.now().plusMonths(12));
            actions.add(a);
        }
        if (safe(p.getDebtRatio()) > 25) {
            ActionPlan a = new ActionPlan();
            a.setUserId(p.getUserId());
            a.setTitle("Réduire le ratio d'endettement");
            a.setDescription("Votre taux d'endettement dépasse 25%. Appliquez la méthode avalanche : remboursez en priorité la dette au taux le plus élevé.");
            a.setCategory("DETTE");
            a.setPriority("HAUTE");
            a.setTargetAmount(safe(p.getTotalDebt()) * 0.3);
            a.setCurrentAmount(0.0);
            a.setDeadline(LocalDate.now().plusMonths(18));
            actions.add(a);
        }
        if (safe(p.getSubscriptions()) > 60) {
            ActionPlan a = new ActionPlan();
            a.setUserId(p.getUserId());
            a.setTitle("Auditer vos abonnements");
            a.setDescription("Listez tous vos abonnements et supprimez ceux que vous utilisez peu. Potentiel d'économie : " + (int)(safe(p.getSubscriptions()) * 0.3) + " €/mois.");
            a.setCategory("BUDGET");
            a.setPriority("MOYENNE");
            a.setTargetAmount(safe(p.getSubscriptions()) * 0.3 * 12);
            a.setCurrentAmount(0.0);
            a.setDeadline(LocalDate.now().plusWeeks(2));
            actions.add(a);
        }
        if (!actions.isEmpty()) {
            actionRepo.saveAll(actions);
        }
    }

    private double safe(Double v) { return v == null ? 0.0 : v; }
}