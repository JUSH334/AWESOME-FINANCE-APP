package backend.controller;

import backend.controller.AIRecommendationController.AIRequest;
import backend.controller.AIRecommendationController.AIResponse;
import backend.controller.AIRecommendationController.AccountDTO;
import backend.controller.AIRecommendationController.TransactionDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AIRecommendationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RestTemplate restTemplate;

    private AIRequest validRequest;
    private AIResponse mockResponse;

    @BeforeEach
    void setUp() {
        validRequest = new AIRequest();
        validRequest.userId = "1";
        validRequest.accounts = new ArrayList<>();
        validRequest.transactions = new ArrayList<>();
        validRequest.monthlyIncome = 5000.0;
        validRequest.savingsGoal = 10000.0;

        AccountDTO account = new AccountDTO();
        account.id = "1";
        account.type = "checking";
        account.balance = 1000.0;
        validRequest.accounts.add(account);

        TransactionDTO transaction = new TransactionDTO();
        transaction.id = "1";
        transaction.date = "2024-01-15";
        transaction.amount = 50.0;
        transaction.category = "Groceries";
        transaction.type = "out";
        validRequest.transactions.add(transaction);

        mockResponse = new AIResponse();
        mockResponse.overallScore = 75;
        mockResponse.insights = new ArrayList<>();
        mockResponse.predictions = new ArrayList<>();
        mockResponse.recommendations = new ArrayList<>();
    }

    @Test
    void getRecommendations_WithValidRequest_ShouldReturnRecommendations() throws Exception {
        when(restTemplate.exchange(
            anyString(),
            eq(HttpMethod.POST),
            any(),
            eq(AIResponse.class)
        )).thenReturn(new ResponseEntity<>(mockResponse, HttpStatus.OK));

        mockMvc.perform(post("/api/ai/recommendations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overallScore").value(75));
    }

    @Test
    void getRecommendations_WithMissingUserId_ShouldReturnBadRequest() throws Exception {
        validRequest.userId = null;

        mockMvc.perform(post("/api/ai/recommendations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("userId is required"));
    }

    @Test
    void getRecommendations_WithEmptyUserId_ShouldReturnBadRequest() throws Exception {
        validRequest.userId = "";

        mockMvc.perform(post("/api/ai/recommendations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("userId is required"));
    }

    @Test
    void getRecommendations_WithNullAccounts_ShouldInitializeEmptyList() throws Exception {
        validRequest.accounts = null;

        when(restTemplate.exchange(
            anyString(),
            eq(HttpMethod.POST),
            any(),
            eq(AIResponse.class)
        )).thenReturn(new ResponseEntity<>(mockResponse, HttpStatus.OK));

        mockMvc.perform(post("/api/ai/recommendations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk());
    }

    @Test
    void getRecommendations_WithAIServiceUnavailable_ShouldReturnServiceUnavailable() throws Exception {
        when(restTemplate.exchange(
            anyString(),
            eq(HttpMethod.POST),
            any(),
            eq(AIResponse.class)
        )).thenThrow(new RestClientException("Connection refused"));

        mockMvc.perform(post("/api/ai/recommendations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("AI service unavailable"));
    }

    @Test
    void getRecommendations_WithEmptyResponse_ShouldReturnError() throws Exception {
        when(restTemplate.exchange(
            anyString(),
            eq(HttpMethod.POST),
            any(),
            eq(AIResponse.class)
        )).thenReturn(new ResponseEntity<>(null, HttpStatus.OK));

        mockMvc.perform(post("/api/ai/recommendations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("AI service returned empty response"));
    }

    @Test
    void checkAiServiceHealth_WhenHealthy_ShouldReturnConnected() throws Exception {
        Map<String, Object> healthResponse = new HashMap<>();
        healthResponse.put("status", "healthy");

        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
            .thenReturn(new ResponseEntity<>(healthResponse, HttpStatus.OK));

        mockMvc.perform(get("/api/ai/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("connected"));
    }

    @Test
    void checkAiServiceHealth_WhenUnhealthy_ShouldReturnDisconnected() throws Exception {
        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
            .thenThrow(new RestClientException("Connection failed"));

        mockMvc.perform(get("/api/ai/health"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value("disconnected"));
    }

    @Test
    void getStatus_ShouldReturnStatus() throws Exception {
        mockMvc.perform(get("/api/ai/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("AI Recommendation Controller"))
                .andExpect(jsonPath("$.version").value("1.0.0"));
    }
}