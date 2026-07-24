package com.mars.service;

import java.util.List;

import com.mars.dto.HodAcademicianListDto;

public interface HodService {

    /**
     * Get academicians in the same department as the specified HOD user,
     * including their statistics.
     *
     * @param hodUserId The user ID of the HOD
     * @return List of academicians with their stats
     */
    List<HodAcademicianListDto> getDepartmentAcademicians(Integer hodUserId);
}
