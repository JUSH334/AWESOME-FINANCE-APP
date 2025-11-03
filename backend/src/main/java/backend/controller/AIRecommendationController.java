// Save as: backend/src/main/java/backend/controller/AIRecommendationController.java

package backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIRecommendationController {

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate;

    public AIRecommendationController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // ==================== DTOs ====================
    
    public static class TransactionDTO {
        public String id;
        public String date;
        public Double amount;
        public String category;
        public String type;
        public String accountId;
        public String note;

        public TransactionDTO() {}

        public TransactionDTO(String id, String date, Double amount, String category, String type) {
            this.id = id;
            this.date = date;
            this.amount = amount;
            this.category = category;
            this.type = type;
        }
    }

    public static class AccountDTO {
        public String id;
        public String type;
        public Double balance;
        public String name;

        public AccountDTO() {}

        public AccountDTO(String id, String type, Double balance) {
            this.id = id;
            this.type = type;
            this.balance = balance;
        }
    }

    public static class AIRequest {
        public String userId;
        public List<AccountDTO> accounts;
        public List<TransactionDTO> transactions;
        public Double monthlyIncome;
        public Double savingsGoal;

        public AIRequest() {
            this.accounts = new ArrayList<>();
            this.transactions = new ArrayList<>();
        }
    }

    public static class InsightDTO {
        public String type;
        public String category;
        public String title;
        public String message;
        public Integer priority;
        public Boolean actionable;
        public String suggestedAction;
    }

    public static class PredictionDTO {
        public String metric;
        public Double currentValue;
        public Double predictedValue;
        public Double confidence;
        public String timeframe;
        public Double change;
        public Double changePercent;
    }

    public static class SummaryDTO {
        public Double totalBalance;
        public Double monthlyExpenses;
        public Double savingsRate;
        public String topCategory;
        public String spendingTrend;
    }

    public static class AIResponse {
        public List<InsightDTO> insights;
        public List<PredictionDTO> predictions;
        public Integer overallScore;
        public List<String> recommendations;
        public SummaryDTO summary;

        public AIResponse() {
            this.insights = new ArrayList<>();
            this.predictions = new ArrayList<>();
            this.recommendations = new ArrayList<>();
        }
    }

    // ==================== ENDPOINTS ====================

    @PostMapping("/recommendations")
    public ResponseEntity<?> getRecommendations(@RequestBody AIRequest request) {
        try {
            // Validate request
            if (request.userId == null || request.userId.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "userId is required"));
            }

            if (request.accounts == null) {
                request.accounts = new ArrayList<>();
            }

            if (request.transactions == null) {
                request.transactions = new ArrayList<>();
            }

            // Call AI service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<AIRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<AIResponse> response = restTemplate.exchange(
                aiServiceUrl + "/api/recommendations",
                HttpMethod.POST,
                entity,
                AIResponse.class
            );

            if (response.getBody() == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "AI service returned empty response"));
            }

            return ResponseEntity.ok(response.getBody());

        } catch (RestClientException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "AI service unavailable");
            error.put("message", "Failed to connect to AI service at " + aiServiceUrl);
            error.put("detail", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> checkAiServiceHealth() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                aiServiceUrl + "/health",
                Map.class
            );

            Map<String, Object> result = new HashMap<>();
            result.put("status", "connected");
            result.put("aiService", response.getBody());
            result.put("url", aiServiceUrl);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "disconnected");
            error.put("message", "AI service is not reachable at " + aiServiceUrl);
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("service", "AI Recommendation Controller");
        status.put("aiServiceUrl", aiServiceUrl);
        status.put("version", "1.0.0");
        
        try {
            restTemplate.getForEntity(aiServiceUrl + "/health", Map.class);
            status.put("aiServiceStatus", "connected");
        } catch (Exception e) {
            status.put("aiServiceStatus", "disconnected");
        }
        
        return ResponseEntity.ok(status);
    }

    // ==================== DEMO ENDPOINT ====================

    
    
}