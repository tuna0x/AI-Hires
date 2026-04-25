package com.project.AIH.controllers;

import com.project.AIH.dto.AuthenticationRequest;
import com.project.AIH.dto.RegisterRequest;
import com.project.AIH.dto.RestLoginDTO;
import com.project.AIH.services.AuthenticationService;
import com.project.AIH.utils.SecurityUtil;
import jakarta.servlet.http.HttpServletResponse;
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
    public ResponseEntity<RestLoginDTO> register(
            @RequestBody RegisterRequest request,
            HttpServletResponse response
    ) {
        RestLoginDTO res = service.register(request);
        setRefreshTokenCookie(response, res.getRefreshToken());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/login")
    public ResponseEntity<RestLoginDTO> authenticate(
            @RequestBody AuthenticationRequest request,
            HttpServletResponse response
    ) {
        RestLoginDTO res = service.authenticate(request);
        setRefreshTokenCookie(response, res.getRefreshToken());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/refresh")
    public ResponseEntity<RestLoginDTO> refresh(
            @CookieValue(name = "refresh_token", defaultValue = "") String refreshToken,
            HttpServletResponse response
    ) {
        if (refreshToken.isEmpty()) {
            return ResponseEntity.status(401).build();
        }
        
        Jwt decodedToken = securityUtil.checkValidToken(refreshToken);
        String email = decodedToken.getSubject();
        
        RestLoginDTO res = service.refreshToken(refreshToken, email);
        setRefreshTokenCookie(response, res.getRefreshToken());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/logout")
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
}
