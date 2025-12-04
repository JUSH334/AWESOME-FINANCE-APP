package backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Autowired
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send email verification link to user
     */
    public void sendVerificationEmail(String toEmail, String username, String verificationToken) {
        try {
            // Point to FRONTEND verify-email page with token as query param
            String verificationUrl = frontendUrl + "/verify-email?token=" + verificationToken;
            
            logger.info("Sending verification email to: {} with URL: {}", toEmail, verificationUrl);
            
            String subject = "Verify Your Email Address";
            String htmlContent = buildVerificationEmailHtml(username, verificationUrl);

            sendHtmlEmail(toEmail, subject, htmlContent);
            logger.info("Verification email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send verification email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send verification email", e);
        }
    }

    /**
     * Send password reset link to user
     */
    public void sendPasswordResetEmail(String toEmail, String username, String resetToken) {
        try {
            // Point to FRONTEND reset-password-confirm page (NOT /reset-password!)
            String resetUrl = frontendUrl + "/reset-password-confirm?token=" + resetToken;
            
            logger.info("Sending password reset email to: {} with URL: {}", toEmail, resetUrl);
            
            String subject = "Password Reset Request";
            String htmlContent = buildPasswordResetEmailHtml(username, resetUrl);

            sendHtmlEmail(toEmail, subject, htmlContent);
            logger.info("Password reset email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send password reset email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }

    /**
     * Send HTML email
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }

    /**
     * Send simple text email (fallback)
     */
    private void sendSimpleEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);

        mailSender.send(message);
    }

    /**
     * Build HTML content for verification email
     */
    private String buildVerificationEmailHtml(String username, String verificationUrl) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <meta charset='UTF-8'>" +
                "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "</head>" +
                "<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>" +
                "    <div style='background-color: #f8f9fa; border-radius: 10px; padding: 30px;'>" +
                "        <h2 style='color: #16a34a; margin-top: 0;'>Welcome, " + username + "!</h2>" +
                "        <p>Thank you for registering. Please verify your email address to activate your account.</p>" +
                "        <div style='text-align: center; margin: 30px 0;'>" +
                "            <a href='" + verificationUrl + "' " +
                "               style='background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>" +
                "                Verify Email Address" +
                "            </a>" +
                "        </div>" +
                "        <p style='color: #666; font-size: 14px;'>" +
                "            If the button doesn't work, copy and paste this link into your browser:<br>" +
                "            <a href='" + verificationUrl + "' style='color: #16a34a; word-break: break-all;'>" + verificationUrl + "</a>" +
                "        </p>" +
                "        <hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'>" +
                "        <p style='color: #999; font-size: 12px;'>" +
                "            If you didn't create an account, please ignore this email." +
                "        </p>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }

    /**
     * Build HTML content for password reset email
     */
    private String buildPasswordResetEmailHtml(String username, String resetUrl) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <meta charset='UTF-8'>" +
                "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "</head>" +
                "<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>" +
                "    <div style='background-color: #f8f9fa; border-radius: 10px; padding: 30px;'>" +
                "        <h2 style='color: #dc3545; margin-top: 0;'>Password Reset Request</h2>" +
                "        <p>Hello, " + username + "!</p>" +
                "        <p>We received a request to reset your password. Click the button below to create a new password:</p>" +
                "        <div style='text-align: center; margin: 30px 0;'>" +
                "            <a href='" + resetUrl + "' " +
                "               style='background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>" +
                "                Reset Password" +
                "            </a>" +
                "        </div>" +
                "        <p style='color: #666; font-size: 14px;'>" +
                "            If the button doesn't work, copy and paste this link into your browser:<br>" +
                "            <a href='" + resetUrl + "' style='color: #dc3545; word-break: break-all;'>" + resetUrl + "</a>" +
                "        </p>" +
                "        <p style='color: #666; font-size: 14px;'>" +
                "            This link will expire in 24 hours." +
                "        </p>" +
                "        <hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'>" +
                "        <p style='color: #999; font-size: 12px;'>" +
                "            If you didn't request a password reset, please ignore this email and your password will remain unchanged." +
                "        </p>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }
}