package com.mars.repository;

import com.mars.entity.WaitlistEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WaitlistEntryRepository extends JpaRepository<WaitlistEntry, Integer> {
}
