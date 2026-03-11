package com.fincoach.dto;

import java.time.LocalDate;

public class ActionPlanRequest {
    private String userId, title, description, category, priority;
    private Double targetAmount, currentAmount;
    private LocalDate deadline;
    public ActionPlanRequest() {}
    public String getUserId() { return userId; } public void setUserId(String v) { userId = v; }
    public String getTitle() { return title; } public void setTitle(String v) { title = v; }
    public String getDescription() { return description; } public void setDescription(String v) { description = v; }
    public String getCategory() { return category; } public void setCategory(String v) { category = v; }
    public String getPriority() { return priority; } public void setPriority(String v) { priority = v; }
    public Double getTargetAmount() { return targetAmount; } public void setTargetAmount(Double v) { targetAmount = v; }
    public Double getCurrentAmount() { return currentAmount; } public void setCurrentAmount(Double v) { currentAmount = v; }
    public LocalDate getDeadline() { return deadline; } public void setDeadline(LocalDate v) { deadline = v; }
}