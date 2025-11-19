package backend.repository;

import backend.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUserId(Long userId);
    List<Budget> findByUserIdAndIsActive(Long userId, Boolean isActive);
    Optional<Budget> findByIdAndUserId(Long id, Long userId);
    Optional<Budget> findByUserIdAndCategoryAndIsActive(Long userId, String category, Boolean isActive);
    boolean existsByUserIdAndCategoryAndIsActive(Long userId, String category, Boolean isActive);
}