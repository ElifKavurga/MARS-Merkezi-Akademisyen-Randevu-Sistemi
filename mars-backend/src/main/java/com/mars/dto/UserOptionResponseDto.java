package com.mars.dto;

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
public class UserOptionResponseDto {

    private Integer userId;
    private String fullName;
    private String institutionalEmail;
    private String departmentName;
}
