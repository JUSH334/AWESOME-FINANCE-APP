package backend.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;

import backend.controller.DataEntryController.AccountRequest;
import backend.controller.DataEntryController.TransactionRequest;
import backend.entity.Account;
import backend.entity.Transaction;
import backend.service.AccountService;
import backend.service.PDFParserService;
import backend.service.PDFParserService.ParsedStatement;
import backend.service.PDFParserService.ParsedTransaction;
import backend.service.TransactionService;

@SpringBootTest
@AutoConfigureMockMvc
class DataEntryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AccountService accountService;

    @MockBean
    private TransactionService transactionService;

    @MockBean
    private PDFParserService pdfParserService;

    private Account testAccount;
    private Transaction testTransaction;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        testAccount = new Account();
        testAccount.setId(1L);
        testAccount.setUserId(1L);
        testAccount.setName("Checking");
        testAccount.setType("checking");
        testAccount.setBalance(new BigDecimal("1000.00"));

        testTransaction = new Transaction();
        testTransaction.setId(1L);
        testTransaction.setUserId(1L);
        testTransaction.setAccountId(1L);
        testTransaction.setAmount(new BigDecimal("50.00"));
        testTransaction.setCategory("Groceries");
        testTransaction.setType("out");
        testTransaction.setTransactionDate(LocalDate.now());

        // Create authentication with userId in details
        Map<String, Object> details = new HashMap<>();
        details.put("userId", 1L);
        
        UsernamePasswordAuthenticationToken auth = 
            new UsernamePasswordAuthenticationToken("testuser", null, null);
        auth.setDetails(details);
        
        authentication = auth;
        
        // Set up SecurityContext
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
    }

    // ==================== ACCOUNT TESTS ====================

    @Test
    void getAccounts_ShouldReturnAccounts() throws Exception {
        when(accountService.getUserAccounts(anyLong())).thenReturn(Arrays.asList(testAccount));

        mockMvc.perform(get("/api/data/accounts")
                .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Checking"));
    }

    @Test
    void createAccount_WithValidData_ShouldCreateAccount() throws Exception {
        AccountRequest request = new AccountRequest();
        request.name = "Savings";
        request.type = "savings";
        request.balance = new BigDecimal("500.00");

        when(accountService.createAccount(anyLong(), eq("Savings"), eq("savings"), 
                any(BigDecimal.class), isNull(), isNull())).thenReturn(testAccount);

        mockMvc.perform(post("/api/data/accounts")
                .principal(authentication)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void createAccount_WithInvalidType_ShouldReturnBadRequest() throws Exception {
        AccountRequest request = new AccountRequest();
        request.name = "Test";
        request.type = "invalid";
        request.balance = BigDecimal.ZERO;

        when(accountService.createAccount(anyLong(), anyString(), anyString(), 
                any(BigDecimal.class), isNull(), isNull()))
                .thenThrow(new IllegalArgumentException("Invalid account type"));

        mockMvc.perform(post("/api/data/accounts")
                .principal(authentication)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void updateAccount_WithValidData_ShouldUpdateAccount() throws Exception {
        AccountRequest request = new AccountRequest();
        request.name = "Updated Checking";
        request.type = "checking";
        request.balance = new BigDecimal("1500.00");

        when(accountService.updateAccount(eq(1L), anyLong(), anyString(), anyString(), 
                any(BigDecimal.class), isNull(), isNull())).thenReturn(testAccount);

        mockMvc.perform(put("/api/data/accounts/1")
                .principal(authentication)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void deleteAccount_WithValidId_ShouldDeleteAccount() throws Exception {
        doNothing().when(accountService).deleteAccount(eq(1L), anyLong());

        mockMvc.perform(delete("/api/data/accounts/1")
                .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Account deleted successfully"));
    }

    // ==================== TRANSACTION TESTS ====================

    @Test
    void getTransactions_ShouldReturnTransactions() throws Exception {
        when(transactionService.getUserTransactions(anyLong())).thenReturn(Arrays.asList(testTransaction));

        mockMvc.perform(get("/api/data/transactions")
                .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].category").value("Groceries"));
    }

    @Test
    void getTransactions_WithAccountId_ShouldReturnFilteredTransactions() throws Exception {
        when(transactionService.getAccountTransactions(anyLong(), eq(1L)))
                .thenReturn(Arrays.asList(testTransaction));

        mockMvc.perform(get("/api/data/transactions")
                .param("accountId", "1")
                .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].accountId").value(1));
    }

    @Test
    void getTransactions_WithSearch_ShouldReturnSearchResults() throws Exception {
        when(transactionService.searchTransactions(anyLong(), eq("Groceries")))
                .thenReturn(Arrays.asList(testTransaction));

        mockMvc.perform(get("/api/data/transactions")
                .param("search", "Groceries")
                .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].category").value("Groceries"));
    }

    @Test
    void createTransaction_WithValidData_ShouldCreateTransaction() throws Exception {
        TransactionRequest request = new TransactionRequest();
        request.accountId = 1L;
        request.transactionDate = LocalDate.now();
        request.amount = new BigDecimal("50.00");
        request.category = "Groceries";
        request.type = "out";

        when(transactionService.createTransaction(anyLong(), eq(1L), any(LocalDate.class),
                any(BigDecimal.class), eq("Groceries"), eq("out"), isNull(), isNull(), anyBoolean()))
                .thenReturn(testTransaction);

        mockMvc.perform(post("/api/data/transactions")
                .principal(authentication)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category").value("Groceries"));
    }

@Test
void createTransaction_WithInvalidType_ShouldReturnBadRequest() throws Exception {
    TransactionRequest request = new TransactionRequest();
    request.accountId = 1L;
    request.transactionDate = LocalDate.now();
    request.amount = new BigDecimal("50.00");
    request.type = "invalid";

    when(transactionService.createTransaction(anyLong(), anyLong(), any(LocalDate.class),
            any(BigDecimal.class), isNull(), anyString(), isNull(), isNull(), anyBoolean()))
            .thenThrow(new IllegalArgumentException("Invalid transaction type"));

    mockMvc.perform(post("/api/data/transactions")
            .principal(authentication)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").exists());
}

@Test
void updateTransaction_WithValidData_ShouldUpdateTransaction() throws Exception {
    TransactionRequest request = new TransactionRequest();
    request.accountId = 1L;
    request.transactionDate = LocalDate.now(); // ADD THIS
    request.amount = new BigDecimal("75.00");
    request.category = "Dining";
    request.type = "out";

    when(transactionService.updateTransaction(eq(1L), anyLong(), anyLong(), any(LocalDate.class),
            any(BigDecimal.class), anyString(), anyString(), isNull(), isNull()))
            .thenReturn(testTransaction);

    mockMvc.perform(put("/api/data/transactions/1")
            .principal(authentication)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1));
}

    @Test
    void deleteTransaction_WithValidId_ShouldDeleteTransaction() throws Exception {
        doNothing().when(transactionService).deleteTransaction(eq(1L), anyLong());

        mockMvc.perform(delete("/api/data/transactions/1")
                .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Transaction deleted successfully"));
    }

    // ==================== PDF UPLOAD TESTS ====================

    @Test
    void uploadStatement_WithValidPdf_ShouldReturnParsedData() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "statement.pdf", "application/pdf", "PDF content".getBytes()
        );

        ParsedStatement statement = new ParsedStatement();
        statement.accountName = "Checking Account";
        statement.accountNumber = "1234567890";
        statement.openingBalance = new BigDecimal("1000.00");
        statement.closingBalance = new BigDecimal("1200.00");
        statement.statementDate = LocalDate.now();
        
        ParsedTransaction tx1 = new ParsedTransaction(
            LocalDate.now(), 
            "Test Transaction 1", 
            new BigDecimal("50.00"),
            "out"
        );
        
        ParsedTransaction tx2 = new ParsedTransaction(
            LocalDate.now(), 
            "Test Transaction 2", 
            new BigDecimal("100.00"),
            "in"
        );
        
        statement.transactions = Arrays.asList(tx1, tx2);

        when(pdfParserService.parseStatement(any())).thenReturn(statement);

        mockMvc.perform(multipart("/api/data/upload-statement")
                .file(file)
                .param("accountId", "1")
                .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountName").value("Checking Account"))
                .andExpect(jsonPath("$.transactionCount").value(2));
    }

    @Test
    void uploadStatement_WithInvalidPdf_ShouldReturnBadRequest() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "statement.pdf", "application/pdf", "Invalid".getBytes()
        );

        when(pdfParserService.parseStatement(any()))
                .thenThrow(new IllegalArgumentException("Invalid PDF format"));

        mockMvc.perform(multipart("/api/data/upload-statement")
                .file(file)
                .principal(authentication))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void uploadStatement_WithNullDates_ShouldFilterAndWarn() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "statement.pdf", "application/pdf", "PDF content".getBytes()
        );

        ParsedStatement statement = new ParsedStatement();
        statement.accountName = "Checking Account";
        statement.accountNumber = "1234567890";
        statement.openingBalance = new BigDecimal("1000.00");
        statement.closingBalance = new BigDecimal("1200.00");
        statement.statementDate = LocalDate.now();
        
        ParsedTransaction tx1 = new ParsedTransaction(
            LocalDate.now(), "Valid Transaction", new BigDecimal("50.00"), "out"
        );
        
        ParsedTransaction tx2 = new ParsedTransaction(
            null, "Invalid Transaction", new BigDecimal("100.00"), "in"
        );
        
        statement.transactions = Arrays.asList(tx1, tx2);

        when(pdfParserService.parseStatement(any())).thenReturn(statement);

        mockMvc.perform(multipart("/api/data/upload-statement")
                .file(file)
                .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactionCount").value(1))
                .andExpect(jsonPath("$.warning").value("1 transaction(s) had invalid dates and were excluded"));
    }

    @Test
    void importTransactions_WithValidData_ShouldImportTransactions() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("transactions", Arrays.asList(testTransaction));
        request.put("updateBalance", true);

        when(transactionService.createBulkTransactions(anyLong(), anyList(), anyBoolean()))
                .thenReturn(Arrays.asList(testTransaction));

        mockMvc.perform(post("/api/data/import-transactions")
                .principal(authentication)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.count").value(1));
    }
}