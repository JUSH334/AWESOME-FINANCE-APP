package backend.service;

import backend.entity.Account;
import backend.entity.Transaction;
import backend.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AccountService accountService;

    @InjectMocks
    private TransactionService transactionService;

    private Transaction testTransaction;
    private Account testAccount;

    @BeforeEach
    void setUp() {
        testAccount = new Account();
        testAccount.setId(1L);
        testAccount.setUserId(1L);
        testAccount.setBalance(new BigDecimal("1000.00"));

        testTransaction = new Transaction();
        testTransaction.setId(1L);
        testTransaction.setUserId(1L);
        testTransaction.setAccountId(1L);
        testTransaction.setAmount(new BigDecimal("50.00"));
        testTransaction.setCategory("Groceries");
        testTransaction.setType("out");
        testTransaction.setTransactionDate(LocalDate.now());
    }

    @Test
    void getUserTransactions_ShouldReturnTransactionsList() {
        // Given
        List<Transaction> transactions = Arrays.asList(testTransaction);
        when(transactionRepository.findByUserIdOrderByTransactionDateDesc(1L))
            .thenReturn(transactions);

        // When
        List<Transaction> result = transactionService.getUserTransactions(1L);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testTransaction);
        verify(transactionRepository).findByUserIdOrderByTransactionDateDesc(1L);
    }

    @Test
    void createTransaction_WithValidData_ShouldCreateTransaction() {
        // Given
        when(transactionRepository.save(any(Transaction.class))).thenReturn(testTransaction);
        when(accountService.getAccountById(1L, 1L)).thenReturn(testAccount);

        // When
        Transaction result = transactionService.createTransaction(
            1L,
            1L,
            LocalDate.now(),
            new BigDecimal("50.00"),
            "Groceries",
            "out",
            "Weekly shopping",
            "Walmart",
            true
        );

        // Then
        assertThat(result).isNotNull();
        verify(transactionRepository).save(any(Transaction.class));
        verify(accountService).updateBalance(eq(1L), eq(1L), any(BigDecimal.class));
    }

    @Test
    void createTransaction_WithInvalidType_ShouldThrowException() {
        // When/Then
        assertThatThrownBy(() -> transactionService.createTransaction(
            1L, 1L, LocalDate.now(), 
            new BigDecimal("50.00"), 
            "Groceries", 
            "invalid", 
            null, null, true
        ))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Invalid transaction type");
    }

    @Test
    void createTransaction_WithNegativeAmount_ShouldThrowException() {
        // When/Then
        assertThatThrownBy(() -> transactionService.createTransaction(
            1L, 1L, LocalDate.now(), 
            new BigDecimal("-50.00"), 
            "Groceries", 
            "out", 
            null, null, true
        ))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Amount must be greater than zero");
    }

    @Test
    void updateTransaction_WithValidData_ShouldUpdateTransaction() {
        // Given
        when(transactionRepository.findByIdAndUserId(1L, 1L))
            .thenReturn(Optional.of(testTransaction));
        when(transactionRepository.save(any(Transaction.class)))
            .thenReturn(testTransaction);

        // When
        Transaction result = transactionService.updateTransaction(
            1L, 1L, 1L, LocalDate.now(),
            new BigDecimal("75.00"),
            "Dining",
            "out",
            "Updated note",
            "Restaurant"
        );

        // Then
        assertThat(result).isNotNull();
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void deleteTransaction_WithValidId_ShouldDeleteTransaction() {
        // Given
        when(transactionRepository.findByIdAndUserId(1L, 1L))
            .thenReturn(Optional.of(testTransaction));

        // When
        transactionService.deleteTransaction(1L, 1L);

        // Then
        verify(transactionRepository).delete(testTransaction);
    }

    @Test
    void deleteTransaction_WithInvalidId_ShouldThrowException() {
        // Given
        when(transactionRepository.findByIdAndUserId(999L, 1L))
            .thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> transactionService.deleteTransaction(999L, 1L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Transaction not found");
    }

    @Test
    void searchTransactions_ShouldReturnMatchingTransactions() {
        // Given
        List<Transaction> transactions = Arrays.asList(testTransaction);
        when(transactionRepository.searchTransactions(1L, "Groceries"))
            .thenReturn(transactions);

        // When
        List<Transaction> result = transactionService.searchTransactions(1L, "Groceries");

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCategory()).isEqualTo("Groceries");
    }

    @Test
    void createBulkTransactions_ShouldCreateMultipleTransactions() {
        // Given
        Transaction txn1 = new Transaction();
        txn1.setAmount(new BigDecimal("100.00"));
        txn1.setCategory("Food");
        txn1.setType("out");
        txn1.setAccountId(1L);

        Transaction txn2 = new Transaction();
        txn2.setAmount(new BigDecimal("200.00"));
        txn2.setCategory("Gas");
        txn2.setType("out");
        txn2.setAccountId(1L);

        List<Transaction> transactions = Arrays.asList(txn1, txn2);

        when(transactionRepository.saveAll(anyList())).thenReturn(transactions);
        when(accountService.getAccountById(1L, 1L)).thenReturn(testAccount);

        // When
        List<Transaction> result = transactionService.createBulkTransactions(1L, transactions, true);

        // Then
        assertThat(result).hasSize(2);
        verify(transactionRepository).saveAll(anyList());
        verify(accountService, times(2)).updateBalance(anyLong(), anyLong(), any(BigDecimal.class));
    }
}