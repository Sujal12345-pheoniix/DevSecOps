package com.devtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class JwtAuthenticationResponse {
    private String accessToken;
    private final String tokenType = "Bearer";
    private Long id;
    private String username;
    private String email;
    private String role;
}
