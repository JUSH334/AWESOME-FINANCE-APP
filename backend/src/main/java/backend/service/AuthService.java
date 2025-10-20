package backend.service;

import backend.dto.AuthResponse;
import backend.entity.User;
import backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Autowired
    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    /**
     * Register a new user with secure password hashing
     */
    public AuthResponse register(String username, String password, String email) {
        // Validation
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        // Check if user already exists
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already taken");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Create new user
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setIsActive(true);
        user.setIsEmailVerified(false);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        return new AuthResponse(
            savedUser.getId().toString(),
            savedUser.getUsername(),
            true,
            "Registration successful"
        );
    }

    /**
     * Login user with credential validation
     */
    public AuthResponse login(String username, String password) {
        // Validation
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (password == null || password.isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }

        // Find user by username
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        User user = userOpt.get();

        // Check if user is active
        if (!user.getIsActive()) {
            throw new IllegalArgumentException("Account is disabled");
        }

        // Verify password using BCrypt
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid username or password");
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
     * Reset password (sends reset link - placeholder implementation)
     */
    public void resetPassword(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found with this username");
        }

        // TODO: In production, generate a reset token and send via email service
        // For now, just validate the user exists
    }
}