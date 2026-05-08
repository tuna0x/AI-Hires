package com.project.AIH.controllers;

import com.project.AIH.dto.AuthenticationRequest;
import com.project.AIH.dto.RegisterRequest;
import com.project.AIH.dto.RestLoginDTO;
import com.project.AIH.services.AuthenticationService;
import com.project.AIH.utils.SecurityUtil;
import com.project.AIH.utils.annotation.ApiMessage;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService service;
    private final SecurityUtil securityUtil;

    @Value("${app.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    @PostMapping("/register")
    @ApiMessage("Register successfully")
    public ResponseEntity<RestLoginDTO> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response
    ) {
        RestLoginDTO res = service.register(request);
        setRefreshTokenCookie(response, res.getRefreshToken());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/login")
    @ApiMessage("Login successfully")
    public ResponseEntity<RestLoginDTO> authenticate(
            @Valid @RequestBody AuthenticationRequest request,
            HttpServletResponse response
    ) {
        RestLoginDTO res = service.authenticate(request);
        setRefreshTokenCookie(response, res.getRefreshToken());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/account")
    @ApiMessage("Fetch account successfully")
    public ResponseEntity<RestLoginDTO.UserGetAccount> getAccount() {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        RestLoginDTO.UserGetAccount account = service.getAccount(email);
        return ResponseEntity.ok(account);
    }

    @PostMapping("/refresh")
    @ApiMessage("Refresh token successfully")
    public ResponseEntity<RestLoginDTO> refresh(
            @CookieValue(name = "refresh_token", defaultValue = "") String refreshToken,
            HttpServletResponse response
    ) {
        if (refreshToken.isEmpty()) {
            return ResponseEntity.status(401).build();
        }
        
        try {
            Jwt decodedToken = securityUtil.checkValidToken(refreshToken);
            String email = decodedToken.getSubject();
            
            RestLoginDTO res = service.refreshToken(refreshToken, email);
            setRefreshTokenCookie(response, res.getRefreshToken());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/logout")
    @ApiMessage("Logout successfully")
    public ResponseEntity<Void> logout(
            HttpServletResponse response
    ) {
        String email = SecurityUtil.getCurrentUserLogin().orElse(null);
        if (email != null) {
            service.logout(email);
        }
        
        ResponseCookie deleteCookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/")
                .maxAge(0)
                .build();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .build();
    }

    @PostMapping("/google")
    @ApiMessage("Google login successfully")
    public ResponseEntity<RestLoginDTO> googleLogin(
            @Valid @RequestBody GoogleTokenRequest request,
            HttpServletResponse response
    ) {
        RestLoginDTO res = service.googleLogin(request.getCredential());
        setRefreshTokenCookie(response, res.getRefreshToken());
        return ResponseEntity.ok(res);
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/")
                .maxAge(refreshTokenExpiration)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public static class GoogleTokenRequest {
        @jakarta.validation.constraints.NotBlank(message = "Credential token is required")
        private String credential;

        public String getCredential() {
            return credential;
        }

        public void setCredential(String credential) {
            this.credential = credential;
        }
    }
}
