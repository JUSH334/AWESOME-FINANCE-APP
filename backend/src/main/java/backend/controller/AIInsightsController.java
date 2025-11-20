// backend/src/main/java/backend/controller/AIInsightsController.java
package backend.controller;

import backend.entity.AIInsights;
import backend.service.AIInsightsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/ai-insights")
@CrossOrigin(origins = "*")
public class AIInsightsController {

    @Autowired
    private AIInsightsService aiInsightsService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Get the latest AI insights for the authenticated user
     */
    @GetMapping("/latest")
    public ResponseEntity<?> getLatestInsights(Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            
            Optional<AIInsights> insightsOpt = aiInsightsService.getLatestInsights(userId);
            
            if (insightsOpt.isEmpty()) {
                // No insights yet - trigger generation
                aiInsightsService.triggerInsightGeneration(userId);
                
                return ResponseEntity.ok(Map.of(
                    "status", "generating",
                    "message", "Insights are being generated. Please check back in a moment."
                ));
            }
            
            AIInsights insights = insightsOpt.get();
            
            // Check status
            if ("generating".equals(insights.getGenerationStatus())) {
                return ResponseEntity.ok(Map.of(
                    "status", "generating",
                    "message", "Insights are currently being generated."
                ));
            }
            
            if ("failed".equals(insights.getGenerationStatus())) {
                return ResponseEntity.ok(Map.of(
                    "status", "failed",
                    "message", "Failed to generate insights: " + insights.getErrorMessage(),
                    "error", insights.getErrorMessage()
                ));
            }
            
            // Parse and return completed insights
            Map<String, Object> response = new HashMap<>();
            response.put("status", "completed");
            response.put("overallScore", insights.getOverallScore());
            response.put("insights", objectMapper.readValue(insights.getInsightsJson(), List.class));
            response.put("predictions", objectMapper.readValue(insights.getPredictionsJson(), List.class));
            response.put("recommendations", objectMapper.readValue(insights.getRecommendationsJson(), List.class));
            
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalBalance", insights.getTotalBalance());
            summary.put("monthlyExpenses", insights.getMonthlyExpenses());
            summary.put("savingsRate", insights.getSavingsRate());
            summary.put("topCategory", insights.getTopCategory());
            summary.put("spendingTrend", insights.getSpendingTrend());
            response.put("summary", summary);
            
            response.put("llmEnhanced", insights.getLlmEnhanced());
            response.put("generatedAt", insights.getCreatedAt());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch insights: " + e.getMessage()));
        }
    }

    /**
     * Manually trigger insight generation (for testing or force refresh)
     */
    @PostMapping("/generate")
    public ResponseEntity<?> triggerGeneration(Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            aiInsightsService.triggerInsightGeneration(userId);
            
            return ResponseEntity.ok(Map.of(
                "status", "triggered",
                "message", "Insight generation has been triggered. Check back in a moment."
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to trigger generation: " + e.getMessage()));
        }
    }

    /**
     * Check insight generation status
     */
    @GetMapping("/status")
    public ResponseEntity<?> getStatus(Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            
            Optional<AIInsights> insightsOpt = aiInsightsService.getLatestInsights(userId);
            
            if (insightsOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "status", "none",
                    "message", "No insights have been generated yet."
                ));
            }
            
            AIInsights insights = insightsOpt.get();
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", insights.getGenerationStatus());
            response.put("llmEnhanced", insights.getLlmEnhanced());
            response.put("createdAt", insights.getCreatedAt());
            response.put("updatedAt", insights.getUpdatedAt());
            
            if ("failed".equals(insights.getGenerationStatus())) {
                response.put("error", insights.getErrorMessage());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to check status: " + e.getMessage()));
        }
    }

    private Long getUserIdFromAuth(Authentication auth) {
        if (auth == null) {
            throw new IllegalArgumentException("User not authenticated");
        }
        
        @SuppressWarnings("unchecked")
        Map<String, Object> details = (Map<String, Object>) auth.getDetails();
        Object userIdObj = details.get("userId");
        
        if (userIdObj == null) {
            throw new IllegalArgumentException("User ID not found in authentication");
        }
        
        return Long.parseLong(userIdObj.toString());
    }
}