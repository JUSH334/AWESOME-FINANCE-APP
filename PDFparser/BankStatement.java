import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a complete bank statement
 */
public class BankStatement {
    
    private String accountNumber;
    private String accountHolderName;
    private String accountHolderAddress;
    private String bankName;
    private String bankAddress;
    private LocalDate statementDate;
    private LocalDate startDate;
    private LocalDate endDate;
    
    private BigDecimal beginningBalance;
    private BigDecimal endingBalance;
    
    private BigDecimal totalDeposits;
    private BigDecimal totalWithdrawals;
    private BigDecimal totalATMWithdrawals;
    private BigDecimal totalChecks;
    private BigDecimal totalFees;
    
    private List<Transaction> transactions;
    
    public BankStatement() {
        this.transactions = new ArrayList<>();
        this.beginningBalance = BigDecimal.ZERO;
        this.endingBalance = BigDecimal.ZERO;
        this.totalDeposits = BigDecimal.ZERO;
        this.totalWithdrawals = BigDecimal.ZERO;
        this.totalATMWithdrawals = BigDecimal.ZERO;
        this.totalChecks = BigDecimal.ZERO;
        this.totalFees = BigDecimal.ZERO;
    }
    
    // Getters and Setters
    
    public String getAccountNumber() {
        return accountNumber;
    }
    
    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }
    
    public String getAccountHolderName() {
        return accountHolderName;
    }
    
    public void setAccountHolderName(String accountHolderName) {
        this.accountHolderName = accountHolderName;
    }
    
    public String getAccountHolderAddress() {
        return accountHolderAddress;
    }
    
    public void setAccountHolderAddress(String accountHolderAddress) {
        this.accountHolderAddress = accountHolderAddress;
    }
    
    public String getBankName() {
        return bankName;
    }
    
    public void setBankName(String bankName) {
        this.bankName = bankName;
    }
    
    public String getBankAddress() {
        return bankAddress;
    }
    
    public void setBankAddress(String bankAddress) {
        this.bankAddress = bankAddress;
    }
    
    public LocalDate getStatementDate() {
        return statementDate;
    }
    
    public void setStatementDate(LocalDate statementDate) {
        this.statementDate = statementDate;
    }
    
    public LocalDate getStartDate() {
        return startDate;
    }
    
    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
    
    public LocalDate getEndDate() {
        return endDate;
    }
    
    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
    
    public BigDecimal getBeginningBalance() {
        return beginningBalance;
    }
    
    public void setBeginningBalance(BigDecimal beginningBalance) {
        this.beginningBalance = beginningBalance;
    }
    
    public BigDecimal getEndingBalance() {
        return endingBalance;
    }
    
    public void setEndingBalance(BigDecimal endingBalance) {
        this.endingBalance = endingBalance;
    }
    
    public BigDecimal getTotalDeposits() {
        return totalDeposits;
    }
    
    public void setTotalDeposits(BigDecimal totalDeposits) {
        this.totalDeposits = totalDeposits;
    }
    
    public BigDecimal getTotalWithdrawals() {
        return totalWithdrawals;
    }
    
    public void setTotalWithdrawals(BigDecimal totalWithdrawals) {
        this.totalWithdrawals = totalWithdrawals;
    }
    
    public BigDecimal getTotalATMWithdrawals() {
        return totalATMWithdrawals;
    }
    
    public void setTotalATMWithdrawals(BigDecimal totalATMWithdrawals) {
        this.totalATMWithdrawals = totalATMWithdrawals;
    }
    
    public BigDecimal getTotalChecks() {
        return totalChecks;
    }
    
    public void setTotalChecks(BigDecimal totalChecks) {
        this.totalChecks = totalChecks;
    }
    
    public BigDecimal getTotalFees() {
        return totalFees;
    }
    
    public void setTotalFees(BigDecimal totalFees) {
        this.totalFees = totalFees;
    }
    
    public List<Transaction> getTransactions() {
        return transactions;
    }
    
    public void setTransactions(List<Transaction> transactions) {
        this.transactions = transactions;
    }
    
    public void addTransaction(Transaction transaction) {
        this.transactions.add(transaction);
    }
    
    /**
     * Validate that the statement balances correctly
     */
    public boolean validateBalances() {
        BigDecimal calculatedEnding = beginningBalance
            .add(totalDeposits)
            .subtract(totalWithdrawals)
            .subtract(totalATMWithdrawals)
            .subtract(totalChecks)
            .subtract(totalFees);
        
        // Allow for small rounding differences
        BigDecimal difference = calculatedEnding.subtract(endingBalance).abs();
        return difference.compareTo(new BigDecimal("0.01")) <= 0;
    }
    
    /**
     * Get a summary of the statement
     */
    public String getSummary() {
        StringBuilder sb = new StringBuilder();
        sb.append("=== Bank Statement Summary ===\n");
        sb.append("Account: ").append(accountNumber).append("\n");
        sb.append("Account Holder: ").append(accountHolderName).append("\n");
        sb.append("Statement Date: ").append(statementDate).append("\n");
        sb.append("Period: ").append(startDate).append(" to ").append(endDate).append("\n");
        sb.append("\n--- Balances ---\n");
        sb.append("Beginning Balance: $").append(String.format("%,.2f", beginningBalance)).append("\n");
        sb.append("Ending Balance:    $").append(String.format("%,.2f", endingBalance)).append("\n");
        sb.append("\n--- Activity ---\n");
        sb.append("Total Deposits:        $").append(String.format("%,.2f", totalDeposits)).append("\n");
        sb.append("Total Withdrawals:     $").append(String.format("%,.2f", totalWithdrawals)).append("\n");
        sb.append("Total ATM Withdrawals: $").append(String.format("%,.2f", totalATMWithdrawals)).append("\n");
        sb.append("Total Checks:          $").append(String.format("%,.2f", totalChecks)).append("\n");
        if (totalFees.compareTo(BigDecimal.ZERO) > 0) {
            sb.append("Total Fees:            $").append(String.format("%,.2f", totalFees)).append("\n");
        }
        sb.append("\n--- Transactions ---\n");
        sb.append("Total Transactions: ").append(transactions.size()).append("\n");
        
        boolean valid = validateBalances();
        sb.append("\n--- Validation ---\n");
        sb.append("Balance Check: ").append(valid ? "✓ PASSED" : "✗ FAILED").append("\n");
        
        return sb.toString();
    }
    
    /**
     * Convert statement to JSON format
     */
    public String toJSON() {
        StringBuilder json = new StringBuilder();
        json.append("{\n");
        json.append("  \"accountNumber\": \"").append(accountNumber).append("\",\n");
        json.append("  \"accountHolderName\": \"").append(escapeJSON(accountHolderName)).append("\",\n");
        if (accountHolderAddress != null) {
            json.append("  \"accountHolderAddress\": \"").append(escapeJSON(accountHolderAddress)).append("\",\n");
        }
        if (bankName != null) {
            json.append("  \"bankName\": \"").append(escapeJSON(bankName)).append("\",\n");
        }
        json.append("  \"statementDate\": \"").append(statementDate).append("\",\n");
        json.append("  \"startDate\": \"").append(startDate).append("\",\n");
        json.append("  \"endDate\": \"").append(endDate).append("\",\n");
        json.append("  \"beginningBalance\": ").append(beginningBalance).append(",\n");
        json.append("  \"endingBalance\": ").append(endingBalance).append(",\n");
        json.append("  \"totalDeposits\": ").append(totalDeposits).append(",\n");
        json.append("  \"totalWithdrawals\": ").append(totalWithdrawals).append(",\n");
        json.append("  \"totalATMWithdrawals\": ").append(totalATMWithdrawals).append(",\n");
        json.append("  \"totalChecks\": ").append(totalChecks).append(",\n");
        json.append("  \"totalFees\": ").append(totalFees).append(",\n");
        json.append("  \"transactions\": [\n");
        
        for (int i = 0; i < transactions.size(); i++) {
            json.append("    ").append(transactions.get(i).toJSON().replace("\n", "\n    "));
            if (i < transactions.size() - 1) {
                json.append(",");
            }
            json.append("\n");
        }
        
        json.append("  ]\n");
        json.append("}");
        return json.toString();
    }
    
    private String escapeJSON(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }
    
    @Override
    public String toString() {
        return getSummary();
    }
}
