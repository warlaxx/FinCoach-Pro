package com.fincoach.controller;

import com.fincoach.dto.ChatRequest;
import com.fincoach.model.ChatMessage;
import com.fincoach.repository.ChatMessageRepository;
import com.fincoach.service.AiChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final ChatMessageRepository chatRepo;
    private final AiChatService aiChatService;

    public ChatController(ChatMessageRepository chatRepo, AiChatService aiChatService) {
        this.chatRepo = chatRepo;
        this.aiChatService = aiChatService;
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getChatHistory(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        log.info("GET /chat/history - userId={}", userId);
        var messages = chatRepo.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(messages);
    }

    /** Maximum allowed length for a single user message (characters). */
    private static final int MAX_MESSAGE_LENGTH = 2_000;

    @PostMapping
    public ResponseEntity<?> chat(@RequestBody ChatRequest request, Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        String message = request.getMessage();
        log.info("POST /chat - userId={} ({} chars)", userId, message != null ? message.length() : 0);

        // Reject oversized messages to prevent prompt-injection and abuse
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le message ne peut pas être vide."));
        }
        if (message.length() > MAX_MESSAGE_LENGTH) {
            return ResponseEntity.badRequest().body(Map.of("error",
                    "Le message est trop long. Maximum " + MAX_MESSAGE_LENGTH + " caractères."));
        }

        chatRepo.save(new ChatMessage(null, userId, "user", message, null));

        List<ChatMessage> history = chatRepo.findTop20ByUserIdOrderByCreatedAtDesc(userId);
        Collections.reverse(history);

        String aiResponse = aiChatService.chat(history, message);
        ChatMessage assistantMsg = chatRepo.save(new ChatMessage(null, userId, "assistant", aiResponse, null));

        log.info("Chat exchange completed for userId={}", userId);
        return ResponseEntity.ok(toResponse(assistantMsg));
    }

    @DeleteMapping
    public ResponseEntity<Void> clearChat(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        log.info("DELETE /chat - userId={}", userId);
        List<ChatMessage> all = chatRepo.findByUserIdOrderByCreatedAtAsc(userId);
        chatRepo.deleteAll(all);
        log.info("Cleared {} message(s) for userId={}", all.size(), userId);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> toResponse(ChatMessage msg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", msg.getId());
        m.put("userId", msg.getUserId());
        m.put("role", msg.getRole());
        m.put("content", msg.getContent());
        m.put("createdAt", msg.getCreatedAt());
        return m;
    }
}
