package com.fincoach.service;

import com.fincoach.dto.ScoreResult;
import com.fincoach.model.FinancialProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link FinancialScoringService#calculateScore(FinancialProfile)}.
 *
 * Each test builds a profile engineered to hit a specific grade and verifies:
 *  - the expected grade letter
 *  - the total score is within the grade band
 *  - the breakdown map contains all four criteria
 *  - the message is non-empty
 */
class ScoringServiceTest {

    private FinancialScoringService service;

    @BeforeEach
    void setUp() {
        service = new FinancialScoringService();
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    /**
     * Builds a minimal valid profile with the given financial figures.
     *
     * @param monthlyIncome   net monthly income
     * @param totalExpenses   total monthly expenses (mapped to rent for simplicity)
     * @param totalDebt       total outstanding debt
     * @param currentSavings  current savings balance
     */
    private FinancialProfile profile(double monthlyIncome, double totalExpenses,
                                     double totalDebt, double currentSavings) {
        FinancialProfile p = new FinancialProfile();
        p.setUserId("test-user");
        p.setMonthlyIncome(monthlyIncome);
        p.setOtherIncome(0.0);
        // Put all expenses in rent so totalExpenses = rent
        p.setRent(totalExpenses);
        p.setUtilities(0.0);
        p.setInsurance(0.0);
        p.setLoans(0.0);
        p.setSubscriptions(0.0);
        p.setFood(0.0);
        p.setTransport(0.0);
        p.setLeisure(0.0);
        p.setClothing(0.0);
        p.setHealth(0.0);
        p.setTotalDebt(totalDebt);
        p.setCurrentSavings(currentSavings);
        p.setMonthlySavingsGoal(0.0);
        return p;
    }

    // ── Grade A ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Grade A: excellent saver, minimal debt, low expenses, full emergency fund")
    void gradeA() {
        // income=5000, expenses=1500 (30%) → savingsRate=70% → 100pts
        // totalDebt=3000 / (5000*12)=60000 → 5% → 100pts
        // expenseRatio=1500/5000=30% → 100pts
        // emergencyRatio=30000/(1500*3)=6.67 → 100pts
        // weighted: 0.30*100 + 0.25*100 + 0.25*100 + 0.20*100 = 100 → A
        FinancialProfile p = profile(5000, 1500, 3000, 30000);
        ScoreResult result = service.calculateScore(p);

        assertEquals("A", result.getGrade());
        assertTrue(result.getTotalScore() >= 85,
                "Expected totalScore >= 85 for grade A, got " + result.getTotalScore());
        assertBreakdownComplete(result);
    }

    // ── Grade B ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Grade B: good savings, moderate debt, moderate expenses, partial emergency fund")
    void gradeB() {
        // income=3000, expenses=1350 (45%) → savingsRate=55% → 100pts
        // totalDebt=7200 / (3000*12)=36000 → 20% → 75pts
        // expenseRatio=1350/3000=45% → 75pts
        // emergencyRatio=1500/(1350*3)=0.37 → 50pts
        // weighted: 0.30*100 + 0.25*75 + 0.25*75 + 0.20*50 = 30+18.75+18.75+10 = 77.5 → 78 → B
        FinancialProfile p = profile(3000, 1350, 7200, 1500);
        ScoreResult result = service.calculateScore(p);

        assertEquals("B", result.getGrade());
        assertTrue(result.getTotalScore() >= 70 && result.getTotalScore() <= 84,
                "Expected totalScore in [70,84] for grade B, got " + result.getTotalScore());
        assertBreakdownComplete(result);
    }

    // ── Grade C ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Grade C: average savings rate, moderate debt, moderate expenses")
    void gradeC() {
        // income=3000, expenses=1650 (55%) → savingsRate=45% → 100pts
        // totalDebt=48000 / (3000*12)=36000 → 133% → 0pts
        // expenseRatio=1650/3000=55% → 50pts
        // emergencyRatio=4500/(1650*3)=0.91 → 75pts
        // weighted: 0.30*100 + 0.25*0 + 0.25*50 + 0.20*75 = 30+0+12.5+15 = 57.5 → 58 → C
        FinancialProfile p = profile(3000, 1650, 48000, 4500);
        ScoreResult result = service.calculateScore(p);

        assertEquals("C", result.getGrade());
        assertTrue(result.getTotalScore() >= 55 && result.getTotalScore() <= 69,
                "Expected totalScore in [55,69] for grade C, got " + result.getTotalScore());
        assertBreakdownComplete(result);
    }

    // ── Grade D ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Grade D: low savings, heavy debt, high expenses, thin emergency fund")
    void gradeD() {
        // income=2500, expenses=1875 (75%) → savingsRate=25% → 100pts
        // totalDebt=90000 / (2500*12)=30000 → 300% → 0pts
        // expenseRatio=1875/2500=75% → 0pts
        // emergencyRatio=1500/(1875*3)=0.267 → 50pts  (was 1406 → 0.2497 < 0.25, wrong band)
        // weighted: 0.30*100 + 0.25*0 + 0.25*0 + 0.20*50 = 30+0+0+10 = 40 → D
        FinancialProfile p = profile(2500, 1875, 90000, 1500);
        ScoreResult result = service.calculateScore(p);

        assertEquals("D", result.getGrade());
        assertTrue(result.getTotalScore() >= 40 && result.getTotalScore() <= 54,
                "Expected totalScore in [40,54] for grade D, got " + result.getTotalScore());
        assertBreakdownComplete(result);
    }

    // ── Grade E ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Grade E: negative savings, very high debt, very high expenses")
    void gradeE() {
        // income=2000, expenses=1700 (85%) → savingsRate=15% → 75pts
        // totalDebt=100000 / (2000*12)=24000 → 417% → 0pts
        // expenseRatio=1700/2000=85% → 0pts
        // emergencyRatio=510/(1700*3)=0.1 → 25pts
        // weighted: 0.30*75 + 0.25*0 + 0.25*0 + 0.20*25 = 22.5+0+0+5 = 27.5 → 28 → E
        FinancialProfile p = profile(2000, 1700, 100000, 510);
        ScoreResult result = service.calculateScore(p);

        assertEquals("E", result.getGrade());
        assertTrue(result.getTotalScore() >= 25 && result.getTotalScore() <= 39,
                "Expected totalScore in [25,39] for grade E, got " + result.getTotalScore());
        assertBreakdownComplete(result);
    }

    // ── Grade F ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Grade F: spending exceeds income, massive debt, zero savings")
    void gradeF() {
        // income=2000, expenses=2400 (120%) → savingsRate=-20% → 0pts
        // totalDebt=200000 / (2000*12)=24000 → 833% → 0pts
        // expenseRatio=2400/2000=120% → 0pts
        // emergencyRatio=0/(2400*3) → 0pts
        // weighted: all 0 → 0 → F
        FinancialProfile p = profile(2000, 2400, 200000, 0);
        ScoreResult result = service.calculateScore(p);

        assertEquals("F", result.getGrade());
        assertTrue(result.getTotalScore() < 25,
                "Expected totalScore < 25 for grade F, got " + result.getTotalScore());
        assertBreakdownComplete(result);
    }

    // ── Edge cases ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Null profile returns N/A without exception")
    void nullProfileReturnsNA() {
        ScoreResult result = service.calculateScore(null);

        assertEquals("N/A", result.getGrade());
        assertEquals(0, result.getTotalScore());
        assertNotNull(result.getMessage());
        assertFalse(result.getMessage().isBlank());
    }

    @Test
    @DisplayName("Zero income returns N/A without division-by-zero")
    void zeroIncomeReturnsNA() {
        FinancialProfile p = profile(0, 1000, 5000, 2000);
        ScoreResult result = service.calculateScore(p);

        assertEquals("N/A", result.getGrade());
        assertEquals(0, result.getTotalScore());
        assertNotNull(result.getMessage());
    }

    @Test
    @DisplayName("Profile with zero expenses and zero debt earns grade B (emergencyFund=0 due to zero expenses)")
    void perfectProfileNoExpenses() {
        // income=3000, expenses=0 → savingsRate=100% → 100
        // totalDebt=0 / (3000*12) → 0% → 100
        // expenseRatio=0/3000=0% → 100
        // emergencyRatio: totalExpenses=0 → ratio=0 → 0pts (edge case)
        // weighted: 0.30*100 + 0.25*100 + 0.25*100 + 0.20*0 = 80 → B
        FinancialProfile p = profile(3000, 0, 0, 9000);
        ScoreResult result = service.calculateScore(p);

        assertEquals("B", result.getGrade());
        assertEquals(80, result.getTotalScore());
        assertBreakdownComplete(result);
    }

    @Test
    @DisplayName("computeScores mutates profile financialScore consistently with calculateScore")
    void computeScoresConsistentWithCalculateScore() {
        FinancialProfile p = profile(4000, 1200, 10000, 15000);
        service.computeScores(p);

        ScoreResult result = service.calculateScore(p);

        assertEquals(result.getGrade(), p.getFinancialScore(),
                "Grade stored by computeScores must match calculateScore");
        assertNotNull(p.getSavingsRate());
        assertNotNull(p.getDebtRatio());
    }

    // ── Assertion helpers ─────────────────────────────────────────────────────

    private void assertBreakdownComplete(ScoreResult result) {
        assertNotNull(result.getBreakdown(), "breakdown must not be null");
        assertTrue(result.getBreakdown().containsKey("savingsRate"),   "missing savingsRate");
        assertTrue(result.getBreakdown().containsKey("debtRatio"),     "missing debtRatio");
        assertTrue(result.getBreakdown().containsKey("expenseRatio"),  "missing expenseRatio");
        assertTrue(result.getBreakdown().containsKey("emergencyFund"), "missing emergencyFund");
        assertNotNull(result.getMessage(), "message must not be null");
        assertFalse(result.getMessage().isBlank(), "message must not be blank");
    }
}
