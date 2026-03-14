package com.fincoach.controller;

import com.fincoach.model.ActionPlan;
import com.fincoach.service.ActionPlanService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<Map<String, Object>>> getActions(@PathVariable String userId) {
        log.info("GET /actions/{}", userId);
        var actions = actionPlanService.getActionsForUser(userId).stream()
                .map(actionPlanService::toResponse)
                .toList();
        return ResponseEntity.ok(actions);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createAction(@RequestBody ActionPlan action) {
        log.info("POST /actions - title='{}', userId={}", action.getTitle(), action.getUserId());
        ActionPlan saved = actionPlanService.save(action);
        return ResponseEntity.ok(actionPlanService.toResponse(saved));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateActionStatus(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        log.info("PUT /actions/{}/status - payload={}", id, body);
        return actionPlanService.findById(id).map(action -> {
            if (body.get("status") instanceof String status) {
                action.setStatus(status);
            }
            if (body.get("currentAmount") instanceof Number amount) {
                action.setCurrentAmount(amount.doubleValue());
            }
            return ResponseEntity.ok(actionPlanService.toResponse(actionPlanService.save(action)));
        }).orElseGet(() -> {
            log.warn("Action id={} not found", id);
            return ResponseEntity.notFound().build();
        });
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAction(@PathVariable Long id) {
        log.info("DELETE /actions/{}", id);
        if (!actionPlanService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        actionPlanService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
