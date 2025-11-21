// backend/src/main/java/backend/controller/UserController.java
package backend.controller;

import backend.entity.User;
import backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.util.HashMap;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ==================== PROFILE ENDPOINTS ====================

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            User user = userService.getUserById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put("username", user.getUsername());
            profile.put("email", user.getEmail());
            profile.put("firstName", user.getFirstName());
            profile.put("lastName", user.getLastName());
            profile.put("isEmailVerified", user.getIsEmailVerified());
            profile.put("createdAt", user.getCreatedAt());
            profile.put("lastLoginAt", user.getLastLoginAt());
            
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody ProfileUpdateRequest request, Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            User user = userService.updateProfile(
                userId,
                request.firstName,
                request.lastName,
                request.email
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Profile updated successfully");
            response.put("user", Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "firstName", user.getFirstName(),
                "lastName", user.getLastName()
            ));
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody PasswordChangeRequest request, Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            userService.changePassword(
                userId,
                request.currentPassword,
                request.newPassword
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Password changed successfully"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(@RequestBody Map<String, String> request, Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            String password = request.get("password");
            
            if (password == null || password.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Password is required"));
            }
            
            userService.deleteAccount(userId, password);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Account deleted successfully"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/export-data")
    public ResponseEntity<?> exportData(@RequestBody Map<String, String> request, Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            String format = request.getOrDefault("format", "csv");
            
            Map<String, Object> exportedData = userService.exportUserData(userId, format);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Data exported successfully",
                "data", exportedData
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

        @GetMapping("/financial-goals")
    public ResponseEntity<?> getFinancialGoals(Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            Map<String, Object> goals = userService.getFinancialGoals(userId);
            return ResponseEntity.ok(goals);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/financial-goals")
    public ResponseEntity<?> updateFinancialGoals(@RequestBody FinancialGoalsRequest request, Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            User user = userService.updateFinancialGoals(
                userId,
                request.savingsGoal,
                request.monthlyIncome
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Financial goals updated successfully");
            response.put("savingsGoal", user.getSavingsGoal());
            response.put("monthlyIncome", user.getMonthlyIncome());
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== HELPER METHODS ====================

    private Long getUserIdFromAuth(Authentication auth) {
        if (auth == null) {
            throw new IllegalArgumentException("User not authenticated");
        }
        
        @SuppressWarnings("unchecked")
        Map<String, Object> details = (Map<String, Object>) auth.getDetails();
        Object userIdObj = details.get("userId");
        
        if (userIdObj == null) {
            throw new IllegalArgumentException("User ID not found in authentication");
        }
        
        return Long.parseLong(userIdObj.toString());
    }

    // ==================== REQUEST DTOs ====================
    public static class FinancialGoalsRequest {
        public BigDecimal savingsGoal;
        public BigDecimal monthlyIncome;
    }

    public static class ProfileUpdateRequest {
        public String firstName;
        public String lastName;
        public String email;
    }

    public static class PasswordChangeRequest {
        public String currentPassword;
        public String newPassword;
    }

    // ==================== LEGACY ENDPOINTS (Keep for compatibility) ====================

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        return ResponseEntity.ok(userService.createUser(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}