import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.MonthDay;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Represents a single bank transaction
 */
public class Transaction {
    
    public enum TransactionType {
        DEPOSIT,
        WITHDRAWAL,
        ATM_WITHDRAWAL,
        CHECK,
        DEBIT_CARD,
        CREDIT_CARD,
        FEE,
        INTEREST,
        TRANSFER,
        OTHER
    }
    
    private TransactionType type;
    private LocalDate transactionDate;
    private LocalDate postedDate;
    private String description;
    private BigDecimal amount;
    private String checkNumber;
    private String referenceNumber;
    private String location;
    
    public Transaction() {
    }
    
    public Transaction(TransactionType type, LocalDate date, String description, BigDecimal amount) {
        this.type = type;
        this.transactionDate = date;
        this.postedDate = date;
        this.description = description;
        this.amount = amount;
    }
    
    // Getters and Setters
    
    public TransactionType getType() {
        return type;
    }
    
    public void setType(TransactionType type) {
        this.type = type;
    }
    
    public LocalDate getTransactionDate() {
        return transactionDate;
    }
    
    public void setTransactionDate(LocalDate transactionDate) {
        this.transactionDate = transactionDate;
    }
    
    public LocalDate getPostedDate() {
        return postedDate;
    }
    
    public void setPostedDate(LocalDate postedDate) {
        this.postedDate = postedDate;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public BigDecimal getAmount() {
        return amount;
    }
    
    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
    
    public String getCheckNumber() {
        return checkNumber;
    }
    
    public void setCheckNumber(String checkNumber) {
        this.checkNumber = checkNumber;
    }
    
    public String getReferenceNumber() {
        return referenceNumber;
    }
    
    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    /**
     * Parse date from common bank statement formats - FIXED VERSION
     */
    public static LocalDate parseDate(String dateStr, int year) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        
        dateStr = dateStr.trim();
        
        // Try parsing MM-dd format (like "05-15")
        try {
            MonthDay monthDay = MonthDay.parse(dateStr, DateTimeFormatter.ofPattern("MM-dd"));
            return monthDay.atYear(year);
        } catch (DateTimeParseException e) {
            // Continue to other formats
        }
        
        // Try parsing M-dd format (like "5-15")
        try {
            MonthDay monthDay = MonthDay.parse(dateStr, DateTimeFormatter.ofPattern("M-dd"));
            return monthDay.atYear(year);
        } catch (DateTimeParseException e) {
            // Continue to other formats
        }
        
        // Try other formats with year included
        DateTimeFormatter[] formatters = {
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),
            DateTimeFormatter.ofPattern("M/dd/yyyy"),
            DateTimeFormatter.ofPattern("MMM dd, yyyy"),
            DateTimeFormatter.ofPattern("MMM d, yyyy")
        };
        
        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDate.parse(dateStr, formatter);
            } catch (DateTimeParseException e) {
                // Try next formatter
            }
        }
        
        System.err.println("Warning: Could not parse date: " + dateStr);
        return null;
    }
    
    /**
     * Parse amount from string, handling various formats
     */
    public static BigDecimal parseAmount(String amountStr) {
        if (amountStr == null || amountStr.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        String cleaned = amountStr.trim()
                                  .replace("$", "")
                                  .replace(",", "")
                                  .replace(" ", "")
                                  .trim();
        
        try {
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            System.err.println("Warning: Could not parse amount: " + amountStr);
            return BigDecimal.ZERO;
        }
    }
    
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Transaction{");
        sb.append("type=").append(type);
        sb.append(", date=").append(transactionDate);
        if (postedDate != null && !postedDate.equals(transactionDate)) {
            sb.append(", posted=").append(postedDate);
        }
        sb.append(", amount=").append(amount);
        sb.append(", description='").append(description).append("'");
        if (checkNumber != null) {
            sb.append(", check#=").append(checkNumber);
        }
        if (referenceNumber != null) {
            sb.append(", ref#=").append(referenceNumber);
        }
        sb.append("}");
        return sb.toString();
    }
    
    /**
     * Convert transaction to JSON format
     */
    public String toJSON() {
        StringBuilder json = new StringBuilder();
        json.append("{\n");
        json.append("  \"type\": \"").append(type).append("\",\n");
        json.append("  \"transactionDate\": \"").append(transactionDate).append("\",\n");
        if (postedDate != null && !postedDate.equals(transactionDate)) {
            json.append("  \"postedDate\": \"").append(postedDate).append("\",\n");
        }
        json.append("  \"description\": \"").append(escapeJSON(description)).append("\",\n");
        json.append("  \"amount\": ").append(amount);
        if (checkNumber != null) {
            json.append(",\n  \"checkNumber\": \"").append(checkNumber).append("\"");
        }
        if (referenceNumber != null) {
            json.append(",\n  \"referenceNumber\": \"").append(referenceNumber).append("\"");
        }
        if (location != null) {
            json.append(",\n  \"location\": \"").append(escapeJSON(location)).append("\"");
        }
        json.append("\n}");
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
    
    /**
     * Convert to CSV format
     */
    public String toCSV() {
        return String.format("%s,%s,%s,%.2f,%s,%s,%s",
            type,
            transactionDate,
            postedDate != null ? postedDate : "",
            amount,
            escapeCSV(description),
            checkNumber != null ? checkNumber : "",
            referenceNumber != null ? referenceNumber : ""
        );
    }
    
    private String escapeCSV(String str) {
        if (str == null) return "";
        if (str.contains(",") || str.contains("\"") || str.contains("\n")) {
            return "\"" + str.replace("\"", "\"\"") + "\"";
        }
        return str;
    }
}