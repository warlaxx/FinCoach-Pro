package com.fincoach.service;

import com.fincoach.model.ActionPlan;
import com.fincoach.model.ChatMessage;
import com.fincoach.model.FinancialProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
interface FinancialProfileRepository extends JpaRepository<FinancialProfile, Long> {
    Optional<FinancialProfile> findTopByUserIdOrderByUpdatedAtDesc(String userId);
    List<FinancialProfile> findByUserIdOrderByCreatedAtDesc(String userId);
}

@Repository
interface ActionPlanRepository extends JpaRepository<ActionPlan, Long> {
    List<ActionPlan> findByUserIdOrderByPriorityAscCreatedAtDesc(String userId);
    List<ActionPlan> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);
}

@Repository
interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByUserIdOrderByCreatedAtAsc(String userId);
    List<ChatMessage> findTop20ByUserIdOrderByCreatedAtDesc(String userId);
}
