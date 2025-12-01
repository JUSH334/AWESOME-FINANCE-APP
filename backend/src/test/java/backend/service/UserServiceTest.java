package backend.service;

import backend.entity.User;
import backend.entity.Account;
import backend.entity.Transaction;
import backend.repository.UserRepository;
import backend.repository.AccountRepository;
import backend.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserService userService;

    private BCryptPasswordEncoder passwordEncoder;
    private User testUser;
    private Account testAccount;
    private Transaction testTransaction;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder(4);
        
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@test.com");
        testUser.setPasswordHash(passwordEncoder.encode("password123"));
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setIsActive(true);
        testUser.setIsEmailVerified(true);
        testUser.setSavingsGoal(new BigDecimal("10000.00"));
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());

        testAccount = new Account();
        testAccount.setId(1L);
        testAccount.setUserId(1L);
        testAccount.setName("Checking");
        testAccount.setBalance(new BigDecimal("1000.00"));

        testTransaction = new Transaction();
        testTransaction.setId(1L);
        testTransaction.setUserId(1L);
        testTransaction.setAmount(new BigDecimal("2000.00"));
        testTransaction.setType("in");
        testTransaction.setTransactionDate(LocalDate.now().minusDays(15));
    }

    // ==================== UPDATE PROFILE TESTS ====================

    @Test
    void updateProfile_WithValidData_ShouldUpdateProfile() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        User result = userService.updateProfile(1L, "NewFirst", "NewLast", null);

        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateProfile_WithNewEmail_ShouldSendVerification() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.findByEmail("newemail@test.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        doNothing().when(emailService).sendVerificationEmail(anyString(), anyString(), anyString());

        User result = userService.updateProfile(1L, null, null, "newemail@test.com");

        assertThat(result).isNotNull();
        verify(emailService).sendVerificationEmail(anyString(), anyString(), anyString());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateProfile_WithInvalidEmail_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> userService.updateProfile(1L, null, null, "invalidemail"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid email format");
    }

    @Test
    void updateProfile_WithDuplicateEmail_ShouldThrowException() {
        User otherUser = new User();
        otherUser.setId(2L);
        otherUser.setEmail("existing@test.com");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.findByEmail("existing@test.com")).thenReturn(Optional.of(otherUser));

        assertThatThrownBy(() -> userService.updateProfile(1L, null, null, "existing@test.com"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("already registered");
    }

    @Test
    void updateProfile_WithNonExistentUser_ShouldThrowException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateProfile(999L, "First", "Last", null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("User not found");
    }

    @Test
    void updateProfile_WithEmptyStrings_ShouldNotUpdate() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        User result = userService.updateProfile(1L, "  ", "  ", null);

        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    // ==================== CHANGE PASSWORD TESTS ====================

    @Test
    void changePassword_WithValidPassword_ShouldChangePassword() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.changePassword(1L, "password123", "newpassword123");

        verify(userRepository).save(any(User.class));
    }

    @Test
    void changePassword_WithIncorrectCurrentPassword_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> userService.changePassword(1L, "wrongpassword", "newpassword123"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Current password is incorrect");
    }

    @Test
    void changePassword_WithShortNewPassword_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> userService.changePassword(1L, "password123", "short"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("at least 8 characters");
    }

    @Test
    void changePassword_WithSamePassword_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> userService.changePassword(1L, "password123", "password123"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("must be different");
    }

    @Test
    void changePassword_WithNonExistentUser_ShouldThrowException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.changePassword(999L, "password123", "newpassword123"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("User not found");
    }

    // ==================== DELETE ACCOUNT TESTS ====================

    @Test
    void deleteAccount_WithValidPassword_ShouldDeleteAccount() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(transactionRepository.findByUserId(1L)).thenReturn(Arrays.asList(testTransaction));
        when(accountRepository.findByUserId(1L)).thenReturn(Arrays.asList(testAccount));
        doNothing().when(transactionRepository).deleteAll(anyList());
        doNothing().when(accountRepository).deleteAll(anyList());
        doNothing().when(userRepository).delete(testUser);

        userService.deleteAccount(1L, "password123");

        verify(transactionRepository).deleteAll(anyList());
        verify(accountRepository).deleteAll(anyList());
        verify(userRepository).delete(testUser);
    }

    @Test
    void deleteAccount_WithIncorrectPassword_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> userService.deleteAccount(1L, "wrongpassword"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Password is incorrect");
    }

    @Test
    void deleteAccount_WithNonExistentUser_ShouldThrowException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteAccount(999L, "password123"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("User not found");
    }

    // ==================== FINANCIAL GOALS TESTS ====================

    @Test
    void updateFinancialGoals_WithValidGoal_ShouldUpdateGoal() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        User result = userService.updateFinancialGoals(1L, new BigDecimal("15000.00"));

        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateFinancialGoals_WithNegativeGoal_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> userService.updateFinancialGoals(1L, new BigDecimal("-1000")))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("cannot be negative");
    }

    @Test
    void updateFinancialGoals_WithNullGoal_ShouldNotUpdate() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        User result = userService.updateFinancialGoals(1L, null);

        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateFinancialGoals_WithNonExistentUser_ShouldThrowException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateFinancialGoals(999L, new BigDecimal("10000")))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("User not found");
    }

    @Test
    void getFinancialGoals_ShouldReturnGoalsAndIncome() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(transactionRepository.findByUserIdAndTransactionDateBetween(
            eq(1L), any(LocalDate.class), any(LocalDate.class)
        )).thenReturn(Arrays.asList(testTransaction));

        Map<String, Object> result = userService.getFinancialGoals(1L);

        assertThat(result).containsKeys("savingsGoal", "monthlyIncome");
        assertThat(result.get("savingsGoal")).isEqualTo(new BigDecimal("10000.00"));
    }

    @Test
    void getFinancialGoals_WithNoIncome_ShouldReturnZeroIncome() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(transactionRepository.findByUserIdAndTransactionDateBetween(
            eq(1L), any(LocalDate.class), any(LocalDate.class)
        )).thenReturn(Collections.emptyList());

        Map<String, Object> result = userService.getFinancialGoals(1L);

        assertThat(result.get("monthlyIncome")).isEqualTo(BigDecimal.ZERO);
    }

    @Test
    void getFinancialGoals_WithNullSavingsGoal_ShouldReturnZero() {
        testUser.setSavingsGoal(null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(transactionRepository.findByUserIdAndTransactionDateBetween(
            eq(1L), any(LocalDate.class), any(LocalDate.class)
        )).thenReturn(Collections.emptyList());

        Map<String, Object> result = userService.getFinancialGoals(1L);

        assertThat(result.get("savingsGoal")).isEqualTo(BigDecimal.ZERO);
    }

    // ==================== EXPORT DATA TESTS ====================

    @Test
    void exportUserData_ShouldReturnCompleteData() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(accountRepository.findByUserId(1L)).thenReturn(Arrays.asList(testAccount));
        when(transactionRepository.findByUserId(1L)).thenReturn(Arrays.asList(testTransaction));

        Map<String, Object> result = userService.exportUserData(1L, "json");

        assertThat(result).containsKeys("profile", "accounts", "transactions", "metadata");
        assertThat(result.get("accounts")).isInstanceOf(List.class);
        assertThat(result.get("transactions")).isInstanceOf(List.class);
    }

    @Test
    void exportUserData_WithNoData_ShouldReturnEmptyCollections() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(accountRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(transactionRepository.findByUserId(1L)).thenReturn(Collections.emptyList());

        Map<String, Object> result = userService.exportUserData(1L, "csv");

        assertThat(result).containsKeys("profile", "accounts", "transactions");
        List<?> accounts = (List<?>) result.get("accounts");
        List<?> transactions = (List<?>) result.get("transactions");
        assertThat(accounts).isEmpty();
        assertThat(transactions).isEmpty();
    }

    @Test
    void exportUserData_WithNonExistentUser_ShouldThrowException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.exportUserData(999L, "json"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("User not found");
    }

    // ==================== LEGACY METHODS TESTS ====================

    @Test
    void getAllUsers_ShouldReturnAllUsers() {
        when(userRepository.findAll()).thenReturn(Arrays.asList(testUser));

        List<User> result = userService.getAllUsers();

        assertThat(result).hasSize(1);
        verify(userRepository).findAll();
    }

    @Test
    void getUserById_WithValidId_ShouldReturnUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        Optional<User> result = userService.getUserById(1L);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(1L);
    }

    @Test
    void getUserById_WithInvalidId_ShouldReturnEmpty() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        Optional<User> result = userService.getUserById(999L);

        assertThat(result).isEmpty();
    }

    @Test
    void createUser_ShouldSaveUser() {
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        User result = userService.createUser(testUser);

        assertThat(result).isNotNull();
        verify(userRepository).save(testUser);
    }

    @Test
    void updateUser_WithValidData_ShouldUpdateUser() {
        User updatedUser = new User();
        updatedUser.setUsername("newusername");
        updatedUser.setEmail("newemail@test.com");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        User result = userService.updateUser(1L, updatedUser);

        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUser_WithInvalidId_ShouldThrowException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateUser(999L, testUser))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("User not found");
    }

    @Test
    void deleteUser_ShouldDeleteUser() {
        doNothing().when(userRepository).deleteById(1L);

        userService.deleteUser(1L);

        verify(userRepository).deleteById(1L);
    }
}