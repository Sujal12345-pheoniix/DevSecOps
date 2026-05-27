package com.devtrack.service;

import com.devtrack.dto.JwtAuthenticationResponse;
import com.devtrack.dto.LoginRequest;
import com.devtrack.dto.SignUpRequest;
import com.devtrack.dto.UserResponse;
import com.devtrack.exception.BadRequestException;
import com.devtrack.model.Role;
import com.devtrack.model.User;
import com.devtrack.repository.UserRepository;
import com.devtrack.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public JwtAuthenticationResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new BadRequestException("User profile not found."));

        return new JwtAuthenticationResponse(
                jwt,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    public User registerUser(SignUpRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            throw new BadRequestException("Username is already taken!");
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new BadRequestException("Email Address already in use!");
        }

        Role userRole = Role.ROLE_DEVELOPER;
        if (signUpRequest.getRole() != null) {
            try {
                userRole = Role.valueOf("ROLE_" + signUpRequest.getRole().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Invalid user role. Allowed: ADMIN, DEVELOPER, MANAGER");
            }
        }

        User user = User.builder()
                .username(signUpRequest.getUsername())
                .email(signUpRequest.getEmail())
                .password(passwordEncoder.encode(signUpRequest.getPassword()))
                .role(userRole)
                .build();

        return userRepository.save(user);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole().name()))
                .collect(Collectors.toList());
    }
}
