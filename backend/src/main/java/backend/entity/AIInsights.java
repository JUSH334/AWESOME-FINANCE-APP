// backend/src/main/java/backend/entity/AIInsights.java
package backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_insights")
public class AIInsights {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "overall_score", nullable = false)
    private Integer overallScore;

    @Column(name = "total_balance", precision = 15, scale = 2)
    private BigDecimal totalBalance;

    @Column(name = "monthly_expenses", precision = 15, scale = 2)
    private BigDecimal monthlyExpenses;

    @Column(name = "savings_rate", precision = 5, scale = 2)
    private BigDecimal savingsRate;

    @Column(name = "top_category", length = 100)
    private String topCategory;

    @Column(name = "spending_trend", length = 20)
    private String spendingTrend;

    @Column(name = "insights_json", columnDefinition = "TEXT", nullable = false)
    private String insightsJson;

    @Column(name = "predictions_json", columnDefinition = "TEXT", nullable = false)
    private String predictionsJson;

    @Column(name = "recommendations_json", columnDefinition = "TEXT", nullable = false)
    private String recommendationsJson;

    @Column(name = "generation_status", length = 20)
    private String generationStatus = "pending";

    @Column(name = "llm_enhanced")
    private Boolean llmEnhanced = false;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Constructors
    public AIInsights() {}

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Integer getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(Integer overallScore) {
        this.overallScore = overallScore;
    }

    public BigDecimal getTotalBalance() {
        return totalBalance;
    }

    public void setTotalBalance(BigDecimal totalBalance) {
        this.totalBalance = totalBalance;
    }

    public BigDecimal getMonthlyExpenses() {
        return monthlyExpenses;
    }

    public void setMonthlyExpenses(BigDecimal monthlyExpenses) {
        this.monthlyExpenses = monthlyExpenses;
    }

    public BigDecimal getSavingsRate() {
        return savingsRate;
    }

    public void setSavingsRate(BigDecimal savingsRate) {
        this.savingsRate = savingsRate;
    }

    public String getTopCategory() {
        return topCategory;
    }

    public void setTopCategory(String topCategory) {
        this.topCategory = topCategory;
    }

    public String getSpendingTrend() {
        return spendingTrend;
    }

    public void setSpendingTrend(String spendingTrend) {
        this.spendingTrend = spendingTrend;
    }

    public String getInsightsJson() {
        return insightsJson;
    }

    public void setInsightsJson(String insightsJson) {
        this.insightsJson = insightsJson;
    }

    public String getPredictionsJson() {
        return predictionsJson;
    }

    public void setPredictionsJson(String predictionsJson) {
        this.predictionsJson = predictionsJson;
    }

    public String getRecommendationsJson() {
        return recommendationsJson;
    }

    public void setRecommendationsJson(String recommendationsJson) {
        this.recommendationsJson = recommendationsJson;
    }

    public String getGenerationStatus() {
        return generationStatus;
    }

    public void setGenerationStatus(String generationStatus) {
        this.generationStatus = generationStatus;
    }

    public Boolean getLlmEnhanced() {
        return llmEnhanced;
    }

    public void setLlmEnhanced(Boolean llmEnhanced) {
        this.llmEnhanced = llmEnhanced;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}