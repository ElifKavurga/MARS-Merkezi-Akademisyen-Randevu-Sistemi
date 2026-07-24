package com.mars.dto.user;

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
public class UserProfileResponseDto {
    private Integer userId;
    private String fullName;
    private String institutionalEmail;
    private String role;
    private String department;
    private String academicTitle;
    private Boolean isActive;
}
