package com.monitoring.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for service action response (result of start/stop operations).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceActionResponse {
    private String instanceId;
    private String serviceName;
    private boolean success;
    private String message;
    private String newStatus;
    
    /**
     * Constructor for successful action with new status.
     */
    public ServiceActionResponse(String instanceId, String serviceName, boolean success, String message) {
        this.instanceId = instanceId;
        this.serviceName = serviceName;
        this.success = success;
        this.message = message;
    }
}
