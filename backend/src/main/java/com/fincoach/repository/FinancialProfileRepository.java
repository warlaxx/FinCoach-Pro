package com.fincoach.repository;

import com.fincoach.model.FinancialProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FinancialProfileRepository extends JpaRepository<FinancialProfile, Long> {
    Optional<FinancialProfile> findTopByUserIdOrderByUpdatedAtDesc(String userId);
    List<FinancialProfile> findByUserIdOrderByCreatedAtDesc(String userId);
}