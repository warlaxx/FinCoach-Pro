package com.fincoach.repository;

import com.fincoach.model.ActionPlan;
import com.fincoach.model.ActionStatut;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ActionPlanRepository extends JpaRepository<ActionPlan, Long> {
    List<ActionPlan> findByUserIdOrderByDeadlineAscCreatedAtDesc(String userId);

    List<ActionPlan> findByUserIdOrderByPriorityAscCreatedAtDesc(String userId);

    List<ActionPlan> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, ActionStatut status);

    boolean existsByUserIdAndTitleAndStatus(String userId, String title, ActionStatut status);
}
