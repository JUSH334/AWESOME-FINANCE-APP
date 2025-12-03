// backend/src/main/java/backend/service/TransactionService.java
package backend.service;

import backend.entity.Transaction;
import backend.entity.Account;
import backend.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountService accountService;

    @Autowired
    public TransactionService(TransactionRepository transactionRepository, AccountService accountService) {
        this.transactionRepository = transactionRepository;
        this.accountService = accountService;
    }

    public List<Transaction> getUserTransactions(Long userId) {
        return transactionRepository.findByUserIdOrderByTransactionDateDesc(userId);
    }

    public List<Transaction> getAccountTransactions(Long userId, Long accountId) {
        return transactionRepository.findByUserIdAndAccountId(userId, accountId);
    }

    public List<Transaction> searchTransactions(Long userId, String searchTerm) {
        return transactionRepository.searchTransactions(userId, searchTerm);
    }

    public Transaction getTransactionById(Long transactionId, Long userId) {
        return transactionRepository.findByIdAndUserId(transactionId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));
    }

    @Transactional
    public Transaction createTransaction(
        Long userId, 
        Long accountId, 
        LocalDate transactionDate, 
        BigDecimal amount, 
        String category, 
        String type, 
        String note, 
        String merchant,
        boolean updateBalance
    ) {
        // Validate transaction type
        if (!List.of("in", "out").contains(type.toLowerCase())) {
            throw new IllegalArgumentException("Invalid transaction type. Must be 'in' or 'out'");
        }

        // Validate amount
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }

        Transaction transaction = new Transaction();
        transaction.setUserId(userId);
        transaction.setAccountId(accountId);
        transaction.setTransactionDate(transactionDate != null ? transactionDate : LocalDate.now());
        transaction.setAmount(amount);
        transaction.setCategory(category);
        transaction.setType(type.toLowerCase());
        transaction.setNote(note);
        transaction.setMerchant(merchant);
        transaction.setCreatedAt(LocalDateTime.now());
        transaction.setUpdatedAt(LocalDateTime.now());

        Transaction saved = transactionRepository.save(transaction);

        // Update account balance if requested
        if (updateBalance && accountId != null) {
            updateAccountBalance(accountId, userId, amount, type);
        }

        return saved;
    }

    @Transactional
    public Transaction updateTransaction(
        Long transactionId, 
        Long userId, 
        Long accountId, 
        LocalDate transactionDate, 
        BigDecimal amount, 
        String category, 
        String type, 
        String note, 
        String merchant
    ) {
        Transaction transaction = getTransactionById(transactionId, userId);

        if (accountId != null) {
            transaction.setAccountId(accountId);
        }
        if (transactionDate != null) {
            transaction.setTransactionDate(transactionDate);
        }
        if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
            transaction.setAmount(amount);
        }
        if (category != null && !category.trim().isEmpty()) {
            transaction.setCategory(category);
        }
        if (type != null && !type.trim().isEmpty()) {
            if (!List.of("in", "out").contains(type.toLowerCase())) {
                throw new IllegalArgumentException("Invalid transaction type");
            }
            transaction.setType(type.toLowerCase());
        }
        if (note != null) {
            transaction.setNote(note);
        }
        if (merchant != null) {
            transaction.setMerchant(merchant);
        }
        transaction.setUpdatedAt(LocalDateTime.now());

        return transactionRepository.save(transaction);
    }

@Transactional
public void deleteTransaction(Long transactionId, Long userId) {
    Transaction transaction = getTransactionById(transactionId, userId);
    
    // FIXED: Reverse the balance change before deleting
    if (transaction.getAccountId() != null) {
        // Reverse the original transaction's effect on the account balance
        // If it was income ("in"), subtract it; if expense ("out"), add it back
        String reverseType = transaction.getType().equals("in") ? "out" : "in";
        updateAccountBalance(
            transaction.getAccountId(), 
            userId, 
            transaction.getAmount(), 
            reverseType
        );
    }
    
    transactionRepository.delete(transaction);
}

@Transactional
public void deleteTransactions(List<Long> transactionIds, Long userId) {
    if (transactionIds == null || transactionIds.isEmpty()) {
        throw new IllegalArgumentException("Transaction IDs cannot be empty");
    }

    // Fetch all transactions to be deleted
    List<Transaction> transactionsToDelete = new java.util.ArrayList<>();
    for (Long id : transactionIds) {
        Transaction transaction = getTransactionById(id, userId);
        transactionsToDelete.add(transaction);
    }

    // Group transactions by account for efficient balance updates
    Map<Long, BigDecimal> accountBalanceChanges = new HashMap<>();
    
    for (Transaction transaction : transactionsToDelete) {
        if (transaction.getAccountId() != null) {
            Long accountId = transaction.getAccountId();
            BigDecimal currentChange = accountBalanceChanges.getOrDefault(accountId, BigDecimal.ZERO);
            
            // Reverse the transaction effect on balance
            // If it was income (in), we subtract it
            // If it was expense (out), we add it back
            if ("in".equals(transaction.getType().toLowerCase())) {
                currentChange = currentChange.subtract(transaction.getAmount());
            } else {
                currentChange = currentChange.add(transaction.getAmount());
            }
            
            accountBalanceChanges.put(accountId, currentChange);
        }
    }

    // Apply balance changes to all affected accounts
    for (Map.Entry<Long, BigDecimal> entry : accountBalanceChanges.entrySet()) {
        Long accountId = entry.getKey();
        BigDecimal balanceChange = entry.getValue();
        
        if (balanceChange.compareTo(BigDecimal.ZERO) != 0) {
            Account account = accountService.getAccountById(accountId, userId);
            BigDecimal newBalance = account.getBalance().add(balanceChange);
            accountService.updateBalance(accountId, userId, newBalance);
        }
    }

    // Delete all transactions
    transactionRepository.deleteAll(transactionsToDelete);
}

    @Transactional
    public List<Transaction> createBulkTransactions(Long userId, List<Transaction> transactions, boolean updateBalance) {
        for (Transaction transaction : transactions) {
            transaction.setUserId(userId);
            transaction.setCreatedAt(LocalDateTime.now());
            transaction.setUpdatedAt(LocalDateTime.now());
        }

        List<Transaction> saved = transactionRepository.saveAll(transactions);

        // Update account balances if requested
        if (updateBalance) {
            for (Transaction transaction : saved) {
                if (transaction.getAccountId() != null) {
                    updateAccountBalance(
                        transaction.getAccountId(), 
                        userId, 
                        transaction.getAmount(), 
                        transaction.getType()
                    );
                }
            }
        }

        return saved;
    }

    private void updateAccountBalance(Long accountId, Long userId, BigDecimal amount, String type) {
        Account account = accountService.getAccountById(accountId, userId);
        BigDecimal currentBalance = account.getBalance();
        BigDecimal newBalance;

        if ("in".equals(type.toLowerCase())) {
            newBalance = currentBalance.add(amount);
        } else {
            newBalance = currentBalance.subtract(amount);
        }

        accountService.updateBalance(accountId, userId, newBalance);
    }
}