package backend.integration;

import backend.dto.AuthRequest;
import backend.entity.User;
import backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void fullRegistrationAndLoginFlow_ShouldWork() throws Exception {
        // Register
        AuthRequest registerRequest = new AuthRequest();
        registerRequest.setUsername("integrationtest");
        registerRequest.setPassword("password123");
        registerRequest.setEmail("integration@test.com");
        registerRequest.setFirstName("Integration");
        registerRequest.setLastName("Test");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        // Verify user was created
        User user = userRepository.findByUsername("integrationtest").orElseThrow();
        
        // Manually verify email for testing
        user.setIsEmailVerified(true);
        userRepository.save(user);

        // Login
        AuthRequest loginRequest = new AuthRequest();
        loginRequest.setUsername("integrationtest");
        loginRequest.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }
}