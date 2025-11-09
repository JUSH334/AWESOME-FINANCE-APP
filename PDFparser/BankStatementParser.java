import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Bank Statement Parser - FINAL FIXED VERSION
 */
public class BankStatementParser {
    
    private static final Pattern ACCOUNT_NUMBER_PATTERN = 
        Pattern.compile("(?:Account|Primary Account)\\s*(?:Number|#)?\\s*:?\\s*(\\d{6,})");
    
    private static final Pattern STATEMENT_DATE_PATTERN = 
        Pattern.compile("Statement Date:\\s*(\\w+\\s+\\d+,\\s*\\d{4})");
    
    private static final Pattern DATE_RANGE_PATTERN = 
        Pattern.compile("(?:Beginning Balance|Balance)\\s+on\\s+(\\w+\\s+\\d+,\\s*\\d{4})");
    
    private static final Pattern ENDING_DATE_PATTERN = 
        Pattern.compile("(?:Ending Balance|Balance)\\s+on\\s+(\\w+\\s+\\d+,\\s*\\d{4})");
    
    public static BankStatement parseStatement(String text) {
        BankStatement statement = new BankStatement();
        
        extractAccountInfo(text, statement);
        extractDates(text, statement);
        extractBalances(text, statement);
        extractSummaryTotals(text, statement);
        
        extractDeposits(text, statement);
        extractATMWithdrawals(text, statement);
        extractChecks(text, statement);
        
        return statement;
    }
    
    private static void extractAccountInfo(String text, BankStatement statement) {
        // Extract account number
        Matcher accountMatcher = ACCOUNT_NUMBER_PATTERN.matcher(text);
        if (accountMatcher.find()) {
            statement.setAccountNumber(accountMatcher.group(1));
        }
        
        // Extract account holder name - look for name between ZIP and street address
        // Pattern: "12345-6789\nJane Customer\n1234"
        Pattern namePattern = Pattern.compile(
            "(\\d{5}-\\d{4})\\s*\\n([A-Z][a-z]+\\s+[A-Z][a-z]+)\\s*\\n\\d+"
        );
        Matcher nameMatcher = namePattern.matcher(text);
        if (nameMatcher.find()) {
            statement.setAccountHolderName(nameMatcher.group(2).trim());
        }
        
        // If that didn't work, try simpler pattern
        if (statement.getAccountHolderName() == null) {
            Pattern simplePattern = Pattern.compile(
                "Small Town.*?\\n([A-Z][a-z]+\\s+[A-Z][a-z]+)\\s*\\n"
            );
            Matcher simpleMatcher = simplePattern.matcher(text);
            if (simpleMatcher.find()) {
                String name = simpleMatcher.group(1).trim();
                // Make sure it's not "Bank Statement" or "Primary Account"
                if (!name.contains("Bank") && !name.contains("Primary") && 
                    !name.contains("Account") && !name.contains("Statement")) {
                    statement.setAccountHolderName(name);
                }
            }
        }
    }
    
    private static void extractDates(String text, BankStatement statement) {
        Matcher statementDateMatcher = STATEMENT_DATE_PATTERN.matcher(text);
        if (statementDateMatcher.find()) {
            LocalDate date = parseFullDate(statementDateMatcher.group(1));
            statement.setStatementDate(date);
            statement.setEndDate(date);
        }
        
        Matcher startDateMatcher = DATE_RANGE_PATTERN.matcher(text);
        if (startDateMatcher.find()) {
            LocalDate date = parseFullDate(startDateMatcher.group(1));
            statement.setStartDate(date);
        }
        
        Matcher endDateMatcher = ENDING_DATE_PATTERN.matcher(text);
        if (endDateMatcher.find()) {
            LocalDate date = parseFullDate(endDateMatcher.group(1));
            statement.setEndDate(date);
        }
    }
    
    private static void extractBalances(String text, BankStatement statement) {
        Pattern beginningPattern = Pattern.compile(
            "Beginning Balance.*?\\$([\\d,]+\\.\\d{2})"
        );
        Matcher beginningMatcher = beginningPattern.matcher(text);
        if (beginningMatcher.find()) {
            statement.setBeginningBalance(parseAmount(beginningMatcher.group(1)));
        }
        
        Pattern endingPattern = Pattern.compile(
            "Ending Balance.*?\\$([\\d,]+\\.\\d{2})"
        );
        Matcher endingMatcher = endingPattern.matcher(text);
        if (endingMatcher.find()) {
            statement.setEndingBalance(parseAmount(endingMatcher.group(1)));
        }
    }
    
    private static void extractSummaryTotals(String text, BankStatement statement) {
        Pattern depositsPattern = Pattern.compile(
            "Deposits.*?[+]?\\$?([\\d,]+\\.\\d{2})"
        );
        Matcher depositsMatcher = depositsPattern.matcher(text);
        if (depositsMatcher.find()) {
            statement.setTotalDeposits(parseAmount(depositsMatcher.group(1)));
        }
        
        Pattern atmPattern = Pattern.compile(
            "ATM Withdrawals.*?[-]?\\$?([\\d,]+\\.\\d{2})"
        );
        Matcher atmMatcher = atmPattern.matcher(text);
        if (atmMatcher.find()) {
            statement.setTotalATMWithdrawals(parseAmount(atmMatcher.group(1)));
        }
        
        Pattern checksPattern = Pattern.compile(
            "Checks Paid.*?[-]?\\$?([\\d,]+\\.\\d{2})"
        );
        Matcher checksMatcher = checksPattern.matcher(text);
        if (checksMatcher.find()) {
            statement.setTotalChecks(parseAmount(checksMatcher.group(1)));
        }
    }
    
    private static void extractDeposits(String text, BankStatement statement) {
        Pattern depositPattern = Pattern.compile(
            "Deposit\\s+Ref\\s+Nbr:\\s+(\\d+)\\s+(\\d{2}-\\d{2})\\s+\\$([\\d,]+\\.\\d{2})"
        );
        Matcher depositMatcher = depositPattern.matcher(text);
        
        int year = statement.getStatementDate() != null ? 
                   statement.getStatementDate().getYear() : 2003;
        
        while (depositMatcher.find()) {
            Transaction t = new Transaction();
            t.setType(Transaction.TransactionType.DEPOSIT);
            t.setReferenceNumber(depositMatcher.group(1));
            t.setTransactionDate(Transaction.parseDate(depositMatcher.group(2), year));
            t.setAmount(parseAmount(depositMatcher.group(3)));
            t.setDescription("Deposit");
            
            statement.addTransaction(t);
        }
    }
    
    private static void extractATMWithdrawals(String text, BankStatement statement) {
        Pattern atmPattern = Pattern.compile(
            "ATM Withdrawal\\s*\\n([^\\n]+)\\n([^\\n]+)\\s+(\\d{2}-\\d{2})\\s+(\\d{2}-\\d{2})\\s+\\$([\\d,]+\\.\\d{2})"
        );
        Matcher atmMatcher = atmPattern.matcher(text);
        
        int year = statement.getStatementDate() != null ? 
                   statement.getStatementDate().getYear() : 2003;
        
        while (atmMatcher.find()) {
            Transaction t = new Transaction();
            t.setType(Transaction.TransactionType.ATM_WITHDRAWAL);
            String location1 = atmMatcher.group(1).trim();
            String location2 = atmMatcher.group(2).trim();
            t.setLocation(location1 + ", " + location2);
            t.setTransactionDate(Transaction.parseDate(atmMatcher.group(3), year));
            t.setPostedDate(Transaction.parseDate(atmMatcher.group(4), year));
            t.setAmount(parseAmount(atmMatcher.group(5)));
            t.setDescription("ATM Withdrawal at " + location1);
            
            statement.addTransaction(t);
        }
    }
    
    private static void extractChecks(String text, BankStatement statement) {
        Pattern sectionPattern = Pattern.compile(
            "Date Paid Check Number Amount Reference Number\\s*\\n(.*?)(?=Total Checks|$)",
            Pattern.DOTALL
        );
        Matcher sectionMatcher = sectionPattern.matcher(text);
        
        if (!sectionMatcher.find()) {
            return;
        }
        
        String checksSection = sectionMatcher.group(1);
        String[] lines = checksSection.trim().split("\\n");
        
        int year = statement.getStatementDate() != null ? 
                   statement.getStatementDate().getYear() : 2003;
        
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) continue;
            
            Pattern linePattern = Pattern.compile(
                "(\\d{2}-\\d{2})\\s+(\\d+)\\s+([\\d,]+\\.\\d{2})\\s+([\\d\\s]+)"
            );
            Matcher lineMatcher = linePattern.matcher(line);
            
            if (lineMatcher.find()) {
                Transaction t = new Transaction();
                t.setType(Transaction.TransactionType.CHECK);
                t.setTransactionDate(Transaction.parseDate(lineMatcher.group(1), year));
                t.setCheckNumber(lineMatcher.group(2));
                t.setAmount(parseAmount(lineMatcher.group(3)));
                t.setReferenceNumber(lineMatcher.group(4).replaceAll("\\s+", ""));
                t.setDescription("Check #" + lineMatcher.group(2));
                
                statement.addTransaction(t);
            }
        }
    }
    
    private static LocalDate parseFullDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        
        dateStr = dateStr.trim();
        
        DateTimeFormatter[] formatters = {
            DateTimeFormatter.ofPattern("MMMM d, yyyy"),
            DateTimeFormatter.ofPattern("MMM d, yyyy"),
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd")
        };
        
        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDate.parse(dateStr, formatter);
            } catch (DateTimeParseException e) {
                // Try next formatter
            }
        }
        
        return null;
    }
    
    private static BigDecimal parseAmount(String amountStr) {
        if (amountStr == null || amountStr.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        String cleaned = amountStr.trim()
                                  .replace("$", "")
                                  .replace(",", "")
                                  .replace("+", "")
                                  .replace("-", "")
                                  .replace(" ", "")
                                  .trim();
        
        try {
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }
}