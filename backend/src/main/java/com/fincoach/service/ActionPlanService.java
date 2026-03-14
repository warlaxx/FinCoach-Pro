package com.fincoach.service;

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

    public Map<String, Object> toResponse(ActionPlan a) {
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

    public void generateFromProfile(FinancialProfile p) {
        log.debug("Evaluating action plans for userId={} (savingsRate={}%, debtRatio={}%, subscriptions={}€)",
                p.getUserId(), p.getSavingsRate(), p.getDebtRatio(), p.getSubscriptions());

        double income = orZero(p.getMonthlyIncome()) + orZero(p.getOtherIncome());
        List<ActionPlan> actions = new ArrayList<>();

        if (orZero(p.getSavingsRate()) < 10 && income > 0
                && !actionRepo.existsByUserIdAndTitleAndStatus(p.getUserId(), "Atteindre 10% de taux d'épargne", "EN_COURS")) {
            ActionPlan a = new ActionPlan();
            a.setUserId(p.getUserId());
            a.setTitle("Atteindre 10% de taux d'épargne");
            a.setDescription("Mettez en place un virement automatique dès réception du salaire. Objectif : épargner "
                    + (int) (income * 0.10) + " €/mois.");
            a.setCategory("EPARGNE");
            a.setPriority("HAUTE");
            a.setTargetAmount(income * 0.10 * 12);
            a.setCurrentAmount(0.0);
            a.setDeadline(LocalDate.now().plusMonths(6));
            actions.add(a);
        }

        if (orZero(p.getCurrentSavings()) < income * 3
                && !actionRepo.existsByUserIdAndTitleAndStatus(p.getUserId(), "Constituer un fonds d'urgence (3 mois)", "EN_COURS")) {
            ActionPlan a = new ActionPlan();
            a.setUserId(p.getUserId());
            a.setTitle("Constituer un fonds d'urgence (3 mois)");
            a.setDescription("Objectif : " + (int) (income * 3) + " € sur Livret A. Ce coussin vous protège des imprévus.");
            a.setCategory("EPARGNE");
            a.setPriority("HAUTE");
            a.setTargetAmount(income * 3);
            a.setCurrentAmount(orZero(p.getCurrentSavings()));
            a.setDeadline(LocalDate.now().plusMonths(12));
            actions.add(a);
        }

        if (orZero(p.getDebtRatio()) > 25
                && !actionRepo.existsByUserIdAndTitleAndStatus(p.getUserId(), "Réduire le ratio d'endettement", "EN_COURS")) {
            ActionPlan a = new ActionPlan();
            a.setUserId(p.getUserId());
            a.setTitle("Réduire le ratio d'endettement");
            a.setDescription("Votre taux d'endettement dépasse 25%. Appliquez la méthode avalanche : remboursez en priorité la dette au taux le plus élevé.");
            a.setCategory("DETTE");
            a.setPriority("HAUTE");
            a.setTargetAmount(orZero(p.getTotalDebt()) * 0.3);
            a.setCurrentAmount(0.0);
            a.setDeadline(LocalDate.now().plusMonths(18));
            actions.add(a);
        }

        if (orZero(p.getSubscriptions()) > 60
                && !actionRepo.existsByUserIdAndTitleAndStatus(p.getUserId(), "Auditer vos abonnements", "EN_COURS")) {
            ActionPlan a = new ActionPlan();
            a.setUserId(p.getUserId());
            a.setTitle("Auditer vos abonnements");
            a.setDescription("Listez tous vos abonnements et supprimez ceux que vous utilisez peu. Potentiel d'économie : "
                    + (int) (orZero(p.getSubscriptions()) * 0.3) + " €/mois.");
            a.setCategory("BUDGET");
            a.setPriority("MOYENNE");
            a.setTargetAmount(orZero(p.getSubscriptions()) * 0.3 * 12);
            a.setCurrentAmount(0.0);
            a.setDeadline(LocalDate.now().plusWeeks(2));
            actions.add(a);
        }

        if (!actions.isEmpty()) {
            actionRepo.saveAll(actions);
            log.info("{} action plan(s) generated for userId={}", actions.size(), p.getUserId());
        } else {
            log.debug("No new action plans to generate for userId={}", p.getUserId());
        }
    }
}
