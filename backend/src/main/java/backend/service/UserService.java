package backend.service;

import backend.entity.User;
import backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    // Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    // Get user by ID
    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }
    
    // Get user by email
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    // Search users by name
    public List<User> searchUsersByName(String name) {
        return userRepository.findByNameContainingIgnoreCase(name);
    }
    
    // Get users in age range
    public List<User> getUsersInAgeRange(int minAge, int maxAge) {
        return userRepository.findUsersInAgeRange(minAge, maxAge);
    }
    
    // Create new user
    public User createUser(User user) {
        // Check if email already exists
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("User with email " + user.getEmail() + " already exists");
        }
        user.setCreatedAt(new Date());
        return userRepository.save(user);
    }
    
    // Update user
    public User updateUser(Long id, User userDetails) {
        User user = getUserById(id);
        
        user.setName(userDetails.getName());
        user.setEmail(userDetails.getEmail());
        user.setAge(userDetails.getAge());
        
        return userRepository.save(user);
    }
    
    // Delete user
    public void deleteUser(Long id) {
        User user = getUserById(id);
        userRepository.delete(user);
    }
    
    // Check if user exists
    public boolean existsById(Long id) {
        return userRepository.existsById(id);
    }
}