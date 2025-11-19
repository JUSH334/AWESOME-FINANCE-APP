package backend.controller;

import backend.entity.Budget;
import backend.service.BudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/budgets")
@CrossOrigin(origins = "*")
public class BudgetController {

    @Autowired
    private BudgetService budgetService;

    @GetMapping
    public ResponseEntity<?> getBudgets(Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            List<Budget> budgets = budgetService.getUserBudgets(userId);
            return ResponseEntity.ok(budgets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBudget(@PathVariable Long id, Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            Budget budget = budgetService.getBudgetById(id, userId);
            return ResponseEntity.ok(budget);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createBudget(@RequestBody BudgetRequest request, Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            
            Budget budget = budgetService.createBudget(
                userId,
                request.category,
                request.amount,
                request.periodType != null ? request.periodType : "monthly"
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(budget);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBudget(
        @PathVariable Long id,
        @RequestBody BudgetRequest request,
        Authentication auth
    ) {
        try {
            Long userId = getUserIdFromAuth(auth);
            
            Budget budget = budgetService.updateBudget(
                id,
                userId,
                request.category,
                request.amount,
                request.periodType
            );
            
            return ResponseEntity.ok(budget);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBudget(@PathVariable Long id, Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            budgetService.deleteBudget(id, userId);
            return ResponseEntity.ok(Map.of("message", "Budget deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/recalculate")
    public ResponseEntity<?> recalculateBudgets(Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            budgetService.recalculateAllBudgets(userId);
            return ResponseEntity.ok(Map.of("message", "Budgets recalculated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    private Long getUserIdFromAuth(Authentication auth) {
        if (auth == null) {
            throw new IllegalArgumentException("User not authenticated");
        }
        
        @SuppressWarnings("unchecked")
        Map<String, Object> details = (Map<String, Object>) auth.getDetails();
        Object userIdObj = details.get("userId");
        
        if (userIdObj == null) {
            throw new IllegalArgumentException("User ID not found in authentication");
        }
        
        return Long.parseLong(userIdObj.toString());
    }

    public static class BudgetRequest {
        public String category;
        public BigDecimal amount;
        public String periodType;
    }
}