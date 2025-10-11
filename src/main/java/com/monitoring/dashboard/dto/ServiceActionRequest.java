package com.monitoring.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for service action requests (start/stop operations).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceActionRequest {
    private List<String> instanceIds;
}
