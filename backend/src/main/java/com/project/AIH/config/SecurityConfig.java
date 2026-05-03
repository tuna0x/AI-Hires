package com.project.AIH.config;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.oauth2.server.resource.web.access.BearerTokenAccessDeniedHandler;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.util.Base64;
import com.project.AIH.utils.SecurityUtil;

@Configuration
@EnableMethodSecurity(securedEnabled = true)
// Renamed file to SecurityConfig.java — class must match filename
public class SecurityConfig {
        @Value("${app.jwt.secret}")
        private String jwtKey;

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        @Bean
        public RoleHierarchy roleHierarchy() {
                String hierarchy = "SUPER_ADMIN > ROLE_USER";
                return RoleHierarchyImpl.fromHierarchy(hierarchy);
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http,
                        CustomAuthenticationEntryPoint customAuthenticationEntryPoint) throws Exception {

                String[] whiteList = {
                                "/",
                                "/api/v1/auth/login",
                                "/api/v1/auth/refresh",
                                "/api/v1/auth/register",
                                "/api/v1/auth/logout",
                                "/api/v1/auth/social-login",
                                "/websocket/**",
                                "/actuator/health",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                };
                http.csrf(c -> c.disable())
                                .cors(Customizer.withDefaults())
                                .authorizeHttpRequests(
                                                authz -> authz
                                                                .requestMatchers(whiteList).permitAll()
                                                                .anyRequest().authenticated())
                                .oauth2ResourceServer((oauth2) -> oauth2.jwt(Customizer.withDefaults())
                                                .authenticationEntryPoint(customAuthenticationEntryPoint))

                                .exceptionHandling(
                                                exceptions -> exceptions
                                                                .authenticationEntryPoint(
                                                                                new BearerTokenAuthenticationEntryPoint()) // 401
                                                                .accessDeniedHandler(
                                                                                new BearerTokenAccessDeniedHandler())) // 403
                                .formLogin(f -> f.disable())
                                .sessionManagement(
                                                session -> session.sessionCreationPolicy(
                                                                SessionCreationPolicy.STATELESS));
                return http.build();
        }

        @Bean
        public JwtAuthenticationConverter jwtAuthenticationConverter() {
                JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
                grantedAuthoritiesConverter.setAuthorityPrefix("");
                grantedAuthoritiesConverter.setAuthoritiesClaimName("permission");

                JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
                jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
                return jwtAuthenticationConverter;
        }

        @Bean
        public JwtEncoder jwtEncoder() {
                return new NimbusJwtEncoder(new ImmutableSecret<>(getSecretKey()));
        }

        @Bean
        public JwtDecoder jwtDecoder() {
                NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withSecretKey(
                                getSecretKey()).macAlgorithm(SecurityUtil.JWT_ALGORITHM).build();
                return token -> {
                        try {
                                return jwtDecoder.decode(token);
                        } catch (Exception e) {
                                throw e;
                        }
                };
        }

        private SecretKey getSecretKey() {
                byte[] keyBytes = Base64.from(jwtKey).decode();
                return new SecretKeySpec(keyBytes, 0, keyBytes.length, SecurityUtil.JWT_ALGORITHM.getName());
        }

}
