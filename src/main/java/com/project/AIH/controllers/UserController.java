package com.project.AIH.controllers;

import com.project.AIH.dto.ResultPaginationDTO;
import com.project.AIH.dto.user.ReqUpdateUserDTO;
import com.project.AIH.dto.user.ResUserDTO;
import com.project.AIH.models.User;
import com.project.AIH.services.UserService;
import com.project.AIH.utils.annotation.ApiMessage;
import com.project.AIH.utils.error.IdInvalidException;
import com.turkraft.springfilter.boot.Filter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @ApiMessage("Create user successfully")
    public ResponseEntity<ResUserDTO> createUser(@Valid @RequestBody User user) throws IdInvalidException {
        if (userService.existsByEmail(user.getEmail())) {
            throw new IdInvalidException("Email already exists");
        }
        User newUser = userService.handleCreateUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.convertToResUserDTO(newUser));
    }

    @GetMapping("/{id}")
    @ApiMessage("Fetch user by id successfully")
    public ResponseEntity<ResUserDTO> getUserById(@PathVariable Long id) throws IdInvalidException {
        User user = userService.fetchUserById(id);
        if (user == null) {
            throw new IdInvalidException("User id not found");
        }
        return ResponseEntity.ok(userService.convertToResUserDTO(user));
    }

    @GetMapping
    @ApiMessage("Fetch all users successfully")
    public ResponseEntity<ResultPaginationDTO> getAllUsers(
            @Filter Specification<User> spec,
            Pageable pageable
    ) {
        return ResponseEntity.ok(userService.fetchAllUsers(spec, pageable));
    }

    @PutMapping
    @ApiMessage("Update user successfully")
    public ResponseEntity<ResUserDTO> updateUser(@RequestBody ReqUpdateUserDTO req) throws IdInvalidException {
        User updatedUser = userService.handleUpdateUser(req);
        if (updatedUser == null) {
            throw new IdInvalidException("User id not found");
        }
        return ResponseEntity.ok(userService.convertToResUserDTO(updatedUser));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete user successfully")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) throws IdInvalidException {
        if (userService.fetchUserById(id) == null) {
            throw new IdInvalidException("User id not found");
        }
        userService.handleDeleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
