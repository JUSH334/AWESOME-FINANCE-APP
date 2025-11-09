import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

/**
 * OCR Error Corrector
 * Fixes common OCR misreadings in bank statement text
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
        WORD_CORRECTIONS.put("Depcsits", "Deposits");
        WORD_CORRECTIONS.put("depcsits", "deposits");
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
        WORD_CORRECTIONS.put("Ifycu", "If you");
        WORD_CORRECTIONS.put("Mayr", "May");
        
        // Pattern-based corrections for common OCR errors
        PATTERN_CORRECTIONS.put(Pattern.compile("\\bcn\\b"), "on");
        PATTERN_CORRECTIONS.put(Pattern.compile("R e f"), "Ref");
        PATTERN_CORRECTIONS.put(Pattern.compile("N u m b e r"), "Number");
        PATTERN_CORRECTIONS.put(Pattern.compile("N b r"), "Nbr");
    }
    
    /**
     * Correct OCR errors in extracted text
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
    private static String applyContextualCorrections(String text) {
        String result = text;
        
        // Fix "Balance cn" -> "Balance on"
        result = result.replaceAll("Balance cn\\b", "Balance on");
        
        // Fix date patterns: "Mayr" -> "May"
        result = result.replaceAll("\\bMayr\\b", "May");
        
        // Fix "8" when it should be "&" in banking contexts
        result = result.replaceAll("Deposits 8 Other", "Deposits & Other");
        result = result.replaceAll("Withdrawals 8 Debits", "Withdrawals & Debits");
        result = result.replaceAll("8 Other Credits", "& Other Credits");
        result = result.replaceAll("8 Debits", "& Debits");
        
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
     */
    public static String correctWord(String word) {
        if (word == null || word.isEmpty()) {
            return word;
        }
        
        if (WORD_CORRECTIONS.containsKey(word)) {
            return WORD_CORRECTIONS.get(word);
        }
        
        return word;
    }
    
    /**
     * Add a custom correction rule
     */
    public static void addCorrection(String incorrect, String correct) {
        WORD_CORRECTIONS.put(incorrect, correct);
    }
    
    /**
     * Add a custom pattern correction rule
     */
    public static void addPatternCorrection(Pattern pattern, String replacement) {
        PATTERN_CORRECTIONS.put(pattern, replacement);
    }
    
    /**
     * Get statistics about corrections made
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
}