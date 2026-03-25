package com.fincoach.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "financial_history")
public class FinancialHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String userId;
    private LocalDate month;
    private Double income;
    private Double expenses;
    private Double savings;
    private Double debt;
    private String score;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    public FinancialHistory() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // --- Getters & Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public LocalDate getMonth() { return month; }
    public void setMonth(LocalDate month) { this.month = month; }

    public Double getIncome() { return income; }
    public void setIncome(Double income) { this.income = income; }

    public Double getExpenses() { return expenses; }
    public void setExpenses(Double expenses) { this.expenses = expenses; }

    public Double getSavings() { return savings; }
    public void setSavings(Double savings) { this.savings = savings; }

    public Double getDebt() { return debt; }
    public void setDebt(Double debt) { this.debt = debt; }

    public String getScore() { return score; }
    public void setScore(String score) { this.score = score; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
