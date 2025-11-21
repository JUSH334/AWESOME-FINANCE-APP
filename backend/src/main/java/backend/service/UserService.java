// backend/src/main/java/backend/service/UserService.java
package backend.service;

import backend.entity.User;
import backend.entity.Account;
import backend.entity.Transaction;
import backend.repository.UserRepository;
import backend.repository.AccountRepository;
import backend.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Autowired
    public UserService(
        UserRepository userRepository,
        AccountRepository accountRepository,
        TransactionRepository transactionRepository,
        EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.emailService = emailService;
    }

    // ==================== PROFILE MANAGEMENT ====================

    @Transactional
    public User updateProfile(Long userId, String firstName, String lastName, String email) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean emailChanged = false;
        String oldEmail = user.getEmail();

        // Update fields if provided
        if (firstName != null && !firstName.trim().isEmpty()) {
            user.setFirstName(firstName.trim());
        }
        
        if (lastName != null && !lastName.trim().isEmpty()) {
            user.setLastName(lastName.trim());
        }
        
        // Check if email is being changed
        if (email != null && !email.trim().isEmpty() && !email.equals(user.getEmail())) {
            // Validate email format
            if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                throw new IllegalArgumentException("Invalid email format");
            }
            
            // Check if email is already taken by another user
            Optional<User> existingUser = userRepository.findByEmail(email);
            if (existingUser.isPresent() && !existingUser.get().getId().equals(userId)) {
                throw new IllegalArgumentException("Email is already registered to another account");
            }
            
            // Mark that email changed
            emailChanged = true;
            user.setEmail(email.trim());
            
            // Reset email verification status
            user.setIsEmailVerified(false);
            
            // Generate new verification token
            String verificationToken = UUID.randomUUID().toString();
            user.setVerificationToken(verificationToken);
            
            // Send verification email to NEW email address
            String fullName = buildFullName(user.getFirstName(), user.getLastName());
            emailService.sendVerificationEmail(
                email.trim(), 
                fullName.isEmpty() ? user.getUsername() : fullName, 
                verificationToken
            );
        }
        
        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);
        
        // Log the email change for security
        if (emailChanged) {
            System.out.println("Email changed for user " + userId + " from " + oldEmail + " to " + email);
        }
        
        return savedUser;
    }

    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        // Validate new password
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters long");
        }

        // Check if new password is same as current
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("New password must be different from current password");
        }

        // Update password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(Long userId, String password) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Verify password before deletion
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Password is incorrect");
        }

        // Delete all user's transactions
        List<Transaction> transactions = transactionRepository.findByUserId(userId);
        transactionRepository.deleteAll(transactions);

        // Delete all user's accounts
        List<Account> accounts = accountRepository.findByUserId(userId);
        accountRepository.deleteAll(accounts);

        // Delete user
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> exportUserData(Long userId, String format) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Map<String, Object> data = new HashMap<>();
        
        // User profile data
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("email", user.getEmail());
        profile.put("firstName", user.getFirstName());
        profile.put("lastName", user.getLastName());
        profile.put("isEmailVerified", user.getIsEmailVerified());
        profile.put("createdAt", user.getCreatedAt());
        data.put("profile", profile);

        // Accounts data
        List<Account> accounts = accountRepository.findByUserId(userId);
        List<Map<String, Object>> accountsData = accounts.stream()
            .map(acc -> {
                Map<String, Object> accMap = new HashMap<>();
                accMap.put("id", acc.getId());
                accMap.put("name", acc.getName());
                accMap.put("type", acc.getType());
                accMap.put("balance", acc.getBalance());
                accMap.put("institution", acc.getInstitution());
                accMap.put("accountNumber", acc.getAccountNumber());
                accMap.put("createdAt", acc.getCreatedAt());
                return accMap;
            })
            .collect(Collectors.toList());
        data.put("accounts", accountsData);

        // Transactions data
        List<Transaction> transactions = transactionRepository.findByUserId(userId);
        List<Map<String, Object>> transactionsData = transactions.stream()
            .map(txn -> {
                Map<String, Object> txnMap = new HashMap<>();
                txnMap.put("id", txn.getId());
                txnMap.put("accountId", txn.getAccountId());
                txnMap.put("date", txn.getTransactionDate());
                txnMap.put("amount", txn.getAmount());
                txnMap.put("category", txn.getCategory());
                txnMap.put("type", txn.getType());
                txnMap.put("note", txn.getNote());
                txnMap.put("merchant", txn.getMerchant());
                txnMap.put("createdAt", txn.getCreatedAt());
                return txnMap;
            })
            .collect(Collectors.toList());
        data.put("transactions", transactionsData);

        // Add metadata
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("exportDate", LocalDateTime.now());
        metadata.put("format", format);
        metadata.put("totalAccounts", accounts.size());
        metadata.put("totalTransactions", transactions.size());
        data.put("metadata", metadata);

        return data;
    }

    // ==================== HELPER METHODS ====================

    private String buildFullName(String firstName, String lastName) {
        StringBuilder name = new StringBuilder();
        if (firstName != null && !firstName.trim().isEmpty()) {
            name.append(firstName.trim());
        }
        if (lastName != null && !lastName.trim().isEmpty()) {
            if (name.length() > 0) {
                name.append(" ");
            }
            name.append(lastName.trim());
        }
        return name.toString();
    }

    // ==================== LEGACY METHODS ====================

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public User updateUser(Long id, User updatedUser) {
        return userRepository.findById(id).map(user -> {
            user.setUsername(updatedUser.getUsername());
            user.setEmail(updatedUser.getEmail());
            user.setFirstName(updatedUser.getFirstName());
            user.setLastName(updatedUser.getLastName());
            user.setIsActive(updatedUser.getIsActive());
            user.setIsEmailVerified(updatedUser.getIsEmailVerified());
            user.setUpdatedAt(LocalDateTime.now());
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}