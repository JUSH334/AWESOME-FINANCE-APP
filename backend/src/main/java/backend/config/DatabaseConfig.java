package backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "backend.repository")
public class DatabaseConfig {
    // Spring Boot auto-configuration handles database connection
}