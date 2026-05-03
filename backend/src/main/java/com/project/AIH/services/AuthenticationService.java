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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final UserRepository repository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityUtil securityUtil;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public RestLoginDTO register(RegisterRequest request) {
        var role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new RuntimeException("Role not found"));
        
        var user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        UserProfile profile = new UserProfile();
        profile.setFullName("User_" + user.getEmail().split("@")[0]);
        profile.setUser(user);
        user.setUserProfile(profile);

        repository.save(user);
        
        return buildLoginResponse(user);
    }

    @Transactional
    public RestLoginDTO authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow();
                
        return buildLoginResponse(user);
    }

    @Transactional
    public RestLoginDTO refreshToken(String refreshToken, String email) {
        var user = repository.findByRefreshTokenAndEmail(refreshToken, email)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));
                
        return buildLoginResponse(user);
    }

    private RestLoginDTO buildLoginResponse(User user) {
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
        var user = repository.findByEmail(email).orElseThrow();
        user.setRefreshToken(null);
        repository.save(user);
    }

    public RestLoginDTO.UserGetAccount getAccount(String email) {
        User user = repository.findByEmail(email).orElse(null);
        if (user == null) return null;

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

        return new RestLoginDTO.UserGetAccount(userLogin);
    }
}
