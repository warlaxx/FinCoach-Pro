package com.fincoach.repository;

import com.fincoach.model.ActionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ActionPlanRepository extends JpaRepository<ActionPlan, Long> {
    List<ActionPlan> findByUserIdOrderByPriorityAscCreatedAtDesc(String userId);

    List<ActionPlan> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);

    boolean existsByUserIdAndTitleAndStatus(String userId, String title, String status);
}