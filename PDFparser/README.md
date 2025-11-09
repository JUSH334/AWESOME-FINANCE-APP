# PDF Text Parser (Java)

A simple Java application to extract text content from PDF files using Apache PDFBox.

## Requirements

- Java 11 or higher
- Maven 3.6+ or Gradle 7+ (for building)

## Installation & Setup

### Option 1: Using Maven

1. Ensure Maven is installed:
```bash
mvn --version
```

2. Build the project:
```bash
mvn clean package
```

This creates an executable JAR at `target/pdf-parser.jar`

### Option 2: Using Gradle

1. Ensure Gradle is installed:
```bash
gradle --version
```

2. Build the project:
```bash
gradle shadowJar
```

This creates an executable JAR at `build/libs/pdf-parser.jar`

### Option 3: Manual Compilation

1. Download Apache PDFBox JAR from: https://pdfbox.apache.org/download.html

2. Compile:
```bash
javac -cp pdfbox-3.0.1.jar PDFParser.java
```

3. Run:
```bash
java -cp .:pdfbox-3.0.1.jar PDFParser document.pdf
```

## Usage

### Command Line

Extract text and print to console:
```bash
java -jar target/pdf-parser.jar document.pdf
```

Extract text and save to a file:
```bash
java -jar target/pdf-parser.jar document.pdf -o output.txt
```

Extract without page separators:
```bash
java -jar target/pdf-parser.jar document.pdf -o output.txt --no-separator
```

Show help:
```bash
java -jar target/pdf-parser.jar --help
```

### Programmatic Usage

```java
import java.io.IOException;

public class MyApp {
    public static void main(String[] args) {
        try {
            // Extract text as String
            String text = PDFParser.parsePDFToText("document.pdf");
            System.out.println(text);
            
            // Extract and save to file
            PDFParser.parsePDFToFile("document.pdf", "output.txt");
            
            // Extract without page separators
            String text2 = PDFParser.parsePDFToText("document.pdf", false, "");
            
            // Custom page separator
            String text3 = PDFParser.parsePDFToText("document.pdf", true, 
                                                    "\n\n=== Page %d ===\n\n");
            
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## Project Structure

```
.
├── PDFParser.java          # Main parser class
├── PDFParserExample.java   # Usage examples
├── pom.xml                 # Maven build configuration
├── build.gradle            # Gradle build configuration
└── README.md               # This file
```

## API Reference

### `PDFParser` Class

#### Methods

**`parsePDFToText(String pdfPath)`**
- Extracts text from PDF with default settings
- Returns: `String` - extracted text
- Throws: `IOException`

**`parsePDFToText(String pdfPath, boolean includePageSeparators, String pageSeparatorFormat)`**
- Extracts text with custom options
- Parameters:
  - `pdfPath` - Path to PDF file
  - `includePageSeparators` - Whether to add separators between pages
  - `pageSeparatorFormat` - Format string for separator (use `%d` for page number)
- Returns: `String` - extracted text
- Throws: `IOException`

**`parsePDFToFile(String pdfPath, String outputPath)`**
- Extracts text and saves to file with default settings
- Throws: `IOException`

**`parsePDFToFile(String pdfPath, String outputPath, boolean includePageSeparators, String pageSeparatorFormat)`**
- Extracts text and saves to file with custom options
- Throws: `IOException`

## Features

- ✅ Extract text from all pages in a PDF
- ✅ Optional page separators with page numbers
- ✅ Return as String or save to file
- ✅ Handle multi-page documents
- ✅ Command-line interface
- ✅ Programmatic API
- ✅ Customizable page separators

## Dependencies

- Apache PDFBox 3.0.1

## Error Handling

The parser handles:
- Missing or invalid PDF files
- Corrupted PDF files
- I/O errors
- Invalid command-line arguments

## Examples

See `PDFParserExample.java` for detailed usage examples including:
1. Basic text extraction
2. Saving to file
3. Extracting without page separators
4. Using custom page separators

## Building from Source

### Maven
```bash
# Clean and compile
mvn clean compile

# Run tests (if any)
mvn test

# Package as JAR
mvn package

# Create executable JAR with dependencies
mvn clean package
```

### Gradle
```bash
# Clean and build
gradle clean build

# Create executable JAR with dependencies
gradle shadowJar

# Run the application
gradle run --args="document.pdf"
```

## License

This project uses Apache PDFBox, which is licensed under the Apache License 2.0.

## Troubleshooting

**Problem**: `ClassNotFoundException: org.apache.pdfbox...`
- **Solution**: Ensure PDFBox is in the classpath or use the built JAR with dependencies

**Problem**: `IOException: PDF file not found`
- **Solution**: Check that the PDF file path is correct and the file exists

**Problem**: Out of memory errors with large PDFs
- **Solution**: Increase JVM heap size: `java -Xmx2g -jar pdf-parser.jar large.pdf`
