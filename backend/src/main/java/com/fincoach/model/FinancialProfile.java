package com.fincoach.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "financial_profiles")
public class FinancialProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String userId;
    private Double monthlyIncome;
    private Double otherIncome;
    private Double rent;
    private Double utilities;
    private Double insurance;
    private Double loans;
    private Double subscriptions;
    private Double food;
    private Double transport;
    private Double leisure;
    private Double clothing;
    private Double health;
    private Double currentSavings;
    private Double totalDebt;
    private Double monthlySavingsGoal;
    private String typeHabitation;
    private String situationFamiliale;
    private Integer nombrePersonnes;
    private String financialScore;
    private Double savingsRate;
    private Double debtRatio;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public FinancialProfile() {
    }

    public FinancialProfile(Long id, String userId, Double monthlyIncome, Double otherIncome,
            Double rent, Double utilities, Double insurance, Double loans, Double subscriptions,
            Double food, Double transport, Double leisure, Double clothing, Double health,
            Double currentSavings, Double totalDebt, Double monthlySavingsGoal,
            String financialScore, Double savingsRate, Double debtRatio,
            LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.monthlyIncome = monthlyIncome;
        this.otherIncome = otherIncome;
        this.rent = rent;
        this.utilities = utilities;
        this.insurance = insurance;
        this.loans = loans;
        this.subscriptions = subscriptions;
        this.food = food;
        this.transport = transport;
        this.leisure = leisure;
        this.clothing = clothing;
        this.health = health;
        this.currentSavings = currentSavings;
        this.totalDebt = totalDebt;
        this.monthlySavingsGoal = monthlySavingsGoal;
        this.financialScore = financialScore;
        this.savingsRate = savingsRate;
        this.debtRatio = debtRatio;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Double getMonthlyIncome() {
        return monthlyIncome;
    }

    public void setMonthlyIncome(Double monthlyIncome) {
        this.monthlyIncome = monthlyIncome;
    }

    public Double getOtherIncome() {
        return otherIncome;
    }

    public void setOtherIncome(Double otherIncome) {
        this.otherIncome = otherIncome;
    }

    public Double getRent() {
        return rent;
    }

    public void setRent(Double rent) {
        this.rent = rent;
    }

    public Double getUtilities() {
        return utilities;
    }

    public void setUtilities(Double utilities) {
        this.utilities = utilities;
    }

    public Double getInsurance() {
        return insurance;
    }

    public void setInsurance(Double insurance) {
        this.insurance = insurance;
    }

    public Double getLoans() {
        return loans;
    }

    public void setLoans(Double loans) {
        this.loans = loans;
    }

    public Double getSubscriptions() {
        return subscriptions;
    }

    public void setSubscriptions(Double subscriptions) {
        this.subscriptions = subscriptions;
    }

    public Double getFood() {
        return food;
    }

    public void setFood(Double food) {
        this.food = food;
    }

    public Double getTransport() {
        return transport;
    }

    public void setTransport(Double transport) {
        this.transport = transport;
    }

    public Double getLeisure() {
        return leisure;
    }

    public void setLeisure(Double leisure) {
        this.leisure = leisure;
    }

    public Double getClothing() {
        return clothing;
    }

    public void setClothing(Double clothing) {
        this.clothing = clothing;
    }

    public Double getHealth() {
        return health;
    }

    public void setHealth(Double health) {
        this.health = health;
    }

    public Double getCurrentSavings() {
        return currentSavings;
    }

    public void setCurrentSavings(Double currentSavings) {
        this.currentSavings = currentSavings;
    }

    public Double getTotalDebt() {
        return totalDebt;
    }

    public void setTotalDebt(Double totalDebt) {
        this.totalDebt = totalDebt;
    }

    public Double getMonthlySavingsGoal() {
        return monthlySavingsGoal;
    }

    public void setMonthlySavingsGoal(Double monthlySavingsGoal) {
        this.monthlySavingsGoal = monthlySavingsGoal;
    }

    public String getTypeHabitation() {
        return typeHabitation;
    }

    public void setTypeHabitation(String typeHabitation) {
        this.typeHabitation = typeHabitation;
    }

    public String getSituationFamiliale() {
        return situationFamiliale;
    }

    public void setSituationFamiliale(String situationFamiliale) {
        this.situationFamiliale = situationFamiliale;
    }

    public Integer getNombrePersonnes() {
        return nombrePersonnes;
    }

    public void setNombrePersonnes(Integer nombrePersonnes) {
        this.nombrePersonnes = nombrePersonnes;
    }

    public String getFinancialScore() {
        return financialScore;
    }

    public void setFinancialScore(String financialScore) {
        this.financialScore = financialScore;
    }

    public Double getSavingsRate() {
        return savingsRate;
    }

    public void setSavingsRate(Double savingsRate) {
        this.savingsRate = savingsRate;
    }

    public Double getDebtRatio() {
        return debtRatio;
    }

    public void setDebtRatio(Double debtRatio) {
        this.debtRatio = debtRatio;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}