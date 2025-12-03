// backend/src/main/java/backend/controller/DataEntryController.java
package backend.controller;

import backend.entity.Account;
import backend.entity.Transaction;
import backend.service.AccountService;
import backend.service.TransactionService;
import backend.service.PDFParserService;
import backend.service.PDFParserService.ParsedStatement;
import backend.service.PDFParserService.ParsedTransaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/data")
@CrossOrigin(origins = "*")
public class DataEntryController {

    @Autowired
    private AccountService accountService;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private PDFParserService pdfParserService;

    // ==================== ACCOUNT ENDPOINTS ====================

    @GetMapping("/accounts")
    public ResponseEntity<?> getAccounts(Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            List<Account> accounts = accountService.getUserAccounts(userId);
            return ResponseEntity.ok(accounts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/accounts")
    public ResponseEntity<?> createAccount(@RequestBody AccountRequest request, Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            
            Account account = accountService.createAccount(
                userId,
                request.name,
                request.type,
                request.balance,
                request.institution,
                request.accountNumber
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(account);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/accounts/{id}")
    public ResponseEntity<?> updateAccount(
        @PathVariable Long id,
        @RequestBody AccountRequest request,
        Authentication auth
    ) {
        try {
            Long userId = getUserIdFromAuth(auth);
            
            Account account = accountService.updateAccount(
                id,
                userId,
                request.name,
                request.type,
                request.balance,
                request.institution,
                request.accountNumber
            );
            
            return ResponseEntity.ok(account);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/accounts/{id}")
    public ResponseEntity<?> deleteAccount(@PathVariable Long id, Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            accountService.deleteAccount(id, userId);
            return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== TRANSACTION ENDPOINTS ====================

    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(
        @RequestParam(required = false) Long accountId,
        @RequestParam(required = false) String search,
        Authentication auth
    ) {
        try {
            Long userId = getUserIdFromAuth(auth);
            List<Transaction> transactions;
            
            if (search != null && !search.trim().isEmpty()) {
                transactions = transactionService.searchTransactions(userId, search);
            } else if (accountId != null) {
                transactions = transactionService.getAccountTransactions(userId, accountId);
            } else {
                transactions = transactionService.getUserTransactions(userId);
            }
            
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/transactions")
    public ResponseEntity<?> createTransaction(@RequestBody TransactionRequest request, Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            
            Transaction transaction = transactionService.createTransaction(
                userId,
                request.accountId,
                request.transactionDate,
                request.amount,
                request.category,
                request.type,
                request.note,
                request.merchant,
                request.updateBalance != null ? request.updateBalance : true
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/transactions/{id}")
    public ResponseEntity<?> updateTransaction(
        @PathVariable Long id,
        @RequestBody TransactionRequest request,
        Authentication auth
    ) {
        try {
            Long userId = getUserIdFromAuth(auth);
            
            Transaction transaction = transactionService.updateTransaction(
                id,
                userId,
                request.accountId,
                request.transactionDate,
                request.amount,
                request.category,
                request.type,
                request.note,
                request.merchant
            );
            
            return ResponseEntity.ok(transaction);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/transactions/{id}")
public ResponseEntity<?> deleteTransaction(@PathVariable Long id, Authentication auth) {
    try {
        Long userId = getUserIdFromAuth(auth);
        
        // Get the transaction first to revert balance
        Transaction transaction = transactionService.getTransactionById(id, userId);
        
        // Revert balance change if transaction has an account
        if (transaction.getAccountId() != null) {
            Account account = accountService.getAccountById(transaction.getAccountId(), userId);
            BigDecimal currentBalance = account.getBalance();
            BigDecimal newBalance;
            
            // Reverse the transaction effect
            if ("in".equals(transaction.getType())) {
                // Was income, subtract it
                newBalance = currentBalance.subtract(transaction.getAmount());
            } else {
                // Was expense, add it back
                newBalance = currentBalance.add(transaction.getAmount());
            }
            
            accountService.updateBalance(transaction.getAccountId(), userId, newBalance);
        }
        
        transactionService.deleteTransaction(id, userId);
        return ResponseEntity.ok(Map.of("message", "Transaction deleted successfully"));
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", e.getMessage()));
    }
}

@DeleteMapping("/transactions/bulk")
public ResponseEntity<?> bulkDeleteTransactions(
    @RequestBody Map<String, List<Integer>> request,  // Changed from List<Long> to List<Integer>
    Authentication auth
) {
    try {
        Long userId = getUserIdFromAuth(auth);
        List<Integer> transactionIdsInt = request.get("transactionIds");
        
        if (transactionIdsInt == null || transactionIdsInt.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "No transaction IDs provided"));
        }
        
        // Convert Integer list to Long list
        List<Long> transactionIds = transactionIdsInt.stream()
            .map(Integer::longValue)
            .collect(java.util.stream.Collectors.toList());
        
        transactionService.deleteTransactions(transactionIds, userId);
        
        return ResponseEntity.ok(Map.of(
            "message", "Transactions deleted successfully",
            "count", transactionIds.size()
        ));
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", e.getMessage()));
    }
}


    // ==================== PDF UPLOAD ENDPOINT ====================

@PostMapping("/upload-statement")
public ResponseEntity<?> uploadStatement(
    @RequestParam("file") MultipartFile file,
    @RequestParam(required = false) Long accountId,
    Authentication auth
) {
    try {
        Long userId = getUserIdFromAuth(auth);
        
        // Parse the PDF
        ParsedStatement parsedStatement = pdfParserService.parseStatement(file);
        
        // Filter out transactions with null dates and convert to Transaction entities
        List<Transaction> validTransactions = parsedStatement.transactions.stream()
            .filter(pt -> pt.date != null) // Only keep transactions with valid dates
            .map(pt -> {
                Transaction t = new Transaction();
                t.setTransactionDate(pt.date);
                t.setAmount(pt.amount);
                t.setCategory(pt.category);
                t.setType(pt.type);
                t.setNote(pt.description);
                t.setMerchant(pt.merchant);
                t.setAccountId(accountId);
                return t;
            })
            .collect(Collectors.toList());
        
        // Create response with parsed data
        Map<String, Object> response = new HashMap<>();
        response.put("accountName", parsedStatement.accountName);
        response.put("accountNumber", parsedStatement.accountNumber);
        response.put("openingBalance", parsedStatement.openingBalance);
        response.put("closingBalance", parsedStatement.closingBalance);
        response.put("statementDate", parsedStatement.statementDate);
        response.put("transactionCount", validTransactions.size());
        response.put("transactions", validTransactions);
        
        // Add warning if some transactions were filtered out
        int filteredCount = parsedStatement.transactions.size() - validTransactions.size();
        if (filteredCount > 0) {
            response.put("warning", filteredCount + " transaction(s) had invalid dates and were excluded");
        }
        
        return ResponseEntity.ok(response);
    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", "Failed to parse statement: " + e.getMessage()));
    }
}

    @PostMapping("/import-transactions")
    public ResponseEntity<?> importTransactions(
        @RequestBody ImportRequest request,
        Authentication auth
    ) {
        try {
            Long userId = getUserIdFromAuth(auth);
            
            List<Transaction> saved = transactionService.createBulkTransactions(
                userId,
                request.transactions,
                request.updateBalance != null ? request.updateBalance : true
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Transactions imported successfully",
                "count", saved.size(),
                "transactions", saved
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== HELPER METHODS ====================

    private Long getUserIdFromAuth(Authentication auth) {
        if (auth == null) {
            throw new IllegalArgumentException("User not authenticated");
        }
        
        Map<String, Object> details = (Map<String, Object>) auth.getDetails();
        Object userIdObj = details.get("userId");
        
        if (userIdObj == null) {
            throw new IllegalArgumentException("User ID not found in authentication");
        }
        
        return Long.parseLong(userIdObj.toString());
    }

    // ==================== REQUEST DTOs ====================

    public static class AccountRequest {
        public String name;
        public String type;
        public BigDecimal balance;
        public String institution;
        public String accountNumber;
    }

    public static class TransactionRequest {
        public Long accountId;
        public LocalDate transactionDate;
        public BigDecimal amount;
        public String category;
        public String type;
        public String note;
        public String merchant;
        public Boolean updateBalance;
    }

    public static class ImportRequest {
        public List<Transaction> transactions;
        public Boolean updateBalance;
    }
}