package backend.service;

import backend.service.PDFParserService.ParsedStatement;
import backend.service.PDFParserService.ParsedTransaction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.*;

class PDFParserServiceTest {

    private PDFParserService pdfParserService;

    @BeforeEach
    void setUp() {
        pdfParserService = new PDFParserService();
    }

    @Test
    void parseStatement_WithNullFile_ShouldThrowException() {
        assertThatThrownBy(() -> pdfParserService.parseStatement(null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("cannot be empty");
    }

    @Test
    void parseStatement_WithEmptyFile_ShouldThrowException() {
        MultipartFile emptyFile = new MockMultipartFile("file", "test.pdf", "application/pdf", new byte[0]);

        assertThatThrownBy(() -> pdfParserService.parseStatement(emptyFile))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("cannot be empty");
    }

    @Test
    void parseStatement_WithNonPdfFile_ShouldThrowException() {
        MultipartFile textFile = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());

        assertThatThrownBy(() -> pdfParserService.parseStatement(textFile))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Only PDF files");
    }

    @Test
    void parseStatement_WithNullFilename_ShouldThrowException() {
        MultipartFile file = new MockMultipartFile("file", null, "application/pdf", "content".getBytes());

        assertThatThrownBy(() -> pdfParserService.parseStatement(file))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void parseStatement_WithInvalidPdfContent_ShouldHandleGracefully() {
        MultipartFile invalidPdf = new MockMultipartFile(
            "file", 
            "test.pdf", 
            "application/pdf", 
            "Not a valid PDF".getBytes()
        );

        assertThatThrownBy(() -> pdfParserService.parseStatement(invalidPdf))
            .isInstanceOf(IOException.class);
    }
}