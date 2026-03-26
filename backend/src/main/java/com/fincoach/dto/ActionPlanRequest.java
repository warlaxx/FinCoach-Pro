package com.fincoach.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class ActionPlanRequest {

    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 255, message = "Le titre ne doit pas dépasser 255 caractères")
    private String title;

    @Size(max = 1000, message = "La description ne doit pas dépasser 1000 caractères")
    private String description;

    private String category;
    private String priority;
    private Double targetAmount;
    private Double currentAmount;
    private LocalDate deadline;

    public ActionPlanRequest() {
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String v) {
        title = v;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String v) {
        description = v;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String v) {
        category = v;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String v) {
        priority = v;
    }

    public Double getTargetAmount() {
        return targetAmount;
    }

    public void setTargetAmount(Double v) {
        targetAmount = v;
    }

    public Double getCurrentAmount() {
        return currentAmount;
    }

    public void setCurrentAmount(Double v) {
        currentAmount = v;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDate v) {
        deadline = v;
    }
}
