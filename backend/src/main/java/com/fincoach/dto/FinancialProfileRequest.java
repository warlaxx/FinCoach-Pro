package com.fincoach.dto;

import java.time.LocalDate;

public class FinancialProfileRequest {
    private String userId;
    private Double monthlyIncome, otherIncome, rent, utilities, insurance;
    private Double loans, subscriptions, food, transport, leisure;
    private Double clothing, health, currentSavings, totalDebt, monthlySavingsGoal;
    public FinancialProfileRequest() {}
    public String getUserId() { return userId; } public void setUserId(String v) { userId = v; }
    public Double getMonthlyIncome() { return monthlyIncome; } public void setMonthlyIncome(Double v) { monthlyIncome = v; }
    public Double getOtherIncome() { return otherIncome; } public void setOtherIncome(Double v) { otherIncome = v; }
    public Double getRent() { return rent; } public void setRent(Double v) { rent = v; }
    public Double getUtilities() { return utilities; } public void setUtilities(Double v) { utilities = v; }
    public Double getInsurance() { return insurance; } public void setInsurance(Double v) { insurance = v; }
    public Double getLoans() { return loans; } public void setLoans(Double v) { loans = v; }
    public Double getSubscriptions() { return subscriptions; } public void setSubscriptions(Double v) { subscriptions = v; }
    public Double getFood() { return food; } public void setFood(Double v) { food = v; }
    public Double getTransport() { return transport; } public void setTransport(Double v) { transport = v; }
    public Double getLeisure() { return leisure; } public void setLeisure(Double v) { leisure = v; }
    public Double getClothing() { return clothing; } public void setClothing(Double v) { clothing = v; }
    public Double getHealth() { return health; } public void setHealth(Double v) { health = v; }
    public Double getCurrentSavings() { return currentSavings; } public void setCurrentSavings(Double v) { currentSavings = v; }
    public Double getTotalDebt() { return totalDebt; } public void setTotalDebt(Double v) { totalDebt = v; }
    public Double getMonthlySavingsGoal() { return monthlySavingsGoal; } public void setMonthlySavingsGoal(Double v) { monthlySavingsGoal = v; }
}