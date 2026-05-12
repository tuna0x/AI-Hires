package com.project.AIH.config;

import com.project.AIH.models.Permission;
import com.project.AIH.models.Role;
import com.project.AIH.models.User;
import com.project.AIH.services.UserService;
import com.project.AIH.utils.SecurityUtil;
import com.project.AIH.utils.error.PermissionException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

import java.util.List;

@Component
public class PermissionInterceptor implements HandlerInterceptor {
    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

    @Autowired
    private UserService userService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = (String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        String httpMethod = request.getMethod();

        // 1. Whitelist endpoints
        if (path != null && (
                path.startsWith("/api/v1/auth/") ||
                path.startsWith("/actuator") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/swagger-ui")
        )) {
            return true;
        }

        // 2. Get current user's permissions from DB
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        if (email.isEmpty()) {
            return true; // Spring Security will handle unauthorized access
        }

        User user = userService.fetchUserByEmail(email);
        if (user != null) {
            Role role = user.getRole();
            if (role != null) {
                // ADMIN has all permissions
                if (role.getName().equals("ADMIN")) {
                    return true;
                }

                List<Permission> permissions = role.getPermissions();
                if (permissions != null) {
                    boolean isAllowed = permissions.stream().anyMatch(p -> 
                            p.getMethod().equalsIgnoreCase(httpMethod)
                                    && matchesPermissionPath(p.getApiPath(), path)
                    );

                    if (!isAllowed) {
                        throw new PermissionException("You don't have permission to access this endpoint");
                    }
                } else {
                    throw new PermissionException("You don't have permission to access this endpoint");
                }
            }
        }

        return true;
    }

    private boolean matchesPermissionPath(String permissionPath, String requestMappingPath) {
        if (permissionPath == null || requestMappingPath == null) {
            return false;
        }
        if (permissionPath.equals(requestMappingPath)) {
            return true;
        }
        return PATH_MATCHER.match(permissionPath, requestMappingPath);
    }
}
