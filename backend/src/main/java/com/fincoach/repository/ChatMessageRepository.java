package com.fincoach.repository;

import com.fincoach.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByUserIdOrderByCreatedAtAsc(String userId);

    List<ChatMessage> findTop20ByUserIdOrderByCreatedAtDesc(String userId);
}