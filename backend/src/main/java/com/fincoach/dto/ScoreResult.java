package com.fincoach.dto;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Result of the financial scoring algorithm.
 * Calculated on-the-fly from the latest FinancialProfile — never persisted.
 */
public class ScoreResult {

    private String grade;
    private int totalScore;
    /** Per-criterion scores (0–100 each): savingsRate, debtRatio, expenseRatio, emergencyFund */
    private Map<String, Integer> breakdown;
    private String message;

    public ScoreResult() {}

    public ScoreResult(String grade, int totalScore, Map<String, Integer> breakdown, String message) {
        this.grade = grade;
        this.totalScore = totalScore;
        this.breakdown = breakdown;
        this.message = message;
    }

    /** Factory for incomplete / unevaluable profiles. */
    public static ScoreResult incomplete(String reason) {
        Map<String, Integer> breakdown = new LinkedHashMap<>();
        breakdown.put("savingsRate", 0);
        breakdown.put("debtRatio", 0);
        breakdown.put("expenseRatio", 0);
        breakdown.put("emergencyFund", 0);
        return new ScoreResult("N/A", 0, breakdown, reason);
    }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }

    public int getTotalScore() { return totalScore; }
    public void setTotalScore(int totalScore) { this.totalScore = totalScore; }

    public Map<String, Integer> getBreakdown() { return breakdown; }
    public void setBreakdown(Map<String, Integer> breakdown) { this.breakdown = breakdown; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
