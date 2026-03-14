package com.fincoach.controller;

import com.fincoach.dto.ChatRequest;
import com.fincoach.model.ChatMessage;
import com.fincoach.repository.ChatMessageRepository;
import com.fincoach.service.AiChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getChatHistory(@PathVariable String userId) {
        log.info("GET /chat/{}", userId);
        var messages = chatRepo.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(messages);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> chat(@RequestBody ChatRequest request) {
        String userId = request.getUserId();
        String message = request.getMessage();
        log.info("POST /chat - userId={} ({} chars)", userId, message != null ? message.length() : 0);

        chatRepo.save(new ChatMessage(null, userId, "user", message, null));

        List<ChatMessage> history = chatRepo.findTop20ByUserIdOrderByCreatedAtDesc(userId);
        Collections.reverse(history);

        String aiResponse = aiChatService.chat(history, message);
        ChatMessage assistantMsg = chatRepo.save(new ChatMessage(null, userId, "assistant", aiResponse, null));

        log.info("Chat exchange completed for userId={}", userId);
        return ResponseEntity.ok(toResponse(assistantMsg));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> clearChat(@PathVariable String userId) {
        log.info("DELETE /chat/{}", userId);
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
