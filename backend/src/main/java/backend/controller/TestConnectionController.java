package backend.controller;

import java.sql.Connection;
import java.sql.DatabaseMetaData;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestConnectionController {

    @Autowired
    private DataSource dataSource;

    @GetMapping("/test-db")
    public String testConnection() {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            
            return String.format(
                "✓ Database connection successful!%n" +
                "Database: %s%n" +
                "URL: %s%n" +
                "User: %s%n" +
                "Driver: %s",
                metaData.getDatabaseProductName(),
                metaData.getURL(),
                metaData.getUserName(),
                metaData.getDriverName()
            );
        } catch (Exception e) {
            return "✗ Database connection failed: " + e.getMessage();
        }
    }
    
    @GetMapping("/")
    public String home() {
        return "Awesome App is running! Visit /test-db to test database connection.";
    }
}