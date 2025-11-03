import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

/**
 * Unified PDF Text Parser - DEBUG VERSION
 * Shows detailed error messages
 */
public class PDFParserUnified {
    
    private static Object tesseract = null;
    private static boolean ocrAvailable = false;
    
    static {
        // Try to initialize Tesseract OCR if available
        try {
            System.out.println("DEBUG: Attempting to load Tesseract class...");
            Class<?> tesseractClass = Class.forName("net.sourceforge.tess4j.Tesseract");
            System.out.println("DEBUG: Tesseract class loaded successfully");
            
            tesseract = tesseractClass.getDeclaredConstructor().newInstance();
            System.out.println("DEBUG: Tesseract instance created");
            
            // Set tessdata path - try both the directory AND the parent directory
            System.out.println("DEBUG: Setting tessdata path to: C:/Program Files (x86)/Tesseract-OCR/tessdata");
            tesseractClass.getMethod("setDatapath", String.class)
                .invoke(tesseract, "C:/Program Files (x86)/Tesseract-OCR/tessdata");
            System.out.println("DEBUG: Tessdata path set successfully");
            
            // Also set language explicitly
            System.out.println("DEBUG: Setting language to: eng");
            tesseractClass.getMethod("setLanguage", String.class)
                .invoke(tesseract, "eng");
            System.out.println("DEBUG: Language set successfully");
            
            ocrAvailable = true;
            System.out.println("OCR support: ENABLED (Tesseract found)");
        } catch (ClassNotFoundException e) {
            System.err.println("DEBUG ERROR: Tesseract class not found");
            System.err.println("  Make sure tess4j-5.9.0.jar is in your classpath");
            System.err.println("  Error: " + e.getMessage());
            ocrAvailable = false;
        } catch (Exception e) {
            System.err.println("DEBUG ERROR: Failed to initialize Tesseract");
            System.err.println("  Error type: " + e.getClass().getName());
            System.err.println("  Error message: " + e.getMessage());
            e.printStackTrace();
            ocrAvailable = false;
        }
        
        if (!ocrAvailable) {
            System.out.println("OCR support: DISABLED (Tesseract not found - install tess4j for OCR support)");
        }
    }
    
    /**
     * Extract text from PDF with default settings
     */
    public static String parsePDFToText(String pdfPath) throws IOException {
        return parsePDFToText(pdfPath, true, true, "\n\n--- Page %d ---\n\n");
    }
    
    /**
     * Extract text from PDF with full options
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
                        pageText = performOCR(renderer, i - 1);
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
        
        return fullText.toString();
    }
    
    /**
     * Perform OCR on a PDF page using reflection
     */
    private static String performOCR(PDFRenderer renderer, int pageIndex) {
        if (!ocrAvailable || tesseract == null) {
            return "";
        }
        
        try {
            // Render page as image at 300 DPI
            BufferedImage image = renderer.renderImageWithDPI(pageIndex, 300);
            
            // Use reflection to call tesseract.doOCR(image)
            Class<?> tesseractClass = tesseract.getClass();
            java.lang.reflect.Method doOCRMethod = tesseractClass.getMethod("doOCR", BufferedImage.class);
            return (String) doOCRMethod.invoke(tesseract, image);
            
        } catch (IOException e) {
            System.err.println("Error rendering page: " + e.getMessage());
            e.printStackTrace();
            return "";
        } catch (Exception e) {
            System.err.println("OCR error: " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
            return "";
        }
    }
    
    /**
     * Extract text from PDF and save to a file
     */
    public static void parsePDFToFile(String pdfPath, String outputPath) throws IOException {
        parsePDFToFile(pdfPath, outputPath, true, true, "\n\n--- Page %d ---\n\n");
    }
    
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
        System.out.println("\nOCR Status: " + (ocrAvailable ? "ENABLED" : "DISABLED (Tess4J not found)"));
    }
}
