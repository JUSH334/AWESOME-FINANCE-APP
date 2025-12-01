package backend.service;

import backend.dto.AuthResponse;
import backend.entity.User;
import backend.repository.UserRepository;
import backend.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private BCryptPasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder(4);
    }

    @Test
    void register_WithValidData_ShouldCreateUser() {
        // Given
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@test.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });
        doNothing().when(emailService).sendVerificationEmail(anyString(), anyString(), anyString());

        // When
        AuthResponse response = authService.register(
            "testuser", 
            "password123", 
            "test@test.com",
            "Test",
            "User"
        );

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getUsername()).isEqualTo("testuser");
        assertThat(response.getId()).isEqualTo("1");
        
        verify(userRepository).save(argThat(user -> 
            user.getUsername().equals("testuser") &&
            user.getEmail().equals("test@test.com") &&
            user.getIsEmailVerified() == false
        ));
        verify(emailService).sendVerificationEmail(eq("test@test.com"), anyString(), anyString());
    }

    @Test
    void register_WithExistingUsername_ShouldThrowException() {
        // Given
        when(userRepository.existsByUsername("existinguser")).thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> authService.register(
            "existinguser", 
            "password123", 
            "new@test.com",
            "Test",
            "User"
        ))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Username already taken");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_WithExistingEmail_ShouldThrowException() {
        // Given
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("existing@test.com")).thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> authService.register(
            "newuser", 
            "password123", 
            "existing@test.com",
            "Test",
            "User"
        ))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Email already registered");
    }

    @Test
    void register_WithShortPassword_ShouldThrowException() {
        // When/Then
        assertThatThrownBy(() -> authService.register(
            "testuser", 
            "short", 
            "test@test.com",
            "Test",
            "User"
        ))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Password must be at least 8 characters");
    }

    @Test
    void register_WithInvalidUsername_ShouldThrowException() {
        // When/Then
        assertThatThrownBy(() -> authService.register(
            "ab", 
            "password123", 
            "test@test.com",
            "Test",
            "User"
        ))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Username must be at least 3 characters");
    }

    @Test
    void login_WithValidCredentials_ShouldReturnToken() {
        // Given
        User user = createTestUser();
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setIsEmailVerified(true);
        user.setIsActive(true);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtUtil.generateToken(eq("testuser"), any())).thenReturn("mock-jwt-token");

        // When
        AuthResponse response = authService.login("testuser", "password123");

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getToken()).isEqualTo("mock-jwt-token");
        assertThat(response.getUsername()).isEqualTo("testuser");
        
        verify(userRepository).save(argThat(u -> u.getLastLoginAt() != null));
    }

    @Test
    void login_WithInvalidPassword_ShouldThrowException() {
        // Given
        User user = createTestUser();
        user.setPasswordHash(passwordEncoder.encode("correctpassword"));

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        // When/Then
        assertThatThrownBy(() -> authService.login("testuser", "wrongpassword"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid credentials");
    }

    @Test
    void login_WithUnverifiedEmail_ShouldThrowException() {
        // Given
        User user = createTestUser();
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setIsEmailVerified(false);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        // When/Then
        assertThatThrownBy(() -> authService.login("testuser", "password123"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("verify your email");
    }

    @Test
    void login_WithInactiveUser_ShouldThrowException() {
        // Given
        User user = createTestUser();
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setIsActive(false);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        // When/Then
        assertThatThrownBy(() -> authService.login("testuser", "password123"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Account is disabled");
    }

    @Test
    void verifyEmail_WithValidToken_ShouldVerifyUser() {
        // Given
        User user = createTestUser();
        user.setIsEmailVerified(false);
        user.setVerificationToken("valid-token");

        when(userRepository.findByVerificationToken("valid-token")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        // When
        AuthResponse response = authService.verifyEmail("valid-token");

        // Then
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).contains("verified successfully");
        
        verify(userRepository).save(argThat(u -> 
            u.getIsEmailVerified() == true && 
            u.getVerificationToken() == null
        ));
    }

    @Test
    void verifyEmail_WithAlreadyVerifiedUser_ShouldReturnSuccess() {
        // Given
        User user = createTestUser();
        user.setIsEmailVerified(true);
        user.setVerificationToken("valid-token");

        when(userRepository.findByVerificationToken("valid-token")).thenReturn(Optional.of(user));

        // When
        AuthResponse response = authService.verifyEmail("valid-token");

        // Then
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).contains("already verified");
    }

    @Test
    void verifyEmail_WithInvalidToken_ShouldThrowException() {
        // Given
        when(userRepository.findByVerificationToken("invalid-token")).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> authService.verifyEmail("invalid-token"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid or expired");
    }

    @Test
    void initiatePasswordReset_WithValidEmail_ShouldSendResetEmail() {
        // Given
        User user = createTestUser();
        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        doNothing().when(emailService).sendPasswordResetEmail(anyString(), anyString(), anyString());

        // When
        authService.initiatePasswordReset("test@test.com");

        // Then
        verify(userRepository).save(argThat(u -> 
            u.getPasswordResetToken() != null &&
            u.getPasswordResetExpiry() != null
        ));
        verify(emailService).sendPasswordResetEmail(eq("test@test.com"), anyString(), anyString());
    }

    @Test
    void confirmPasswordReset_WithValidToken_ShouldResetPassword() {
        // Given
        User user = createTestUser();
        user.setPasswordResetToken("valid-reset-token");
        user.setPasswordResetExpiry(LocalDateTime.now().plusHours(1));

        when(userRepository.findByPasswordResetToken("valid-reset-token")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        // When
        AuthResponse response = authService.confirmPasswordReset("valid-reset-token", "newpassword123");

        // Then
        assertThat(response.isSuccess()).isTrue();
        verify(userRepository).save(argThat(u -> 
            u.getPasswordResetToken() == null &&
            u.getPasswordResetExpiry() == null
        ));
    }

    @Test
    void confirmPasswordReset_WithExpiredToken_ShouldThrowException() {
        // Given
        User user = createTestUser();
        user.setPasswordResetToken("expired-token");
        user.setPasswordResetExpiry(LocalDateTime.now().minusHours(1));

        when(userRepository.findByPasswordResetToken("expired-token")).thenReturn(Optional.of(user));

        // When/Then
        assertThatThrownBy(() -> authService.confirmPasswordReset("expired-token", "newpassword123"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("expired");
    }

    private User createTestUser() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@test.com");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setIsActive(true);
        user.setIsEmailVerified(false);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return user;
    }
}