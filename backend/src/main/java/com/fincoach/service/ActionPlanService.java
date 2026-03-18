package com.fincoach.service;

import com.fincoach.config.AppConstants;
import com.fincoach.model.ActionPlan;
import com.fincoach.model.FinancialProfile;
import com.fincoach.repository.ActionPlanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.fincoach.util.NumberUtils.orZero;

@Service
public class ActionPlanService {

    private static final Logger log = LoggerFactory.getLogger(ActionPlanService.class);

    private final ActionPlanRepository actionRepo;

    public ActionPlanService(ActionPlanRepository actionRepo) {
        this.actionRepo = actionRepo;
    }

    public List<ActionPlan> getActionsForUser(String userId) {
        return actionRepo.findByUserIdOrderByPriorityAscCreatedAtDesc(userId);
    }

    public ActionPlan save(ActionPlan action) {
        return actionRepo.save(action);
    }

    public Optional<ActionPlan> findById(Long id) {
        return actionRepo.findById(id);
    }

    public boolean existsById(Long id) {
        return actionRepo.existsById(id);
    }

    public void deleteById(Long id) {
        actionRepo.deleteById(id);
    }

    public Map<String, Object> buildStats(String userId) {
        List<ActionPlan> all = actionRepo.findByUserIdOrderByPriorityAscCreatedAtDesc(userId);
        long total = all.size();
        long done = all.stream().filter(a -> "TERMINE".equals(a.getStatus())).count();
        long inProgress = all.stream().filter(a -> "EN_COURS".equals(a.getStatus())).count();
        log.debug("Stats for userId={} - total={}, done={}, inProgress={}", userId, total, done, inProgress);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalActions", total);
        stats.put("completedActions", done);
        stats.put("inProgressActions", inProgress);
        stats.put("completionRate", total > 0 ? Math.round((done * 100.0 / total) * 10) / 10.0 : 0);
        return stats;
    }

    public Map<String, Object> toResponse(ActionPlan action) {
        double progressPercent = 0;
        if (action.getTargetAmount() != null && action.getTargetAmount() > 0 && action.getCurrentAmount() != null) {
            progressPercent = Math.min(100, (action.getCurrentAmount() / action.getTargetAmount()) * 100);
        }
        Map<String, Object> actionResponse = new LinkedHashMap<>();
        actionResponse.put("id", action.getId());
        actionResponse.put("userId", action.getUserId());
        actionResponse.put("title", action.getTitle());
        actionResponse.put("description", action.getDescription());
        actionResponse.put("category", action.getCategory());
        actionResponse.put("priority", action.getPriority());
        actionResponse.put("status", action.getStatus());
        actionResponse.put("targetAmount", action.getTargetAmount());
        actionResponse.put("currentAmount", action.getCurrentAmount());
        actionResponse.put("progressPercent", Math.round(progressPercent * 10.0) / 10.0);
        actionResponse.put("deadline", action.getDeadline());
        actionResponse.put("createdAt", action.getCreatedAt());
        return actionResponse;
    }

    public void generateFromProfile(FinancialProfile profile) {
        log.debug("Evaluating action plans for userId={} (savingsRate={}%, debtRatio={}%, subscriptions={}€)",
                profile.getUserId(), profile.getSavingsRate(), profile.getDebtRatio(), profile.getSubscriptions());

        double totalIncome = orZero(profile.getMonthlyIncome()) + orZero(profile.getOtherIncome());
        List<ActionPlan> newActions = new ArrayList<>();

        if (orZero(profile.getSavingsRate()) < AppConstants.ACTION_SAVINGS_TRIGGER_RATE && totalIncome > 0
                && !actionRepo.existsByUserIdAndTitleAndStatus(profile.getUserId(), "Atteindre 10% de taux d'épargne", "EN_COURS")) {
            ActionPlan action = new ActionPlan();
            action.setUserId(profile.getUserId());
            action.setTitle("Atteindre 10% de taux d'épargne");
            action.setDescription("Mettez en place un virement automatique dès réception du salaire. Objectif : épargner "
                    + (int) (totalIncome * 0.10) + " €/mois.");
            action.setCategory("EPARGNE");
            action.setPriority("HAUTE");
            action.setTargetAmount(totalIncome * 0.10 * 12);
            action.setCurrentAmount(0.0);
            action.setDeadline(LocalDate.now().plusMonths(6));
            newActions.add(action);
        }

        if (orZero(profile.getCurrentSavings()) < totalIncome * AppConstants.ACTION_EMERGENCY_FUND_MONTHS
                && !actionRepo.existsByUserIdAndTitleAndStatus(profile.getUserId(), "Constituer un fonds d'urgence (3 mois)", "EN_COURS")) {
            ActionPlan action = new ActionPlan();
            action.setUserId(profile.getUserId());
            action.setTitle("Constituer un fonds d'urgence (3 mois)");
            action.setDescription("Objectif : " + (int) (totalIncome * AppConstants.ACTION_EMERGENCY_FUND_MONTHS) + " € sur Livret A. Ce coussin vous protège des imprévus.");
            action.setCategory("EPARGNE");
            action.setPriority("HAUTE");
            action.setTargetAmount(totalIncome * AppConstants.ACTION_EMERGENCY_FUND_MONTHS);
            action.setCurrentAmount(orZero(profile.getCurrentSavings()));
            action.setDeadline(LocalDate.now().plusMonths(12));
            newActions.add(action);
        }

        if (orZero(profile.getDebtRatio()) > AppConstants.ACTION_DEBT_RATIO_TRIGGER
                && !actionRepo.existsByUserIdAndTitleAndStatus(profile.getUserId(), "Réduire le ratio d'endettement", "EN_COURS")) {
            ActionPlan action = new ActionPlan();
            action.setUserId(profile.getUserId());
            action.setTitle("Réduire le ratio d'endettement");
            action.setDescription("Votre taux d'endettement dépasse 25%. Appliquez la méthode avalanche : remboursez en priorité la dette au taux le plus élevé.");
            action.setCategory("DETTE");
            action.setPriority("HAUTE");
            action.setTargetAmount(orZero(profile.getTotalDebt()) * 0.3);
            action.setCurrentAmount(0.0);
            action.setDeadline(LocalDate.now().plusMonths(18));
            newActions.add(action);
        }

        if (orZero(profile.getSubscriptions()) > AppConstants.ACTION_SUBSCRIPTIONS_THRESHOLD
                && !actionRepo.existsByUserIdAndTitleAndStatus(profile.getUserId(), "Auditer vos abonnements", "EN_COURS")) {
            ActionPlan action = new ActionPlan();
            action.setUserId(profile.getUserId());
            action.setTitle("Auditer vos abonnements");
            action.setDescription("Listez tous vos abonnements et supprimez ceux que vous utilisez peu. Potentiel d'économie : "
                    + (int) (orZero(profile.getSubscriptions()) * 0.3) + " €/mois.");
            action.setCategory("BUDGET");
            action.setPriority("MOYENNE");
            action.setTargetAmount(orZero(profile.getSubscriptions()) * 0.3 * 12);
            action.setCurrentAmount(0.0);
            action.setDeadline(LocalDate.now().plusWeeks(2));
            newActions.add(action);
        }

        if (!newActions.isEmpty()) {
            actionRepo.saveAll(newActions);
            log.info("{} action plan(s) generated for userId={}", newActions.size(), profile.getUserId());
        } else {
            log.debug("No new action plans to generate for userId={}", profile.getUserId());
        }
    }
}
