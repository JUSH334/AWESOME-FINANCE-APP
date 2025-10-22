package backend.service;

import backend.dto.AuthResponse;
import backend.entity.User;
import backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Autowired
    public AuthService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.emailService = emailService;
    }

    /**
     * Register a new user with secure password hashing and email verification
     */
    public AuthResponse register(String username, String password, String email) {
        // Validation
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (username.length() < 3) {
            throw new IllegalArgumentException("Username must be at least 3 characters long");
        }
        if (!username.matches("^[a-zA-Z0-9_]+$")) {
            throw new IllegalArgumentException("Username can only contain letters, numbers, and underscores");
        }
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Invalid email format");
        }

        // Check if user already exists
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already taken");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Generate verification token
        String verificationToken = UUID.randomUUID().toString();

        // Create new user
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setIsActive(true);
        user.setIsEmailVerified(false);
        user.setVerificationToken(verificationToken);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // Send verification email
        emailService.sendVerificationEmail(email, username, verificationToken);

        return new AuthResponse(
            savedUser.getId().toString(),
            savedUser.getUsername(),
            true,
            "Registration successful. Please check your email to verify your account."
        );
    }

    /**
     * Login user with credential validation (accepts username or email)
     */
    public AuthResponse login(String usernameOrEmail, String password) {
        // Validation
        if (usernameOrEmail == null || usernameOrEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("Username or email is required");
        }
        if (password == null || password.isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }

        // Find user by username or email
        Optional<User> userOpt = userRepository.findByUsername(usernameOrEmail);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(usernameOrEmail);
        }
        
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        User user = userOpt.get();

        // Check if user is active
        if (!user.getIsActive()) {
            throw new IllegalArgumentException("Account is disabled");
        }

        // Verify password using BCrypt
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        // Check if email is verified
        if (!user.getIsEmailVerified()) {
            throw new IllegalArgumentException("Please verify your email before logging in. Check your inbox for the verification link.");
        }

        // Update last login time
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return new AuthResponse(
            user.getId().toString(),
            user.getUsername(),
            true,
            "Login successful"
        );
    }

    /**
     * Verify email with token
     */
    public AuthResponse verifyEmail(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("Verification token is required");
        }

        Optional<User> userOpt = userRepository.findByVerificationToken(token);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid or expired verification token");
        }

        User user = userOpt.get();
        
        if (user.getIsEmailVerified()) {
            throw new IllegalArgumentException("Email is already verified");
        }

        user.setIsEmailVerified(true);
        user.setVerificationToken(null); // Clear the token
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        return new AuthResponse(
            user.getId().toString(),
            user.getUsername(),
            true,
            "Email verified successfully. You can now log in."
        );
    }

    /**
     * Initiate password reset (sends reset link)
     */
    public void initiatePasswordReset(String usernameOrEmail) {
        if (usernameOrEmail == null || usernameOrEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("Username or email is required");
        }

        Optional<User> userOpt = userRepository.findByUsername(usernameOrEmail);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(usernameOrEmail);
        }
        
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found");
        }

        User user = userOpt.get();
        
        // Generate reset token
        String resetToken = UUID.randomUUID().toString();
        user.setPasswordResetToken(resetToken);
        user.setPasswordResetExpiry(LocalDateTime.now().plusHours(24));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Send reset email
        emailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), resetToken);
    }

    /**
     * Validate password reset token
     */
    public boolean validatePasswordResetToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        Optional<User> userOpt = userRepository.findByPasswordResetToken(token);
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        
        // Check if token is expired
        if (user.getPasswordResetExpiry() == null || 
            user.getPasswordResetExpiry().isBefore(LocalDateTime.now())) {
            return false;
        }

        return true;
    }

    /**
     * Confirm password reset with new password
     */
    public AuthResponse confirmPasswordReset(String token, String newPassword) {
        if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("Reset token is required");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long");
        }

        Optional<User> userOpt = userRepository.findByPasswordResetToken(token);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid or expired reset token");
        }

        User user = userOpt.get();
        
        // Check if token is expired
        if (user.getPasswordResetExpiry() == null || 
            user.getPasswordResetExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Reset token has expired. Please request a new one.");
        }

        // Update password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiry(null);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        return new AuthResponse(
            user.getId().toString(),
            user.getUsername(),
            true,
            "Password reset successful. You can now log in with your new password."
        );
    }

    /**
     * Resend verification email
     */
    public void resendVerificationEmail(String usernameOrEmail) {
        if (usernameOrEmail == null || usernameOrEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("Username or email is required");
        }

        Optional<User> userOpt = userRepository.findByUsername(usernameOrEmail);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(usernameOrEmail);
        }
        
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found");
        }

        User user = userOpt.get();
        
        if (user.getIsEmailVerified()) {
            throw new IllegalArgumentException("Email is already verified");
        }

        // Generate new verification token if needed
        if (user.getVerificationToken() == null) {
            user.setVerificationToken(UUID.randomUUID().toString());
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        }

        emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), user.getVerificationToken());
    }
}