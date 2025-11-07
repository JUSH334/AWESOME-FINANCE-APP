package backend.dto;

public class AuthResponse {
    private String id;
    private String username;
    private boolean success;
    private String message;
    private String token; // JWT token

    // Default constructor
    public AuthResponse() {}

    // Constructor with 4 parameters (backward compatible)
    public AuthResponse(String id, String username, boolean success, String message) {
        this.id = id;
        this.username = username;
        this.success = success;
        this.message = message;
    }

    // Constructor with token
    public AuthResponse(String id, String username, boolean success, String message, String token) {
        this.id = id;
        this.username = username;
        this.success = success;
        this.message = message;
        this.token = token;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}