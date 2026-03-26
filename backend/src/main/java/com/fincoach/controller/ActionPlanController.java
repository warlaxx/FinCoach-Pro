package com.fincoach.controller;

import com.fincoach.dto.ActionPlanRequest;
import com.fincoach.model.ActionCategorie;
import com.fincoach.model.ActionPlan;
import com.fincoach.model.ActionStatut;
import com.fincoach.service.ActionPlanService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/actions")
public class ActionPlanController {

    private static final Logger log = LoggerFactory.getLogger(ActionPlanController.class);

    private final ActionPlanService actionPlanService;

    public ActionPlanController(ActionPlanService actionPlanService) {
        this.actionPlanService = actionPlanService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getActions(
            @PathVariable String userId,
            @AuthenticationPrincipal String authenticatedUserId) {
        log.info("GET /actions for authenticated user");
        if (!userId.equals(authenticatedUserId)) {
            log.warn("Forbidden: authenticated user does not match requested userId");
            return ResponseEntity.status(403).build();
        }
        var actions = actionPlanService.getActionsForUser(userId).stream()
                .map(actionPlanService::toResponse)
                .toList();
        return ResponseEntity.ok(actions);
    }

    @PostMapping
    public ResponseEntity<?> createAction(
            @Valid @RequestBody ActionPlanRequest request,
            @AuthenticationPrincipal String authenticatedUserId) {
        log.info("POST /actions for authenticated user");
        ActionPlan action = new ActionPlan();
        action.setUserId(authenticatedUserId);
        action.setTitle(request.getTitle());
        action.setDescription(request.getDescription());
        if (request.getCategory() != null) {
            try {
                action.setCategory(ActionCategorie.valueOf(request.getCategory()));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Catégorie invalide : " + request.getCategory()));
            }
        }
        action.setPriority(request.getPriority());
        action.setTargetAmount(request.getTargetAmount());
        action.setCurrentAmount(request.getCurrentAmount() != null ? request.getCurrentAmount() : 0.0);
        action.setDeadline(request.getDeadline());
        ActionPlan saved = actionPlanService.save(action);
        return ResponseEntity.ok(actionPlanService.toResponse(saved));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateActionStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal String authenticatedUserId) {
        log.info("PUT /actions/{}/status", id);
        Optional<ActionPlan> opt = actionPlanService.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        ActionPlan action = opt.get();
        if (!action.getUserId().equals(authenticatedUserId)) {
            log.warn("Forbidden: authenticated user does not own action id={}", id);
            return ResponseEntity.status(403).build();
        }
        boolean explicitStatus = false;
        if (body.get("status") instanceof String status) {
            try {
                action.setStatus(ActionStatut.valueOf(status));
                explicitStatus = true;
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Statut invalide : " + status));
            }
        }
        if (body.get("currentAmount") instanceof Number amount) {
            action.setCurrentAmount(amount.doubleValue());
        }
        ActionPlan saved = actionPlanService.save(action, explicitStatus);
        return ResponseEntity.ok(actionPlanService.toResponse(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAction(
            @PathVariable Long id,
            @AuthenticationPrincipal String authenticatedUserId) {
        log.info("DELETE /actions/{}", id);
        Optional<ActionPlan> opt = actionPlanService.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        ActionPlan action = opt.get();
        if (!action.getUserId().equals(authenticatedUserId)) {
            log.warn("Forbidden: authenticated user does not own action id={}", id);
            return ResponseEntity.status(403).build();
        }
        actionPlanService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
