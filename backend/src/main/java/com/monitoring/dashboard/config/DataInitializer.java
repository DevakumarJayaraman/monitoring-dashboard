package com.monitoring.dashboard.config;

import com.monitoring.dashboard.model.*;
import com.monitoring.dashboard.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Random;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final InfrastructureRepository infrastructureRepository;
    private final InfraResourceLimitRepository resourceLimitRepository;
    private final InfraUsageMetricRepository usageMetricRepository;
    private final ServiceRepository serviceRepository;
    private final ServiceDeploymentRepository deploymentRepository;
    private final Random random = new Random();

    @Override
    public void run(String... args) {
        log.info("Initializing sample data...");

        if (infrastructureRepository.count() == 0) {
            initializeData();
            log.info("Sample data initialization completed");
        } else {
            log.info("Data already exists, skipping initialization");
        }
    }

    private void initializeData() {
        // Create Infrastructure
        Infrastructure apacqaVm1 = createInfrastructure("apacqa-vm1", "linux", "192.168.1.10", "10.0.1.10", "UAT");
        Infrastructure apacqaVm2 = createInfrastructure("apacqa-vm2", "linux", "192.168.1.11", "10.0.1.11", "UAT");
        Infrastructure apacuatVm1 = createInfrastructure("apacuat-vm1", "linux", "192.168.1.20", "10.0.1.20", "UAT");
        Infrastructure prodEcs1 = createInfrastructure("prod-ecs-cluster-1", "ecs", "prod-ecs-1.aws.com", null, "PROD");
        Infrastructure prodWin1 = createInfrastructure("prod-win-vm1", "windows", "192.168.2.10", "10.0.2.10", "PROD");
        Infrastructure devLinux1 = createInfrastructure("dev-linux-vm1", "linux", "192.168.3.10", "10.0.3.10", "DEV");

        // Add resource limits
        addResourceLimits(apacqaVm1, 4.0, 16.0, 100.0);
        addResourceLimits(apacqaVm2, 4.0, 16.0, 100.0);
        addResourceLimits(apacuatVm1, 4.0, 16.0, 100.0);
        addResourceLimits(prodEcs1, 8.0, 32.0, 500.0);
        addResourceLimits(prodWin1, 8.0, 32.0, 200.0);
        addResourceLimits(devLinux1, 2.0, 8.0, 50.0);

        // Add usage metrics
        addUsageMetrics(apacqaVm1, 2.4, 60.0, 8.1, 50.6, 45.0, 45.0);
        addUsageMetrics(apacqaVm2, 2.6, 65.0, 8.4, 52.5, 48.0, 48.0);
        addUsageMetrics(apacuatVm1, 1.8, 45.0, 6.2, 38.8, 32.0, 32.0);
        addUsageMetrics(prodEcs1, 5.2, 65.0, 20.5, 64.1, 285.0, 57.0);
        addUsageMetrics(prodWin1, 6.1, 76.3, 24.8, 77.5, 142.0, 71.0);
        addUsageMetrics(devLinux1, 1.2, 60.0, 4.5, 56.3, 28.0, 56.0);

        // Create Services
        Service paymentService = createService("payment-service", "Handles payment processing", "Payments Team");
        Service authService = createService("auth-service", "Authentication and authorization", "Security Team");
        Service tradeService = createService("trade-service", "Trade capture and processing", "Trading Team");
        Service riskService = createService("risk-service", "Risk calculation engine", "Risk Team");
        Service reportService = createService("report-service", "Report generation", "Analytics Team");

        // Create Deployments
        createDeployment(paymentService, apacqaVm1, "apacqa", 8080);
        createDeployment(paymentService, apacqaVm2, "apacqa", 8080);
        createDeployment(paymentService, apacuatVm1, "apacuat", 8080);
        createDeployment(paymentService, prodEcs1, "prod", 8080);

        createDeployment(authService, apacqaVm1, "apacqa", 8081);
        createDeployment(authService, prodEcs1, "prod", 8081);
        createDeployment(authService, devLinux1, "dev", 8081);

        createDeployment(tradeService, apacuatVm1, "apacuat", 9000);
        createDeployment(tradeService, prodEcs1, "prod", 9000);

        createDeployment(riskService, prodWin1, "prod", 9100);
        createDeployment(riskService, prodEcs1, "prod", 9100);

        createDeployment(reportService, devLinux1, "dev", 9200);
        createDeployment(reportService, apacuatVm1, "apacuat", 9200);

        log.info("Created {} infrastructure instances", infrastructureRepository.count());
        log.info("Created {} services", serviceRepository.count());
        log.info("Created {} deployments", deploymentRepository.count());
    }

    private Infrastructure createInfrastructure(String name, String type, String hostname, String ipAddress, String environment) {
        Infrastructure infra = new Infrastructure();
        infra.setInfraName(name);
        infra.setInfraType(type);
        infra.setHostname(hostname);
        infra.setIpAddress(ipAddress);
        infra.setEnvironment(environment);
        return infrastructureRepository.save(infra);
    }

    private void addResourceLimits(Infrastructure infra, Double cpuLimit, Double memoryLimit, Double diskLimit) {
        InfraResourceLimit cpuLim = new InfraResourceLimit();
        cpuLim.setInfrastructure(infra);
        cpuLim.setResourceName("cpu");
        cpuLim.setLimitValue(String.valueOf(cpuLimit));
        cpuLim.setUnit("vCPU");
        resourceLimitRepository.save(cpuLim);

        InfraResourceLimit memLim = new InfraResourceLimit();
        memLim.setInfrastructure(infra);
        memLim.setResourceName("memory");
        memLim.setLimitValue(String.valueOf(memoryLimit));
        memLim.setUnit("GiB");
        resourceLimitRepository.save(memLim);

        InfraResourceLimit diskLim = new InfraResourceLimit();
        diskLim.setInfrastructure(infra);
        diskLim.setResourceName("disk");
        diskLim.setLimitValue(String.valueOf(diskLimit));
        diskLim.setUnit("GiB");
        resourceLimitRepository.save(diskLim);
    }

    private void addUsageMetrics(Infrastructure infra, Double cpuUsage, Double cpuPct, 
                                 Double memUsage, Double memPct, Double diskUsage, Double diskPct) {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        InfraUsageMetric cpuMetric = new InfraUsageMetric();
        cpuMetric.setInfrastructure(infra);
        cpuMetric.setMetricName("cpu_usage");
        cpuMetric.setMetricValue(String.valueOf(cpuUsage));
        cpuMetric.setUnit("cores");
        cpuMetric.setMetricDate(today);
        cpuMetric.setMetricTime(now);
        usageMetricRepository.save(cpuMetric);

        InfraUsageMetric cpuPctMetric = new InfraUsageMetric();
        cpuPctMetric.setInfrastructure(infra);
        cpuPctMetric.setMetricName("cpu_usage_pct");
        cpuPctMetric.setMetricValue(String.valueOf(cpuPct));
        cpuPctMetric.setUnit("%");
        cpuPctMetric.setMetricDate(today);
        cpuPctMetric.setMetricTime(now);
        usageMetricRepository.save(cpuPctMetric);

        InfraUsageMetric memMetric = new InfraUsageMetric();
        memMetric.setInfrastructure(infra);
        memMetric.setMetricName("memory_usage");
        memMetric.setMetricValue(String.valueOf(memUsage));
        memMetric.setUnit("GiB");
        memMetric.setMetricDate(today);
        memMetric.setMetricTime(now);
        usageMetricRepository.save(memMetric);

        InfraUsageMetric memPctMetric = new InfraUsageMetric();
        memPctMetric.setInfrastructure(infra);
        memPctMetric.setMetricName("memory_usage_pct");
        memPctMetric.setMetricValue(String.valueOf(memPct));
        memPctMetric.setUnit("%");
        memPctMetric.setMetricDate(today);
        memPctMetric.setMetricTime(now);
        usageMetricRepository.save(memPctMetric);

        InfraUsageMetric diskMetric = new InfraUsageMetric();
        diskMetric.setInfrastructure(infra);
        diskMetric.setMetricName("disk_usage");
        diskMetric.setMetricValue(String.valueOf(diskUsage));
        diskMetric.setUnit("GiB");
        diskMetric.setMetricDate(today);
        diskMetric.setMetricTime(now);
        usageMetricRepository.save(diskMetric);

        InfraUsageMetric diskPctMetric = new InfraUsageMetric();
        diskPctMetric.setInfrastructure(infra);
        diskPctMetric.setMetricName("disk_usage_pct");
        diskPctMetric.setMetricValue(String.valueOf(diskPct));
        diskPctMetric.setUnit("%");
        diskPctMetric.setMetricDate(today);
        diskPctMetric.setMetricTime(now);
        usageMetricRepository.save(diskPctMetric);
    }

    private Service createService(String name, String description, String team) {
        Service service = new Service();
        service.setServiceName(name);
        service.setDescription(description);
        service.setOwningTeam(team);
        return serviceRepository.save(service);
    }

    private void createDeployment(Service service, Infrastructure infra, String profile, Integer port) {
        ServiceDeployment deployment = new ServiceDeployment();
        deployment.setService(service);
        deployment.setInfrastructure(infra);
        deployment.setProfile(profile);
        deployment.setPort(port);
        deploymentRepository.save(deployment);
    }
}
