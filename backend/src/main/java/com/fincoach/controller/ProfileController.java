package com.fincoach.controller;

import com.fincoach.dto.FinancialProfileRequest;
import com.fincoach.dto.ScoreResult;
import com.fincoach.model.FinancialProfile;
import com.fincoach.repository.FinancialProfileRepository;
import com.fincoach.service.ActionPlanService;
import com.fincoach.service.FinancialScoringService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

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

    /** GET /api/profile — retourne le profil de l'utilisateur connecté. */
    @GetMapping("/profile")
    public ResponseEntity<?> getMyProfile(@AuthenticationPrincipal String userId) {
        log.info("GET /profile for userId={}", userId);
        Optional<FinancialProfile> profileOpt = profileRepo.findTopByUserIdOrderByUpdatedAtDesc(userId);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(toResponse(profileOpt.get()));
    }

    /** GET /api/profile/{userId} — conservé pour compatibilité dashboard. */
    @GetMapping("/profile/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable String userId) {
        log.info("GET /profile/{}", userId);
        Optional<FinancialProfile> profileOpt = profileRepo.findTopByUserIdOrderByUpdatedAtDesc(userId);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(toResponse(profileOpt.get()));
    }

    /**
     * POST /api/profile — upsert du profil financier.
     * L'userId est extrait du JWT (jamais du body), ce qui empêche toute usurpation.
     */
    @PostMapping("/profile")
    public ResponseEntity<?> saveProfile(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody FinancialProfileRequest req,
            BindingResult bindingResult) {

        if (bindingResult.hasErrors()) {
            Map<String, String> errors = bindingResult.getFieldErrors().stream()
                    .collect(Collectors.toMap(
                            fe -> fe.getField(),
                            fe -> fe.getDefaultMessage(),
                            (a, b) -> a));
            log.warn("Validation errors for userId={}: {}", userId, errors);
            return ResponseEntity.badRequest().body(Map.of("errors", errors));
        }

        log.info("POST /profile (upsert) for userId={}", userId);

        // Upsert : mise à jour si profil existant, création sinon
        Optional<FinancialProfile> existingOpt = profileRepo.findTopByUserIdOrderByUpdatedAtDesc(userId);
        FinancialProfile profile = existingOpt.orElse(new FinancialProfile());
        profile.setUserId(userId);

        profile.setMonthlyIncome(req.getMonthlyIncome());
        profile.setOtherIncome(req.getOtherIncome() != null ? req.getOtherIncome() : 0.0);
        profile.setRent(req.getRent());
        profile.setUtilities(req.getUtilities() != null ? req.getUtilities() : 0.0);
        profile.setInsurance(req.getInsurance() != null ? req.getInsurance() : 0.0);
        profile.setLoans(req.getLoans());
        profile.setSubscriptions(req.getSubscriptions() != null ? req.getSubscriptions() : 0.0);
        profile.setFood(req.getFood());
        profile.setTransport(req.getTransport() != null ? req.getTransport() : 0.0);
        profile.setLeisure(req.getLeisure() != null ? req.getLeisure() : 0.0);
        profile.setClothing(req.getClothing() != null ? req.getClothing() : 0.0);
        profile.setHealth(req.getHealth() != null ? req.getHealth() : 0.0);
        profile.setCurrentSavings(req.getCurrentSavings());
        profile.setTotalDebt(req.getTotalDebt());
        profile.setMonthlySavingsGoal(req.getMonthlySavingsGoal() != null ? req.getMonthlySavingsGoal() : 0.0);
        profile.setTypeHabitation(req.getTypeHabitation());
        profile.setSituationFamiliale(req.getSituationFamiliale());
        profile.setNombrePersonnes(req.getNombrePersonnes() != null ? req.getNombrePersonnes() : 0);

        scoringService.computeScores(profile);
        FinancialProfile saved = profileRepo.save(profile);
        log.info("Profile upserted id={}, score={}", saved.getId(), saved.getFinancialScore());
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
                .filter(a -> com.fincoach.model.ActionStatut.EN_COURS == a.getStatus())
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
        m.put("typeHabitation", p.getTypeHabitation());
        m.put("situationFamiliale", p.getSituationFamiliale());
        m.put("nombrePersonnes", p.getNombrePersonnes());
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

        // Score breakdown (calculé à la volée — non persisté, omis si profil incomplet)
        ScoreResult scoreResult = scoringService.calculateScore(p);
        if (!"N/A".equals(scoreResult.getGrade())) {
            m.put("scoreBreakdown", Map.of(
                    "grade", scoreResult.getGrade(),
                    "totalScore", scoreResult.getTotalScore(),
                    "breakdown", scoreResult.getBreakdown(),
                    "message", scoreResult.getMessage()
            ));
        }

        // Champs bruts pour pré-remplissage du formulaire
        m.put("raw", Map.ofEntries(
                Map.entry("monthlyIncome", orZero(p.getMonthlyIncome())),
                Map.entry("otherIncome", orZero(p.getOtherIncome())),
                Map.entry("rent", orZero(p.getRent())),
                Map.entry("utilities", orZero(p.getUtilities())),
                Map.entry("insurance", orZero(p.getInsurance())),
                Map.entry("loans", orZero(p.getLoans())),
                Map.entry("subscriptions", orZero(p.getSubscriptions())),
                Map.entry("food", orZero(p.getFood())),
                Map.entry("transport", orZero(p.getTransport())),
                Map.entry("leisure", orZero(p.getLeisure())),
                Map.entry("clothing", orZero(p.getClothing())),
                Map.entry("health", orZero(p.getHealth())),
                Map.entry("currentSavings", orZero(p.getCurrentSavings())),
                Map.entry("totalDebt", orZero(p.getTotalDebt())),
                Map.entry("monthlySavingsGoal", orZero(p.getMonthlySavingsGoal()))
        ));
        return m;
    }
}
