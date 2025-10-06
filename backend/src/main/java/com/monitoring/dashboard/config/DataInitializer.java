package com.monitoring.dashboard.config;

import com.monitoring.dashboard.model.*;
import com.monitoring.dashboard.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@org.springframework.stereotype.Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final InfrastructureRepository infrastructureRepository;
    private final InfraMetricsRepository infraMetricsRepository;
    private final ProjectRepository projectRepository;
    private final RoleFunctionAccessRepository accessRepository;
    private final ComponentRepository componentRepository;
    private final ComponentDeploymentRepository componentDeploymentRepository;
    private final ServiceInstanceRepository serviceInstanceRepository;

    private final Random random = new Random(42); // Fixed seed for reproducibility

    @Override
    public void run(String... args) {
        log.info("Initializing sample data...");
        initializeData();
        log.info("Sample data initialization completed");
    }

    private void initializeData() {
        // Clear all existing data
        serviceInstanceRepository.deleteAll();
        componentDeploymentRepository.deleteAll();
        componentRepository.deleteAll();
        infraMetricsRepository.deleteAll();
        infrastructureRepository.deleteAll();
        accessRepository.deleteAll();
        projectRepository.deleteAll();

        infrastructureRepository.flush();
        log.info("Cleared all data from DB.");

        // --- Create Projects ---
        Project tradeProject = createProject("Trade Management", "Trade operations, settlement, and execution management");
        Project kycProject = createProject("KYC", "Know Your Customer compliance and verification");

        log.info("Created projects: {} and {}", tradeProject.getProjectName(), kycProject.getProjectName());

        // --- Create Infrastructure for both projects ---
        Map<String, Infrastructure> tradeInfraMap = loadInfrastructure(tradeProject);
        Map<String, Infrastructure> kycInfraMap = loadInfrastructure(kycProject);

        // --- Generate Services ---
        generateTradeManagementServices(tradeProject, tradeInfraMap);
        generateKYCServices(kycProject, kycInfraMap);

        // --- Create Components for both projects ---
        loadComponents(tradeProject, "Trade");
        loadComponents(kycProject, "KYC");

        // Access control setup
        accessRepository.save(new RoleFunctionAccess("default", "VIEW_ALL", "STAGING", "Y"));
        accessRepository.save(new RoleFunctionAccess("Support", "VIEW_ALL", "PROD", "Y"));
        accessRepository.save(new RoleFunctionAccess("Support", "MANAGE_SERVICES", "PROD", "Y"));
        accessRepository.save(new RoleFunctionAccess("Support", "CONFIG_UPDATE", "PROD", "Y"));
        accessRepository.save(new RoleFunctionAccess("Developer", "VIEW_ALL", null, "Y"));
        accessRepository.save(new RoleFunctionAccess("Developer", "MANAGE_SERVICES", "STAGING", "Y"));
        accessRepository.save(new RoleFunctionAccess("Admin", "VIEW_ALL", null, "Y"));
        accessRepository.save(new RoleFunctionAccess("Admin", "EDIT_INFRA", null, "Y"));
        accessRepository.save(new RoleFunctionAccess("Admin", "EDIT_SERVICES", null, "Y"));
        accessRepository.save(new RoleFunctionAccess("Admin", "CONFIG_UPDATE", null, "Y"));

        log.info("Created {} infrastructure instances", infrastructureRepository.count());
        log.info("Created {} components", componentRepository.count());
        log.info("Created {} service instances", serviceInstanceRepository.count());
    }

    private Project createProject(String name, String description) {
        Project project = new Project(name, description);

        // DEV Environment (no region)
        ProjectEnvironment devEnv = new ProjectEnvironment("DEV", null, "dev", "Development environment");
        
        // STAGING Environments (APAC, EMEA, NAM)
        ProjectEnvironment stagingApacQa = new ProjectEnvironment("STAGING", "APAC", "apacqa", "APAC STAGING QA");
        ProjectEnvironment stagingApacUat = new ProjectEnvironment("STAGING", "APAC", "apacuat", "APAC STAGING UAT");
        ProjectEnvironment stagingApacDailyRefresh = new ProjectEnvironment("STAGING", "APAC", "apacdailyrefresh", "APAC STAGING Daily Refresh");
        
        ProjectEnvironment stagingEmeaQa = new ProjectEnvironment("STAGING", "EMEA", "emeaqa", "EMEA STAGING QA");
        ProjectEnvironment stagingEmeaUat = new ProjectEnvironment("STAGING", "EMEA", "emeauat", "EMEA STAGING UAT");
        ProjectEnvironment stagingEmeaDailyRefresh = new ProjectEnvironment("STAGING", "EMEA", "emeadailyrefresh", "EMEA STAGING Daily Refresh");
        
        ProjectEnvironment stagingNamQa = new ProjectEnvironment("STAGING", "NAM", "namqa", "NAM STAGING QA");
        ProjectEnvironment stagingNamUat = new ProjectEnvironment("STAGING", "NAM", "namuat", "NAM STAGING UAT");
        ProjectEnvironment stagingNamDailyRefresh = new ProjectEnvironment("STAGING", "NAM", "namdailyrefresh", "NAM STAGING Daily Refresh");
        
        // PROD Environments (APAC, EMEA, NAM)
        ProjectEnvironment prodApacProd = new ProjectEnvironment("PROD", "APAC", "apacprod", "APAC Production");
        ProjectEnvironment prodEmeaProd = new ProjectEnvironment("PROD", "EMEA", "emeaprod", "EMEA Production");
        ProjectEnvironment prodNamProd = new ProjectEnvironment("PROD", "NAM", "namprod", "NAM Production");
        
        // COB (Disaster Recovery) Environments (APAC, EMEA, NAM)
        ProjectEnvironment cobApac = new ProjectEnvironment("COB", "APAC", "apaccob", "APAC Disaster Recovery");
        ProjectEnvironment cobEmea = new ProjectEnvironment("COB", "EMEA", "emeacob", "EMEA Disaster Recovery");
        ProjectEnvironment cobNam = new ProjectEnvironment("COB", "NAM", "namcob", "NAM Disaster Recovery");
        
        // Add all environments to project
        project.addEnvironment(devEnv);
        project.addEnvironment(stagingApacQa);
        project.addEnvironment(stagingApacUat);
        project.addEnvironment(stagingApacDailyRefresh);
        project.addEnvironment(stagingEmeaQa);
        project.addEnvironment(stagingEmeaUat);
        project.addEnvironment(stagingEmeaDailyRefresh);
        project.addEnvironment(stagingNamQa);
        project.addEnvironment(stagingNamUat);
        project.addEnvironment(stagingNamDailyRefresh);
        project.addEnvironment(prodApacProd);
        project.addEnvironment(prodEmeaProd);
        project.addEnvironment(prodNamProd);
        project.addEnvironment(cobApac);
        project.addEnvironment(cobEmea);
        project.addEnvironment(cobNam);
        
        project = projectRepository.save(project);
        log.info("Created project: {} with {} environments", project.getProjectName(), project.getEnvironments().size());

        return project;
    }

    private Map<String, Infrastructure> loadInfrastructure(Project project) {
        Map<String, Infrastructure> infraMap = new HashMap<>();
        
        // Get project code (first 2 letters)
        String projectCode = project.getProjectName().substring(0, 2).toUpperCase(); // "TR" for Trade, "KY" for KYC
        
        // Create infrastructure for each environment
        List<ProjectEnvironment> environments = new ArrayList<>(project.getEnvironments());

        for (ProjectEnvironment env : environments) {
            String envCode = env.getEnvCode();
            String region = env.getRegionCode() != null ? env.getRegionCode() : "";
            String profileKey = env.getProfileCode();
            
            // Determine suffix based on environment type
            String suffix = "";
            switch (envCode) {
                case "DEV":
                    suffix = "D";
                    break;
                case "STAGING":
                    suffix = "U";
                    break;
                case "PROD":
                    suffix = "P";
                    break;
                case "COB":
                    suffix = "C";
                    break;
            }
            
            // Create 10 of each infrastructure type per environment/region
            String[] infraTypes = {"linux", "windows", "ecs"};
            
            for (String infraType : infraTypes) {
                for (int i = 1; i <= 10; i++) {
                    String machineNumber = String.format("%02d", i);
                    
                    // Naming convention: {ProjectCode}{Region}{Type}{Number}{Suffix}
                    // Examples: TRAPLIN01U, KYNAMWIN05P, KYAPECS03C
                    String regionCode = region.isEmpty() ? "" : region.substring(0, 2); // AP, EM, NA
                    String typeCode = infraType.equals("linux") ? "LIN" : 
                                     infraType.equals("windows") ? "WIN" : "ECS";
                    
                    String infraName = projectCode + regionCode + typeCode + machineNumber + suffix;
                    String hostname = infraName.toLowerCase() + ".example.com";
                    String ipAddress = infraType.equals("ecs") ? null : generateIpAddress();
                    String datacenter = generateDatacenter(region);
                    
                    // Vary resources based on environment and type
                    Double cpuLimit = infraType.equals("ecs") ? 
                                    (envCode.equals("PROD") || envCode.equals("COB") ? 16.0 : 8.0) :
                                    (envCode.equals("PROD") || envCode.equals("COB") ? 8.0 : 4.0);
                    Double memLimit = infraType.equals("ecs") ?
                                    (envCode.equals("PROD") || envCode.equals("COB") ? 64.0 : 32.0) :
                                    (envCode.equals("PROD") || envCode.equals("COB") ? 32.0 : 16.0);
                    
                    // Random usage between 20-80% of limit
                    Double cpuUsage = cpuLimit * (0.2 + random.nextDouble() * 0.6);
                    Double memUsage = memLimit * (0.2 + random.nextDouble() * 0.6);
                    
                    // Random status
                    String[] statuses = {"healthy", "healthy", "healthy", "watch", "scaling"};
                    String status = statuses[random.nextInt(statuses.length)];
                    
                    Infrastructure infra = createInfraWithMetrics(
                        project, env, infraName, infraType, hostname, ipAddress,
                        profileKey, region, datacenter, status, cpuLimit,
                        memLimit, cpuUsage, memUsage
                    );

                    // Store in map with a unique key
                    String mapKey = profileKey + "_" + infraType + "_" + i;
                    infraMap.put(mapKey, infra);
                }
            }
        }

        log.info("Created {} infrastructure instances for project {}", infraMap.size(), project.getProjectName());
        return infraMap;
    }

    private Infrastructure createInfraWithMetrics(Project project, ProjectEnvironment env, String infraName, String type, 
                                                  String hostname, String ipAddress, String environment, String region,
                                                  String datacenter, String status, Double cpuLimit,
                                                  Double memLimit, Double cpuUsage, Double memUsage) {
        Infrastructure infra = new Infrastructure();
        infra.setInfraType(type);
        infra.setInfraName(infraName);
        infra.setHostname(hostname);
        infra.setIpAddress(ipAddress);
        infra.setEnvironment(environment);
        infra.setRegion(region);
        infra.setDatacenter(datacenter);
        infra.setStatus(status);
        infra.setProject(project);
        infra.setProjectEnvironment(env);
        infra = infrastructureRepository.save(infra);

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        if ("ecs".equalsIgnoreCase(type)) {
            // ECS CPU metrics: limit_cpu_max, limit_cpu_used, request_cpu_max, request_cpu_used
            Double limitCpuMax = cpuLimit;
            Double requestCpuMax = cpuLimit * 0.5;
            Double limitCpuUsed = cpuUsage;
            Double requestCpuUsed = cpuUsage * 0.5;
            
            addMetric(infra, "limit_cpu_max", String.valueOf(limitCpuMax), "vCPU", null, null);
            addMetric(infra, "limit_cpu_used", String.valueOf(limitCpuUsed), "vCPU", today, now);
            addMetric(infra, "request_cpu_max", String.valueOf(requestCpuMax), "vCPU", null, null);
            addMetric(infra, "request_cpu_used", String.valueOf(requestCpuUsed), "vCPU", today, now);
            
            // ECS memory metrics: limit_memory_max, limit_memory_used, request_memory_max, request_memory_used
            Double limitMemMax = memLimit;
            Double requestMemMax = memLimit * 0.5;
            Double limitMemUsed = memUsage;
            Double requestMemUsed = memUsage * 0.5;
            
            addMetric(infra, "limit_memory_max", String.valueOf(limitMemMax), "GiB", null, null);
            addMetric(infra, "limit_memory_used", String.valueOf(limitMemUsed), "GiB", today, now);
            addMetric(infra, "request_memory_max", String.valueOf(requestMemMax), "GiB", null, null);
            addMetric(infra, "request_memory_used", String.valueOf(requestMemUsed), "GiB", today, now);
            
            // Pod metrics: pod_max, pod_used
            int podMax = 50 + random.nextInt(150); // 50-200 pods
            int podUsed = 10 + random.nextInt(podMax - 10); // 10 to podMax-1
            addMetric(infra, "pod_max", String.valueOf(podMax), "count", null, null);
            addMetric(infra, "pod_used", String.valueOf(podUsed), "count", today, now);
        } else {
            // VM metrics (linux/windows): cpu_max, cpu_used, memory_max, memory_used, disk_max, disk_used
            addMetric(infra, "cpu_max", String.valueOf(cpuLimit), "vCPU", null, null);
            addMetric(infra, "cpu_used", String.valueOf(cpuUsage), "vCPU", today, now);
            
            addMetric(infra, "memory_max", String.valueOf(memLimit), "GiB", null, null);
            addMetric(infra, "memory_used", String.valueOf(memUsage), "GiB", today, now);
            
            // Disk metrics
            Double diskMax = 100.0 + random.nextDouble() * 400.0; // 100-500 GiB
            Double diskUsed = diskMax * (0.3 + random.nextDouble() * 0.4); // 30-70% used
            addMetric(infra, "disk_max", String.valueOf(diskMax), "GiB", null, null);
            addMetric(infra, "disk_used", String.valueOf(diskUsed), "GiB", today, now);
        }

        return infra;
    }

    private void addMetric(Infrastructure infra, String metricName, String metricValue,
                          String unit, LocalDate date, LocalDateTime time) {
        InfraMetrics metric = new InfraMetrics();
        metric.setInfrastructure(infra);
        metric.setMetricName(metricName);
        metric.setMetricValue(metricValue);
        metric.setUnit(unit);
        metric.setMetricDate(date);
        metric.setMetricTime(time);
        infraMetricsRepository.save(metric);
    }

    private void generateTradeManagementServices(Project project, Map<String, Infrastructure> infraMap) {
        List<String> serviceNames = Arrays.asList(
            // Core Trading Services (15)
            "trade-execution-service", "order-management-service", "trade-matching-engine",
            "position-management-service", "trade-validation-service", "trade-booking-service",
            "price-discovery-service", "market-data-service", "order-routing-service",
            "trade-confirmation-service", "trade-enrichment-service", "trade-lifecycle-service",
            "pre-trade-compliance-service", "post-trade-processing-service", "trade-allocation-service",

            // Settlement & Clearing (10)
            "settlement-service", "clearing-service", "cash-management-service",
            "collateral-management-service", "margin-calculation-service", "reconciliation-service",
            "settlement-instruction-service", "payment-gateway-service", "corporate-actions-service",
            "dividend-processing-service",

            // Risk & Compliance (10)
            "risk-analytics-service", "credit-risk-service", "market-risk-service",
            "operational-risk-service", "regulatory-reporting-service", "trade-surveillance-service",
            "fraud-detection-service", "aml-screening-service", "sanctions-screening-service",
            "risk-limit-monitoring-service",

            // Reference Data & Master Data (8)
            "reference-data-service", "instrument-master-service", "counterparty-master-service",
            "static-data-service", "security-master-service", "entity-master-service",
            "hierarchy-management-service", "data-quality-service",

            // Support & Integration (7)
            "audit-trail-service", "notification-service", "reporting-service",
            "api-gateway-service", "file-transfer-service", "event-streaming-service",
            "analytics-dashboard-service"
        );

        generateServicesForProject(project, infraMap, serviceNames);
    }

    private void generateKYCServices(Project project, Map<String, Infrastructure> infraMap) {
        List<String> serviceNames = Arrays.asList(
            // Customer Onboarding (12)
            "customer-onboarding-service", "identity-verification-service", "document-verification-service",
            "biometric-verification-service", "digital-signature-service", "e-signature-service",
            "customer-screening-service", "customer-due-diligence-service", "enhanced-due-diligence-service",
            "customer-risk-rating-service", "customer-profile-service", "customer-consent-service",

            // Document Management (8)
            "document-upload-service", "document-processing-service", "document-extraction-service",
            "document-classification-service", "document-storage-service", "document-retention-service",
            "document-archival-service", "document-retrieval-service",

            // Verification & Validation (10)
            "address-verification-service", "employment-verification-service", "income-verification-service",
            "bank-account-verification-service", "credit-check-service", "background-check-service",
            "sanctions-check-service", "pep-screening-service", "adverse-media-screening-service",
            "watchlist-screening-service",

            // Compliance & Regulatory (10)
            "aml-compliance-service", "kyc-refresh-service", "periodic-review-service",
            "regulatory-reporting-service", "suspicious-activity-reporting-service", "transaction-monitoring-service",
            "case-management-service", "alert-management-service", "investigation-service",
            "compliance-dashboard-service",

            // Integration & Support (10)
            "third-party-verification-service", "credit-bureau-integration-service", "government-id-verification-service",
            "api-gateway-service", "notification-service", "audit-log-service",
            "workflow-engine-service", "rule-engine-service", "reporting-service",
            "analytics-service"
        );

        generateServicesForProject(project, infraMap, serviceNames);
    }

    private void generateServicesForProject(Project project, Map<String, Infrastructure> infraMap, List<String> serviceNames) {
        List<ProjectEnvironment> allEnvironments = new ArrayList<>(project.getEnvironments());
        int serviceCount = 0;

        for (String serviceName : serviceNames) {
            // 85% of services run on all profiles, 15% on specific regions only
            boolean runOnAllProfiles = random.nextDouble() < 0.85;

            List<ProjectEnvironment> targetEnvironments;
            if (runOnAllProfiles) {
                targetEnvironments = allEnvironments;
            } else {
                // Region-specific service - pick one or two regions
                List<String> regions = Arrays.asList("APAC", "EMEA", "NAM");
                String selectedRegion = regions.get(random.nextInt(regions.size()));

                targetEnvironments = allEnvironments.stream()
                    .filter(env -> env.getRegionCode() == null || env.getRegionCode().equals(selectedRegion))
                    .collect(Collectors.toList());
            }

            // Create service instances for each target environment
            for (ProjectEnvironment env : targetEnvironments) {
                // Pick a random infrastructure from this environment
                String profileKey = env.getProfileCode();
                
                // Find all infrastructure for this profile
                List<String> infraKeys = infraMap.keySet().stream()
                    .filter(key -> key.startsWith(profileKey + "_"))
                    .collect(Collectors.toList());
                
                if (infraKeys.isEmpty()) continue;
                
                // Randomly select one infrastructure
                String selectedKey = infraKeys.get(random.nextInt(infraKeys.size()));
                Infrastructure infra = infraMap.get(selectedKey);
                
                if (infra == null) continue;

                String instanceId = "srv-" + UUID.randomUUID().toString().substring(0, 8);
                int port = 8080 + random.nextInt(100);
                String version = random.nextInt(5) + "." + random.nextInt(10) + "." + random.nextInt(10);
                int uptimeSeconds = random.nextInt(86400) + 3600; // 1 hour to 1 day
                String status = random.nextDouble() < 0.95 ? "running" : "degraded";

                createServiceInstance(
                    instanceId, serviceName, infra.getInfraName(), infra.getInfraType(),
                    env.getProfileCode(), port, version, uptimeSeconds, status
                );
                serviceCount++;
            }
        }

        log.info("Created {} service instances for project {}", serviceCount, project.getProjectName());
    }

    private void createServiceInstance(String instanceId, String serviceName, String machineName,
                                       String infraType, String profile, Integer port,
                                       String version, Integer uptimeSeconds, String status) {
        ServiceInstance instance = new ServiceInstance();
        instance.setInstanceId(instanceId);
        instance.setServiceName(serviceName);
        instance.setMachineName(machineName);
        instance.setInfraType(infraType);
        instance.setProfile(profile);
        instance.setPort(port);
        instance.setVersion(version);
        instance.setUptimeSeconds(uptimeSeconds);
        instance.setStatus(status);
        instance.setLogUrl("https://logs.example.com/" + instanceId);
        instance.setMetricsUrl("https://metrics.example.com/" + instanceId);
        serviceInstanceRepository.save(instance);
    }

    private void loadComponents(Project project, String projectType) {
        if (projectType.equals("Trade")) {
            createComponent(project, "trade-execution-component", "Handles trade execution, matching, and order management across all trading venues.", "Core Trading");
            createComponent(project, "settlement-component", "Manages settlement, clearing, and cash management workflows.", "Settlement & Clearing");
            createComponent(project, "risk-management-component", "Provides risk analytics, monitoring, and compliance capabilities.", "Risk & Compliance");
            createComponent(project, "reference-data-component", "Manages master data for instruments, counterparties, and entities.", "Reference Data");
            createComponent(project, "reporting-component", "Generates and serves regulatory and business reports.", "Support & Integration");
        } else {
            createComponent(project, "onboarding-component", "Handles customer onboarding, verification, and due diligence workflows.", "Customer Onboarding");
            createComponent(project, "document-management-component", "Manages document upload, processing, extraction, and storage.", "Document Management");
            createComponent(project, "verification-component", "Provides identity, address, and background verification services.", "Verification & Validation");
            createComponent(project, "compliance-component", "Manages AML, KYC refresh, case management, and regulatory reporting.", "Compliance & Regulatory");
            createComponent(project, "integration-component", "Handles third-party integrations and API gateway services.", "Integration & Support");
        }
    }

    private Component createComponent(Project project, String name, String description, String module) {
        Component component = new Component();
        component.setComponentName(name);
        component.setDescription(description);
        component.setModule(module);
        component.setProject(project);
        return componentRepository.save(component);
    }

    private String generateIpAddress() {
        return "10." + random.nextInt(255) + "." + random.nextInt(255) + "." + (random.nextInt(250) + 1);
    }

    private String generateDatacenter(String region) {
        if (region == null || region.isEmpty()) {
            return "us-east-1a";
        }

        switch (region) {
            case "APAC":
                return Arrays.asList("ap-southeast-1a", "ap-southeast-1b", "ap-southeast-2a")
                    .get(random.nextInt(3));
            case "EMEA":
                return Arrays.asList("eu-west-1a", "eu-west-1b", "eu-central-1a")
                    .get(random.nextInt(3));
            case "NAM":
                return Arrays.asList("us-east-1a", "us-east-1b", "us-west-2a")
                    .get(random.nextInt(3));
            default:
                return "us-east-1a";
        }
    }
}
