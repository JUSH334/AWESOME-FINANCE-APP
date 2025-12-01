package backend.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;

import backend.entity.User;
import backend.service.UserService;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@test.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setIsEmailVerified(true);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setSavingsGoal(new BigDecimal("10000.00"));
    }

    @Test
    void getProfile_ShouldReturnProfile() throws Exception {
        when(userService.getUserById(anyLong())).thenReturn(Optional.of(testUser));

        mockMvc.perform(get("/api/users/profile")
                .with(createAuthenticationToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.email").value("test@test.com"));
    }

    @Test
    void updateProfile_WithValidData_ShouldUpdateProfile() throws Exception {
        when(userService.updateProfile(anyLong(), eq("NewFirst"), eq("NewLast"), isNull()))
            .thenReturn(testUser);

        Map<String, String> request = new HashMap<>();
        request.put("firstName", "NewFirst");
        request.put("lastName", "NewLast");

        mockMvc.perform(put("/api/users/profile")
                .with(createAuthenticationToken())
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void updateProfile_WithInvalidEmail_ShouldReturnBadRequest() throws Exception {
        when(userService.updateProfile(anyLong(), isNull(), isNull(), eq("invalidemail")))
            .thenThrow(new IllegalArgumentException("Invalid email format"));

        Map<String, String> request = new HashMap<>();
        request.put("email", "invalidemail");

        mockMvc.perform(put("/api/users/profile")
                .with(createAuthenticationToken())
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid email format"));
    }

    @Test
    void changePassword_WithValidPassword_ShouldChangePassword() throws Exception {
        doNothing().when(userService).changePassword(anyLong(), anyString(), anyString());

        Map<String, String> request = new HashMap<>();
        request.put("currentPassword", "oldpassword123");
        request.put("newPassword", "newpassword123");

        mockMvc.perform(post("/api/users/change-password")
                .with(createAuthenticationToken())
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void changePassword_WithIncorrectCurrentPassword_ShouldReturnBadRequest() throws Exception {
        doThrow(new IllegalArgumentException("Current password is incorrect"))
            .when(userService).changePassword(anyLong(), anyString(), anyString());

        Map<String, String> request = new HashMap<>();
        request.put("currentPassword", "wrongpassword");
        request.put("newPassword", "newpassword123");

        mockMvc.perform(post("/api/users/change-password")
                .with(createAuthenticationToken())
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteAccount_WithValidPassword_ShouldDeleteAccount() throws Exception {
        doNothing().when(userService).deleteAccount(anyLong(), anyString());

        Map<String, String> request = new HashMap<>();
        request.put("password", "password123");

        mockMvc.perform(delete("/api/users/account")
                .with(createAuthenticationToken())
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void deleteAccount_WithoutPassword_ShouldReturnBadRequest() throws Exception {
        Map<String, String> request = new HashMap<>();

        mockMvc.perform(delete("/api/users/account")
                .with(createAuthenticationToken())
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Password is required"));
    }

    @Test
    void exportData_ShouldReturnExportedData() throws Exception {
        Map<String, Object> exportedData = new HashMap<>();
        exportedData.put("profile", testUser);
        exportedData.put("accounts", new ArrayList<>());
        exportedData.put("transactions", new ArrayList<>());

        when(userService.exportUserData(anyLong(), anyString())).thenReturn(exportedData);

        Map<String, String> request = new HashMap<>();
        request.put("format", "json");

        mockMvc.perform(post("/api/users/export-data")
                .with(createAuthenticationToken())
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getFinancialGoals_ShouldReturnGoals() throws Exception {
        Map<String, Object> goals = new HashMap<>();
        goals.put("savingsGoal", new BigDecimal("10000.00"));
        goals.put("monthlyIncome", new BigDecimal("5000.00"));

        when(userService.getFinancialGoals(anyLong())).thenReturn(goals);

        mockMvc.perform(get("/api/users/financial-goals")
                .with(createAuthenticationToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.savingsGoal").value(10000.00));
    }

    @Test
    void updateFinancialGoals_WithValidGoal_ShouldUpdateGoal() throws Exception {
        when(userService.updateFinancialGoals(anyLong(), any(BigDecimal.class)))
            .thenReturn(testUser);

        Map<String, BigDecimal> request = new HashMap<>();
        request.put("savingsGoal", new BigDecimal("15000.00"));

        mockMvc.perform(put("/api/users/financial-goals")
                .with(createAuthenticationToken())
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void updateFinancialGoals_WithNegativeGoal_ShouldReturnBadRequest() throws Exception {
        when(userService.updateFinancialGoals(anyLong(), any(BigDecimal.class)))
            .thenThrow(new IllegalArgumentException("Savings goal cannot be negative"));

        Map<String, BigDecimal> request = new HashMap<>();
        request.put("savingsGoal", new BigDecimal("-1000.00"));

        mockMvc.perform(put("/api/users/financial-goals")
                .with(createAuthenticationToken())
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
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