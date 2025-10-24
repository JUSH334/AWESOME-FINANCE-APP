package backend.service;

import backend.dto.AuthResponse;
import backend.entity.User;
import backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

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
        logger.info("Token length: {}", verificationToken.length());

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

        logger.info("About to save user with token: {}", user.getVerificationToken());

        User savedUser = userRepository.save(user);
        
        logger.info("User saved successfully!");
        logger.info("Saved user ID: {}", savedUser.getId());
        logger.info("Saved user verification token: {}", savedUser.getVerificationToken());
        logger.info("Is token null? {}", savedUser.getVerificationToken() == null);
        logger.info("Token matches original? {}", verificationToken.equals(savedUser.getVerificationToken()));

        // Verify it was actually saved by querying it back
        Optional<User> verifyUser = userRepository.findByVerificationToken(verificationToken);
        logger.info("Can we find the user by token immediately after save? {}", verifyUser.isPresent());
        if (verifyUser.isPresent()) {
            logger.info("Found user: {} with token: {}", verifyUser.get().getUsername(), verifyUser.get().getVerificationToken());
        } else {
            logger.error("CRITICAL: User was saved but cannot be found by token!");
            // List all users with verification tokens
            List<User> allUsers = userRepository.findAll();
            logger.info("Total users in database: {}", allUsers.size());
            for (User u : allUsers) {
                logger.info("User: {} | Token: {} | Verified: {}", 
                    u.getUsername(), 
                    u.getVerificationToken(), 
                    u.getIsEmailVerified());
            }
        }

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
     * Verify email with token - IDEMPOTENT VERSION
     */
    public AuthResponse verifyEmail(String token) {
        logger.info("=== VERIFY EMAIL SERVICE ===");
        logger.info("Received token: {}", token);
        
        if (token == null || token.trim().isEmpty()) {
            logger.error("Token is null or empty");
            throw new IllegalArgumentException("Verification token is required");
        }

        String cleanToken = token.trim();
        logger.info("Cleaned token: {}", cleanToken);
        logger.info("Token length: {}", cleanToken.length());

        // First, let's see ALL users in the database
        List<User> allUsers = userRepository.findAll();
        logger.info("=== ALL USERS IN DATABASE ===");
        logger.info("Total users: {}", allUsers.size());
        for (User u : allUsers) {
            logger.info("User: {} | ID: {} | Email: {} | Token: {} | Token Length: {} | Verified: {}", 
                u.getUsername(), 
                u.getId(),
                u.getEmail(),
                u.getVerificationToken(),
                u.getVerificationToken() != null ? u.getVerificationToken().length() : "null",
                u.getIsEmailVerified());
            
            if (u.getVerificationToken() != null) {
                logger.info("Token comparison - Incoming: [{}] | Stored: [{}] | Match: {}", 
                    cleanToken, 
                    u.getVerificationToken(),
                    cleanToken.equals(u.getVerificationToken()));
            }
        }

        Optional<User> userOpt = userRepository.findByVerificationToken(cleanToken);
        logger.info("User found by token query: {}", userOpt.isPresent());
        
        if (userOpt.isEmpty()) {
            logger.error("No user found with token: {}", cleanToken);
            
            // Check if there's a user who was RECENTLY verified (within last 5 minutes)
            // This handles the case where the token was already used
            LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
            for (User u : allUsers) {
                if (u.getIsEmailVerified() && 
                    u.getUpdatedAt() != null && 
                    u.getUpdatedAt().isAfter(fiveMinutesAgo) &&
                    u.getVerificationToken() == null) {
                    
                    logger.info("Found recently verified user (within 5 min): {} - Token was likely already used", u.getUsername());
                    // Return success for already-verified users (idempotent)
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
        logger.info("Found user: {} (ID: {})", user.getUsername(), user.getId());
        logger.info("User's stored token: {}", user.getVerificationToken());
        logger.info("Tokens match: {}", cleanToken.equals(user.getVerificationToken()));
        
        // Check if already verified
        if (user.getIsEmailVerified()) {
            logger.warn("Email already verified for user: {}", user.getUsername());
            // Return success instead of error (idempotent behavior)
            return new AuthResponse(
                user.getId().toString(),
                user.getUsername(),
                true,
                "Email already verified. You can now log in."
            );
        }

        // Verify the user
        user.setIsEmailVerified(true);
        user.setVerificationToken(null); // Clear the token
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
        emailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), resetToken);
    }

    /**
     * Validate password reset token
     */
    public boolean validatePasswordResetToken(String token) {
        logger.info("=== VALIDATE PASSWORD RESET TOKEN ===");
        logger.info("Received token: {}", token);
        
        if (token == null || token.trim().isEmpty()) {
            logger.error("Token is null or empty");
            return false;
        }

        String cleanToken = token.trim();
        logger.info("Cleaned token: {}", cleanToken);

        Optional<User> userOpt = userRepository.findByPasswordResetToken(cleanToken);
        logger.info("User found: {}", userOpt.isPresent());
        
        if (userOpt.isEmpty()) {
            logger.error("No user found with reset token");
            return false;
        }

        User user = userOpt.get();
        logger.info("Found user: {} (ID: {})", user.getUsername(), user.getId());
        logger.info("Token expiry: {}", user.getPasswordResetExpiry());
        logger.info("Current time: {}", LocalDateTime.now());
        
        // Check if token is expired
        if (user.getPasswordResetExpiry() == null || 
            user.getPasswordResetExpiry().isBefore(LocalDateTime.now())) {
            logger.error("Token is expired");
            return false;
        }

        logger.info("Token is valid!");
        return true;
    }

    /**
     * Confirm password reset with new password
     */
    public AuthResponse confirmPasswordReset(String token, String newPassword) {
        logger.info("=== CONFIRM PASSWORD RESET ===");
        logger.info("Received token: {}", token);
        
        if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("Reset token is required");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long");
        }

        String cleanToken = token.trim();
        Optional<User> userOpt = userRepository.findByPasswordResetToken(cleanToken);
        
        if (userOpt.isEmpty()) {
            logger.error("No user found with reset token");
            throw new IllegalArgumentException("Invalid or expired reset token");
        }

        User user = userOpt.get();
        logger.info("Found user: {} (ID: {})", user.getUsername(), user.getId());
        
        // Check if token is expired
        if (user.getPasswordResetExpiry() == null || 
            user.getPasswordResetExpiry().isBefore(LocalDateTime.now())) {
            logger.error("Token is expired");
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

        logger.info("Resending verification email to {} with token: {}", user.getEmail(), user.getVerificationToken());
        emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), user.getVerificationToken());
    }
}