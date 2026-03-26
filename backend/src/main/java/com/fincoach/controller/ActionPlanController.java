package com.fincoach.controller;

import com.fincoach.dto.ActionPlanRequest;
import com.fincoach.model.ActionCategorie;
import com.fincoach.model.ActionPlan;
import com.fincoach.model.ActionStatut;
import com.fincoach.service.ActionPlanService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
        log.info("GET /actions/{}", userId);
        if (!userId.equals(authenticatedUserId)) {
            log.warn("User {} tried to access actions of user {}", authenticatedUserId, userId);
            return ResponseEntity.status(403).build();
        }
        var actions = actionPlanService.getActionsForUser(userId).stream()
                .map(actionPlanService::toResponse)
                .toList();
        return ResponseEntity.ok(actions);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createAction(
            @RequestBody ActionPlanRequest request,
            @AuthenticationPrincipal String authenticatedUserId) {
        log.info("POST /actions - title='{}', userId={}", request.getTitle(), authenticatedUserId);
        ActionPlan action = new ActionPlan();
        action.setUserId(authenticatedUserId);
        action.setTitle(request.getTitle());
        action.setDescription(request.getDescription());
        if (request.getCategory() != null) {
            action.setCategory(ActionCategorie.valueOf(request.getCategory()));
        }
        action.setPriority(request.getPriority());
        action.setTargetAmount(request.getTargetAmount());
        action.setCurrentAmount(request.getCurrentAmount() != null ? request.getCurrentAmount() : 0.0);
        action.setDeadline(request.getDeadline());
        ActionPlan saved = actionPlanService.save(action);
        return ResponseEntity.ok(actionPlanService.toResponse(saved));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateActionStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal String authenticatedUserId) {
        log.info("PUT /actions/{}/status - payload={}", id, body);
        return actionPlanService.findById(id).map(action -> {
            if (!action.getUserId().equals(authenticatedUserId)) {
                log.warn("User {} tried to update action {} owned by {}", authenticatedUserId, id, action.getUserId());
                return ResponseEntity.<Map<String, Object>>status(403).build();
            }
            if (body.get("status") instanceof String status) {
                action.setStatus(ActionStatut.valueOf(status));
            }
            if (body.get("currentAmount") instanceof Number amount) {
                action.setCurrentAmount(amount.doubleValue());
            }
            ActionPlan saved = actionPlanService.save(action);
            return ResponseEntity.ok(actionPlanService.toResponse(saved));
        }).orElseGet(() -> {
            log.warn("Action id={} not found", id);
            return ResponseEntity.notFound().build();
        });
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAction(
            @PathVariable Long id,
            @AuthenticationPrincipal String authenticatedUserId) {
        log.info("DELETE /actions/{}", id);
        return actionPlanService.findById(id).map(action -> {
            if (!action.getUserId().equals(authenticatedUserId)) {
                log.warn("User {} tried to delete action {} owned by {}", authenticatedUserId, id, action.getUserId());
                return ResponseEntity.<Void>status(403).build();
            }
            actionPlanService.deleteById(id);
            return ResponseEntity.<Void>noContent().build();
        }).orElseGet(() -> ResponseEntity.<Void>notFound().build());
    }
}
