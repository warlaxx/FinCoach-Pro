package com.fincoach.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "financial_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinancialProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;

    // Revenus
    private Double monthlyIncome;
    private Double otherIncome;

    // Charges fixes
    private Double rent;
    private Double utilities;
    private Double insurance;
    private Double loans;
    private Double subscriptions;

    // Charges variables
    private Double food;
    private Double transport;
    private Double leisure;
    private Double clothing;
    private Double health;

    // Épargne & Dettes
    private Double currentSavings;
    private Double totalDebt;
    private Double monthlySavingsGoal;

    // Score calculé
    private String financialScore;
    private Double savingsRate;
    private Double debtRatio;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
