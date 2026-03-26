package com.fincoach.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class FinancialProfileRequest {

    @NotNull(message = "Le revenu mensuel est requis")
    @DecimalMin(value = "0.01", message = "Le revenu mensuel doit être supérieur à 0")
    private Double monthlyIncome;

    @DecimalMin(value = "0.0", message = "Les autres revenus doivent être ≥ 0")
    private Double otherIncome;

    @NotNull(message = "Le loyer est requis")
    @DecimalMin(value = "0.0", message = "Le loyer doit être ≥ 0")
    private Double rent;

    @DecimalMin(value = "0.0", message = "Les charges doivent être ≥ 0")
    private Double utilities;

    @DecimalMin(value = "0.0", message = "Les assurances doivent être ≥ 0")
    private Double insurance;

    @NotNull(message = "Les crédits sont requis")
    @DecimalMin(value = "0.0", message = "Les crédits doivent être ≥ 0")
    private Double loans;

    @DecimalMin(value = "0.0", message = "Les abonnements doivent être ≥ 0")
    private Double subscriptions;

    @NotNull(message = "L'alimentation est requise")
    @DecimalMin(value = "0.0", message = "L'alimentation doit être ≥ 0")
    private Double food;

    @DecimalMin(value = "0.0", message = "Le transport doit être ≥ 0")
    private Double transport;

    @DecimalMin(value = "0.0", message = "Les loisirs doivent être ≥ 0")
    private Double leisure;

    @DecimalMin(value = "0.0", message = "Les vêtements doivent être ≥ 0")
    private Double clothing;

    @DecimalMin(value = "0.0", message = "La santé doit être ≥ 0")
    private Double health;

    @NotNull(message = "L'épargne actuelle est requise")
    @DecimalMin(value = "0.0", message = "L'épargne actuelle doit être ≥ 0")
    private Double currentSavings;

    @NotNull(message = "Le total des dettes est requis")
    @DecimalMin(value = "0.0", message = "Les dettes doivent être ≥ 0")
    private Double totalDebt;

    @DecimalMin(value = "0.0", message = "L'objectif d'épargne doit être ≥ 0")
    private Double monthlySavingsGoal;

    private String typeHabitation;

    private String situationFamiliale;

    @Min(value = 0, message = "Le nombre de personnes à charge doit être ≥ 0")
    private Integer nombrePersonnes;

    public FinancialProfileRequest() {}

    public Double getMonthlyIncome() { return monthlyIncome; }
    public void setMonthlyIncome(Double v) { monthlyIncome = v; }

    public Double getOtherIncome() { return otherIncome; }
    public void setOtherIncome(Double v) { otherIncome = v; }

    public Double getRent() { return rent; }
    public void setRent(Double v) { rent = v; }

    public Double getUtilities() { return utilities; }
    public void setUtilities(Double v) { utilities = v; }

    public Double getInsurance() { return insurance; }
    public void setInsurance(Double v) { insurance = v; }

    public Double getLoans() { return loans; }
    public void setLoans(Double v) { loans = v; }

    public Double getSubscriptions() { return subscriptions; }
    public void setSubscriptions(Double v) { subscriptions = v; }

    public Double getFood() { return food; }
    public void setFood(Double v) { food = v; }

    public Double getTransport() { return transport; }
    public void setTransport(Double v) { transport = v; }

    public Double getLeisure() { return leisure; }
    public void setLeisure(Double v) { leisure = v; }

    public Double getClothing() { return clothing; }
    public void setClothing(Double v) { clothing = v; }

    public Double getHealth() { return health; }
    public void setHealth(Double v) { health = v; }

    public Double getCurrentSavings() { return currentSavings; }
    public void setCurrentSavings(Double v) { currentSavings = v; }

    public Double getTotalDebt() { return totalDebt; }
    public void setTotalDebt(Double v) { totalDebt = v; }

    public Double getMonthlySavingsGoal() { return monthlySavingsGoal; }
    public void setMonthlySavingsGoal(Double v) { monthlySavingsGoal = v; }

    public String getTypeHabitation() { return typeHabitation; }
    public void setTypeHabitation(String v) { typeHabitation = v; }

    public String getSituationFamiliale() { return situationFamiliale; }
    public void setSituationFamiliale(String v) { situationFamiliale = v; }

    public Integer getNombrePersonnes() { return nombrePersonnes; }
    public void setNombrePersonnes(Integer v) { nombrePersonnes = v; }
}
