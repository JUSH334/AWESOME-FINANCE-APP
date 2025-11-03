import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

/**
 * PDF Text Parser
 * Extracts text content from PDF files using Apache PDFBox
 */
public class PDFParser {
    
    /**
     * Extract text from a PDF file
     * 
     * @param pdfPath Path to the PDF file
     * @return Extracted text as String
     * @throws IOException if file cannot be read
     */
    public static String parsePDFToText(String pdfPath) throws IOException {
        return parsePDFToText(pdfPath, true, "\n\n--- Page %d ---\n\n");
    }
    
    /**
     * Extract text from a PDF file with options
     * 
     * @param pdfPath Path to the PDF file
     * @param includePageSeparators Whether to include page separators
     * @param pageSeparatorFormat Format string for page separator (use %d for page number)
     * @return Extracted text as String
     * @throws IOException if file cannot be read
     */
    public static String parsePDFToText(String pdfPath, boolean includePageSeparators, 
                                       String pageSeparatorFormat) throws IOException {
        File pdfFile = new File(pdfPath);
        
        if (!pdfFile.exists()) {
            throw new IOException("PDF file not found: " + pdfPath);
        }
        
        StringBuilder fullText = new StringBuilder();
        
        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            PDFTextStripper stripper = new PDFTextStripper();
            int totalPages = document.getNumberOfPages();
            
            System.out.println("Processing PDF: " + pdfPath);
            System.out.println("Total pages: " + totalPages);
            
            // Extract text page by page
            for (int i = 1; i <= totalPages; i++) {
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                
                String pageText = stripper.getText(document);
                
                // Add page separator if not the first page
                if (i > 1 && includePageSeparators) {
                    fullText.append(String.format(pageSeparatorFormat, i));
                }
                
                fullText.append(pageText);
            }
            
            System.out.println("Extraction complete. Total characters: " + fullText.length());
        }
        
        return fullText.toString();
    }
    
    /**
     * Extract text from PDF and save to a file
     * 
     * @param pdfPath Path to the PDF file
     * @param outputPath Path to save the extracted text
     * @throws IOException if file operations fail
     */
    public static void parsePDFToFile(String pdfPath, String outputPath) throws IOException {
        parsePDFToFile(pdfPath, outputPath, true, "\n\n--- Page %d ---\n\n");
    }
    
    /**
     * Extract text from PDF and save to a file with options
     * 
     * @param pdfPath Path to the PDF file
     * @param outputPath Path to save the extracted text
     * @param includePageSeparators Whether to include page separators
     * @param pageSeparatorFormat Format string for page separator
     * @throws IOException if file operations fail
     */
    public static void parsePDFToFile(String pdfPath, String outputPath, 
                                     boolean includePageSeparators, 
                                     String pageSeparatorFormat) throws IOException {
        String text = parsePDFToText(pdfPath, includePageSeparators, pageSeparatorFormat);
        
        try (FileWriter writer = new FileWriter(outputPath)) {
            writer.write(text);
            System.out.println("Text saved to: " + outputPath);
        }
    }
    
    /**
     * Command-line interface
     */
    public static void main(String[] args) {
        if (args.length == 0) {
            printUsage();
            System.exit(1);
        }
        
        // Check for help flag first
        for (String arg : args) {
            if (arg.equals("-h") || arg.equals("--help")) {
                printUsage();
                System.exit(0);
            }
        }
        
        String pdfPath = args[0];
        String outputPath = null;
        boolean includePageSeparators = true;
        
        // Parse command-line arguments
        for (int i = 1; i < args.length; i++) {
            switch (args[i]) {
                case "-o":
                case "--output":
                    if (i + 1 < args.length) {
                        outputPath = args[++i];
                    } else {
                        System.err.println("Error: -o/--output requires a file path");
                        System.exit(1);
                    }
                    break;
                case "--no-separator":
                    includePageSeparators = false;
                    break;
                case "-h":
                case "--help":
                    printUsage();
                    System.exit(0);
                    break;
                default:
                    System.err.println("Unknown option: " + args[i]);
                    printUsage();
                    System.exit(1);
            }
        }
        
        try {
            String text = parsePDFToText(pdfPath, includePageSeparators, "\n\n--- Page %d ---\n\n");
            
            if (outputPath != null) {
                try (FileWriter writer = new FileWriter(outputPath)) {
                    writer.write(text);
                    System.out.println("Text saved to: " + outputPath);
                }
            } else {
                System.out.println("\n=== Extracted Text ===\n");
                System.out.println(text);
            }
            
        } catch (IOException e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
    
    private static void printUsage() {
        System.out.println("PDF Text Parser");
        System.out.println("\nUsage: java PDFParser <pdf-file> [options]");
        System.out.println("\nOptions:");
        System.out.println("  -o, --output <file>    Save extracted text to file");
        System.out.println("  --no-separator         Do not include page separators");
        System.out.println("  -h, --help             Show this help message");
        System.out.println("\nExamples:");
        System.out.println("  java PDFParser document.pdf");
        System.out.println("  java PDFParser document.pdf -o output.txt");
        System.out.println("  java PDFParser document.pdf -o output.txt --no-separator");
    }
}
