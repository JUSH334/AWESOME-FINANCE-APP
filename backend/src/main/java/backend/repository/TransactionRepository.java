// backend/src/main/java/backend/repository/TransactionRepository.java
package backend.repository;

import backend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserId(Long userId);
    List<Transaction> findByUserIdOrderByTransactionDateDesc(Long userId);
    List<Transaction> findByUserIdAndAccountId(Long userId, Long accountId);
    List<Transaction> findByUserIdAndTransactionDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
    Optional<Transaction> findByIdAndUserId(Long id, Long userId);
    
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId AND " +
           "(LOWER(t.category) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.note) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.merchant) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Transaction> searchTransactions(@Param("userId") Long userId, @Param("search") String search);
}