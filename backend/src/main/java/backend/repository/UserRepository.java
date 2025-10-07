package backend.repository;

import backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    
    // Find user by email
    Optional<User> findByEmail(String email);
    
    // Find users by age greater than
    List<User> findByAgeGreaterThan(Integer age);
    
    // Search users by name (containing)
    List<User> findByNameContainingIgnoreCase(String name);
    
    // Custom query for age range
    @Query("SELECT u FROM User u WHERE u.age BETWEEN :minAge AND :maxAge")
    List<User> findUsersInAgeRange(@Param("minAge") int minAge, @Param("maxAge") int maxAge);
}