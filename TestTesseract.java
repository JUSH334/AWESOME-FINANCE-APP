public class TestTesseract {
    public static void main(String[] args) {
        System.out.println("Testing Tesseract loading...");
        
        try {
            Class<?> tesseractClass = Class.forName("net.sourceforge.tess4j.Tesseract");
            System.out.println("SUCCESS: Tesseract class found!");
            System.out.println("Class: " + tesseractClass.getName());
            
            Object instance = tesseractClass.getDeclaredConstructor().newInstance();
            System.out.println("SUCCESS: Tesseract instance created!");
            
            // Try to set tessdata path
            tesseractClass.getMethod("setDatapath", String.class)
                .invoke(instance, "C:/Program Files (x86)/Tesseract-OCR/tessdata");
            System.out.println("SUCCESS: Tessdata path set!");
            
            System.out.println("\n✅ All checks passed! Tesseract is working!");
            
        } catch (ClassNotFoundException e) {
            System.err.println("❌ ERROR: Tesseract class not found");
            System.err.println("   tess4j-5.9.0.jar is missing or not in classpath");
        } catch (Exception e) {
            System.err.println("❌ ERROR: " + e.getClass().getSimpleName());
            System.err.println("   Message: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
