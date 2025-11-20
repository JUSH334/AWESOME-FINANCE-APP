// backend/src/main/java/backend/repository/AIInsightsRepository.java
package backend.repository;

import backend.entity.AIInsights;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AIInsightsRepository extends JpaRepository<AIInsights, Long> {
    
    /**
     * Find the most recent AI insights for a user
     */
    Optional<AIInsights> findTopByUserIdOrderByCreatedAtDesc(Long userId);
    
    /**
     * Delete all insights for a specific user
     */
    void deleteByUserId(Long userId);
}