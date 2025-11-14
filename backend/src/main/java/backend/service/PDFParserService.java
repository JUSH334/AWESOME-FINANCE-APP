// backend/src/main/java/backend/service/PDFParserService.java
package backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PDFParserService {

    // Common date patterns for bank statements
    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
        DateTimeFormatter.ofPattern("MM/dd/yyyy"),
        DateTimeFormatter.ofPattern("M/d/yyyy"),
        DateTimeFormatter.ofPattern("MM-dd-yyyy"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd"),
        DateTimeFormatter.ofPattern("MMM dd, yyyy"),
        DateTimeFormatter.ofPattern("MMMM dd, yyyy")
    );

    public static class ParsedTransaction {
        public LocalDate date;
        public String description;
        public BigDecimal amount;
        public String type; // "in" or "out"
        public String category;
        public String merchant;

        public ParsedTransaction(LocalDate date, String description, BigDecimal amount, String type) {
            this.date = date;
            this.description = description;
            this.amount = amount;
            this.type = type;
            this.category = inferCategory(description);
            this.merchant = extractMerchant(description);
        }

        private String inferCategory(String description) {
            String desc = description.toLowerCase();
            
            // Income categories
            if (desc.contains("salary") || desc.contains("paycheck") || desc.contains("direct deposit")) {
                return "Income";
            }
            if (desc.contains("transfer in") || desc.contains("deposit")) {
                return "Transfer";
            }
            
            // Expense categories
            if (desc.contains("grocery") || desc.contains("supermarket") || desc.contains("food")) {
                return "Groceries";
            }
            if (desc.contains("restaurant") || desc.contains("dining") || desc.contains("coffee")) {
                return "Dining";
            }
            if (desc.contains("gas") || desc.contains("fuel") || desc.contains("exxon") || desc.contains("shell")) {
                return "Gas";
            }
            if (desc.contains("amazon") || desc.contains("walmart") || desc.contains("target")) {
                return "Shopping";
            }
            if (desc.contains("utility") || desc.contains("electric") || desc.contains("water") || desc.contains("internet")) {
                return "Utilities";
            }
            if (desc.contains("rent") || desc.contains("mortgage")) {
                return "Housing";
            }
            if (desc.contains("insurance")) {
                return "Insurance";
            }
            if (desc.contains("transfer out") || desc.contains("withdrawal")) {
                return "Transfer";
            }
            
            return "Other";
        }

        private String extractMerchant(String description) {
            // Remove common prefixes
            String cleaned = description
                .replaceAll("(?i)^(debit card purchase|credit card|purchase|payment to|transfer to|from)\\s*-?\\s*", "")
                .trim();
            
            // Take first part before common separators
            String[] parts = cleaned.split("[\\-\\#\\*]");
            if (parts.length > 0) {
                return parts[0].trim();
            }
            
            return cleaned;
        }
    }

    public static class ParsedStatement {
        public String accountName;
        public String accountNumber;
        public BigDecimal openingBalance;
        public BigDecimal closingBalance;
        public LocalDate statementDate;
        public List<ParsedTransaction> transactions = new ArrayList<>();
    }

    public ParsedStatement parseStatement(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF files are supported");
        }

        String text = extractTextFromPDF(file);
        return parseStatementText(text);
    }

    private String extractTextFromPDF(MultipartFile file) throws IOException {
        // Use Loader.loadPDF for PDFBox 3.0+
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private ParsedStatement parseStatementText(String text) {
        ParsedStatement statement = new ParsedStatement();
        String[] lines = text.split("\\r?\\n");

        // Extract account information
        extractAccountInfo(lines, statement);

        // Extract transactions
        extractTransactions(lines, statement);

        return statement;
    }

    private void extractAccountInfo(String[] lines, ParsedStatement statement) {
        Pattern accountPattern = Pattern.compile("account\\s*(?:number|#)?\\s*:?\\s*([\\dX\\*]+)", Pattern.CASE_INSENSITIVE);
        Pattern balancePattern = Pattern.compile("(?:opening|beginning)\\s*balance\\s*:?\\s*\\$?([\\d,]+\\.\\d{2})", Pattern.CASE_INSENSITIVE);
        Pattern closingPattern = Pattern.compile("(?:closing|ending)\\s*balance\\s*:?\\s*\\$?([\\d,]+\\.\\d{2})", Pattern.CASE_INSENSITIVE);
        Pattern datePattern = Pattern.compile("statement\\s*(?:date|period)?\\s*:?\\s*([\\d\\/\\-]+)", Pattern.CASE_INSENSITIVE);

        for (String line : lines) {
            Matcher accountMatcher = accountPattern.matcher(line);
            if (accountMatcher.find()) {
                statement.accountNumber = accountMatcher.group(1);
            }

            Matcher balanceMatcher = balancePattern.matcher(line);
            if (balanceMatcher.find()) {
                String amount = balanceMatcher.group(1).replace(",", "");
                statement.openingBalance = new BigDecimal(amount);
            }

            Matcher closingMatcher = closingPattern.matcher(line);
            if (closingMatcher.find()) {
                String amount = closingMatcher.group(1).replace(",", "");
                statement.closingBalance = new BigDecimal(amount);
            }

            Matcher dateMatcher = datePattern.matcher(line);
            if (dateMatcher.find()) {
                statement.statementDate = parseDate(dateMatcher.group(1));
            }
        }

        // Extract account name from first few lines
        for (int i = 0; i < Math.min(10, lines.length); i++) {
            String line = lines[i].trim();
            if (line.length() > 3 && line.length() < 50 && 
                !line.matches(".*\\d{4,}.*") && 
                !line.toLowerCase().contains("statement")) {
                statement.accountName = line;
                break;
            }
        }
    }

    private void extractTransactions(String[] lines, ParsedStatement statement) {
        // Pattern to match transaction lines
        // Format: Date Description Amount
        Pattern transactionPattern = Pattern.compile(
            "^\\s*(\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4})\\s+(.+?)\\s+(\\-?\\$?[\\d,]+\\.\\d{2})\\s*$"
        );

        // Alternative pattern for different formats
        Pattern altPattern = Pattern.compile(
            "^\\s*(\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4})\\s+(.+?)\\s+(debit|credit|withdrawal|deposit)?\\s*(\\-?\\$?[\\d,]+\\.\\d{2})\\s*$",
            Pattern.CASE_INSENSITIVE
        );

        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) continue;

            Matcher matcher = transactionPattern.matcher(line);
            if (!matcher.find()) {
                matcher = altPattern.matcher(line);
            }

            if (matcher.find()) {
                try {
                    LocalDate date = parseDate(matcher.group(1));
                    String description = matcher.group(2).trim();
                    
                    // Get amount from last group
                    String amountStr = matcher.group(matcher.groupCount()).replace("$", "").replace(",", "").trim();
                    BigDecimal amount = new BigDecimal(amountStr).abs();
                    
                    // Determine if it's income or expense
                    String type = "out"; // default to expense
                    if (amountStr.startsWith("-") || 
                        description.toLowerCase().contains("withdrawal") ||
                        description.toLowerCase().contains("payment") ||
                        description.toLowerCase().contains("debit")) {
                        type = "out";
                    } else if (description.toLowerCase().contains("deposit") ||
                               description.toLowerCase().contains("credit") ||
                               description.toLowerCase().contains("transfer in")) {
                        type = "in";
                    }

                    ParsedTransaction transaction = new ParsedTransaction(date, description, amount, type);
                    statement.transactions.add(transaction);
                } catch (Exception e) {
                    // Skip malformed transaction lines
                    continue;
                }
            }
        }
    }

    private LocalDate parseDate(String dateStr) {
        dateStr = dateStr.trim();
        
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(dateStr, formatter);
            } catch (Exception e) {
                // Try next formatter
            }
        }
        
        // If no formatter works, return current date
        return LocalDate.now();
    }
}