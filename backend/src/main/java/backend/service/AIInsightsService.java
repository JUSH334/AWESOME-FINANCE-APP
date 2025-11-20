// backend/src/main/java/backend/service/AIInsightsService.java
package backend.service;

import backend.entity.AIInsights;
import backend.entity.Account;
import backend.entity.Transaction;
import backend.repository.AIInsightsRepository;
import backend.repository.AccountRepository;
import backend.repository.TransactionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AIInsightsService {

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    @Autowired
    private AIInsightsRepository aiInsightsRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Get the latest AI insights for a user
     */
    public Optional<AIInsights> getLatestInsights(Long userId) {
        return aiInsightsRepository.findTopByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Trigger insight generation asynchronously
     * This is called whenever user data changes
     */
    @Async
    public void triggerInsightGeneration(Long userId) {
        try {
            // Mark as generating
            AIInsights insights = new AIInsights();
            insights.setUserId(userId);
            insights.setGenerationStatus("generating");
            insights.setOverallScore(0);
            insights.setInsightsJson("[]");
            insights.setPredictionsJson("[]");
            insights.setRecommendationsJson("[]");
            insights = aiInsightsRepository.save(insights);

            // Generate insights
            generateAndStoreInsights(userId, insights.getId());
        } catch (Exception e) {
            System.err.println("Failed to trigger insight generation: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Generate insights and store in database
     */
    @Transactional
    public void generateAndStoreInsights(Long userId, Long insightId) {
        AIInsights insights = aiInsightsRepository.findById(insightId)
            .orElseThrow(() -> new RuntimeException("Insight record not found"));

        try {
            // Fetch user's financial data
            List<Account> accounts = accountRepository.findByUserId(userId);
            List<Transaction> transactions = transactionRepository.findByUserId(userId);

            // Prepare AI request
            Map<String, Object> aiRequest = prepareAIRequest(userId, accounts, transactions);

            // Call AI service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(aiRequest, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                aiServiceUrl + "/api/recommendations",
                HttpMethod.POST,
                entity,
                Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> aiResponse = response.getBody();

                // Store insights
                insights.setGenerationStatus("completed");
                insights.setOverallScore((Integer) aiResponse.get("overallScore"));
                
                // Store summary data
                Map<String, Object> summary = (Map<String, Object>) aiResponse.get("summary");
                if (summary != null) {
                    insights.setTotalBalance(convertToBigDecimal(summary.get("totalBalance")));
                    insights.setMonthlyExpenses(convertToBigDecimal(summary.get("monthlyExpenses")));
                    insights.setSavingsRate(convertToBigDecimal(summary.get("savingsRate")));
                    insights.setTopCategory((String) summary.get("topCategory"));
                    insights.setSpendingTrend((String) summary.get("spendingTrend"));
                }

                // Store JSON data
                insights.setInsightsJson(objectMapper.writeValueAsString(aiResponse.get("insights")));
                insights.setPredictionsJson(objectMapper.writeValueAsString(aiResponse.get("predictions")));
                insights.setRecommendationsJson(objectMapper.writeValueAsString(aiResponse.get("recommendations")));
                
                // Check if LLM enhanced
                insights.setLlmEnhanced(checkIfLLMEnhanced(aiResponse));
                
                insights.setUpdatedAt(LocalDateTime.now());
                aiInsightsRepository.save(insights);

                System.out.println("Successfully generated and stored AI insights for user " + userId);
            } else {
                throw new RuntimeException("AI service returned empty response");
            }
        } catch (Exception e) {
            System.err.println("Failed to generate insights: " + e.getMessage());
            e.printStackTrace();
            
            // Mark as failed
            insights.setGenerationStatus("failed");
            insights.setErrorMessage(e.getMessage());
            insights.setUpdatedAt(LocalDateTime.now());
            aiInsightsRepository.save(insights);
        }
    }

    /**
     * Prepare AI request payload
     */
    private Map<String, Object> prepareAIRequest(Long userId, List<Account> accounts, List<Transaction> transactions) {
        Map<String, Object> request = new HashMap<>();
        request.put("userId", userId.toString());

        // Convert accounts
        List<Map<String, Object>> accountList = accounts.stream()
            .map(acc -> {
                Map<String, Object> accMap = new HashMap<>();
                accMap.put("id", acc.getId().toString());
                accMap.put("type", acc.getType());
                accMap.put("balance", acc.getBalance().doubleValue());
                accMap.put("name", acc.getName());
                return accMap;
            })
            .collect(Collectors.toList());
        request.put("accounts", accountList);

        // Convert transactions
        List<Map<String, Object>> txnList = transactions.stream()
            .map(txn -> {
                Map<String, Object> txnMap = new HashMap<>();
                txnMap.put("id", txn.getId().toString());
                txnMap.put("date", txn.getTransactionDate().toString());
                txnMap.put("amount", txn.getAmount().doubleValue());
                txnMap.put("category", txn.getCategory());
                txnMap.put("type", txn.getType());
                if (txn.getAccountId() != null) {
                    txnMap.put("accountId", txn.getAccountId().toString());
                }
                if (txn.getNote() != null) {
                    txnMap.put("note", txn.getNote());
                }
                return txnMap;
            })
            .collect(Collectors.toList());
        request.put("transactions", txnList);

        // Optional: Add monthly income and savings goal
        request.put("monthlyIncome", 5000.0); // TODO: Get from user settings
        request.put("savingsGoal", 15000.0);  // TODO: Get from user settings

        return request;
    }

    /**
     * Check if insights were enhanced by LLM
     */
    private boolean checkIfLLMEnhanced(Map<String, Object> aiResponse) {
        // Check if insights contain LLM-enhanced content
        // This is a simple heuristic - you can make it more sophisticated
        try {
            List<Map<String, Object>> insights = (List<Map<String, Object>>) aiResponse.get("insights");
            if (insights != null && !insights.isEmpty()) {
                // Check if insights have more detailed messages (sign of LLM enhancement)
                for (Map<String, Object> insight : insights) {
                    String message = (String) insight.get("message");
                    if (message != null && message.length() > 150) {
                        return true; // LLM typically generates longer, more detailed messages
                    }
                }
            }
        } catch (Exception e) {
            // Ignore parsing errors
        }
        return false;
    }

    /**
     * Convert object to BigDecimal safely
     */
    private BigDecimal convertToBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof Number) {
            return BigDecimal.valueOf(((Number) value).doubleValue());
        }
        try {
            return new BigDecimal(value.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    /**
     * Delete all insights for a user (used when user is deleted)
     */
    @Transactional
    public void deleteUserInsights(Long userId) {
        aiInsightsRepository.deleteByUserId(userId);
    }
}