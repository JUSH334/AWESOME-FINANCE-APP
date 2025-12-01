package backend.controller;

import backend.controller.BudgetController.BudgetRequest;
import backend.entity.Budget;
import backend.service.BudgetService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class BudgetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BudgetService budgetService;

    private Budget testBudget;

    @BeforeEach
    void setUp() {
        testBudget = new Budget();
        testBudget.setId(1L);
        testBudget.setUserId(1L);
        testBudget.setCategory("Groceries");
        testBudget.setAmount(new BigDecimal("500.00"));
        testBudget.setPeriodType("monthly");
        testBudget.setSpent(new BigDecimal("200.00"));
        testBudget.setIsActive(true);
        testBudget.setCreatedAt(LocalDateTime.now());
        testBudget.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void getBudgets_ShouldReturnBudgets() throws Exception {
        when(budgetService.getUserBudgets(anyLong())).thenReturn(Arrays.asList(testBudget));

        mockMvc.perform(get("/api/budgets")
                .with(createAuthenticationToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].category").value("Groceries"));
    }

    @Test
    void getBudgets_WithError_ShouldReturnError() throws Exception {
        when(budgetService.getUserBudgets(anyLong())).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/budgets")
                .with(createAuthenticationToken()))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void getBudget_WithValidId_ShouldReturnBudget() throws Exception {
        when(budgetService.getBudgetById(eq(1L), anyLong())).thenReturn(testBudget);

        mockMvc.perform(get("/api/budgets/1")
                .with(createAuthenticationToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.category").value("Groceries"));
    }

    @Test
    void getBudget_WithInvalidId_ShouldReturnBadRequest() throws Exception {
        when(budgetService.getBudgetById(eq(999L), anyLong()))
                .thenThrow(new IllegalArgumentException("Budget not found"));

        mockMvc.perform(get("/api/budgets/999")
                .with(createAuthenticationToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Budget not found"));
    }

    @Test
    void createBudget_WithValidData_ShouldCreateBudget() throws Exception {
        BudgetRequest request = new BudgetRequest();
        request.category = "Groceries";
        request.amount = new BigDecimal("500.00");
        request.periodType = "monthly";

        when(budgetService.createBudget(anyLong(), eq("Groceries"), any(BigDecimal.class), eq("monthly")))
                .thenReturn(testBudget);

        mockMvc.perform(post("/api/budgets")
                .with(createAuthenticationToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category").value("Groceries"));
    }

    @Test
    void createBudget_WithInvalidData_ShouldReturnBadRequest() throws Exception {
        BudgetRequest request = new BudgetRequest();
        request.category = "Groceries";
        request.amount = new BigDecimal("-100");
        request.periodType = "monthly";

        when(budgetService.createBudget(anyLong(), anyString(), any(BigDecimal.class), anyString()))
                .thenThrow(new IllegalArgumentException("Amount must be greater than zero"));

        mockMvc.perform(post("/api/budgets")
                .with(createAuthenticationToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void updateBudget_WithValidData_ShouldUpdateBudget() throws Exception {
        BudgetRequest request = new BudgetRequest();
        request.category = "Food";
        request.amount = new BigDecimal("600.00");
        request.periodType = "yearly";

        when(budgetService.updateBudget(eq(1L), anyLong(), eq("Food"), any(BigDecimal.class), eq("yearly")))
                .thenReturn(testBudget);

        mockMvc.perform(put("/api/budgets/1")
                .with(createAuthenticationToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void deleteBudget_WithValidId_ShouldDeleteBudget() throws Exception {
        doNothing().when(budgetService).deleteBudget(eq(1L), anyLong());

        mockMvc.perform(delete("/api/budgets/1")
                .with(createAuthenticationToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Budget deleted successfully"));
    }

    @Test
    void recalculateBudgets_ShouldRecalculate() throws Exception {
        doNothing().when(budgetService).recalculateAllBudgets(anyLong());

        mockMvc.perform(post("/api/budgets/recalculate")
                .with(createAuthenticationToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Budgets recalculated successfully"));
    }

    private org.springframework.test.web.servlet.request.RequestPostProcessor createAuthenticationToken() {
        Map<String, Object> details = new HashMap<>();
        details.put("userId", 1L);
        
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
            "testuser",
            "password",
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
        auth.setDetails(details);
        
        return authentication(auth);
    }
}