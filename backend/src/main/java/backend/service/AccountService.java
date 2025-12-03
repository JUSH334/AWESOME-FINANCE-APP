// backend/src/main/java/backend/service/AccountService.java
package backend.service;

import backend.entity.Account;
import backend.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AccountService {

    private final AccountRepository accountRepository;

    @Autowired
    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public List<Account> getUserAccounts(Long userId) {
        return accountRepository.findByUserIdAndIsActive(userId, true);
    }

    public Account getAccountById(Long accountId, Long userId) {
        return accountRepository.findByIdAndUserId(accountId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Account not found"));
    }

    public Account createAccount(Long userId, String name, String type, BigDecimal balance, String institution, String accountNumber) {
        // Validate account type
        if (!List.of("checking", "savings", "credit").contains(type.toLowerCase())) {
            throw new IllegalArgumentException("Invalid account type. Must be checking, savings, or credit");
        }

// Check if ACTIVE account with same name already exists
    Optional<Account> existingAccount = accountRepository.findByUserIdAndNameAndIsActive(userId, name, true);
    if (existingAccount.isPresent()) {
        throw new IllegalArgumentException("Account with this name already exists");
    }

        Account account = new Account();
        account.setUserId(userId);
        account.setName(name);
        account.setType(type.toLowerCase());
        account.setBalance(balance != null ? balance : BigDecimal.ZERO);
        account.setInstitution(institution);
        account.setAccountNumber(accountNumber);
        account.setIsActive(true);
        account.setCreatedAt(LocalDateTime.now());
        account.setUpdatedAt(LocalDateTime.now());

        return accountRepository.save(account);
    }

    public Account updateAccount(Long accountId, Long userId, String name, String type, BigDecimal balance, String institution, String accountNumber) {
        Account account = getAccountById(accountId, userId);

        if (name != null && !name.trim().isEmpty()) {
            account.setName(name);
        }
        if (type != null && !type.trim().isEmpty()) {
            if (!List.of("checking", "savings", "credit").contains(type.toLowerCase())) {
                throw new IllegalArgumentException("Invalid account type");
            }
            account.setType(type.toLowerCase());
        }
        if (balance != null) {
            account.setBalance(balance);
        }
        if (institution != null) {
            account.setInstitution(institution);
        }
        if (accountNumber != null) {
            account.setAccountNumber(accountNumber);
        }
        account.setUpdatedAt(LocalDateTime.now());

        return accountRepository.save(account);
    }

    public void deleteAccount(Long accountId, Long userId) {
        Account account = getAccountById(accountId, userId);
        account.setIsActive(false);
        account.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(account);
    }

    public void updateBalance(Long accountId, Long userId, BigDecimal newBalance) {
        Account account = getAccountById(accountId, userId);
        account.setBalance(newBalance);
        account.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(account);
    }
}