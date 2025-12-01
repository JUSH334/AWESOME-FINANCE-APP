package backend.controller;

import backend.dto.AuthRequest;
import backend.dto.AuthResponse;
import backend.dto.PasswordResetRequest;
import backend.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    private AuthRequest validRegisterRequest;
    private AuthRequest validLoginRequest;
    private AuthResponse successResponse;

    @BeforeEach
    void setUp() {
        validRegisterRequest = new AuthRequest();
        validRegisterRequest.setUsername("testuser");
        validRegisterRequest.setPassword("password123");
        validRegisterRequest.setEmail("test@test.com");
        validRegisterRequest.setFirstName("Test");
        validRegisterRequest.setLastName("User");

        validLoginRequest = new AuthRequest();
        validLoginRequest.setUsername("testuser");
        validLoginRequest.setPassword("password123");

        successResponse = new AuthResponse("1", "testuser", true, "Success", "mock-token");
    }

    @Test
    void register_WithValidData_ShouldReturnCreated() throws Exception {
        when(authService.register(anyString(), anyString(), anyString(), anyString(), anyString()))
            .thenReturn(successResponse);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRegisterRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.username").value("testuser"));

        verify(authService).register("testuser", "password123", "test@test.com", "Test", "User");
    }

    @Test
    void register_WithExistingUsername_ShouldReturnBadRequest() throws Exception {
        when(authService.register(anyString(), anyString(), anyString(), anyString(), anyString()))
            .thenThrow(new IllegalArgumentException("Username already taken"));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRegisterRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Username already taken"));
    }

    @Test
    void login_WithValidCredentials_ShouldReturnOk() throws Exception {
        when(authService.login(anyString(), anyString()))
            .thenReturn(successResponse);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validLoginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.token").value("mock-token"));

        verify(authService).login("testuser", "password123");
    }

    @Test
    void login_WithInvalidPassword_ShouldReturnUnauthorized() throws Exception {
        when(authService.login(anyString(), anyString()))
            .thenThrow(new IllegalArgumentException("Invalid credentials"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validLoginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    void verifyEmail_WithValidToken_ShouldReturnOk() throws Exception {
        when(authService.verifyEmail("valid-token"))
            .thenReturn(new AuthResponse("1", "testuser", true, "Email verified successfully"));

        mockMvc.perform(get("/api/auth/verify-email")
                .param("token", "valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void verifyEmail_WithInvalidToken_ShouldReturnBadRequest() throws Exception {
        when(authService.verifyEmail("invalid-token"))
            .thenThrow(new IllegalArgumentException("Invalid or expired verification token"));

        mockMvc.perform(get("/api/auth/verify-email")
                .param("token", "invalid-token"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resendVerification_WithValidUsername_ShouldReturnOk() throws Exception {
        doNothing().when(authService).resendVerificationEmail(anyString());

        AuthRequest request = new AuthRequest();
        request.setUsername("testuser");

        mockMvc.perform(post("/api/auth/resend-verification")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("Verification email resent successfully"));
    }

    @Test
    void initiatePasswordReset_WithValidEmail_ShouldReturnOk() throws Exception {
        doNothing().when(authService).initiatePasswordReset(anyString());

        AuthRequest request = new AuthRequest();
        request.setUsername("test@test.com");

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(authService).initiatePasswordReset("test@test.com");
    }

    @Test
    void confirmPasswordReset_WithValidToken_ShouldReturnOk() throws Exception {
        PasswordResetRequest request = new PasswordResetRequest();
        request.setToken("valid-token");
        request.setNewPassword("newpassword123");

        when(authService.confirmPasswordReset(anyString(), anyString()))
            .thenReturn(new AuthResponse("1", "testuser", true, "Password reset successful"));

        mockMvc.perform(post("/api/auth/reset-password/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void confirmPasswordReset_WithExpiredToken_ShouldReturnBadRequest() throws Exception {
        PasswordResetRequest request = new PasswordResetRequest();
        request.setToken("expired-token");
        request.setNewPassword("newpassword123");

        when(authService.confirmPasswordReset(anyString(), anyString()))
            .thenThrow(new IllegalArgumentException("Reset token has expired"));

        mockMvc.perform(post("/api/auth/reset-password/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void validateResetToken_WithValidToken_ShouldReturnOk() throws Exception {
        when(authService.validatePasswordResetToken("valid-token")).thenReturn(true);

        mockMvc.perform(get("/api/auth/validate-reset-token")
                .param("token", "valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void validateResetToken_WithInvalidToken_ShouldReturnBadRequest() throws Exception {
        when(authService.validatePasswordResetToken("invalid-token")).thenReturn(false);

        mockMvc.perform(get("/api/auth/validate-reset-token")
                .param("token", "invalid-token"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void changeUsername_WithValidData_ShouldReturnOk() throws Exception {
        doNothing().when(authService).changeUsername(anyString(), anyString(), anyString());

        AuthRequest request = new AuthRequest();
        request.setEmail("test@test.com");
        request.setPassword("password123");
        request.setUsername("newusername");

        mockMvc.perform(post("/api/auth/change-username")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}