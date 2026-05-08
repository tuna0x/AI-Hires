package com.project.AIH.services;

import com.project.AIH.dto.AuthenticationRequest;
import com.project.AIH.dto.RegisterRequest;
import com.project.AIH.dto.RestLoginDTO;
import com.project.AIH.models.Permission;
import com.project.AIH.models.User;
import com.project.AIH.models.UserProfile;
import com.project.AIH.repositories.RoleRepository;
import com.project.AIH.repositories.UserRepository;
import com.project.AIH.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthenticationService {
    private final UserRepository repository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityUtil securityUtil;
    private final AuthenticationManager authenticationManager;
    private final org.springframework.web.client.RestTemplate restTemplate;

    @Transactional
    public RestLoginDTO register(RegisterRequest request) {
        log.info("Registering user with email: {} and role: {}", request.getEmail(), request.getRole());
        var role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> {
                    log.error("Registration failed: Role {} not found", request.getRole());
                    return new RuntimeException("Role not found");
                });
        
        var user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        UserProfile profile = new UserProfile();
        profile.setFullName(request.getFullName() != null && !request.getFullName().trim().isEmpty()
                ? request.getFullName().trim()
                : "User_" + user.getEmail().split("@")[0]);
        profile.setUser(user);
        user.setUserProfile(profile);

        repository.save(user);
        log.info("User registered successfully with ID: {}", user.getId());
        
        return buildLoginResponse(user);
    }

    @Transactional
    public RestLoginDTO authenticate(AuthenticationRequest request) {
        log.info("Attempting login for user: {}", request.getEmail());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (Exception e) {
            log.warn("Authentication failed for user: {}. Error: {}", request.getEmail(), e.getMessage());
            throw e;
        }
        
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.error("Authenticated user email {} not found in database", request.getEmail());
                    return new RuntimeException("User not found");
                });
                
        log.info("Login successful for user: {}", request.getEmail());
        return buildLoginResponse(user);
    }

    @Transactional
    public RestLoginDTO refreshToken(String refreshToken, String email) {
        log.info("Refreshing token for user: {}", email);
        var user = repository.findByRefreshTokenAndEmail(refreshToken, email)
                .orElseThrow(() -> {
                    log.warn("Invalid refresh token attempt for email: {}", email);
                    return new RuntimeException("Invalid refresh token");
                });
                
        log.info("Token refreshed successfully for user: {}", email);
        return buildLoginResponse(user);
    }

    private RestLoginDTO buildLoginResponse(User user) {
        log.debug("Building login response for user ID: {}", user.getId());
        var role = user.getRole();
        List<String> permissions = role.getPermissions() != null ? 
                role.getPermissions().stream().map(Permission::getName).collect(Collectors.toList()) : 
                Collections.emptyList();

        RestLoginDTO.UserLogin userLogin = new RestLoginDTO.UserLogin();
        userLogin.setId(user.getId());
        userLogin.setEmail(user.getEmail());
        userLogin.setName(user.getUserProfile() != null ? user.getUserProfile().getFullName() : user.getEmail());
        userLogin.setVerified(true); // Default to true for now
        userLogin.setRole(role.getName());
        userLogin.setPermissions(permissions);
        userLogin.setAvatar(user.getUserProfile() != null ? user.getUserProfile().getAvatar() : null);

        RestLoginDTO res = new RestLoginDTO();
        res.setUser(userLogin);

        String accessToken = securityUtil.createAccessToken(user.getEmail(), res);
        String refreshToken = securityUtil.refreshToken(user.getEmail(), res);
        
        // Update user's refresh token in DB
        user.setRefreshToken(refreshToken);
        repository.save(user);

        res.setAccessToken(accessToken);
        res.setRefreshToken(refreshToken);

        return res;
    }

    @Transactional
    public void logout(String email) {
        log.info("Logging out user: {}", email);
        var user = repository.findByEmail(email)
                .orElseThrow(() -> {
                    log.error("Logout failed: User with email {} not found", email);
                    return new RuntimeException("User not found");
                });
        user.setRefreshToken(null);
        repository.save(user);
        log.info("User {} logged out successfully", email);
    }

    @Transactional(readOnly = true)
    public RestLoginDTO.UserGetAccount getAccount(String email) {
        log.debug("Fetching account information for email: {}", email);
        User user = repository.findByEmail(email).orElse(null);
        if (user == null) {
            log.warn("Account fetch failed: Email {} not found", email);
            return null;
        }

        var role = user.getRole();
        List<String> permissions = role.getPermissions() != null ? 
                role.getPermissions().stream().map(Permission::getName).collect(Collectors.toList()) : 
                Collections.emptyList();

        RestLoginDTO.UserLogin userLogin = new RestLoginDTO.UserLogin();
        userLogin.setId(user.getId());
        userLogin.setEmail(user.getEmail());
        userLogin.setName(user.getUserProfile() != null ? user.getUserProfile().getFullName() : user.getEmail());
        userLogin.setVerified(true);
        userLogin.setRole(role.getName());
        userLogin.setPermissions(permissions);
        userLogin.setAvatar(user.getUserProfile() != null ? user.getUserProfile().getAvatar() : null);
        return new RestLoginDTO.UserGetAccount(userLogin);
    }

    @Transactional
    public RestLoginDTO googleLogin(String credential) {
        log.info("Processing Google login for token credential");
        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + credential;
        GoogleTokenInfo tokenInfo;
        try {
            tokenInfo = restTemplate.getForObject(url, GoogleTokenInfo.class);
        } catch (Exception e) {
            log.error("Failed to verify Google ID token with tokeninfo API: {}", e.getMessage());
            throw new RuntimeException("Xác thực Google ID Token thất bại: " + e.getMessage());
        }

        if (tokenInfo == null || tokenInfo.getEmail() == null) {
            log.error("Google ID token is invalid or does not contain email claim");
            throw new RuntimeException("Xác thực tài khoản Google thất bại.");
        }

        String email = tokenInfo.getEmail();
        String name = tokenInfo.getName() != null ? tokenInfo.getName() : "Người dùng Google";

        log.info("Google verification successful for email: {}", email);
        User user = repository.findByEmail(email).orElseGet(() -> {
            log.info("Email {} not found in database, auto-registering new Google user", email);
            var role = roleRepository.findByName("CANDIDATE")
                    .orElseThrow(() -> new RuntimeException("Mặc định quyền CANDIDATE không tồn tại."));

            User newUser = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode("google-oauth-dummy-pw-" + java.util.UUID.randomUUID()))
                    .role(role)
                    .build();

            UserProfile profile = new UserProfile();
            profile.setFullName(name);
            profile.setUser(newUser);
            newUser.setUserProfile(profile);

            return repository.save(newUser);
        });

        return buildLoginResponse(user);
    }

    @lombok.Data
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class GoogleTokenInfo {
        private String email;
        private String name;
        private String sub;
        private String picture;
    }
}
