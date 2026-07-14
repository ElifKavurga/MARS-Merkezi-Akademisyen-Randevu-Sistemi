package com.mars.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {

    private String fullName;
    private String institutionalEmail;
    private String password;
    private Integer roleId;
    private Integer departmentId;
}
