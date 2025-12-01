package backend.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import backend.entity.Budget;
import backend.entity.Transaction;
import backend.repository.BudgetRepository;
import backend.repository.TransactionRepository;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private BudgetService budgetService;

    private Budget testBudget;
    private Transaction testTransaction;

    @BeforeEach
    void setUp() {
        testBudget = new Budget();
        testBudget.setId(1L);
        testBudget.setUserId(1L);
        testBudget.setCategory("Groceries");
        testBudget.setAmount(new BigDecimal("500.00"));
        testBudget.setPeriodType("monthly");
        testBudget.setSpent(new BigDecimal("200.00"));
        testBudget.setIsActive(true);
        testBudget.setCreatedAt(LocalDateTime.now());
        testBudget.setUpdatedAt(LocalDateTime.now());

        testTransaction = new Transaction();
        testTransaction.setId(1L);
        testTransaction.setUserId(1L);
        testTransaction.setAmount(new BigDecimal("50.00"));
        testTransaction.setCategory("Groceries");
        testTransaction.setType("out");
        testTransaction.setTransactionDate(LocalDate.now());
    }

    @Test
    void getUserBudgets_ShouldReturnBudgetsWithCalculatedSpending() {
        List<Budget> budgets = Arrays.asList(testBudget);
        when(budgetRepository.findByUserIdAndIsActive(1L, true)).thenReturn(budgets);
        when(transactionRepository.findByUserIdAndTransactionDateBetween(
            eq(1L), any(LocalDate.class), any(LocalDate.class)
        )).thenReturn(Arrays.asList(testTransaction));

        List<Budget> result = budgetService.getUserBudgets(1L);

        assertThat(result).hasSize(1);
        verify(budgetRepository).findByUserIdAndIsActive(1L, true);
    }

    @Test
    void getUserBudgets_WithNoBudgets_ShouldReturnEmptyList() {
        when(budgetRepository.findByUserIdAndIsActive(1L, true)).thenReturn(Collections.emptyList());

        List<Budget> result = budgetService.getUserBudgets(1L);

        assertThat(result).isEmpty();
    }

    @Test
    void getUserBudgets_WithYearlyBudget_ShouldCalculateCorrectly() {
        testBudget.setPeriodType("yearly");
        when(budgetRepository.findByUserIdAndIsActive(1L, true)).thenReturn(Arrays.asList(testBudget));
        when(transactionRepository.findByUserIdAndTransactionDateBetween(
            eq(1L), any(LocalDate.class), any(LocalDate.class)
        )).thenReturn(Arrays.asList(testTransaction));

        List<Budget> result = budgetService.getUserBudgets(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPeriodType()).isEqualTo("yearly");
    }

    @Test
    void getBudgetById_WithValidId_ShouldReturnBudget() {
        when(budgetRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(testBudget));
        when(transactionRepository.findByUserIdAndTransactionDateBetween(
            eq(1L), any(LocalDate.class), any(LocalDate.class)
        )).thenReturn(Arrays.asList(testTransaction));

        Budget result = budgetService.getBudgetById(1L, 1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void getBudgetById_WithInvalidId_ShouldThrowException() {
        when(budgetRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> budgetService.getBudgetById(999L, 1L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Budget not found");
    }

    @Test
    void createBudget_WithValidData_ShouldCreateBudget() {
        when(budgetRepository.existsByUserIdAndCategoryAndIsActive(1L, "Groceries", true)).thenReturn(false);
        when(budgetRepository.save(any(Budget.class))).thenReturn(testBudget);
        when(transactionRepository.findByUserIdAndTransactionDateBetween(
            eq(1L), any(LocalDate.class), any(LocalDate.class)
        )).thenReturn(Collections.emptyList());

        Budget result = budgetService.createBudget(1L, "Groceries", new BigDecimal("500.00"), "monthly");

        assertThat(result).isNotNull();
        verify(budgetRepository, times(2)).save(any(Budget.class));
    }

    @Test
    void createBudget_WithExistingCategory_ShouldThrowException() {
        when(budgetRepository.existsByUserIdAndCategoryAndIsActive(1L, "Groceries", true)).thenReturn(true);

        assertThatThrownBy(() -> budgetService.createBudget(1L, "Groceries", new BigDecimal("500.00"), "monthly"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("already exists");
    }

    @Test
    void createBudget_WithInvalidPeriodType_ShouldThrowException() {
        assertThatThrownBy(() -> budgetService.createBudget(1L, "Groceries", new BigDecimal("500.00"), "invalid"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("must be 'monthly' or 'yearly'");
    }

    @Test
    void createBudget_WithNegativeAmount_ShouldThrowException() {
        assertThatThrownBy(() -> budgetService.createBudget(1L, "Groceries", new BigDecimal("-100"), "monthly"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("must be greater than zero");
    }

    @Test
    void createBudget_WithZeroAmount_ShouldThrowException() {
        assertThatThrownBy(() -> budgetService.createBudget(1L, "Groceries", BigDecimal.ZERO, "monthly"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("must be greater than zero");
    }

    @Test
    void createBudget_WithNullAmount_ShouldThrowException() {
        assertThatThrownBy(() -> budgetService.createBudget(1L, "Groceries", null, "monthly"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("must be greater than zero");
    }

    @Test
    void updateBudget_WithValidData_ShouldUpdateBudget() {
        when(budgetRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(testBudget));
        when(budgetRepository.save(any(Budget.class))).thenReturn(testBudget);
        when(transactionRepository.findByUserIdAndTransactionDateBetween(
            eq(1L), any(LocalDate.class), any(LocalDate.class)
        )).thenReturn(Collections.emptyList());

        Budget result = budgetService.updateBudget(1L, 1L, "Food", new BigDecimal("600.00"), "yearly");

        assertThat(result).isNotNull();
        verify(budgetRepository).save(any(Budget.class));
    }

    @Test
    void updateBudget_WithDuplicateCategory_ShouldThrowException() {
        when(budgetRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(testBudget));
        when(budgetRepository.existsByUserIdAndCategoryAndIsActive(1L, "Dining", true)).thenReturn(true);
        when(transactionRepository.findByUserIdAndTransactionDateBetween(
            eq(1L), any(LocalDate.class), any(LocalDate.class)
        )).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> budgetService.updateBudget(1L, 1L, "Dining", new BigDecimal("600"), "monthly"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("already exists");
    }

    @Test
    void updateBudget_WithInvalidPeriodType_ShouldThrowException() {
        when(budgetRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(testBudget));
        when(transactionRepository.findByUserIdAndTransactionDateBetween(
            eq(1L), any(LocalDate.class), any(LocalDate.class)
        )).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> budgetService.updateBudget(1L, 1L, null, null, "invalid"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("must be 'monthly' or 'yearly'");
    }

    @Test
    void deleteBudget_WithValidId_ShouldDeleteBudget() {
        when(budgetRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(testBudget));
        when(transactionRepository.findByUserIdAndTransactionDateBetween(
            eq(1L), any(LocalDate.class), any(LocalDate.class)
        )).thenReturn(Collections.emptyList());
        doNothing().when(budgetRepository).delete(testBudget);

        budgetService.deleteBudget(1L, 1L);

        verify(budgetRepository).delete(testBudget);
    }

    @Test
    void deleteBudget_WithInvalidId_ShouldThrowException() {
        // Only this is required
        when(budgetRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> budgetService.deleteBudget(999L, 1L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Budget not found");

        // No transactionRepository stubbing here!
    }



    @Test
    void recalculateAllBudgets_WithActiveBudgets_ShouldRecalculateAll() {
        List<Budget> budgets = Arrays.asList(testBudget);
        when(budgetRepository.findByUserIdAndIsActive(1L, true)).thenReturn(budgets);
        when(transactionRepository.findByUserIdAndTransactionDateBetween(
            eq(1L), any(LocalDate.class), any(LocalDate.class)
        )).thenReturn(Arrays.asList(testTransaction));
        when(budgetRepository.saveAll(anyList())).thenReturn(budgets);

        budgetService.recalculateAllBudgets(1L);

        verify(budgetRepository).saveAll(anyList());
    }

    @Test
    void recalculateAllBudgets_WithNoBudgets_ShouldDoNothing() {
        when(budgetRepository.findByUserIdAndIsActive(1L, true)).thenReturn(Collections.emptyList());

        budgetService.recalculateAllBudgets(1L);

        verify(budgetRepository, never()).saveAll(anyList());
    }
}