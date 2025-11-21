package backend.service;

import backend.entity.Budget;
import backend.entity.Transaction;
import backend.repository.BudgetRepository;
import backend.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;

    @Autowired
    public BudgetService(BudgetRepository budgetRepository, TransactionRepository transactionRepository) {
        this.budgetRepository = budgetRepository;
        this.transactionRepository = transactionRepository;
    }

    public List<Budget> getUserBudgets(Long userId) {
        List<Budget> budgets = budgetRepository.findByUserIdAndIsActive(userId, true);
        
        // Single query: fetch all transactions for all budgets at once
        LocalDate startDate = calculateStartDate(budgets);
        LocalDate endDate = LocalDate.now();
        
        // Get all transactions in the date range with a single query
        List<Transaction> allTransactions = transactionRepository
            .findByUserIdAndTransactionDateBetween(userId, startDate, endDate);
        
        // Calculate spending in memory instead of querying per budget
        Map<String, BigDecimal> categorySpending = calculateCategorySpending(allTransactions, budgets);
        
        // Update budgets with calculated spending
        for (Budget budget : budgets) {
            BigDecimal spent = categorySpending.getOrDefault(budget.getCategory(), BigDecimal.ZERO);
            budget.setSpent(spent);
            budget.setUpdatedAt(LocalDateTime.now());
        }
        
        return budgets;
    }

    public Budget getBudgetById(Long budgetId, Long userId) {
        Budget budget = budgetRepository.findByIdAndUserId(budgetId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Budget not found"));
        
        // Single query: fetch transactions for this budget's period
        LocalDate startDate = getStartDateForBudget(budget);
        LocalDate endDate = LocalDate.now();
        
        List<Transaction> transactions = transactionRepository
            .findByUserIdAndTransactionDateBetween(userId, startDate, endDate);
        
        // Calculate spending in memory
        BigDecimal totalSpent = transactions.stream()
            .filter(t -> "out".equals(t.getType()))
            .filter(t -> budget.getCategory().equalsIgnoreCase(t.getCategory()))
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        budget.setSpent(totalSpent);
        budget.setUpdatedAt(LocalDateTime.now());
        
        return budget;
    }

    @Transactional
    public Budget createBudget(Long userId, String category, BigDecimal amount, String periodType) {
        // Validate period type
        if (!List.of("monthly", "yearly").contains(periodType.toLowerCase())) {
            throw new IllegalArgumentException("Period type must be 'monthly' or 'yearly'");
        }

        // Check if budget already exists for this category
        if (budgetRepository.existsByUserIdAndCategoryAndIsActive(userId, category, true)) {
            throw new IllegalArgumentException("Budget already exists for category: " + category);
        }

        // Validate amount
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Budget amount must be greater than zero");
        }

        Budget budget = new Budget();
        budget.setUserId(userId);
        budget.setCategory(category);
        budget.setAmount(amount);
        budget.setPeriodType(periodType.toLowerCase());
        budget.setSpent(BigDecimal.ZERO);
        budget.setIsActive(true);
        budget.setCreatedAt(LocalDateTime.now());
        budget.setUpdatedAt(LocalDateTime.now());

        Budget saved = budgetRepository.save(budget);
        
        // Single query to calculate initial spending
        LocalDate startDate = getStartDateForBudget(saved);
        LocalDate endDate = LocalDate.now();
        
        List<Transaction> transactions = transactionRepository
            .findByUserIdAndTransactionDateBetween(userId, startDate, endDate);
        
        BigDecimal totalSpent = transactions.stream()
            .filter(t -> "out".equals(t.getType()))
            .filter(t -> category.equalsIgnoreCase(t.getCategory()))
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        saved.setSpent(totalSpent);
        budgetRepository.save(saved);
        
        return saved;
    }

    @Transactional
    public Budget updateBudget(Long budgetId, Long userId, String category, BigDecimal amount, String periodType) {
        Budget budget = getBudgetById(budgetId, userId);

        if (category != null && !category.trim().isEmpty()) {
            // Check if changing to a category that already exists
            if (!budget.getCategory().equals(category)) {
                if (budgetRepository.existsByUserIdAndCategoryAndIsActive(userId, category, true)) {
                    throw new IllegalArgumentException("Budget already exists for category: " + category);
                }
            }
            budget.setCategory(category);
        }

        if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
            budget.setAmount(amount);
        }

        if (periodType != null && !periodType.trim().isEmpty()) {
            if (!List.of("monthly", "yearly").contains(periodType.toLowerCase())) {
                throw new IllegalArgumentException("Period type must be 'monthly' or 'yearly'");
            }
            budget.setPeriodType(periodType.toLowerCase());
        }

        budget.setUpdatedAt(LocalDateTime.now());
        return budgetRepository.save(budget);
    }

    @Transactional
    public void deleteBudget(Long budgetId, Long userId) {
        Budget budget = getBudgetById(budgetId, userId);
        budget.setIsActive(false);
        budget.setUpdatedAt(LocalDateTime.now());
        budgetRepository.save(budget);
    }

    @Transactional
    public void recalculateAllBudgets(Long userId) {
        List<Budget> budgets = budgetRepository.findByUserIdAndIsActive(userId, true);
        
        if (budgets.isEmpty()) {
            return;
        }

        // Single query: fetch all transactions once
        LocalDate startDate = calculateStartDate(budgets);
        LocalDate endDate = LocalDate.now();
        
        List<Transaction> allTransactions = transactionRepository
            .findByUserIdAndTransactionDateBetween(userId, startDate, endDate);
        
        // Calculate spending by category in memory
        Map<String, BigDecimal> categorySpending = calculateCategorySpending(allTransactions, budgets);
        
        // Update all budgets in memory, then save
        for (Budget budget : budgets) {
            BigDecimal spent = categorySpending.getOrDefault(budget.getCategory(), BigDecimal.ZERO);
            budget.setSpent(spent);
            budget.setUpdatedAt(LocalDateTime.now());
        }
        
        // Single batch save
        budgetRepository.saveAll(budgets);
    }

    /**
     * Calculate spending for all categories at once
     */
    private Map<String, BigDecimal> calculateCategorySpending(List<Transaction> transactions, List<Budget> budgets) {
        Map<String, BigDecimal> categorySpending = new HashMap<>();
        
        // Initialize all budget categories
        for (Budget budget : budgets) {
            categorySpending.put(budget.getCategory(), BigDecimal.ZERO);
        }
        
        // Sum up spending by category
        for (Transaction transaction : transactions) {
            if ("out".equals(transaction.getType())) {
                String category = transaction.getCategory();
                BigDecimal amount = transaction.getAmount();
                
                categorySpending.put(
                    category,
                    categorySpending.getOrDefault(category, BigDecimal.ZERO).add(amount)
                );
            }
        }
        
        return categorySpending;
    }

    /**
     * Determine the start date based on budget period type and current date
     */
    private LocalDate getStartDateForBudget(Budget budget) {
        if ("monthly".equals(budget.getPeriodType())) {
            // Current month
            YearMonth currentMonth = YearMonth.now();
            return currentMonth.atDay(1);
        } else {
            // Current year
            return LocalDate.now().withDayOfYear(1);
        }
    }

    /**
     * Calculate the earliest start date needed for all budgets
     * (in case they have different period types)
     */
    private LocalDate calculateStartDate(List<Budget> budgets) {
        LocalDate earliest = LocalDate.now();

        for (Budget budget : budgets) {
            LocalDate budgetStart = getStartDateForBudget(budget);
            if (budgetStart.isBefore(earliest)) {
                earliest = budgetStart;
            }
        }

        return earliest;
    }
}