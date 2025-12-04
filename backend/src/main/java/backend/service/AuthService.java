package backend.service;

import backend.dto.AuthResponse;
import backend.entity.User;
import backend.repository.UserRepository;
import backend.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtUtil jwtUtil; 

    @Autowired
    public AuthService(UserRepository userRepository, EmailService emailService, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.emailService = emailService;
        this.jwtUtil = jwtUtil; 
    }

    /**
     * Register a new user with secure password hashing and email verification
     */
    public AuthResponse register(String username, String password, String email, String firstName, String lastName) {
        logger.info("=== REGISTRATION DEBUG ===");
        logger.info("Registering user: {}", username);
        
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
        logger.info("Generated verification token: {}", verificationToken);

        // Create new user
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setIsActive(true);
        user.setIsEmailVerified(false);
        user.setVerificationToken(verificationToken);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);
        
        logger.info("User saved successfully with ID: {}", savedUser.getId());

        // Send verification email
        String fullName = buildFullName(firstName, lastName);
        emailService.sendVerificationEmail(email, fullName.isEmpty() ? username : fullName, verificationToken);

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

        // Generate JWT token
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId().toString());
        claims.put("email", user.getEmail());
        String token = jwtUtil.generateToken(user.getUsername(), claims);

        return new AuthResponse(
            user.getId().toString(),
            user.getUsername(),
            true,
            "Login successful",
            token  // Include JWT token
        );
    }

    /**
     * Verify email with token - IDEMPOTENT VERSION
     */
    public AuthResponse verifyEmail(String token) {
        logger.info("=== VERIFY EMAIL SERVICE ===");
        logger.info("Received token: {}", token);
        
        if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("Verification token is required");
        }

        String cleanToken = token.trim();
        Optional<User> userOpt = userRepository.findByVerificationToken(cleanToken);
        
        if (userOpt.isEmpty()) {
            // Check if there's a user who was recently verified
            LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
            List<User> allUsers = userRepository.findAll();
            for (User u : allUsers) {
                if (u.getIsEmailVerified() && 
                    u.getUpdatedAt() != null && 
                    u.getUpdatedAt().isAfter(fiveMinutesAgo) &&
                    u.getVerificationToken() == null) {
                    
                    return new AuthResponse(
                        u.getId().toString(),
                        u.getUsername(),
                        true,
                        "Email already verified. You can now log in."
                    );
                }
            }
            
            throw new IllegalArgumentException("Invalid or expired verification token");
        }

        User user = userOpt.get();
        
        // Check if already verified
        if (user.getIsEmailVerified()) {
            return new AuthResponse(
                user.getId().toString(),
                user.getUsername(),
                true,
                "Email already verified. You can now log in."
            );
        }

        // Verify the user
        user.setIsEmailVerified(true);
        user.setVerificationToken(null);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        logger.info("Email verified successfully for user: {}", user.getUsername());

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
        logger.info("Generated password reset token for {}: {}", user.getUsername(), resetToken);
        
        user.setPasswordResetToken(resetToken);
        user.setPasswordResetExpiry(LocalDateTime.now().plusHours(24));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Send reset email
        String fullName = buildFullName(user.getFirstName(), user.getLastName());
        emailService.sendPasswordResetEmail(user.getEmail(), fullName.isEmpty() ? user.getUsername() : fullName, resetToken);
    }

    /**
     * Validate password reset token
     */
    public boolean validatePasswordResetToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        Optional<User> userOpt = userRepository.findByPasswordResetToken(token.trim());
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

        String cleanToken = token.trim();
        Optional<User> userOpt = userRepository.findByPasswordResetToken(cleanToken);
        
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

        logger.info("Password reset successful for user: {}", user.getUsername());

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

        String fullName = buildFullName(user.getFirstName(), user.getLastName());
        emailService.sendVerificationEmail(user.getEmail(), fullName.isEmpty() ? user.getUsername() : fullName, user.getVerificationToken());
    }

    /**
     * Change username with email and password verification
     */
    public void changeUsername(String email, String password, String newUsername) {
        logger.info("=== CHANGE USERNAME ===");
        logger.info("Email: {}, New Username: {}", email, newUsername);
        
        // Validation
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (password == null || password.isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (newUsername == null || newUsername.trim().isEmpty()) {
            throw new IllegalArgumentException("New username is required");
        }
        if (newUsername.length() < 3) {
            throw new IllegalArgumentException("Username must be at least 3 characters long");
        }
        if (!newUsername.matches("^[a-zA-Z0-9_]+$")) {
            throw new IllegalArgumentException("Username can only contain letters, numbers, and underscores");
        }
        
        // Find user by email
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        
        User user = userOpt.get();
        
        // Verify password
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        
        // Check if new username is already taken
        if (userRepository.existsByUsername(newUsername)) {
            throw new IllegalArgumentException("Username already taken");
        }
        
        // Update username
        user.setUsername(newUsername);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        
        logger.info("Username changed successfully for email: {}", email);
    }

    /**
     * Helper method to build full name
     */
    private String buildFullName(String firstName, String lastName) {
        StringBuilder name = new StringBuilder();
        if (firstName != null && !firstName.trim().isEmpty()) {
            name.append(firstName.trim());
        }
        if (lastName != null && !lastName.trim().isEmpty()) {
            if (name.length() > 0) {
                name.append(" ");
            }
            name.append(lastName.trim());
        }
        return name.toString();
    }
}