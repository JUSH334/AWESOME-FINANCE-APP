package backend.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "testSecretKeyForJWTTokenGenerationThatIsAtLeast256BitsLongForHS256Algorithm");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 3600000L); // 1 hour
    }

    @Test
    void generateToken_WithUsername_ShouldGenerateValidToken() {
        String token = jwtUtil.generateToken("testuser");

        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(jwtUtil.extractUsername(token)).isEqualTo("testuser");
    }

    @Test
    void generateToken_WithClaims_ShouldIncludeClaims() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", "123");
        claims.put("email", "test@test.com");

        String token = jwtUtil.generateToken("testuser", claims);

        Claims extractedClaims = jwtUtil.extractAllClaims(token);
        assertThat(extractedClaims.get("userId")).isEqualTo("123");
        assertThat(extractedClaims.get("email")).isEqualTo("test@test.com");
    }

    @Test
    void extractUsername_WithValidToken_ShouldReturnUsername() {
        String token = jwtUtil.generateToken("testuser");

        String username = jwtUtil.extractUsername(token);

        assertThat(username).isEqualTo("testuser");
    }

    @Test
    void extractExpiration_WithValidToken_ShouldReturnExpirationDate() {
        String token = jwtUtil.generateToken("testuser");

        Date expiration = jwtUtil.extractExpiration(token);

        assertThat(expiration).isAfter(new Date());
    }

    @Test
    void extractAllClaims_WithValidToken_ShouldReturnAllClaims() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", "123");

        String token = jwtUtil.generateToken("testuser", claims);

        Claims extractedClaims = jwtUtil.extractAllClaims(token);

        assertThat(extractedClaims.getSubject()).isEqualTo("testuser");
        assertThat(extractedClaims.get("userId")).isEqualTo("123");
    }

    @Test
    void validateToken_WithValidToken_ShouldReturnTrue() {
        String token = jwtUtil.generateToken("testuser");

        Boolean isValid = jwtUtil.validateToken(token, "testuser");

        assertThat(isValid).isTrue();
    }

    @Test
    void validateToken_WithWrongUsername_ShouldReturnFalse() {
        String token = jwtUtil.generateToken("testuser");

        Boolean isValid = jwtUtil.validateToken(token, "wronguser");

        assertThat(isValid).isFalse();
    }

    @Test
    void validateToken_WithExpiredToken_ShouldThrowException() {
        // Create a new JwtUtil instance with very short expiration
        JwtUtil expiredJwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(expiredJwtUtil, "secret", "testSecretKeyForJWTTokenGenerationThatIsAtLeast256BitsLongForHS256Algorithm");
        ReflectionTestUtils.setField(expiredJwtUtil, "expiration", 1L); // 1 millisecond
        
        String token = expiredJwtUtil.generateToken("testuser");
        
        // Wait for token to expire
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Attempting to extract username from expired token should throw ExpiredJwtException
        assertThatThrownBy(() -> expiredJwtUtil.extractUsername(token))
            .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    void validateToken_WithoutUsername_ShouldValidateToken() {
        String token = jwtUtil.generateToken("testuser");

        Boolean isValid = jwtUtil.validateToken(token);

        assertThat(isValid).isTrue();
    }

    @Test
    void validateToken_WithInvalidToken_ShouldReturnFalse() {
        Boolean isValid = jwtUtil.validateToken("invalid.token.here");

        assertThat(isValid).isFalse();
    }

    @Test
    void extractClaim_WithCustomClaimExtractor_ShouldExtractCorrectly() {
        String token = jwtUtil.generateToken("testuser");

        Date issuedAt = jwtUtil.extractClaim(token, Claims::getIssuedAt);

        assertThat(issuedAt).isNotNull();
        assertThat(issuedAt).isBeforeOrEqualTo(new Date());
    }
}