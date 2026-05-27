package com.devtrack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProjectRequest {
    @NotBlank
    @Size(min = 3, max = 100)
    private String name;

    @Size(max = 500)
    private String description;
}
