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
    private final EnvironmentRepository environmentRepository;
    private final RegionRepository regionRepository;
    private final ProjectEnvironmentMappingRepository projectEnvironmentMappingRepository;
    private final ProjectEnvironmentRepository projectEnvironmentRepository;

    private final Random random = new Random(42); // Fixed seed for reproducibility

    private record ProfileSeed(String envCode, String regionCode, String profileCode, String profileDescription) {}

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
        projectEnvironmentRepository.deleteAll();
        projectEnvironmentMappingRepository.deleteAll();
        projectRepository.deleteAll();
        environmentRepository.deleteAll();
        regionRepository.deleteAll();

        infrastructureRepository.flush();
        log.info("Cleared all data from DB.");

        // --- Seed master tables ---
        Map<String, Environment> environmentMap = seedEnvironments();
        Map<String, Region> regionMap = seedRegions();
        List<ProfileSeed> profileSeeds = buildProfileSeeds();

        log.info("Created {} environments and {} regions", environmentMap.size(), regionMap.size());

        // --- Create Projects ---
        Project tradeProject = createProject(
                "Trade Management",
                "Trade operations, settlement, and execution management",
                environmentMap,
                regionMap,
                profileSeeds);

        Project kycProject = createProject(
                "KYC",
                "Know Your Customer compliance and verification",
                environmentMap,
                regionMap,
                profileSeeds);

        log.info("Created projects: {} and {}", tradeProject.getProjectName(), kycProject.getProjectName());

        // --- Create Components for both projects FIRST ---
        Map<String, Component> tradeComponentsMap = loadComponents(tradeProject, "Trade");
        Map<String, Component> kycComponentsMap = loadComponents(kycProject, "KYC");

        // --- Create Infrastructure for both projects ---
        Map<String, Infrastructure> tradeInfraMap = loadInfrastructure(tradeProject);
        Map<String, Infrastructure> kycInfraMap = loadInfrastructure(kycProject);

        // --- Generate Services with Component mapping ---
        generateTradeManagementServices(tradeProject, tradeInfraMap, tradeComponentsMap);
        generateKYCServices(kycProject, kycInfraMap, kycComponentsMap);

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

    private Map<String, Environment> seedEnvironments() {
        Map<String, Environment> environments = new HashMap<>();

        environments.put("DEV", environmentRepository.save(new Environment("DEV", "Development environment")));
        environments.put("STAGING", environmentRepository.save(new Environment("STAGING", "Staging/UAT environment")));
        environments.put("PROD", environmentRepository.save(new Environment("PROD", "Production environment")));
        environments.put("COB", environmentRepository.save(new Environment("COB", "Continuity of Business")));

        return environments;
    }

    private Map<String, Region> seedRegions() {
        Map<String, Region> regions = new HashMap<>();

        regions.put("GLOBAL", regionRepository.save(new Region("GLOBAL", "Global/Non-region specific")));
        regions.put("APAC", regionRepository.save(new Region("APAC", "Asia Pacific")));
        regions.put("EMEA", regionRepository.save(new Region("EMEA", "Europe, Middle East & Africa")));
        regions.put("NAM", regionRepository.save(new Region("NAM", "North America")));

        return regions;
    }

    private List<ProfileSeed> buildProfileSeeds() {
        List<ProfileSeed> seeds = new ArrayList<>();

        // DEV (Global)
        seeds.add(new ProfileSeed("DEV", "GLOBAL", "dev", "Development environment"));

        // STAGING profiles
        seeds.add(new ProfileSeed("STAGING", "APAC", "apacqa", "APAC STAGING QA"));
        seeds.add(new ProfileSeed("STAGING", "APAC", "apacuat", "APAC STAGING UAT"));
        seeds.add(new ProfileSeed("STAGING", "APAC", "apacdailyrefresh", "APAC STAGING Daily Refresh"));

        seeds.add(new ProfileSeed("STAGING", "EMEA", "emeaqa", "EMEA STAGING QA"));
        seeds.add(new ProfileSeed("STAGING", "EMEA", "emeauat", "EMEA STAGING UAT"));
        seeds.add(new ProfileSeed("STAGING", "EMEA", "emeadailyrefresh", "EMEA STAGING Daily Refresh"));

        seeds.add(new ProfileSeed("STAGING", "NAM", "namqa", "NAM STAGING QA"));
        seeds.add(new ProfileSeed("STAGING", "NAM", "namuat", "NAM STAGING UAT"));
        seeds.add(new ProfileSeed("STAGING", "NAM", "namdailyrefresh", "NAM STAGING Daily Refresh"));

        // PROD profiles
        seeds.add(new ProfileSeed("PROD", "APAC", "apacprod", "APAC Production"));
        seeds.add(new ProfileSeed("PROD", "EMEA", "emeaprod", "EMEA Production"));
        seeds.add(new ProfileSeed("PROD", "NAM", "namprod", "NAM Production"));

        // COB profiles
        seeds.add(new ProfileSeed("COB", "APAC", "apaccob", "APAC Disaster Recovery"));
        seeds.add(new ProfileSeed("COB", "EMEA", "emeacob", "EMEA Disaster Recovery"));
        seeds.add(new ProfileSeed("COB", "NAM", "namcob", "NAM Disaster Recovery"));

        return seeds;
    }

    private Project createProject(String name,
                                  String description,
                                  Map<String, Environment> environmentMap,
                                  Map<String, Region> regionMap,
                                  List<ProfileSeed> profileSeeds) {
        Project project = new Project(name, description);
        project = projectRepository.save(project);

        Map<String, ProjectEnvironmentMapping> mappingCache = new HashMap<>();

        for (ProfileSeed seed : profileSeeds) {
            Environment environment = environmentMap.get(seed.envCode());
            Region region = regionMap.get(seed.regionCode());

            if (environment == null) {
                throw new IllegalStateException("Missing environment for code " + seed.envCode());
            }
            if (region == null) {
                throw new IllegalStateException("Missing region for code " + seed.regionCode());
            }

            String key = seed.envCode() + "::" + seed.regionCode();
            ProjectEnvironmentMapping mapping = mappingCache.get(key);
            if (mapping == null) {
                mapping = new ProjectEnvironmentMapping();
                mapping.setEnvironment(environment);
                mapping.setRegion(region);
                project.addEnvironmentMapping(mapping);
                mapping = projectEnvironmentMappingRepository.save(mapping);
                mappingCache.put(key, mapping);
            }

            ProjectProfiles profile = new ProjectProfiles();
            profile.setProjectEnvironmentMapping(mapping);
            profile.setProfileCode(seed.profileCode());
            profile.setProfileDesc(seed.profileDescription());
            profile.setStatus("ACTIVE");
            projectEnvironmentRepository.save(profile);
        }

        log.info("Created project: {} with {} environment mappings and {} profiles",
                project.getProjectName(),
                project.getEnvironmentMappings().size(),
                projectEnvironmentRepository.findByProjectEnvironmentMappingProjectProjectId(project.getProjectId()).size());

        return project;
    }

    private Map<String, Infrastructure> loadInfrastructure(Project project) {
        Map<String, Infrastructure> infraMap = new HashMap<>();
        String projectPrefix = project.getProjectName().toLowerCase().replace(" ", "-");

        // Create infrastructure for each environment
        // Create 10-12 machines per environment to ensure good distribution
        List<ProjectProfiles> environments = projectEnvironmentRepository
                .findByProjectEnvironmentMappingProjectProjectId(project.getProjectId());

        for (ProjectProfiles env : environments) {
            String profile = env.getEnvCode();
            String region = env.getRegionCode() != null ? env.getRegionCode() : "";
            String profileKey = env.getProfileCode();
            ProjectEnvironmentMapping mapping = env.getProjectEnvironmentMapping();

            // Determine number of machines and infra types
            int machineCount = 10 + random.nextInt(3); // 10-12 machines per environment

            for (int i = 1; i <= machineCount; i++) {
                // Determine infra type based on environment and machine number
                String infraType;
                if (profile.equals("PROD") || profile.equals("COB")) {
                    // PROD/COB: Mix of linux, windows, and ecs
                    int typeSelector = i % 3;
                    if (typeSelector == 0) {
                        infraType = "ecs";
                    } else if (typeSelector == 1) {
                        infraType = "windows";
                    } else {
                        infraType = "linux";
                    }
                } else if (profile.equals("STAGING")) {
                    // STAGING: Mostly linux/windows with some ecs
                    int typeSelector = i % 4;
                    if (typeSelector == 0) {
                        infraType = "ecs";
                    } else if (typeSelector == 1) {
                        infraType = "windows";
                    } else {
                        infraType = "linux";
                    }
                } else {
                    // DEV: Mix of linux and windows, no ecs
                    infraType = (i % 2 == 0) ? "windows" : "linux";
                }

                String infraName = projectPrefix + "-" + profileKey + "-vm-" + String.format("%02d", i);
                String hostname = infraName + ".example.com";
                String ipAddress = infraType.equals("ecs") ? null : generateIpAddress();
                String datacenter = generateDatacenter(region);

                Infrastructure infra = createInfraWithMetrics(
                    project, mapping, infraName, infraType, hostname, ipAddress,
                    profile, region, datacenter, "healthy",
                    infraType.equals("ecs") ? 8.0 : 4.0,
                    infraType.equals("ecs") ? 32.0 : 16.0,
                    random.nextDouble() * 4.0 + 1.0,
                    random.nextDouble() * 12.0 + 4.0
                );

                // Store with unique key including machine number
                String infraKey = profileKey + "_" + String.format("%02d", i);
                infraMap.put(infraKey, infra);
            }
        }

        log.info("Created {} infrastructure instances for project {}", infraMap.size(), project.getProjectName());
        return infraMap;
    }

    private Infrastructure createInfraWithMetrics(Project project, ProjectEnvironmentMapping mapping, String infraName, String type,
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
        infra.setProjectEnvironmentMapping(mapping);
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

    private void generateTradeManagementServices(Project project, Map<String, Infrastructure> infraMap, Map<String, Component> componentsMap) {
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

        generateServicesForProject(project, infraMap, serviceNames, componentsMap);
    }

    private void generateKYCServices(Project project, Map<String, Infrastructure> infraMap, Map<String, Component> componentsMap) {
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

        generateServicesForProject(project, infraMap, serviceNames, componentsMap);
    }

    private void generateServicesForProject(Project project, Map<String, Infrastructure> infraMap, List<String> serviceNames, Map<String, Component> componentsMap) {
        List<ProjectProfiles> allEnvironments = projectEnvironmentRepository
                .findByProjectEnvironmentMappingProjectProjectId(project.getProjectId());
        int serviceCount = 0;

        for (String serviceName : serviceNames) {
            // 85% of services run on all profiles, 15% on specific regions only
            boolean runOnAllProfiles = random.nextDouble() < 0.85;

            List<ProjectProfiles> targetEnvironments;
            if (runOnAllProfiles) {
                targetEnvironments = allEnvironments;
            } else {
                // Region-specific service - pick one or two regions
                List<String> regions = Arrays.asList("APAC", "EMEA", "NAM");
                String selectedRegion = regions.get(random.nextInt(regions.size()));

                targetEnvironments = allEnvironments.stream()
                    .filter(env -> {
                        String region = env.getRegionCode();
                        return region == null || "GLOBAL".equals(region) || region.equals(selectedRegion);
                    })
                    .collect(Collectors.toList());
            }

            // Create service instances for each target environment
            for (ProjectProfiles env : targetEnvironments) {
                // Get all infrastructure machines for this environment
                String profileKey = env.getProfileCode();
                List<Infrastructure> envInfrastructures = infraMap.values().stream()
                    .filter(infra -> infra.getInfraName().contains(profileKey))
                    .collect(Collectors.toList());

                if (envInfrastructures.isEmpty()) continue;

                // Randomly select one of the machines in this environment
                Infrastructure infra = envInfrastructures.get(random.nextInt(envInfrastructures.size()));

                // Create service instance with profile-specific naming
                String instanceId = "srv-" + profileKey + "-" + UUID.randomUUID().toString().substring(0, 8);
                int port = 8080 + random.nextInt(100);
                String version = random.nextInt(5) + "." + random.nextInt(10) + "." + random.nextInt(10);
                int uptimeSeconds = random.nextInt(86400) + 3600; // 1 hour to 1 day
                String status = random.nextDouble() < 0.95 ? "running" : "degraded";

                // Map service name to component - try multiple strategies
                Component component = findComponentForService(serviceName, componentsMap);

                createServiceInstance(
                    instanceId, serviceName, infra.getInfraName(), infra.getInfraType(),
                    profileKey, port, version, uptimeSeconds, status, component
                );
                serviceCount++;
            }
        }

        log.info("Created {} service instances for project {}", serviceCount, project.getProjectName());
    }

    /**
     * Smart component mapping that tries multiple strategies to find the right component
     */
    private Component findComponentForService(String serviceName, Map<String, Component> componentsMap) {
        // Strategy 1: Direct match after removing "-service" suffix and converting to underscores
        String cleanName = serviceName.replace("-service", "").replace("-", "-");
        Component component = componentsMap.get(cleanName);
        if (component != null) return component;

        // Strategy 2: Try with underscores instead of hyphens
        String underscoreName = serviceName.replace("-service", "").replace("-", "_");
        component = componentsMap.get(underscoreName);
        if (component != null) return component;

        // Strategy 3: Try exact match
        component = componentsMap.get(serviceName);
        if (component != null) return component;

        // Strategy 4: Try mapping based on keywords
        // e.g., "trade-execution-service" -> "trade-execution-engine"
        if (serviceName.contains("execution")) {
            component = componentsMap.get("trade-execution-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("order-management")) {
            component = componentsMap.get("order-management-system");
            if (component != null) return component;
        }
        if (serviceName.contains("position")) {
            component = componentsMap.get("position-keeper");
            if (component != null) return component;
        }
        if (serviceName.contains("validation")) {
            component = componentsMap.get("trade-validation-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("market-data")) {
            component = componentsMap.get("market-data-aggregator");
            if (component != null) return component;
        }
        if (serviceName.contains("price-discovery")) {
            component = componentsMap.get("price-discovery-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("routing")) {
            component = componentsMap.get("order-router");
            if (component != null) return component;
        }
        if (serviceName.contains("booking")) {
            component = componentsMap.get("trade-booking-system");
            if (component != null) return component;
        }
        if (serviceName.contains("enrichment")) {
            component = componentsMap.get("trade-enrichment-service");
            if (component != null) return component;
        }
        if (serviceName.contains("pre-trade-compliance")) {
            component = componentsMap.get("pre-trade-compliance");
            if (component != null) return component;
        }
        if (serviceName.contains("post-trade")) {
            component = componentsMap.get("post-trade-processor");
            if (component != null) return component;
        }
        if (serviceName.contains("allocation")) {
            component = componentsMap.get("trade-allocation-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("settlement") && !serviceName.contains("instruction")) {
            component = componentsMap.get("settlement-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("clearing")) {
            component = componentsMap.get("clearing-gateway");
            if (component != null) return component;
        }
        if (serviceName.contains("cash-management")) {
            component = componentsMap.get("cash-management-system");
            if (component != null) return component;
        }
        if (serviceName.contains("collateral")) {
            component = componentsMap.get("collateral-optimizer");
            if (component != null) return component;
        }
        if (serviceName.contains("margin")) {
            component = componentsMap.get("margin-calculator");
            if (component != null) return component;
        }
        if (serviceName.contains("reconciliation")) {
            component = componentsMap.get("reconciliation-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("payment")) {
            component = componentsMap.get("payment-gateway");
            if (component != null) return component;
        }
        if (serviceName.contains("corporate-actions")) {
            component = componentsMap.get("corporate-actions-processor");
            if (component != null) return component;
        }
        if (serviceName.contains("dividend")) {
            component = componentsMap.get("dividend-manager");
            if (component != null) return component;
        }
        if (serviceName.contains("settlement-instruction")) {
            component = componentsMap.get("settlement-instruction-manager");
            if (component != null) return component;
        }
        if (serviceName.contains("risk-analytics")) {
            component = componentsMap.get("risk-analytics-platform");
            if (component != null) return component;
        }
        if (serviceName.contains("credit-risk")) {
            component = componentsMap.get("credit-risk-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("market-risk")) {
            component = componentsMap.get("market-risk-calculator");
            if (component != null) return component;
        }
        if (serviceName.contains("operational-risk")) {
            component = componentsMap.get("operational-risk-monitor");
            if (component != null) return component;
        }
        if (serviceName.contains("surveillance")) {
            component = componentsMap.get("trade-surveillance-system");
            if (component != null) return component;
        }
        if (serviceName.contains("fraud")) {
            component = componentsMap.get("fraud-detection-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("risk-limit")) {
            component = componentsMap.get("risk-limit-monitor");
            if (component != null) return component;
        }
        if (serviceName.contains("regulatory-reporting")) {
            component = componentsMap.get("regulatory-reporting-hub");
            if (component != null) return component;
            component = componentsMap.get("regulatory-reporting-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("instrument-master")) {
            component = componentsMap.get("instrument-master-data");
            if (component != null) return component;
        }
        if (serviceName.contains("counterparty-master")) {
            component = componentsMap.get("counterparty-master-data");
            if (component != null) return component;
        }
        if (serviceName.contains("security-master")) {
            component = componentsMap.get("security-master-data");
            if (component != null) return component;
        }
        if (serviceName.contains("static-data")) {
            component = componentsMap.get("static-data-manager");
            if (component != null) return component;
        }
        if (serviceName.contains("hierarchy")) {
            component = componentsMap.get("hierarchy-manager");
            if (component != null) return component;
        }
        if (serviceName.contains("data-quality")) {
            component = componentsMap.get("data-quality-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("reference-data")) {
            component = componentsMap.get("reference-data-hub");
            if (component != null) return component;
        }
        if (serviceName.contains("api-gateway")) {
            component = componentsMap.get("api-gateway");
            if (component != null) return component;
            component = componentsMap.get("api-gateway-kyc");
            if (component != null) return component;
        }
        if (serviceName.contains("event-streaming")) {
            component = componentsMap.get("event-streaming-platform");
            if (component != null) return component;
        }
        if (serviceName.contains("file-transfer")) {
            component = componentsMap.get("file-transfer-manager");
            if (component != null) return component;
        }
        if (serviceName.contains("notification")) {
            component = componentsMap.get("notification-service");
            if (component != null) return component;
            component = componentsMap.get("notification-hub");
            if (component != null) return component;
        }
        if (serviceName.contains("audit")) {
            component = componentsMap.get("audit-trail-system");
            if (component != null) return component;
            component = componentsMap.get("audit-log-manager");
            if (component != null) return component;
        }
        if (serviceName.contains("reporting")) {
            component = componentsMap.get("reporting-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("analytics")) {
            component = componentsMap.get("analytics-dashboard");
            if (component != null) return component;
        }
        if (serviceName.contains("workflow")) {
            component = componentsMap.get("workflow-engine");
            if (component != null) return component;
            component = componentsMap.get("workflow-orchestrator");
            if (component != null) return component;
        }

        // KYC-specific mappings
        if (serviceName.contains("customer-onboarding")) {
            component = componentsMap.get("customer-onboarding-portal");
            if (component != null) return component;
        }
        if (serviceName.contains("identity-verification")) {
            component = componentsMap.get("identity-verification-service");
            if (component != null) return component;
        }
        if (serviceName.contains("document-verification")) {
            component = componentsMap.get("document-verification-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("biometric")) {
            component = componentsMap.get("biometric-authentication");
            if (component != null) return component;
        }
        if (serviceName.contains("digital-signature") || serviceName.contains("e-signature")) {
            component = componentsMap.get("digital-signature-platform");
            if (component != null) return component;
        }
        if (serviceName.contains("customer-screening")) {
            component = componentsMap.get("customer-screening-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("due-diligence")) {
            component = componentsMap.get("due-diligence-workflow");
            if (component != null) return component;
        }
        if (serviceName.contains("risk-rating")) {
            component = componentsMap.get("risk-rating-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("customer-profile")) {
            component = componentsMap.get("customer-profile-manager");
            if (component != null) return component;
        }
        if (serviceName.contains("consent")) {
            component = componentsMap.get("consent-management-system");
            if (component != null) return component;
        }
        if (serviceName.contains("document-upload")) {
            component = componentsMap.get("document-upload-portal");
            if (component != null) return component;
        }
        if (serviceName.contains("document-processing")) {
            component = componentsMap.get("document-processing-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("document-extraction")) {
            component = componentsMap.get("document-extraction-service");
            if (component != null) return component;
        }
        if (serviceName.contains("document-storage")) {
            component = componentsMap.get("document-storage-vault");
            if (component != null) return component;
        }
        if (serviceName.contains("document-retention")) {
            component = componentsMap.get("document-retention-manager");
            if (component != null) return component;
        }
        if (serviceName.contains("document-archival")) {
            component = componentsMap.get("document-archival-system");
            if (component != null) return component;
        }
        if (serviceName.contains("document-retrieval")) {
            component = componentsMap.get("document-retrieval-service");
            if (component != null) return component;
        }
        if (serviceName.contains("document-classification")) {
            component = componentsMap.get("document-classifier");
            if (component != null) return component;
        }
        if (serviceName.contains("address-verification")) {
            component = componentsMap.get("address-verification-service");
            if (component != null) return component;
        }
        if (serviceName.contains("employment-verification")) {
            component = componentsMap.get("employment-verification-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("income-verification")) {
            component = componentsMap.get("income-verification-platform");
            if (component != null) return component;
        }
        if (serviceName.contains("bank-account-verification")) {
            component = componentsMap.get("bank-account-verification");
            if (component != null) return component;
        }
        if (serviceName.contains("credit-check")) {
            component = componentsMap.get("credit-check-service");
            if (component != null) return component;
        }
        if (serviceName.contains("background-check")) {
            component = componentsMap.get("background-check-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("sanctions")) {
            component = componentsMap.get("sanctions-screening-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("pep-screening")) {
            component = componentsMap.get("pep-screening-service");
            if (component != null) return component;
        }
        if (serviceName.contains("adverse-media")) {
            component = componentsMap.get("adverse-media-monitor");
            if (component != null) return component;
        }
        if (serviceName.contains("aml")) {
            component = componentsMap.get("aml-monitoring-platform");
            if (component != null) return component;
        }
        if (serviceName.contains("kyc-refresh")) {
            component = componentsMap.get("kyc-refresh-scheduler");
            if (component != null) return component;
        }
        if (serviceName.contains("transaction-monitoring")) {
            component = componentsMap.get("transaction-monitoring-engine");
            if (component != null) return component;
        }
        if (serviceName.contains("case-management")) {
            component = componentsMap.get("case-management-system");
            if (component != null) return component;
        }
        if (serviceName.contains("alert-management")) {
            component = componentsMap.get("alert-management-platform");
            if (component != null) return component;
        }
        if (serviceName.contains("investigation")) {
            component = componentsMap.get("investigation-workflow");
            if (component != null) return component;
        }
        if (serviceName.contains("suspicious-activity")) {
            component = componentsMap.get("sar-filing-system");
            if (component != null) return component;
        }
        if (serviceName.contains("compliance-dashboard")) {
            component = componentsMap.get("compliance-dashboard");
            if (component != null) return component;
        }
        if (serviceName.contains("periodic-review")) {
            component = componentsMap.get("periodic-review-manager");
            if (component != null) return component;
        }
        if (serviceName.contains("third-party-verification")) {
            component = componentsMap.get("third-party-verification-hub");
            if (component != null) return component;
        }
        if (serviceName.contains("credit-bureau")) {
            component = componentsMap.get("credit-bureau-gateway");
            if (component != null) return component;
        }
        if (serviceName.contains("government-id")) {
            component = componentsMap.get("government-id-verification");
            if (component != null) return component;
        }
        if (serviceName.contains("rule-engine")) {
            component = componentsMap.get("rule-engine");
            if (component != null) return component;
        }

        // Return null if no match found (15% of services are standalone without components)
        return null;
    }

    private void createServiceInstance(String instanceId, String serviceName, String machineName,
                                       String infraType, String profile, Integer port,
                                       String version, Integer uptimeSeconds, String status, Component component) {
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
        instance.setComponent(component);
        serviceInstanceRepository.save(instance);
    }

    private Map<String, Component> loadComponents(Project project, String projectType) {
        Map<String, Component> componentsMap = new HashMap<>();

        if (projectType.equals("Trade")) {
            // Core Trading Components (12)
            componentsMap.put("trade-execution-engine", createComponent(project, "trade-execution-engine", "Real-time trade execution and order matching system", "Core Trading"));
            componentsMap.put("order-management-system", createComponent(project, "order-management-system", "Centralized order management and lifecycle tracking", "Core Trading"));
            componentsMap.put("position-keeper", createComponent(project, "position-keeper", "Real-time position management and P&L calculation", "Core Trading"));
            componentsMap.put("trade-validation-engine", createComponent(project, "trade-validation-engine", "Pre-trade and post-trade validation", "Core Trading"));
            componentsMap.put("market-data-aggregator", createComponent(project, "market-data-aggregator", "Multi-source market data aggregation and normalization", "Core Trading"));
            componentsMap.put("price-discovery-engine", createComponent(project, "price-discovery-engine", "Real-time price discovery and quote management", "Core Trading"));
            componentsMap.put("order-router", createComponent(project, "order-router", "Smart order routing across multiple venues", "Core Trading"));
            componentsMap.put("trade-booking-system", createComponent(project, "trade-booking-system", "Trade booking and confirmation management", "Core Trading"));
            componentsMap.put("trade-enrichment-service", createComponent(project, "trade-enrichment-service", "Trade data enrichment and augmentation", "Core Trading"));
            componentsMap.put("pre-trade-compliance", createComponent(project, "pre-trade-compliance", "Pre-trade compliance and risk checks", "Core Trading"));
            componentsMap.put("post-trade-processor", createComponent(project, "post-trade-processor", "Post-trade processing and workflow", "Core Trading"));
            componentsMap.put("trade-allocation-engine", createComponent(project, "trade-allocation-engine", "Trade allocation and block processing", "Core Trading"));

            // Settlement & Clearing Components (10)
            componentsMap.put("settlement-engine", createComponent(project, "settlement-engine", "Multi-currency settlement processing", "Settlement & Clearing"));
            componentsMap.put("clearing-gateway", createComponent(project, "clearing-gateway", "Central clearing house integration", "Settlement & Clearing"));
            componentsMap.put("cash-management-system", createComponent(project, "cash-management-system", "Cash and liquidity management", "Settlement & Clearing"));
            componentsMap.put("collateral-optimizer", createComponent(project, "collateral-optimizer", "Collateral optimization and management", "Settlement & Clearing"));
            componentsMap.put("margin-calculator", createComponent(project, "margin-calculator", "Real-time margin calculation engine", "Settlement & Clearing"));
            componentsMap.put("reconciliation-engine", createComponent(project, "reconciliation-engine", "Multi-party reconciliation system", "Settlement & Clearing"));
            componentsMap.put("payment-gateway", createComponent(project, "payment-gateway", "Payment processing and settlement", "Settlement & Clearing"));
            componentsMap.put("corporate-actions-processor", createComponent(project, "corporate-actions-processor", "Corporate actions processing", "Settlement & Clearing"));
            componentsMap.put("dividend-manager", createComponent(project, "dividend-manager", "Dividend processing and distribution", "Settlement & Clearing"));
            componentsMap.put("settlement-instruction-manager", createComponent(project, "settlement-instruction-manager", "Settlement instruction generation and management", "Settlement & Clearing"));

            // Risk Management Components (8)
            componentsMap.put("risk-analytics-platform", createComponent(project, "risk-analytics-platform", "Real-time risk analytics and monitoring", "Risk & Compliance"));
            componentsMap.put("credit-risk-engine", createComponent(project, "credit-risk-engine", "Credit risk assessment and monitoring", "Risk & Compliance"));
            componentsMap.put("market-risk-calculator", createComponent(project, "market-risk-calculator", "Market risk calculation (VaR, Greeks)", "Risk & Compliance"));
            componentsMap.put("operational-risk-monitor", createComponent(project, "operational-risk-monitor", "Operational risk monitoring", "Risk & Compliance"));
            componentsMap.put("trade-surveillance-system", createComponent(project, "trade-surveillance-system", "Real-time trade surveillance", "Risk & Compliance"));
            componentsMap.put("fraud-detection-engine", createComponent(project, "fraud-detection-engine", "ML-based fraud detection", "Risk & Compliance"));
            componentsMap.put("risk-limit-monitor", createComponent(project, "risk-limit-monitor", "Risk limit monitoring and alerts", "Risk & Compliance"));
            componentsMap.put("regulatory-reporting-hub", createComponent(project, "regulatory-reporting-hub", "Multi-jurisdiction regulatory reporting", "Risk & Compliance"));

            // Reference Data Components (7)
            componentsMap.put("instrument-master-data", createComponent(project, "instrument-master-data", "Central instrument reference data", "Reference Data"));
            componentsMap.put("counterparty-master-data", createComponent(project, "counterparty-master-data", "Counterparty and entity master data", "Reference Data"));
            componentsMap.put("security-master-data", createComponent(project, "security-master-data", "Security reference data management", "Reference Data"));
            componentsMap.put("static-data-manager", createComponent(project, "static-data-manager", "Static data management and distribution", "Reference Data"));
            componentsMap.put("hierarchy-manager", createComponent(project, "hierarchy-manager", "Entity and product hierarchy management", "Reference Data"));
            componentsMap.put("data-quality-engine", createComponent(project, "data-quality-engine", "Data quality and validation", "Reference Data"));
            componentsMap.put("reference-data-hub", createComponent(project, "reference-data-hub", "Central reference data distribution", "Reference Data"));

            // Integration & Support Components (8)
            componentsMap.put("api-gateway", createComponent(project, "api-gateway", "External API gateway and security", "Integration & Support"));
            componentsMap.put("event-streaming-platform", createComponent(project, "event-streaming-platform", "Real-time event streaming", "Integration & Support"));
            componentsMap.put("file-transfer-manager", createComponent(project, "file-transfer-manager", "Secure file transfer and processing", "Integration & Support"));
            componentsMap.put("notification-service", createComponent(project, "notification-service", "Multi-channel notification service", "Integration & Support"));
            componentsMap.put("audit-trail-system", createComponent(project, "audit-trail-system", "Comprehensive audit trail", "Integration & Support"));
            componentsMap.put("reporting-engine", createComponent(project, "reporting-engine", "Business and regulatory reporting", "Integration & Support"));
            componentsMap.put("analytics-dashboard", createComponent(project, "analytics-dashboard", "Real-time analytics and dashboards", "Integration & Support"));
            componentsMap.put("workflow-engine", createComponent(project, "workflow-engine", "Business workflow orchestration", "Integration & Support"));

        } else {
            // Customer Onboarding Components (10)
            componentsMap.put("customer-onboarding-portal", createComponent(project, "customer-onboarding-portal", "Digital customer onboarding platform", "Customer Onboarding"));
            componentsMap.put("identity-verification-service", createComponent(project, "identity-verification-service", "Identity verification and validation", "Customer Onboarding"));
            componentsMap.put("document-verification-engine", createComponent(project, "document-verification-engine", "Document verification and OCR", "Customer Onboarding"));
            componentsMap.put("biometric-authentication", createComponent(project, "biometric-authentication", "Biometric verification system", "Customer Onboarding"));
            componentsMap.put("digital-signature-platform", createComponent(project, "digital-signature-platform", "Digital signature and e-signature", "Customer Onboarding"));
            componentsMap.put("customer-screening-engine", createComponent(project, "customer-screening-engine", "Real-time customer screening", "Customer Onboarding"));
            componentsMap.put("due-diligence-workflow", createComponent(project, "due-diligence-workflow", "Customer due diligence workflow", "Customer Onboarding"));
            componentsMap.put("risk-rating-engine", createComponent(project, "risk-rating-engine", "Customer risk rating and scoring", "Customer Onboarding"));
            componentsMap.put("customer-profile-manager", createComponent(project, "customer-profile-manager", "Customer profile management", "Customer Onboarding"));
            componentsMap.put("consent-management-system", createComponent(project, "consent-management-system", "Customer consent and preferences", "Customer Onboarding"));

            // Document Management Components (8)
            componentsMap.put("document-upload-portal", createComponent(project, "document-upload-portal", "Secure document upload interface", "Document Management"));
            componentsMap.put("document-processing-engine", createComponent(project, "document-processing-engine", "Document processing and classification", "Document Management"));
            componentsMap.put("document-extraction-service", createComponent(project, "document-extraction-service", "Data extraction from documents", "Document Management"));
            componentsMap.put("document-storage-vault", createComponent(project, "document-storage-vault", "Secure document storage", "Document Management"));
            componentsMap.put("document-retention-manager", createComponent(project, "document-retention-manager", "Document retention and lifecycle", "Document Management"));
            componentsMap.put("document-archival-system", createComponent(project, "document-archival-system", "Long-term document archival", "Document Management"));
            componentsMap.put("document-retrieval-service", createComponent(project, "document-retrieval-service", "Fast document retrieval", "Document Management"));
            componentsMap.put("document-classifier", createComponent(project, "document-classifier", "AI-based document classification", "Document Management"));

            // Verification & Screening Components (9)
            componentsMap.put("address-verification-service", createComponent(project, "address-verification-service", "Address verification and validation", "Verification & Validation"));
            componentsMap.put("employment-verification-engine", createComponent(project, "employment-verification-engine", "Employment verification service", "Verification & Validation"));
            componentsMap.put("income-verification-platform", createComponent(project, "income-verification-platform", "Income verification and analysis", "Verification & Validation"));
            componentsMap.put("bank-account-verification", createComponent(project, "bank-account-verification", "Bank account verification", "Verification & Validation"));
            componentsMap.put("credit-check-service", createComponent(project, "credit-check-service", "Credit bureau integration and checks", "Verification & Validation"));
            componentsMap.put("background-check-engine", createComponent(project, "background-check-engine", "Comprehensive background checks", "Verification & Validation"));
            componentsMap.put("sanctions-screening-engine", createComponent(project, "sanctions-screening-engine", "Real-time sanctions screening", "Verification & Validation"));
            componentsMap.put("pep-screening-service", createComponent(project, "pep-screening-service", "PEP and politically exposed persons screening", "Verification & Validation"));
            componentsMap.put("adverse-media-monitor", createComponent(project, "adverse-media-monitor", "Adverse media monitoring", "Verification & Validation"));

            // Compliance & AML Components (10)
            componentsMap.put("aml-monitoring-platform", createComponent(project, "aml-monitoring-platform", "Real-time AML monitoring", "Compliance & Regulatory"));
            componentsMap.put("kyc-refresh-scheduler", createComponent(project, "kyc-refresh-scheduler", "Automated KYC refresh and reviews", "Compliance & Regulatory"));
            componentsMap.put("transaction-monitoring-engine", createComponent(project, "transaction-monitoring-engine", "Transaction monitoring and alerting", "Compliance & Regulatory"));
            componentsMap.put("case-management-system", createComponent(project, "case-management-system", "Investigation case management", "Compliance & Regulatory"));
            componentsMap.put("alert-management-platform", createComponent(project, "alert-management-platform", "Alert triage and management", "Compliance & Regulatory"));
            componentsMap.put("investigation-workflow", createComponent(project, "investigation-workflow", "Investigation and resolution workflow", "Compliance & Regulatory"));
            componentsMap.put("sar-filing-system", createComponent(project, "sar-filing-system", "Suspicious activity report filing", "Compliance & Regulatory"));
            componentsMap.put("regulatory-reporting-engine", createComponent(project, "regulatory-reporting-engine", "Regulatory reporting and submissions", "Compliance & Regulatory"));
            componentsMap.put("compliance-dashboard", createComponent(project, "compliance-dashboard", "Compliance metrics and dashboards", "Compliance & Regulatory"));
            componentsMap.put("periodic-review-manager", createComponent(project, "periodic-review-manager", "Periodic customer review management", "Compliance & Regulatory"));

            // Integration & Support Components (8)
            componentsMap.put("third-party-verification-hub", createComponent(project, "third-party-verification-hub", "Third-party verification integrations", "Integration & Support"));
            componentsMap.put("credit-bureau-gateway", createComponent(project, "credit-bureau-gateway", "Credit bureau integration gateway", "Integration & Support"));
            componentsMap.put("government-id-verification", createComponent(project, "government-id-verification", "Government ID verification service", "Integration & Support"));
            componentsMap.put("api-gateway-kyc", createComponent(project, "api-gateway-kyc", "KYC API gateway and orchestration", "Integration & Support"));
            componentsMap.put("notification-hub", createComponent(project, "notification-hub", "Multi-channel notification service", "Integration & Support"));
            componentsMap.put("audit-log-manager", createComponent(project, "audit-log-manager", "Comprehensive audit logging", "Integration & Support"));
            componentsMap.put("workflow-orchestrator", createComponent(project, "workflow-orchestrator", "Business process orchestration", "Integration & Support"));
            componentsMap.put("rule-engine", createComponent(project, "rule-engine", "Business rules engine", "Integration & Support"));
        }

        return componentsMap;
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
