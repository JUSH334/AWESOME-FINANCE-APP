package backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.MonthDay;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PDFParserService {

    public static class ParsedTransaction {
        public LocalDate date;
        public String description;
        public BigDecimal amount;
        public String type;
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
            
            if (desc.contains("salary") || desc.contains("paycheck") || desc.contains("direct deposit") || 
                desc.contains("payroll") || desc.contains("ach deposit") || desc.contains("pay from")) {
                return "Income";
            }
            if (desc.contains("transfer in") || desc.contains("deposit") && !desc.contains("direct")) {
                return "Transfer";
            }
            if (desc.contains("interest") || desc.contains("dividend")) {
                return "Interest";
            }
            if (desc.contains("grocery") || desc.contains("supermarket") || desc.contains("food store") ||
                desc.contains("kroger") || desc.contains("safeway") || desc.contains("whole foods")) {
                return "Groceries";
            }
            if (desc.contains("restaurant") || desc.contains("dining") || desc.contains("coffee") || 
                desc.contains("cafe") || desc.contains("pizza") || desc.contains("mcdonald") || 
                desc.contains("subway") || desc.contains("starbucks")) {
                return "Dining";
            }
            if (desc.contains("gas") || desc.contains("fuel") || desc.contains("exxon") || 
                desc.contains("shell") || desc.contains("chevron") || desc.contains("petrol") ||
                desc.contains("bp ") || desc.contains("mobil")) {
                return "Gas";
            }
            if (desc.contains("amazon") || desc.contains("walmart") || desc.contains("target") || 
                desc.contains("purchase") || desc.contains("ebay") || desc.contains("best buy")) {
                return "Shopping";
            }
            if (desc.contains("utility") || desc.contains("electric") || desc.contains("water") || 
                desc.contains("internet") || desc.contains("phone") || desc.contains("mobile") ||
                desc.contains("verizon") || desc.contains("att") || desc.contains("comcast")) {
                return "Utilities";
            }
            if (desc.contains("rent") || desc.contains("mortgage") || desc.contains("housing") ||
                desc.contains("property")) {
                return "Housing";
            }
            if (desc.contains("insurance") || desc.contains("geico") || desc.contains("state farm")) {
                return "Insurance";
            }
            if (desc.contains("atm") || desc.contains("withdrawal") || desc.contains("cash")) {
                return "Cash Withdrawal";
            }
            if (desc.contains("check") || desc.contains("cheque")) {
                return "Check";
            }
            if (desc.contains("fee") || desc.contains("charge") || desc.contains("service")) {
                return "Fees";
            }
            if (desc.contains("transfer out")) {
                return "Transfer";
            }
            if (desc.contains("healthcare") || desc.contains("medical") || desc.contains("doctor") ||
                desc.contains("pharmacy") || desc.contains("cvs") || desc.contains("walgreens")) {
                return "Healthcare";
            }
            if (desc.contains("entertainment") || desc.contains("netflix") || desc.contains("spotify") ||
                desc.contains("hulu") || desc.contains("movie") || desc.contains("theater")) {
                return "Entertainment";
            }
            
            return "Other";
        }

        private String extractMerchant(String description) {
            String cleaned = description
                .replaceAll("(?i)^(debit card purchase|debit purchase|credit card|purchase|payment to|transfer to|from|pos purchase|card payment|online payment|mobile payment)\\s*-?\\s*", "")
                .replaceAll("(?i)\\s+(visa|mastercard|debit|credit|card|\\d{4}).*$", "")
                .replaceAll("\\s+#\\d+.*$", "")
                .replaceAll("\\s+\\*+\\d+.*$", "")
                .trim();
            
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
        String correctedText = correctOCRErrors(text);
        return parseStatementText(correctedText);
    }

    private String extractTextFromPDF(MultipartFile file) throws IOException {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String correctOCRErrors(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }

        Map<String, String> corrections = new HashMap<>();
        corrections.put("Acccunt", "Account");
        corrections.put("Amcunt", "Amount");
        corrections.put("Depcsit", "Deposit");
        corrections.put("Descripticn", "Description");
        corrections.put("Tctal", "Total");
        corrections.put("ca!!!", "call");
        corrections.put("N br", "Nbr");
        corrections.put("TransactiOn", "Transaction");
        corrections.put("Baiance", "Balance");
        
        String result = text;
        for (Map.Entry<String, String> entry : corrections.entrySet()) {
            result = result.replaceAll("\\b" + Pattern.quote(entry.getKey()) + "\\b", entry.getValue());
        }
        
        result = result.replaceAll("\\bcn\\b", "on");
        result = result.replaceAll("Balance cn\\b", "Balance on");
        result = result.replaceAll("(\\d{1,2})l(\\d{1,2})", "$1/$2");
        result = result.replaceAll("(\\d)O(\\d)", "$10$2");
        
        return result;
    }

    private ParsedStatement parseStatementText(String text) {
        ParsedStatement statement = new ParsedStatement();
        
        int year = LocalDate.now().getYear();
        
        statement.accountNumber = extractAccountNumber(text);
        statement.accountName = extractAccountName(text);
        statement.statementDate = extractStatementDate(text);
        if (statement.statementDate != null) {
            year = statement.statementDate.getYear();
        }
        statement.openingBalance = extractBalance(text, "Beginning|Opening|Start");
        statement.closingBalance = extractBalance(text, "Ending|Closing|Final|Current");
        
        List<ParsedTransaction> transactions = new ArrayList<>();
        
        // Try parsers in order of specificity
        transactions.addAll(extractTableTransactions(text, year));
        
        if (transactions.isEmpty()) {
            transactions.addAll(extractBrokenTableFormat(text, year));
        }
        
        if (transactions.isEmpty()) {
            transactions.addAll(extractUSBankTransactions(text, year));
        }
        
        if (transactions.isEmpty()) {
            transactions.addAll(extractCapitalOneTransactions(text, year));
        }
        
        // Generic smart parser as final fallback
        if (transactions.isEmpty()) {
            transactions.addAll(extractGenericTransactions(text, year));
        }
        
        statement.transactions = transactions;
        
        return statement;
    }

    // ==================== GENERIC SMART PARSER ====================
    
    private List<ParsedTransaction> extractGenericTransactions(String text, int year) {
        List<ParsedTransaction> transactions = new ArrayList<>();
        System.out.println("Using generic smart parser...");
        
        String[] lines = text.split("\\r?\\n");
        
        // First pass: identify lines that look like transactions
        List<String> potentialTransactions = new ArrayList<>();
        
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) continue;
            
            // Skip obvious header/footer lines
            if (isHeaderOrFooter(line)) continue;
            
            // Check if line contains transaction indicators
            if (containsTransactionIndicators(line)) {
                potentialTransactions.add(line);
            }
        }
        
        // Second pass: parse each potential transaction
        for (String line : potentialTransactions) {
            ParsedTransaction txn = parseTransactionLine(line, year);
            if (txn != null) {
                transactions.add(txn);
            }
        }
        
        System.out.println("Generic parser extracted " + transactions.size() + " transactions");
        return transactions;
    }
    
    private boolean isHeaderOrFooter(String line) {
        String lower = line.toLowerCase();
        return lower.contains("page") ||
               lower.contains("continued") ||
               lower.contains("total") && !lower.matches(".*\\d+\\.\\d{2}.*") ||
               lower.contains("statement") && !lower.matches(".*\\d+\\.\\d{2}.*") ||
               lower.contains("account summary") ||
               lower.contains("transaction history") ||
               lower.contains("date") && lower.contains("description") ||
               lower.contains("privacy") ||
               lower.contains("member fdic") ||
               lower.length() < 5;
    }
    
    private boolean containsTransactionIndicators(String line) {
        // Must contain: date + amount
        boolean hasDate = containsDate(line);
        boolean hasAmount = containsAmount(line);
        
        // Bonus: contains transaction keywords
        String lower = line.toLowerCase();
        boolean hasKeywords = lower.contains("purchase") ||
                              lower.contains("payment") ||
                              lower.contains("withdrawal") ||
                              lower.contains("deposit") ||
                              lower.contains("transfer") ||
                              lower.contains("debit") ||
                              lower.contains("credit") ||
                              lower.contains("check");
        
        return hasDate && hasAmount;
    }
    
    private boolean containsDate(String line) {
        // Check for various date formats
        return line.matches(".*\\d{1,2}[/\\-]\\d{1,2}([/\\-]\\d{2,4})?.*") ||
               line.matches(".*\\d{1,2}\\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\w*.*");
    }
    
    private boolean containsAmount(String line) {
        // Check for currency amounts
        return line.matches(".*\\$?\\d{1,3}(,\\d{3})*\\.\\d{2}.*");
    }
    
    private ParsedTransaction parseTransactionLine(String line, int year) {
        // Extract date
        LocalDate date = extractDateFromLine(line, year);
        if (date == null) return null;
        
        // Extract amounts
        List<BigDecimal> amounts = extractAmountsFromLine(line);
        if (amounts.isEmpty()) return null;
        
        // Determine transaction amount (first amount that's not a balance)
        BigDecimal amount = amounts.get(0);
        
        // Extract description (everything between date and amounts)
        String description = extractDescriptionFromLine(line);
        
        // Determine type (in/out)
        String type = determineTransactionType(line, description);
        
        if (amount.compareTo(BigDecimal.ZERO) > 0) {
            return new ParsedTransaction(date, description, amount, type);
        }
        
        return null;
    }
    
    private LocalDate extractDateFromLine(String line, int year) {
        // Try various date patterns
        Pattern[] datePatterns = {
            Pattern.compile("(\\d{1,2}[/\\-]\\d{1,2}[/\\-]\\d{2,4})"),
            Pattern.compile("(\\d{1,2}[/\\-]\\d{1,2})"),
            Pattern.compile("(\\d{1,2})\\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\w*\\s+(\\d{2,4})?"),
            Pattern.compile("(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\w*\\s+(\\d{1,2}),?\\s+(\\d{4})?")
        };
        
        for (Pattern pattern : datePatterns) {
            Matcher matcher = pattern.matcher(line);
            if (matcher.find()) {
                String dateStr = matcher.group(0);
                LocalDate parsed = parseDate(dateStr, year);
                if (parsed != null) {
                    return parsed;
                }
            }
        }
        
        return null;
    }
    
    private List<BigDecimal> extractAmountsFromLine(String line) {
        List<BigDecimal> amounts = new ArrayList<>();
        
        // Pattern for currency amounts
        Pattern amountPattern = Pattern.compile("\\$?([\\d,]+\\.\\d{2})");
        Matcher matcher = amountPattern.matcher(line);
        
        while (matcher.find()) {
            String amountStr = matcher.group(1).replace(",", "");
            try {
                BigDecimal amount = new BigDecimal(amountStr);
                amounts.add(amount);
            } catch (NumberFormatException e) {
                // Skip invalid amounts
            }
        }
        
        return amounts;
    }
    
    private String extractDescriptionFromLine(String line) {
        // Remove date
        line = line.replaceAll("\\d{1,2}[/\\-]\\d{1,2}([/\\-]\\d{2,4})?", "");
        line = line.replaceAll("\\d{1,2}\\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\w*(\\s+\\d{2,4})?", "");
        
        // Remove amounts
        line = line.replaceAll("\\$?[\\d,]+\\.\\d{2}", "");
        
        // Remove common suffixes
        line = line.replaceAll("\\s+(Debit|Credit|Withdrawal|Deposit)\\s*$", "");
        
        // Clean up
        line = line.trim();
        line = line.replaceAll("\\s{2,}", " ");
        
        return line.isEmpty() ? "Transaction" : line;
    }
    
    private String determineTransactionType(String line, String description) {
        String lower = (line + " " + description).toLowerCase();
        
        // Check for income indicators
        if (lower.contains("deposit") ||
            lower.contains("credit") ||
            lower.contains("payment received") ||
            lower.contains("refund") ||
            lower.contains("interest") ||
            lower.contains("dividend") ||
            lower.contains("salary") ||
            lower.contains("paycheck")) {
            return "in";
        }
        
        // Check for expense indicators (more common)
        if (lower.contains("withdrawal") ||
            lower.contains("debit") ||
            lower.contains("purchase") ||
            lower.contains("payment") ||
            lower.contains("fee") ||
            lower.contains("check")) {
            return "out";
        }
        
        // Check for negative sign
        if (line.contains("-$") || line.matches(".*-\\s*\\d+\\.\\d{2}.*")) {
            return "out";
        }
        
        // Default to expense
        return "out";
    }

    // ==================== EXISTING PARSERS (kept for compatibility) ====================
    
    private String extractAccountNumber(String text) {
        Pattern[] patterns = {
            Pattern.compile("Account\\s+Number:\\s*\\n?\\s*(\\d[\\s\\d-]+\\d)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:VIP|Interest|Checking|Savings)\\s+(?:Interest\\s+)?(?:Checking|Savings)?\\s+(\\d{10,})", Pattern.CASE_INSENSITIVE),
            Pattern.compile("Account\\s+Number:\\s*(\\d{6,})", Pattern.CASE_INSENSITIVE),
            Pattern.compile("Account\\s*#\\s*(\\d{6,})", Pattern.CASE_INSENSITIVE),
            Pattern.compile("Account\\s*:\\s*(\\d{6,})", Pattern.CASE_INSENSITIVE)
        };
        
        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                return matcher.group(1).replaceAll("[\\s-]", "");
            }
        }
        
        return null;
    }

    private String extractAccountName(String text) {
        Pattern[] patterns = {
            Pattern.compile("(?:SAMPLE)?\\s*\\n([A-Z]+(?:\\s+[A-Z]\\.?)?\\s+[A-Z]+)\\s*\\n\\d+\\s+[A-Z]", Pattern.MULTILINE),
            Pattern.compile("(\\d{5}-\\d{4})\\s*\\n([A-Z][a-z]+\\s+[A-Z][a-z]+)\\s*\\n\\d+")
        };
        
        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                String name = matcher.group(matcher.groupCount()).trim();
                if (!name.contains("Bank") && !name.contains("Statement") && name.length() > 5) {
                    return name;
                }
            }
        }
        
        return null;
    }

    private LocalDate extractStatementDate(String text) {
        Pattern[] patterns = {
            Pattern.compile("Ending Balance\\s+(\\d{1,2}/\\d{1,2}/\\d{2,4})", Pattern.CASE_INSENSITIVE),
            Pattern.compile("Statement\\s+Date:\\s*(\\w+\\s+\\d+,\\s*\\d{4})", Pattern.CASE_INSENSITIVE),
            Pattern.compile("Statement\\s+Date:\\s*(\\d{1,2}[-/]\\d{1,2}[-/]\\d{4})", Pattern.CASE_INSENSITIVE),
            Pattern.compile("As of\\s+(\\d{1,2}/\\d{1,2}/\\d{2,4})", Pattern.CASE_INSENSITIVE)
        };
        
        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                return parseDate(matcher.group(1), LocalDate.now().getYear());
            }
        }
        
        return null;
    }

    private BigDecimal extractBalance(String text, String balanceTypeRegex) {
        Pattern pattern = Pattern.compile(
            balanceTypeRegex + "\\s+Balance.*?\\$?\\s*([\\d,]+\\.\\d{2})",
            Pattern.CASE_INSENSITIVE
        );
        
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return parseAmount(matcher.group(1));
        }
        
        return BigDecimal.ZERO;
    }

    private List<ParsedTransaction> extractTableTransactions(String text, int year) {
        List<ParsedTransaction> transactions = new ArrayList<>();
        
        Pattern brokenTablePattern = Pattern.compile(
            "Date\\s+Description.*?Money\\s+out\\s+Money\\s+In\\s+Balance",
            Pattern.CASE_INSENSITIVE
        );
        
        if (brokenTablePattern.matcher(text).find()) {
            return extractBrokenTableFormat(text, year);
        }
        
        Pattern tablePattern = Pattern.compile(
            "Date\\s+(?:Description|Transaction).*?(?:Debit|Amount|Money).*?(?:Credit|Balance)\\s*\\n(.*?)(?=\\n\\n|Page|Activity|$)",
            Pattern.DOTALL | Pattern.CASE_INSENSITIVE
        );
        Matcher tableMatcher = tablePattern.matcher(text);
        
        if (!tableMatcher.find()) {
            return transactions;
        }
        
        String tableSection = tableMatcher.group(1);
        String[] lines = tableSection.split("\\r?\\n");
        
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty() || line.startsWith("Balance brought")) continue;
            
            Pattern linePattern = Pattern.compile(
                "^(\\d{1,2}[/\\-]\\d{1,2}|\\d{1,2}\\s+\\w+)\\s+(.+?)\\s+((?:[\\d,]+\\.\\d{2}\\s*)+)$"
            );
            Matcher lineMatcher = linePattern.matcher(line);
            
            if (lineMatcher.matches()) {
                String dateStr = lineMatcher.group(1);
                String description = lineMatcher.group(2).trim();
                String amountsStr = lineMatcher.group(3).trim();
                
                LocalDate date = parseDate(dateStr, year);
                if (date == null) continue;
                
                Pattern amountPattern = Pattern.compile("([\\d,]+\\.\\d{2})");
                Matcher amountMatcher = amountPattern.matcher(amountsStr);
                List<BigDecimal> amounts = new ArrayList<>();
                
                while (amountMatcher.find()) {
                    amounts.add(parseAmount(amountMatcher.group(1)));
                }
                
                if (amounts.isEmpty()) continue;
                
                BigDecimal amount;
                String type = "out";
                
                if (amounts.size() == 3) {
                    if (amounts.get(1).compareTo(BigDecimal.ZERO) > 0) {
                        amount = amounts.get(1);
                        type = "in";
                    } else {
                        amount = amounts.get(0);
                        type = "out";
                    }
                } else if (amounts.size() == 2) {
                    amount = amounts.get(0);
                    String descLower = description.toLowerCase();
                    if (descLower.contains("credit") || 
                        descLower.contains("deposit") ||
                        descLower.contains("payment") && !descLower.contains("card payment")) {
                        type = "in";
                    }
                } else {
                    amount = amounts.get(0);
                }
                
                if (amount.compareTo(BigDecimal.ZERO) > 0) {
                    transactions.add(new ParsedTransaction(date, description, amount, type));
                }
            }
        }
        
        return transactions;
    }
    
    private List<ParsedTransaction> extractBrokenTableFormat(String text, int year) {
        List<ParsedTransaction> transactions = new ArrayList<>();
        
        int dateDescStart = text.indexOf("Date Description");
        int moneyStart = text.indexOf("Money out Money In Balance");
        
        if (dateDescStart == -1 || moneyStart == -1) {
            return transactions;
        }
        
        String dateDescSection = text.substring(dateDescStart, moneyStart).trim();
        String moneySection = text.substring(moneyStart).trim();
        
        String[] dateDescLines = dateDescSection.split("\\r?\\n");
        String[] moneyLines = moneySection.split("\\r?\\n");
        
        List<TransactionLine> txnLines = new ArrayList<>();
        
        for (int i = 1; i < dateDescLines.length; i++) {
            String line = dateDescLines[i].trim();
            if (line.isEmpty() || line.equals("Date Description")) continue;
            
            Pattern datePattern = Pattern.compile("^(\\d{1,2})\\s+(\\w+)\\s+(.+)$");
            Matcher dateMatcher = datePattern.matcher(line);
            
            if (dateMatcher.matches()) {
                TransactionLine txn = new TransactionLine();
                txn.day = dateMatcher.group(1);
                txn.month = dateMatcher.group(2);
                txn.description = dateMatcher.group(3).trim();
                txnLines.add(txn);
            } else if (!txnLines.isEmpty()) {
                TransactionLine lastTxn = txnLines.get(txnLines.size() - 1);
                lastTxn.description += " " + line.trim();
            }
        }
        
        List<AmountLine> amountLines = new ArrayList<>();
        for (int i = 1; i < moneyLines.length; i++) {
            String line = moneyLines[i].trim();
            if (line.isEmpty() || line.startsWith("Money")) continue;
            
            String[] parts = line.split("\\s+");
            if (parts.length >= 1) {
                AmountLine amtLine = new AmountLine();
                
                if (parts.length >= 1 && !parts[0].isEmpty() && !parts[0].equals("-")) {
                    amtLine.moneyOut = parseAmount(parts[0]);
                }
                
                if (parts.length >= 2 && !parts[1].isEmpty() && !parts[1].equals("-")) {
                    amtLine.moneyIn = parseAmount(parts[1]);
                }
                
                if (parts.length >= 3 && !parts[2].isEmpty()) {
                    amtLine.balance = parseAmount(parts[2]);
                }
                
                amountLines.add(amtLine);
            }
        }
        
        int minSize = Math.min(txnLines.size(), amountLines.size());
        for (int i = 0; i < minSize; i++) {
            TransactionLine txn = txnLines.get(i);
            AmountLine amt = amountLines.get(i);
            
            String dateStr = txn.month + " " + txn.day;
            LocalDate date = parseDate(dateStr, year);
            
            if (date == null) continue;
            
            BigDecimal amount;
            String type;
            
            if (amt.moneyIn.compareTo(BigDecimal.ZERO) > 0) {
                amount = amt.moneyIn;
                type = "in";
            } else if (amt.moneyOut.compareTo(BigDecimal.ZERO) > 0) {
                amount = amt.moneyOut;
                type = "out";
            } else {
                continue;
            }
            
            if (amount.compareTo(BigDecimal.ZERO) > 0) {
                transactions.add(new ParsedTransaction(date, txn.description, amount, type));
            }
        }
        
        return transactions;
    }
    
    private static class TransactionLine {
        String day;
        String month;
        String description;
    }
    
    private static class AmountLine {
        BigDecimal moneyOut = BigDecimal.ZERO;
        BigDecimal moneyIn = BigDecimal.ZERO;
        BigDecimal balance = BigDecimal.ZERO;
    }

    private List<ParsedTransaction> extractUSBankTransactions(String text, int year) {
        List<ParsedTransaction> transactions = new ArrayList<>();
        
        Pattern depositsPattern = Pattern.compile(
            "Deposits I Credits\\s*\\n.*?\\n(.*?)(?=Other Withdrawals|Total|$)",
            Pattern.DOTALL | Pattern.CASE_INSENSITIVE
        );
        Matcher depositsMatcher = depositsPattern.matcher(text);
        
        if (depositsMatcher.find()) {
            transactions.addAll(parseUSBankLines(depositsMatcher.group(1), year, false));
        }
        
        Pattern withdrawalsPattern = Pattern.compile(
            "Other Withdrawals.*?\\n.*?\\n(.*?)(?=Page|BALANCE|$)",
            Pattern.DOTALL | Pattern.CASE_INSENSITIVE
        );
        Matcher withdrawalsMatcher = withdrawalsPattern.matcher(text);
        
        if (withdrawalsMatcher.find()) {
            transactions.addAll(parseUSBankLines(withdrawalsMatcher.group(1), year, true));
        }
        
        return transactions;
    }

    private List<ParsedTransaction> parseUSBankLines(String section, int year, boolean isWithdrawal) {
        List<ParsedTransaction> transactions = new ArrayList<>();
        String[] lines = section.split("\\r?\\n");
        
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty() || line.startsWith("Total")) continue;
            
            Pattern linePattern = Pattern.compile("^(\\w+)\\s+(\\d{1,2})\\s+(.+?)\\s+([\\d,]+\\.\\d{2})-?\\s*$");
            Matcher lineMatcher = linePattern.matcher(line);
            
            if (lineMatcher.matches()) {
                String month = lineMatcher.group(1);
                String day = lineMatcher.group(2);
                String description = lineMatcher.group(3).trim();
                String amountStr = lineMatcher.group(4);
                
                String dateStr = convertMonthToNumber(month) + "/" + day;
                LocalDate date = parseDate(dateStr, year);
                BigDecimal amount = parseAmount(amountStr);
                String type = isWithdrawal ? "out" : "in";
                
                transactions.add(new ParsedTransaction(date, description, amount, type));
            }
        }
        
        return transactions;
    }

    private List<ParsedTransaction> extractCapitalOneTransactions(String text, int year) {
        List<ParsedTransaction> transactions = new ArrayList<>();
        
        Pattern tablePattern = Pattern.compile(
            "Date\\s+Amount\\s+Resulting Balance.*?\\n(.*?)(?=PAGE|$)",
            Pattern.DOTALL | Pattern.CASE_INSENSITIVE
        );
        Matcher tableMatcher = tablePattern.matcher(text);
        
        if (!tableMatcher.find()) {
            return transactions;
        }
        
        String tableSection = tableMatcher.group(1);
        String[] lines = tableSection.split("\\r?\\n");
        
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) continue;
            
            Pattern firstLinePattern = Pattern.compile(
                "^(\\d{1,2}/\\d{1,2})\\s+(-?\\$[\\d,]+\\.\\d{2})\\s+\\$[\\d,]+\\.\\d{2}\\s+(\\w+)\\s*$"
            );
            Matcher firstLineMatcher = firstLinePattern.matcher(line);
            
            if (firstLineMatcher.matches()) {
                String dateStr = firstLineMatcher.group(1);
                String amountStr = firstLineMatcher.group(2);
                String typeStr = firstLineMatcher.group(3);
                
                String description = "";
                if (i + 1 < lines.length) {
                    String nextLine = lines[i + 1].trim();
                    if (!nextLine.matches("^\\d{1,2}/\\d{1,2}.*")) {
                        description = nextLine;
                    }
                }
                
                LocalDate date = parseDate(dateStr, year);
                BigDecimal amount = parseAmount(amountStr.replace("$", "").replace("-", ""));
                String type = amountStr.startsWith("-") ? "out" : "in";
                
                transactions.add(new ParsedTransaction(date, description.isEmpty() ? typeStr : description, amount, type));
            }
        }
        
        return transactions;
    }

    private String convertMonthToNumber(String month) {
        month = month.toLowerCase();
        switch (month) {
            case "jan": case "january": return "1";
            case "feb": case "february": return "2";
            case "mar": case "march": return "3";
            case "apr": case "april": return "4";
            case "may": return "5";
            case "jun": case "june": return "6";
            case "jul": case "july": return "7";
            case "aug": case "august": return "8";
            case "sep": case "sept": case "september": return "9";
            case "oct": case "october": return "10";
            case "nov": case "november": return "11";
            case "dec": case "december": return "12";
            default: return "1";
        }
    }

    private LocalDate parseDate(String dateStr, int year) {
        if (dateStr == null || dateStr.isEmpty()) {
            return null;
        }
        
        dateStr = dateStr.trim();
        
        // Try "d Month" format
        try {
            Pattern dayMonthPattern = Pattern.compile("^(\\d{1,2})\\s+(\\w+)$");
            Matcher matcher = dayMonthPattern.matcher(dateStr);
            if (matcher.matches()) {
                String day = matcher.group(1);
                String monthName = matcher.group(2);
                String monthNum = convertMonthNameToNumber(monthName);
                
                if (monthNum != null) {
                    MonthDay monthDay = MonthDay.parse(monthNum + "-" + day, DateTimeFormatter.ofPattern("M-d"));
                    return monthDay.atYear(year);
                }
            }
        } catch (Exception e) {
            // Continue
        }
        
        // Try Month d format
        try {
            Pattern monthDayPattern = Pattern.compile("^(\\w+)\\s+(\\d{1,2})$");
            Matcher matcher = monthDayPattern.matcher(dateStr);
            if (matcher.matches()) {
                String monthName = matcher.group(1);
                String day = matcher.group(2);
                String monthNum = convertMonthNameToNumber(monthName);
                
                if (monthNum != null) {
                    MonthDay monthDay = MonthDay.parse(monthNum + "-" + day, DateTimeFormatter.ofPattern("M-d"));
                    return monthDay.atYear(year);
                }
            }
        } catch (Exception e) {
            // Continue
        }
        
        // Try MM-dd or MM/dd format
        try {
            MonthDay monthDay = MonthDay.parse(dateStr, DateTimeFormatter.ofPattern("MM-dd"));
            return monthDay.atYear(year);
        } catch (DateTimeParseException e) {
            // Continue
        }
        
        try {
            MonthDay monthDay = MonthDay.parse(dateStr, DateTimeFormatter.ofPattern("MM/dd"));
            return monthDay.atYear(year);
        } catch (DateTimeParseException e) {
            // Continue
        }
        
        try {
            MonthDay monthDay = MonthDay.parse(dateStr, DateTimeFormatter.ofPattern("M-dd"));
            return monthDay.atYear(year);
        } catch (DateTimeParseException e) {
            // Continue
        }
        
        try {
            MonthDay monthDay = MonthDay.parse(dateStr, DateTimeFormatter.ofPattern("M/dd"));
            return monthDay.atYear(year);
        } catch (DateTimeParseException e) {
            // Continue
        }
        
        // Try full date formats
        DateTimeFormatter[] formatters = {
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),
            DateTimeFormatter.ofPattern("M/dd/yyyy"),
            DateTimeFormatter.ofPattern("MM/dd/yy"),
            DateTimeFormatter.ofPattern("M/dd/yy"),
            DateTimeFormatter.ofPattern("d MMMM yyyy"),
            DateTimeFormatter.ofPattern("d MMM yyyy"),
            DateTimeFormatter.ofPattern("MMMM d, yyyy"),
            DateTimeFormatter.ofPattern("MMM d, yyyy"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy")
        };
        
        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDate.parse(dateStr, formatter);
            } catch (DateTimeParseException e) {
                // Try next
            }
        }
        
        return null;
    }
    
    private String convertMonthNameToNumber(String monthName) {
        if (monthName == null) return null;
        
        String month = monthName.toLowerCase();
        switch (month) {
            case "jan": case "january": return "1";
            case "feb": case "february": return "2";
            case "mar": case "march": return "3";
            case "apr": case "april": return "4";
            case "may": return "5";
            case "jun": case "june": return "6";
            case "jul": case "july": return "7";
            case "aug": case "august": return "8";
            case "sep": case "sept": case "september": return "9";
            case "oct": case "october": return "10";
            case "nov": case "november": return "11";
            case "dec": case "december": return "12";
            default: return null;
        }
    }

    private BigDecimal parseAmount(String amountStr) {
        if (amountStr == null || amountStr.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        String cleaned = amountStr.trim()
            .replace("$", "")
            .replace(",", "")
            .replace("+", "")
            .replace(" ", "")
            .trim();
        
        try {
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }
}