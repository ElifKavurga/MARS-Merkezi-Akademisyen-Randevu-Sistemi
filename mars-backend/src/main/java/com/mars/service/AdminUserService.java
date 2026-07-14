package com.mars.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.admin.UserListResponse;
import com.mars.mapper.UserMapper;
import com.mars.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public List<UserListResponse> getAllUsers() {
        return userRepository.findAllWithRoleAndDepartment().stream()
                .map(userMapper::toUserListResponse)
                .toList();
    }
}
