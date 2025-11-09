import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

/**
 * Bank Statement Extractor
 * Main integration class that combines PDF parsing, OCR correction, and data extraction
 * 
 * Usage:
 *   BankStatementExtractor extractor = new BankStatementExtractor();
 *   BankStatement statement = extractor.extractFromPDF("statement.pdf");
 */
public class BankStatementExtractor {
    
    private boolean verboseMode = false;
    
    public BankStatementExtractor() {
    }
    
    public BankStatementExtractor(boolean verbose) {
        this.verboseMode = verbose;
    }
    
    /**
     * Extract bank statement data from a PDF file
     * 
     * @param pdfPath Path to the PDF file
     * @return Parsed BankStatement object
     * @throws IOException if file cannot be read
     */
    public BankStatement extractFromPDF(String pdfPath) throws IOException {
        log("Starting extraction from: " + pdfPath);
        
        // Step 1: Extract raw text from PDF
        log("Step 1: Extracting text from PDF...");
        String rawText = PDFParserUnified.parsePDFToText(pdfPath);
        log("Extracted " + rawText.length() + " characters");
        
        // Step 2: Correct OCR errors
        log("Step 2: Correcting OCR errors...");
        String correctedText = OCRCorrector.correctText(rawText);
        
        if (verboseMode) {
            var stats = OCRCorrector.getCorrectionStats(rawText, correctedText);
            log("OCR Corrections: " + stats.get("words_changed") + " words changed");
        }
        
        // Step 3: Parse corrected text into structured data
        log("Step 3: Parsing statement data...");
        BankStatement statement = BankStatementParser.parseStatement(correctedText);
        
        log("Extraction complete!");
        log("Found " + statement.getTransactions().size() + " transactions");
        
        return statement;
    }
    
    /**
     * Extract bank statement and save results to files
     * 
     * @param pdfPath Path to the PDF file
     * @param outputDir Directory to save output files
     * @return Parsed BankStatement object
     * @throws IOException if file operations fail
     */
    public BankStatement extractAndSave(String pdfPath, String outputDir) throws IOException {
        // Create output directory if it doesn't exist
        File dir = new File(outputDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        
        // Extract the statement
        BankStatement statement = extractFromPDF(pdfPath);
        
        // Determine base filename
        String pdfFileName = new File(pdfPath).getName();
        String baseName = pdfFileName.substring(0, pdfFileName.lastIndexOf('.'));
        
        // Save corrected text
        String correctedTextPath = outputDir + File.separator + baseName + "_corrected.txt";
        String rawText = PDFParser.parsePDFToText(pdfPath);
        String correctedText = OCRCorrector.correctText(rawText);
        saveToFile(correctedText, correctedTextPath);
        log("Saved corrected text to: " + correctedTextPath);
        
        // Save summary
        String summaryPath = outputDir + File.separator + baseName + "_summary.txt";
        saveToFile(statement.getSummary(), summaryPath);
        log("Saved summary to: " + summaryPath);
        
        // Save JSON
        String jsonPath = outputDir + File.separator + baseName + ".json";
        saveToFile(statement.toJSON(), jsonPath);
        log("Saved JSON to: " + jsonPath);
        
        // Save transactions CSV
        String csvPath = outputDir + File.separator + baseName + "_transactions.csv";
        saveTransactionsCSV(statement, csvPath);
        log("Saved transactions CSV to: " + csvPath);
        
        return statement;
    }
    
    /**
     * Save transactions to CSV file
     */
    private void saveTransactionsCSV(BankStatement statement, String path) throws IOException {
        StringBuilder csv = new StringBuilder();
        csv.append("Type,Transaction Date,Posted Date,Amount,Description,Check Number,Reference Number\n");
        
        for (Transaction t : statement.getTransactions()) {
            csv.append(t.toCSV()).append("\n");
        }
        
        saveToFile(csv.toString(), path);
    }
    
    /**
     * Save text to file
     */
    private void saveToFile(String content, String path) throws IOException {
        try (FileWriter writer = new FileWriter(path)) {
            writer.write(content);
        }
    }
    
    /**
     * Log message if verbose mode is enabled
     */
    private void log(String message) {
        if (verboseMode) {
            System.out.println("[BankStatementExtractor] " + message);
        }
    }
    
    public void setVerboseMode(boolean verbose) {
        this.verboseMode = verbose;
    }
    
    /**
     * Command-line interface
     */
    public static void main(String[] args) {
        if (args.length == 0) {
            printUsage();
            System.exit(1);
        }
        
        String pdfPath = null;
        String outputDir = "output";
        boolean verbose = false;
        boolean jsonOnly = false;
        boolean summaryOnly = false;
        
        // Parse arguments
        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "-o":
                case "--output":
                    if (i + 1 < args.length) {
                        outputDir = args[++i];
                    }
                    break;
                case "-v":
                case "--verbose":
                    verbose = true;
                    break;
                case "--json-only":
                    jsonOnly = true;
                    break;
                case "--summary-only":
                    summaryOnly = true;
                    break;
                case "-h":
                case "--help":
                    printUsage();
                    System.exit(0);
                    break;
                default:
                    if (pdfPath == null && !args[i].startsWith("-")) {
                        pdfPath = args[i];
                    }
            }
        }
        
        if (pdfPath == null) {
            System.err.println("Error: No PDF file specified");
            printUsage();
            System.exit(1);
        }
        
        try {
            BankStatementExtractor extractor = new BankStatementExtractor(verbose);
            
            if (summaryOnly) {
                // Just print summary to console
                BankStatement statement = extractor.extractFromPDF(pdfPath);
                System.out.println(statement.getSummary());
                System.out.println("\n--- Transactions ---");
                for (Transaction t : statement.getTransactions()) {
                    System.out.println(t);
                }
            } else if (jsonOnly) {
                // Just print JSON to console
                BankStatement statement = extractor.extractFromPDF(pdfPath);
                System.out.println(statement.toJSON());
            } else {
                // Full extraction and save
                BankStatement statement = extractor.extractAndSave(pdfPath, outputDir);
                System.out.println("\n" + statement.getSummary());
                System.out.println("\n✓ All files saved to: " + outputDir);
            }
            
        } catch (IOException e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
    
    private static void printUsage() {
        System.out.println("Bank Statement Extractor");
        System.out.println("Extracts structured data from bank statement PDFs");
        System.out.println("\nUsage: java BankStatementExtractor <pdf-file> [options]");
        System.out.println("\nOptions:");
        System.out.println("  -o, --output <dir>     Output directory (default: output)");
        System.out.println("  -v, --verbose          Enable verbose output");
        System.out.println("  --json-only            Print JSON to console only (no files)");
        System.out.println("  --summary-only         Print summary to console only (no files)");
        System.out.println("  -h, --help             Show this help message");
        System.out.println("\nExamples:");
        System.out.println("  java BankStatementExtractor statement.pdf");
        System.out.println("  java BankStatementExtractor statement.pdf -o results");
        System.out.println("  java BankStatementExtractor statement.pdf --summary-only");
        System.out.println("  java BankStatementExtractor statement.pdf --json-only");
        System.out.println("\nOutput Files:");
        System.out.println("  <basename>_corrected.txt    - OCR-corrected text");
        System.out.println("  <basename>_summary.txt      - Human-readable summary");
        System.out.println("  <basename>.json             - Structured JSON data");
        System.out.println("  <basename>_transactions.csv - Transaction list");
        System.out.println("\nFeatures:");
        System.out.println("  • Automatic OCR error correction");
        System.out.println("  • Extracts account info, balances, and transactions");
        System.out.println("  • Validates statement balances");
        System.out.println("  • Exports to multiple formats (JSON, CSV, TXT)");
        System.out.println("  • Ready for budget app integration");
    }
}
