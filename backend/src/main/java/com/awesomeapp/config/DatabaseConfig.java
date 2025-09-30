package demo.backend.src.main.java.com.awesomeapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.awesomeapp.repository")
public class DatabaseConfig {
    // Spring Boot auto-configuration handles database connection
}