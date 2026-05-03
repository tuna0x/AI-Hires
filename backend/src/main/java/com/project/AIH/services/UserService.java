package com.project.AIH.services;

import com.project.AIH.dto.ResultPaginationDTO;
import com.project.AIH.dto.user.ReqUpdateUserDTO;
import com.project.AIH.dto.user.ResUserDTO;
import com.project.AIH.models.Role;
import com.project.AIH.models.User;
import com.project.AIH.models.UserProfile;
import com.project.AIH.repositories.RoleRepository;
import com.project.AIH.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User handleCreateUser(User user) {
        // Encode password
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // Handle Role
        if (user.getRole() != null && user.getRole().getId() != null) {
            Role role = roleRepository.findById(user.getRole().getId()).orElse(null);
            user.setRole(role);
        } else {
            roleRepository.findByName("CANDIDATE").ifPresent(user::setRole);
        }

        // Handle UserProfile
        if (user.getUserProfile() == null) {
            UserProfile profile = new UserProfile();
            profile.setFullName("User_" + user.getEmail().split("@")[0]);
            profile.setUser(user);
            user.setUserProfile(profile);
        } else {
            user.getUserProfile().setUser(user);
        }
        
        return userRepository.save(user);
    }

    public User fetchUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    @Transactional(readOnly = true)
    public User fetchUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    @Transactional
    public User handleUpdateUser(ReqUpdateUserDTO req) {
        User currentUser = fetchUserById(req.getId());
        if (currentUser != null) {
            UserProfile profile = currentUser.getUserProfile();
            if (profile == null) {
                profile = new UserProfile();
                profile.setUser(currentUser);
                currentUser.setUserProfile(profile);
            }
            
            if (req.getFullName() != null) profile.setFullName(req.getFullName());
            if (req.getPhoneNumber() != null) profile.setPhoneNumber(req.getPhoneNumber());
            if (req.getAvatar() != null) profile.setAvatar(req.getAvatar());
            
            return userRepository.save(currentUser);
        }
        return null;
    }

    @Transactional
    public void handleDeleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public ResultPaginationDTO fetchAllUsers(Specification<User> spec, Pageable pageable) {
        Page<User> pageUser = userRepository.findAll(spec, pageable);
        
        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        
        meta.setPage(pageUser.getNumber() + 1);
        meta.setPageSize(pageUser.getSize());
        meta.setPages(pageUser.getTotalPages());
        meta.setTotal(pageUser.getTotalElements());
        
        rs.setMeta(meta);
        
        List<ResUserDTO> listUser = pageUser.getContent().stream()
                .map(this::convertToResUserDTO)
                .collect(Collectors.toList());
        
        rs.setResult(listUser);
        
        return rs;
    }

    public ResUserDTO convertToResUserDTO(User user) {
        if (user == null) return null;
        
        ResUserDTO res = ResUserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .active(user.isActive())
                .verified(user.isVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .createdBy(user.getCreatedBy())
                .updatedBy(user.getUpdatedBy())
                .build();
        
        UserProfile profile = user.getUserProfile();
        if (profile != null) {
            res.setFullName(profile.getFullName());
            res.setPhoneNumber(profile.getPhoneNumber());
            res.setAvatar(profile.getAvatar());
        }
        
        if (user.getRole() != null) {
            res.setRole(new ResUserDTO.RoleUser(user.getRole().getId(), user.getRole().getName()));
        }
        
        return res;
    }

    public boolean existsByEmail(String email) {
        return userRepository.findByEmail(email).isPresent();
    }
}
