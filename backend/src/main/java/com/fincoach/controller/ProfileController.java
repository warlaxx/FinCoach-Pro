package com.fincoach.controller;

import com.fincoach.model.FinancialProfile;
import com.fincoach.repository.FinancialProfileRepository;
import com.fincoach.service.ActionPlanService;
import com.fincoach.service.FinancialScoringService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import static com.fincoach.util.NumberUtils.orZero;

@RestController
@RequestMapping("/api")
public class ProfileController {

    private static final Logger log = LoggerFactory.getLogger(ProfileController.class);

    private final FinancialProfileRepository profileRepo;
    private final FinancialScoringService scoringService;
    private final ActionPlanService actionPlanService;

    public ProfileController(FinancialProfileRepository profileRepo,
                             FinancialScoringService scoringService,
                             ActionPlanService actionPlanService) {
        this.profileRepo = profileRepo;
        this.scoringService = scoringService;
        this.actionPlanService = actionPlanService;
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable String userId) {
        log.info("GET /profile/{}", userId);
        Optional<FinancialProfile> profileOpt = profileRepo.findTopByUserIdOrderByUpdatedAtDesc(userId);
        if (profileOpt.isEmpty()) {
            log.warn("No profile found for userId={}", userId);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(toResponse(profileOpt.get()));
    }

    @PostMapping("/profile")
    public ResponseEntity<Map<String, Object>> saveProfile(@RequestBody FinancialProfile profile) {
        log.info("POST /profile for userId={}", profile.getUserId());
        scoringService.computeScores(profile);
        FinancialProfile saved = profileRepo.save(profile);
        log.info("Profile saved id={}, score={}", saved.getId(), saved.getFinancialScore());
        actionPlanService.generateFromProfile(saved);
        return ResponseEntity.ok(toResponse(saved));
    }

    @GetMapping("/dashboard/{userId}")
    public ResponseEntity<Map<String, Object>> getDashboard(@PathVariable String userId) {
        log.info("GET /dashboard/{}", userId);
        Map<String, Object> dashboard = new LinkedHashMap<>();

        Optional<FinancialProfile> profileOpt = profileRepo.findTopByUserIdOrderByUpdatedAtDesc(userId);
        dashboard.put("profile", profileOpt.map(this::toResponse).orElse(null));

        var activeActions = actionPlanService.getActionsForUser(userId).stream()
                .filter(a -> "EN_COURS".equals(a.getStatus()))
                .limit(4)
                .map(actionPlanService::toResponse)
                .toList();
        dashboard.put("topActions", activeActions);
        dashboard.put("stats", actionPlanService.buildStats(userId));

        return ResponseEntity.ok(dashboard);
    }

    Map<String, Object> toResponse(FinancialProfile p) {
        double income = orZero(p.getMonthlyIncome()) + orZero(p.getOtherIncome());
        double fixed = orZero(p.getRent()) + orZero(p.getUtilities()) + orZero(p.getInsurance())
                + orZero(p.getLoans()) + orZero(p.getSubscriptions());
        double variable = orZero(p.getFood()) + orZero(p.getTransport()) + orZero(p.getLeisure())
                + orZero(p.getClothing()) + orZero(p.getHealth());
        double total = fixed + variable;

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("userId", p.getUserId());
        m.put("monthlyIncome", income);
        m.put("totalFixedExpenses", fixed);
        m.put("totalVariableExpenses", variable);
        m.put("totalExpenses", total);
        m.put("monthlySurplus", income - total);
        m.put("savingsRate", p.getSavingsRate());
        m.put("debtRatio", p.getDebtRatio());
        m.put("financialScore", p.getFinancialScore());
        m.put("currentSavings", p.getCurrentSavings());
        m.put("totalDebt", p.getTotalDebt());
        m.put("insights", scoringService.generateInsights(p));
        m.put("breakdown", Map.of(
                "housing", orZero(p.getRent()),
                "food", orZero(p.getFood()),
                "transport", orZero(p.getTransport()),
                "leisure", orZero(p.getLeisure()),
                "loans", orZero(p.getLoans()),
                "other", orZero(p.getUtilities()) + orZero(p.getInsurance())
                        + orZero(p.getSubscriptions()) + orZero(p.getClothing()) + orZero(p.getHealth())));
        m.put("updatedAt", p.getUpdatedAt());
        return m;
    }
}
