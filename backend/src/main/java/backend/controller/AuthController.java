package backend.controller;

import backend.dto.AuthRequest;
import backend.dto.AuthResponse;
import backend.dto.PasswordResetRequest;
import backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.register(
                request.getUsername(), 
                request.getPassword(), 
                request.getEmail()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                new AuthResponse(null, null, false, e.getMessage())
            );
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        try {
            String usernameOrEmail = request.getUsername();
            AuthResponse response = authService.login(usernameOrEmail, request.getPassword());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                new AuthResponse(null, null, false, e.getMessage())
            );
        }
    }

    @GetMapping("/verify-email")
    public ResponseEntity<AuthResponse> verifyEmail(@RequestParam String token) {
        try {
            AuthResponse response = authService.verifyEmail(token);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                new AuthResponse(null, null, false, e.getMessage())
            );
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<String> resendVerification(@RequestBody AuthRequest request) {
        try {
            authService.resendVerificationEmail(request.getUsername());
            return ResponseEntity.ok("Verification email resent successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> initiatePasswordReset(@RequestBody AuthRequest request) {
        try {
            authService.initiatePasswordReset(request.getUsername());
            return ResponseEntity.ok("Password reset link sent to your email");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PostMapping("/reset-password/confirm")
    public ResponseEntity<AuthResponse> confirmPasswordReset(@RequestBody PasswordResetRequest request) {
        try {
            AuthResponse response = authService.confirmPasswordReset(
                request.getToken(), 
                request.getNewPassword()
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                new AuthResponse(null, null, false, e.getMessage())
            );
        }
    }

    @GetMapping("/validate-reset-token")
    public ResponseEntity<AuthResponse> validateResetToken(@RequestParam String token) {
        try {
            boolean isValid = authService.validatePasswordResetToken(token);
            if (isValid) {
                return ResponseEntity.ok(
                    new AuthResponse(null, null, true, "Token is valid")
                );
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    new AuthResponse(null, null, false, "Invalid or expired token")
                );
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                new AuthResponse(null, null, false, e.getMessage())
            );
        }
    }
}