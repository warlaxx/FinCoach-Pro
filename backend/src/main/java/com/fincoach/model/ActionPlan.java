package com.fincoach.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "action_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;
    private String title;

    @Column(length = 1000)
    private String description;

    private String category; // EPARGNE, DETTE, BUDGET, INVESTISSEMENT
    private String priority; // HAUTE, MOYENNE, FAIBLE
    private String status;   // EN_COURS, TERMINE, REPORTE

    private Double targetAmount;
    private Double currentAmount;
    private LocalDate deadline;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "EN_COURS";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
