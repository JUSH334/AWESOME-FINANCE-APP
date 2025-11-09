import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

/**
 * Unified PDF Text Parser
 * Extracts text from both text-based and image-based (scanned) PDFs
 * 
 * Features:
 * - Text extraction from regular PDFs
 * - OCR support for scanned PDFs (optional, requires Tesseract)
 * - Automatic detection and fallback
 * - Command-line interface and programmatic API
 */
public class PDFParserUnified {
    
    private static Object tesseract = null;
    private static boolean ocrAvailable = false;
    
    static {
        // Try to initialize Tesseract OCR if available
        try {
            Class<?> tesseractClass = Class.forName("net.sourceforge.tess4j.Tesseract");
            tesseract = tesseractClass.getDeclaredConstructor().newInstance();
            
            // Set tessdata path - adjust if your Tesseract is installed elsewhere
            try {
                tesseractClass.getMethod("setDatapath", String.class)
                    .invoke(tesseract, "C:/Program Files (x86)/Tesseract-OCR/tessdata");
            } catch (Exception e) {
                // Try 64-bit location as fallback
                tesseractClass.getMethod("setDatapath", String.class)
                    .invoke(tesseract, "C:/Program Files/Tesseract-OCR/tessdata");
            }
            
            ocrAvailable = true;
            System.out.println("OCR support: ENABLED (Tesseract found)");
        } catch (Exception e) {
            ocrAvailable = false;
            System.out.println("OCR support: DISABLED (Tesseract not found - install tess4j for OCR support)");
        }
    }
    
    /**
     * Extract text from PDF with default settings
     * 
     * @param pdfPath Path to the PDF file
     * @return Extracted text as String
     * @throws IOException if file cannot be read
     */
    public static String parsePDFToText(String pdfPath) throws IOException {
        return parsePDFToText(pdfPath, true, true, "\n\n--- Page %d ---\n\n");
    }
    
    /**
     * Extract text from PDF with full options
     * 
     * @param pdfPath Path to the PDF file
     * @param useOCR Whether to use OCR for pages without text (requires Tesseract)
     * @param includePageSeparators Whether to include page separators
     * @param pageSeparatorFormat Format string for page separator (use %d for page number)
     * @return Extracted text as String
     * @throws IOException if file cannot be read
     */
    public static String parsePDFToText(String pdfPath, boolean useOCR, 
                                       boolean includePageSeparators, 
                                       String pageSeparatorFormat) throws IOException {
        File pdfFile = new File(pdfPath);
        
        if (!pdfFile.exists()) {
            throw new IOException("PDF file not found: " + pdfPath);
        }
        
        StringBuilder fullText = new StringBuilder();
        
        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            PDFTextStripper stripper = new PDFTextStripper();
            PDFRenderer renderer = (useOCR && ocrAvailable) ? new PDFRenderer(document) : null;
            int totalPages = document.getNumberOfPages();
            
            System.out.println("Processing PDF: " + pdfPath);
            System.out.println("Total pages: " + totalPages);
            
            // Extract text page by page
            for (int i = 1; i <= totalPages; i++) {
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                
                String pageText = stripper.getText(document);
                
                // If no text found and OCR is enabled and available, try OCR
                if ((pageText == null || pageText.trim().isEmpty()) && useOCR) {
                    if (ocrAvailable) {
                        System.out.println("Page " + i + ": No text found, attempting OCR...");
                        pageText = performOCR(renderer, i - 1); // Page index is 0-based
                        System.out.println("Page " + i + ": OCR extracted " + pageText.length() + " characters");
                    } else {
                        System.out.println("Page " + i + ": No text found (OCR not available)");
                    }
                }
                
                // Add page separator if not the first page
                if (i > 1 && includePageSeparators) {
                    fullText.append(String.format(pageSeparatorFormat, i));
                }
                
                fullText.append(pageText);
            }
            
            System.out.println("Extraction complete. Total characters: " + fullText.length());
        }
        
        System.out.println("Applying OCR corrections...");
        String correctedText = OCRCorrector.correctText(fullText.toString());
        System.out.println("OCR corrections applied!");

        return correctedText;
    }
    
    /**
     * Perform OCR on a PDF page using reflection (to avoid hard dependency on Tess4J)
     * 
     * @param renderer PDFRenderer to render page as image
     * @param pageIndex 0-based page index
     * @return Extracted text from OCR
     */
    private static String performOCR(PDFRenderer renderer, int pageIndex) {
        if (!ocrAvailable || tesseract == null) {
            return "";
        }
        
        try {
            // Render page as image at 300 DPI for better OCR accuracy
            BufferedImage image = renderer.renderImageWithDPI(pageIndex, 300);
            
            // Use reflection to call tesseract.doOCR(image)
            Class<?> tesseractClass = tesseract.getClass();
            java.lang.reflect.Method doOCRMethod = tesseractClass.getMethod("doOCR", BufferedImage.class);
            return (String) doOCRMethod.invoke(tesseract, image);
            
        } catch (IOException e) {
            System.err.println("Error rendering page: " + e.getMessage());
            return "";
        } catch (Exception e) {
            System.err.println("OCR error: " + e.getMessage());
            return "";
        }
    }
    
    /**
     * Extract text from PDF and save to a file with default settings
     * 
     * @param pdfPath Path to the PDF file
     * @param outputPath Path to save the extracted text
     * @throws IOException if file operations fail
     */
    public static void parsePDFToFile(String pdfPath, String outputPath) throws IOException {
        parsePDFToFile(pdfPath, outputPath, true, true, "\n\n--- Page %d ---\n\n");
    }
    
    /**
     * Extract text from PDF and save to a file with full options
     * 
     * @param pdfPath Path to the PDF file
     * @param outputPath Path to save the extracted text
     * @param useOCR Whether to use OCR
     * @param includePageSeparators Whether to include page separators
     * @param pageSeparatorFormat Format string for page separator
     * @throws IOException if file operations fail
     */
    public static void parsePDFToFile(String pdfPath, String outputPath, 
                                     boolean useOCR,
                                     boolean includePageSeparators, 
                                     String pageSeparatorFormat) throws IOException {
        String text = parsePDFToText(pdfPath, useOCR, includePageSeparators, pageSeparatorFormat);
        
        try (FileWriter writer = new FileWriter(outputPath)) {
            writer.write(text);
            System.out.println("Text saved to: " + outputPath);
        }
    }
    
    /**
     * Check if OCR support is available
     * 
     * @return true if Tess4J is available, false otherwise
     */
    public static boolean isOCRAvailable() {
        return ocrAvailable;
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
        boolean useOCR = true;
        
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
                case "--no-ocr":
                    useOCR = false;
                    break;
                case "--check-ocr":
                    System.out.println("OCR Available: " + (ocrAvailable ? "YES" : "NO"));
                    if (!ocrAvailable) {
                        System.out.println("\nTo enable OCR:");
                        System.out.println("1. Install Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki");
                        System.out.println("2. Add tess4j dependency to your classpath");
                        System.out.println("3. Rebuild your project");
                    }
                    System.exit(0);
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
            String text = parsePDFToText(pdfPath, useOCR, includePageSeparators, "\n\n--- Page %d ---\n\n");
            
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
        System.out.println("Unified PDF Text Parser");
        System.out.println("\nUsage: java PDFParserUnified <pdf-file> [options]");
        System.out.println("\nOptions:");
        System.out.println("  -o, --output <file>    Save extracted text to file");
        System.out.println("  --no-separator         Do not include page separators");
        System.out.println("  --no-ocr               Disable OCR (text-only extraction)");
        System.out.println("  --check-ocr            Check if OCR support is available");
        System.out.println("  -h, --help             Show this help message");
        System.out.println("\nExamples:");
        System.out.println("  java PDFParserUnified document.pdf");
        System.out.println("  java PDFParserUnified scanned.pdf -o output.txt");
        System.out.println("  java PDFParserUnified document.pdf --no-ocr");
        System.out.println("  java PDFParserUnified --check-ocr");
        System.out.println("\nFeatures:");
        System.out.println("  - Extracts text from regular text-based PDFs (fast)");
        System.out.println("  - Extracts text from scanned/image PDFs using OCR (requires Tess4J)");
        System.out.println("  - Automatic detection: tries text first, falls back to OCR if needed");
        System.out.println("  - Works without OCR libraries (just disables OCR feature)");
        System.out.println("\nOCR Status: " + (ocrAvailable ? "ENABLED" : "DISABLED (Tess4J not found)"));
        
        if (!ocrAvailable) {
            System.out.println("\nNote: OCR is currently disabled. To enable:");
            System.out.println("  1. Install Tesseract: https://github.com/UB-Mannheim/tesseract/wiki");
            System.out.println("  2. Add tess4j to classpath or use Maven with pom-unified.xml");
        }
    }
}
