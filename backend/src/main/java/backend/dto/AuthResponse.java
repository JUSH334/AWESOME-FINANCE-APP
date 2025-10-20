package backend.dto;

public class AuthResponse {
    private String id;
    private String username;
    private boolean success;
    private String message;

    // Default constructor
    public AuthResponse() {}

    // Constructor with 4 parameters
    public AuthResponse(String id, String username, boolean success, String message) {
        this.id = id;
        this.username = username;
        this.success = success;
        this.message = message;
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
}