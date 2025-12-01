package backend.service;

import backend.entity.Account;
import backend.repository.AccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private AccountService accountService;

    private Account testAccount;

    @BeforeEach
    void setUp() {
        testAccount = new Account();
        testAccount.setId(1L);
        testAccount.setUserId(1L);
        testAccount.setName("Test Checking");
        testAccount.setType("checking");
        testAccount.setBalance(new BigDecimal("1000.00"));
        testAccount.setIsActive(true);
    }

    @Test
    void getUserAccounts_ShouldReturnActiveAccounts() {
        // Given
        List<Account> accounts = Arrays.asList(testAccount);
        when(accountRepository.findByUserIdAndIsActive(1L, true)).thenReturn(accounts);

        // When
        List<Account> result = accountService.getUserAccounts(1L);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Test Checking");
    }

    @Test
    void createAccount_WithValidData_ShouldCreateAccount() {
        // Given
        when(accountRepository.existsByUserIdAndName(1L, "New Savings")).thenReturn(false);
        when(accountRepository.save(any(Account.class))).thenReturn(testAccount);

        // When
        Account result = accountService.createAccount(
            1L,
            "New Savings",
            "savings",
            new BigDecimal("500.00"),
            "Test Bank",
            "123456"
        );

        // Then
        assertThat(result).isNotNull();
        verify(accountRepository).save(any(Account.class));
    }

    @Test
    void createAccount_WithDuplicateName_ShouldThrowException() {
        // Given
        when(accountRepository.existsByUserIdAndName(1L, "Existing Account")).thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> accountService.createAccount(
            1L, "Existing Account", "checking", BigDecimal.ZERO, null, null
        ))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("already exists");
    }

    @Test
    void createAccount_WithInvalidType_ShouldThrowException() {
        // When/Then
        assertThatThrownBy(() -> accountService.createAccount(
            1L, "Test", "invalid_type", BigDecimal.ZERO, null, null
        ))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Invalid account type");
    }

    @Test
    void updateAccount_WithValidData_ShouldUpdateAccount() {
        // Given
        when(accountRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(testAccount));
        when(accountRepository.save(any(Account.class))).thenReturn(testAccount);

        // When
        Account result = accountService.updateAccount(
            1L, 1L, "Updated Name", "savings", 
            new BigDecimal("1500.00"), "New Bank", "654321"
        );

        // Then
        assertThat(result).isNotNull();
        verify(accountRepository).save(any(Account.class));
    }

    @Test
    void deleteAccount_ShouldSetInactive() {
        // Given
        when(accountRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(testAccount));
        when(accountRepository.save(any(Account.class))).thenReturn(testAccount);

        // When
        accountService.deleteAccount(1L, 1L);

        // Then
        verify(accountRepository).save(argThat(account -> !account.getIsActive()));
    }

    @Test
    void updateBalance_ShouldUpdateAccountBalance() {
        // Given
        when(accountRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(testAccount));
        when(accountRepository.save(any(Account.class))).thenReturn(testAccount);

        // When
        accountService.updateBalance(1L, 1L, new BigDecimal("2000.00"));

        // Then
        verify(accountRepository).save(argThat(account -> 
            account.getBalance().compareTo(new BigDecimal("2000.00")) == 0
        ));
    }

    @Test
    void getAccountById_WithInvalidId_ShouldThrowException() {
        // Given
        when(accountRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> accountService.getAccountById(999L, 1L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Account not found");
    }
}