package com.mars.dto.admin;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserListResponse {

    private Integer userId;
    private String fullName;
    private String institutionalEmail;
    private String role;
    private String department;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
