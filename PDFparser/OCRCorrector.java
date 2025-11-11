import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

/**
 * OCR Error Corrector
 * Fixes common OCR misreadings in bank statement text
 * 
 * Common issues:
 * - 'o' misread as '0' or 'c'
 * - 'l' misread as '1' or 'I'
 * - Spacing issues
 * - Similar character confusions
 */
public class OCRCorrector {
    
    // Common word corrections (case-sensitive)
    private static final Map<String, String> WORD_CORRECTIONS = new HashMap<>();
    
    // Pattern-based corrections
    private static final Map<Pattern, String> PATTERN_CORRECTIONS = new HashMap<>();
    
    static {
        // Initialize common banking term corrections
        WORD_CORRECTIONS.put("Acccunt", "Account");
        WORD_CORRECTIONS.put("acccunt", "account");
        WORD_CORRECTIONS.put("Amcunt", "Amount");
        WORD_CORRECTIONS.put("amcunt", "amount");
        WORD_CORRECTIONS.put("Depcsit", "Deposit");
        WORD_CORRECTIONS.put("depcsit", "deposit");
        WORD_CORRECTIONS.put("Descripticn", "Description");
        WORD_CORRECTIONS.put("descripticn", "description");
        WORD_CORRECTIONS.put("Tctal", "Total");
        WORD_CORRECTIONS.put("tctal", "total");
        WORD_CORRECTIONS.put("quasricns", "questions");
        WORD_CORRECTIONS.put("ca!!!", "call");
        WORD_CORRECTIONS.put("Ref N br", "Ref Nbr");
        WORD_CORRECTIONS.put("N br", "Nbr");
        WORD_CORRECTIONS.put("Withdrawals", "Withdrawals");
        WORD_CORRECTIONS.put("Tran", "Trans");
        
        // Pattern-based corrections for common OCR errors
        // Fix 'cn' when it should be 'on' (but be careful with 'Inc', 'cnc', etc)
        PATTERN_CORRECTIONS.put(Pattern.compile("\\bcn\\b"), "on");
        
        // Fix spaced-out words
        PATTERN_CORRECTIONS.put(Pattern.compile("R e f"), "Ref");
        PATTERN_CORRECTIONS.put(Pattern.compile("N u m b e r"), "Number");
        PATTERN_CORRECTIONS.put(Pattern.compile("N b r"), "Nbr");
    }
    
    /**
     * Correct OCR errors in extracted text
     * 
     * @param text Raw text from PDF extraction
     * @return Corrected text
     */
    public static String correctText(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        
        String corrected = text;
        
        // Apply word-level corrections
        corrected = applyWordCorrections(corrected);
        
        // Apply pattern-based corrections
        corrected = applyPatternCorrections(corrected);
        
        // Apply contextual corrections
        corrected = applyContextualCorrections(corrected);
        
        return corrected;
    }
    
    /**
     * Apply direct word replacements
     */
    private static String applyWordCorrections(String text) {
        String result = text;
        
        for (Map.Entry<String, String> entry : WORD_CORRECTIONS.entrySet()) {
            // Use word boundaries to avoid partial replacements
            String pattern = "\\b" + Pattern.quote(entry.getKey()) + "\\b";
            result = result.replaceAll(pattern, entry.getValue());
        }
        
        return result;
    }
    
    /**
     * Apply pattern-based corrections
     */
    private static String applyPatternCorrections(String text) {
        String result = text;
        
        for (Map.Entry<Pattern, String> entry : PATTERN_CORRECTIONS.entrySet()) {
            Matcher matcher = entry.getKey().matcher(result);
            result = matcher.replaceAll(entry.getValue());
        }
        
        return result;
    }
    
    /**
     * Apply contextual corrections based on surrounding text
     */
    /**
     * Apply contextual corrections based on surrounding text
     */
    private static String applyContextualCorrections(String text) {
        String result = text;
        
        // Fix "Balance cn" -> "Balance on"
        result = result.replaceAll("Balance cn\\b", "Balance on");
        
        // Fix date patterns: "Mayr" -> "May"
        result = result.replaceAll("\\bMayr\\b", "May");
        
        // Fix dates with lowercase L instead of slash: "10l03" -> "10/03"
        result = result.replaceAll("(\\d{1,2})l(\\d{1,2})", "$1/$2");
        
        // Fix currency symbols - British Pound OCR error: "Â£" -> "£"
        result = result.replaceAll("Â£", "£");
        
        // Normalize all currency symbols to $ for consistent parsing
        result = result.replaceAll("£", "\\$");
        
        // Fix common banking terms with OCR errors
        result = result.replaceAll("\\bCheck Card\\b", "Check Card");
        result = result.replaceAll("\\bVISA\\b", "VISA");
        
        // Fix spacing in common phrases
        result = result.replaceAll("I f\\s*y\\s*c\\s*u", "If you");
        
        // Fix exclamation marks misread as lowercase L
        result = result.replaceAll("ca[l1!]{2,}", "call");
        
        return result;
    }
    
    /**
     * Correct a single word
     * 
     * @param word Word to correct
     * @return Corrected word
     */
    public static String correctWord(String word) {
        if (word == null || word.isEmpty()) {
            return word;
        }
        
        // Check direct mapping first
        if (WORD_CORRECTIONS.containsKey(word)) {
            return WORD_CORRECTIONS.get(word);
        }
        
        return word;
    }
    
    /**
     * Add a custom correction rule
     * 
     * @param incorrect The incorrect text
     * @param correct The correct text
     */
    public static void addCorrection(String incorrect, String correct) {
        WORD_CORRECTIONS.put(incorrect, correct);
    }
    
    /**
     * Add a custom pattern correction rule
     * 
     * @param pattern Pattern to match
     * @param replacement Replacement text
     */
    public static void addPatternCorrection(Pattern pattern, String replacement) {
        PATTERN_CORRECTIONS.put(pattern, replacement);
    }
    
    /**
     * Get statistics about corrections made
     * 
     * @param original Original text
     * @param corrected Corrected text
     * @return Map of statistics
     */
    public static Map<String, Integer> getCorrectionStats(String original, String corrected) {
        Map<String, Integer> stats = new HashMap<>();
        
        int changes = 0;
        String[] originalWords = original.split("\\s+");
        String[] correctedWords = corrected.split("\\s+");
        
        int minLength = Math.min(originalWords.length, correctedWords.length);
        for (int i = 0; i < minLength; i++) {
            if (!originalWords[i].equals(correctedWords[i])) {
                changes++;
            }
        }
        
        stats.put("total_words", originalWords.length);
        stats.put("words_changed", changes);
        stats.put("original_length", original.length());
        stats.put("corrected_length", corrected.length());
        
        return stats;
    }
    
    /**
     * Test the corrector with sample text
     */
    public static void main(String[] args) {
        String sampleText = "Acccunt Summary\n" +
                           "Beginning Balance cn Mayr 3, 2003 $7,126.11\n" +
                           "Depcsits 8 Other Credits +3,615.08\n" +
                           "Tctal Checks Paid $305.00\n" +
                           "Descripticn Date Credited Amcunt\n" +
                           "If ycu have any quasricns please ca!!! us";
        
        System.out.println("=== OCR Correction Test ===\n");
        System.out.println("Original Text:");
        System.out.println(sampleText);
        System.out.println("\n" + "=".repeat(50) + "\n");
        
        String corrected = correctText(sampleText);
        System.out.println("Corrected Text:");
        System.out.println(corrected);
        
        System.out.println("\n" + "=".repeat(50) + "\n");
        Map<String, Integer> stats = getCorrectionStats(sampleText, corrected);
        System.out.println("Correction Statistics:");
        for (Map.Entry<String, Integer> entry : stats.entrySet()) {
            System.out.println("  " + entry.getKey() + ": " + entry.getValue());
        }
    }
}