package com.monitoring.dashboard.config;

import com.monitoring.dashboard.model.*;
import com.monitoring.dashboard.repository.*;
import jakarta.transaction.Transactional;
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
    private final DeploymentConfigRepository deploymentConfigRepository;
    private final ServiceInstanceRepository serviceInstanceRepository;
    private final EnvironmentRepository environmentRepository;
    private final RegionRepository regionRepository;
    private final ProjectEnvironmentMappingRepository projectEnvironmentMappingRepository;
    private final ProjectEnvironmentRepository projectEnvironmentRepository;

    private final Random random = new Random(42); // Fixed seed for reproducibility

    private record ProfileSeed(String envCode, String regionCode, String profileCode, String profileDescription) {}

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Initializing sample data...");
        initializeData();
        log.info("Sample data initialization completed");
    }

    private void initializeData() {
        // Clear all existing data
        serviceInstanceRepository.deleteAll();
        deploymentConfigRepository.deleteAll();
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
        List<ProfileSeed> khayyamProfileSeeds = buildKhayyamProfileSeeds();

        log.info("Created {} environments and {} regions", environmentMap.size(), regionMap.size());

        // --- Create Projects ---
        Project eventHorizonProject = createProject(
                "Event Horizon",
                "Real-time event streaming and processing platform",
                environmentMap,
                regionMap,
                profileSeeds);

        Project khayyamProject = createProject(
                "Khayyam",
                "Advanced spot pricing and market data analytics",
                environmentMap,
                regionMap,
                khayyamProfileSeeds);

        log.info("Created projects: {} and {}",
                eventHorizonProject.getProjectName(), khayyamProject.getProjectName());

        // --- Create Components for all projects FIRST ---
        Map<String, Component> eventHorizonComponentsMap = loadComponents(eventHorizonProject, "EventHorizon");
        Map<String, Component> khayyamComponentsMap = loadComponents(khayyamProject, "Khayyam");

        // --- Create Infrastructure for all projects ---
        Map<String, Infrastructure> eventHorizonInfraMap = loadInfrastructure(eventHorizonProject);
        Map<String, Infrastructure> khayyamInfraMap = loadInfrastructure(khayyamProject);

        if (shouldSeedOpsData()) {
            // --- Create Deployment Configs for all components and infrastructure ---
            createDeploymentConfigs(eventHorizonComponentsMap, eventHorizonInfraMap);
            createDeploymentConfigs(khayyamComponentsMap, khayyamInfraMap);

            // --- Generate Services with Component mapping ---
            generateEventHorizonServices(eventHorizonProject, eventHorizonInfraMap, eventHorizonComponentsMap);
            generateKhayyamServices(khayyamProject, khayyamInfraMap, khayyamComponentsMap);
        } else {
            log.info("Skipping seeding of ops_deployment_config and ops_service_instances tables (set SEED_OPS_DATA=true to enable).");
        }

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
        log.info("Created {} deployment configs", deploymentConfigRepository.count());
        log.info("Created {} service instances", serviceInstanceRepository.count());
    }

    private boolean shouldSeedOpsData() {
        return Boolean.parseBoolean(Optional.ofNullable(System.getenv("SEED_OPS_DATA"))
                .orElseGet(() -> System.getProperty("seed.ops.data", "false")));
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

    private List<ProfileSeed> buildKhayyamProfileSeeds() {
        List<ProfileSeed> seeds = new ArrayList<>();

        // DEV (Global)
        seeds.add(new ProfileSeed("DEV", "GLOBAL", "dev", "Development environment"));

        // STAGING profiles with new format: region-uat1, region-uat2
        seeds.add(new ProfileSeed("STAGING", "APAC", "apac-uat1", "APAC STAGING UAT1"));
        seeds.add(new ProfileSeed("STAGING", "APAC", "apac-uat2", "APAC STAGING UAT2"));

        seeds.add(new ProfileSeed("STAGING", "EMEA", "emea-uat1", "EMEA STAGING UAT1"));
        seeds.add(new ProfileSeed("STAGING", "EMEA", "emea-uat2", "EMEA STAGING UAT2"));

        seeds.add(new ProfileSeed("STAGING", "NAM", "nam-uat1", "NAM STAGING UAT1"));
        seeds.add(new ProfileSeed("STAGING", "NAM", "nam-uat2", "NAM STAGING UAT2"));

        // PROD profiles with new format: region-prod
        seeds.add(new ProfileSeed("PROD", "APAC", "apac-prod", "APAC Production"));
        seeds.add(new ProfileSeed("PROD", "EMEA", "emea-prod", "EMEA Production"));
        seeds.add(new ProfileSeed("PROD", "NAM", "nam-prod", "NAM Production"));

        // COB profiles with new format: region-cob
        seeds.add(new ProfileSeed("COB", "APAC", "apac-cob", "APAC Disaster Recovery"));
        seeds.add(new ProfileSeed("COB", "EMEA", "emea-cob", "EMEA Disaster Recovery"));
        seeds.add(new ProfileSeed("COB", "NAM", "nam-cob", "NAM Disaster Recovery"));

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

    /**
     * Create deployment configs for all components on all infrastructure
     * Creates ONE config per component per profile, selecting random infrastructure
     */
    private void createDeploymentConfigs(Map<String, Component> componentsMap, Map<String, Infrastructure> infraMap) {
        int configCount = 0;

        // Group infrastructure by profile and type
        Map<String, Map<String, List<Infrastructure>>> infraByProfileAndType = new HashMap<>();

        for (Infrastructure infra : infraMap.values()) {
            String profile = extractProfileFromInfraName(infra.getInfraName());
            if (profile == null || profile.isEmpty()) {
                continue;
            }

            infraByProfileAndType
                .computeIfAbsent(profile, k -> new HashMap<>())
                .computeIfAbsent(infra.getInfraType(), k -> new ArrayList<>())
                .add(infra);
        }

        // For each component
        for (Component component : componentsMap.values()) {
            // Determine preferred infrastructure type for this component
            // 70% linux, 20% ecs, 10% windows (can be customized per component)
            String preferredInfraType = determinePreferredInfraType();

            // For each profile
            for (Map.Entry<String, Map<String, List<Infrastructure>>> profileEntry : infraByProfileAndType.entrySet()) {
                String profile = profileEntry.getKey();
                Map<String, List<Infrastructure>> infraByType = profileEntry.getValue();

                // Try to get infrastructure of preferred type, fallback to any available
                Infrastructure selectedInfra = selectInfrastructure(infraByType, preferredInfraType);

                if (selectedInfra == null) {
                    log.warn("No infrastructure found for profile {} and component {}", profile, component.getComponentName());
                    continue;
                }

                // Create deployment config
                DeploymentConfig config = new DeploymentConfig();
                config.setComponent(component);
                config.setInfrastructure(selectedInfra);
                // Profile is no longer set on DeploymentConfig; resolve via infra/project mapping if needed
                config.setEnabled(true);

                // Set base port (8000 + random offset)
                config.setBasePort(8000 + random.nextInt(100));

                // Create deployment parameters based on infrastructure type
                try {
                    byte[] deployParams = createDeploymentParams(selectedInfra.getInfraType());
                    config.setDeployParams(deployParams);
                } catch (Exception e) {
                    log.error("Error creating deployment params for component {} on infra {}",
                             component.getComponentName(), selectedInfra.getInfraName(), e);
                    continue;
                }

                deploymentConfigRepository.save(config);
                configCount++;
            }
        }

        log.info("Created {} deployment configs (1 per component per profile)", configCount);
    }

    /**
     * Determine preferred infrastructure type for a component
     * Can be enhanced to make decisions based on component type/name
     */
    private String determinePreferredInfraType() {
        double rand = random.nextDouble();
        if (rand < 0.70) {
            return "linux";
        } else if (rand < 0.90) {
            return "ecs";
        } else {
            return "windows";
        }
    }

    /**
     * Select a random infrastructure from available types, preferring the specified type
     */
    private Infrastructure selectInfrastructure(Map<String, List<Infrastructure>> infraByType, String preferredType) {
        // Try preferred type first
        if (infraByType.containsKey(preferredType)) {
            List<Infrastructure> infraList = infraByType.get(preferredType);
            if (!infraList.isEmpty()) {
                return infraList.get(random.nextInt(infraList.size()));
            }
        }

        // Fallback to any available type
        for (List<Infrastructure> infraList : infraByType.values()) {
            if (!infraList.isEmpty()) {
                return infraList.get(random.nextInt(infraList.size()));
            }
        }

        return null;
    }

    private void generateEventHorizonServices(Project project, Map<String, Infrastructure> infraMap, Map<String, Component> componentsMap) {
        List<String> serviceNames = Arrays.asList(
            // Event Streaming (10)
            "event-ingestion-service", "stream-processing-service", "real-time-analytics-service",
            "event-storage-service", "notification-delivery-service", "audit-log-ingestion-service",
            "metrics-collection-service", "api-gateway-service", "reporting-service",
            "analytics-dashboard-service",

            // Support & Integration (5)
            "schema-registry-service", "kafka-manager-service", "connector-management-service",
            "api-gateway-service", "notification-service"
        );

        generateServicesForProject(project, infraMap, serviceNames, componentsMap);
    }

    private void generateKhayyamServices(Project project, Map<String, Infrastructure> infraMap, Map<String, Component> componentsMap) {
        List<String> serviceNames = Arrays.asList(
            // Spot Pricing (10)
            "spot-pricing-service", "market-data-ingestion-service", "historical-data-service",
            "pricing-strategy-service", "risk-assessment-service", "order-execution-service",
            "notification-service", "reporting-service", "analytics-dashboard-service",
            "api-gateway-service",

            // Support & Integration (5)
            "data-validation-service", "schema-registry-service", "api-gateway-service",
            "notification-service", "audit-log-service"
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
        // Find the infrastructure for this machine
        Infrastructure infrastructure = infrastructureRepository.findAll().stream()
                .filter(infra -> infra.getInfraName().equals(machineName))
                .findFirst()
                .orElse(null);

        if (infrastructure == null || component == null) {
            log.warn("Skipping service instance {} - missing infrastructure or component", instanceId);
            return;
        }

        // Find or create deployment config for this component + infrastructure
        DeploymentConfig deploymentConfig = deploymentConfigRepository.findAll().stream()
                .filter(dc -> dc.getComponent().equals(component)
                        && dc.getInfrastructure().equals(infrastructure))
                .findFirst()
                .orElseGet(() -> {
                    // Create a new deployment config
                    DeploymentConfig newConfig = new DeploymentConfig();
                    newConfig.setComponent(component);
                    newConfig.setInfrastructure(infrastructure);
                    newConfig.setBasePort(port);
                    newConfig.setEnabled(true);
                    return deploymentConfigRepository.save(newConfig);
                });

        ServiceInstance instance = new ServiceInstance();
        instance.setInstanceId(instanceId);
        instance.setDeploymentConfig(deploymentConfig);
        instance.setServiceName(serviceName);
        instance.setMachineName(machineName);
        instance.setInfraType(infraType);
        instance.setProfile(profile);
        instance.setPort(port);
        instance.setVersion(version);
        instance.setUptimeSeconds(uptimeSeconds);
        instance.setStatus(status);
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

        } else if (projectType.equals("KYC")) {
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

        } else if (projectType.equals("EventHorizon")) {
            // Event Streaming Components (8)
            componentsMap.put("event-ingestion-engine", createComponent(project, "event-ingestion-engine", "High-throughput event ingestion from multiple sources", "Event Streaming"));
            componentsMap.put("stream-processor", createComponent(project, "stream-processor", "Real-time stream processing and transformation", "Event Streaming"));
            componentsMap.put("event-router", createComponent(project, "event-router", "Intelligent event routing and distribution", "Event Streaming"));
            componentsMap.put("event-store", createComponent(project, "event-store", "Durable event storage and replay", "Event Streaming"));
            componentsMap.put("real-time-analytics-engine", createComponent(project, "real-time-analytics-engine", "Real-time analytics and aggregation", "Event Streaming"));
            componentsMap.put("notification-dispatcher", createComponent(project, "notification-dispatcher", "Multi-channel notification delivery", "Event Streaming"));
            componentsMap.put("audit-event-logger", createComponent(project, "audit-event-logger", "Audit trail event logging", "Event Streaming"));
            componentsMap.put("metrics-aggregator", createComponent(project, "metrics-aggregator", "Real-time metrics collection and aggregation", "Event Streaming"));

            // Schema & Configuration (4)
            componentsMap.put("schema-registry", createComponent(project, "schema-registry", "Event schema management and versioning", "Schema & Config"));
            componentsMap.put("kafka-cluster-manager", createComponent(project, "kafka-cluster-manager", "Kafka cluster management and monitoring", "Schema & Config"));
            componentsMap.put("connector-hub", createComponent(project, "connector-hub", "Source and sink connector management", "Schema & Config"));
            componentsMap.put("config-manager", createComponent(project, "config-manager", "Centralized configuration management", "Schema & Config"));

            // Integration & Support (5)
            componentsMap.put("api-gateway", createComponent(project, "api-gateway", "REST/GraphQL API gateway for event queries", "Integration & Support"));
            componentsMap.put("reporting-engine", createComponent(project, "reporting-engine", "Event analytics and reporting", "Integration & Support"));
            componentsMap.put("analytics-dashboard", createComponent(project, "analytics-dashboard", "Real-time event dashboards", "Integration & Support"));
            componentsMap.put("notification-service", createComponent(project, "notification-service", "Alert and notification service", "Integration & Support"));
            componentsMap.put("monitoring-platform", createComponent(project, "monitoring-platform", "Platform health monitoring", "Integration & Support"));

        } else if (projectType.equals("Khayyam")) {
            // Spot Pricing Core (8)
            componentsMap.put("spot-pricing-engine", createComponent(project, "spot-pricing-engine", "Real-time spot price calculation engine", "Pricing Core"));
            componentsMap.put("market-data-ingestion", createComponent(project, "market-data-ingestion", "Multi-source market data ingestion", "Pricing Core"));
            componentsMap.put("historical-data-store", createComponent(project, "historical-data-store", "Time-series historical data storage", "Pricing Core"));
            componentsMap.put("pricing-model-engine", createComponent(project, "pricing-model-engine", "Advanced pricing model execution", "Pricing Core"));
            componentsMap.put("volatility-calculator", createComponent(project, "volatility-calculator", "Real-time volatility calculation", "Pricing Core"));
            componentsMap.put("liquidity-analyzer", createComponent(project, "liquidity-analyzer", "Market liquidity analysis", "Pricing Core"));
            componentsMap.put("spread-calculator", createComponent(project, "spread-calculator", "Bid-ask spread calculation", "Pricing Core"));
            componentsMap.put("fair-value-calculator", createComponent(project, "fair-value-calculator", "Fair value pricing calculation", "Pricing Core"));

            // Risk & Analytics (6)
            componentsMap.put("risk-assessment-engine", createComponent(project, "risk-assessment-engine", "Real-time risk assessment", "Risk & Analytics"));
            componentsMap.put("correlation-analyzer", createComponent(project, "correlation-analyzer", "Cross-asset correlation analysis", "Risk & Analytics"));
            componentsMap.put("scenario-simulator", createComponent(project, "scenario-simulator", "Monte Carlo and scenario simulation", "Risk & Analytics"));
            componentsMap.put("var-calculator", createComponent(project, "var-calculator", "Value at Risk calculation", "Risk & Analytics"));
            componentsMap.put("stress-test-engine", createComponent(project, "stress-test-engine", "Stress testing and sensitivity analysis", "Risk & Analytics"));
            componentsMap.put("backtesting-framework", createComponent(project, "backtesting-framework", "Strategy backtesting framework", "Risk & Analytics"));

            // Order Management (5)
            componentsMap.put("order-execution-engine", createComponent(project, "order-execution-engine", "Spot order execution", "Order Management"));
            componentsMap.put("order-book-manager", createComponent(project, "order-book-manager", "Real-time order book management", "Order Management"));
            componentsMap.put("trade-confirmation-system", createComponent(project, "trade-confirmation-system", "Trade confirmation and reporting", "Order Management"));
            componentsMap.put("position-tracker", createComponent(project, "position-tracker", "Real-time position tracking", "Order Management"));
            componentsMap.put("pnl-calculator", createComponent(project, "pnl-calculator", "Profit and loss calculation", "Order Management"));

            // Data & Integration (6)
            componentsMap.put("data-validation-engine", createComponent(project, "data-validation-engine", "Market data validation and cleansing", "Data & Integration"));
            componentsMap.put("reference-data-manager", createComponent(project, "reference-data-manager", "Instrument reference data", "Data & Integration"));
            componentsMap.put("schema-registry", createComponent(project, "schema-registry", "Data schema management", "Data & Integration"));
            componentsMap.put("api-gateway", createComponent(project, "api-gateway", "External API gateway", "Data & Integration"));
            componentsMap.put("notification-hub", createComponent(project, "notification-hub", "Price alert notifications", "Data & Integration"));
            componentsMap.put("audit-log-service", createComponent(project, "audit-log-service", "Comprehensive audit logging", "Data & Integration"));

            // Reporting & Visualization (5)
            componentsMap.put("reporting-engine", createComponent(project, "reporting-engine", "Pricing and risk reporting", "Reporting"));
            componentsMap.put("analytics-dashboard", createComponent(project, "analytics-dashboard", "Real-time pricing dashboards", "Reporting"));
            componentsMap.put("chart-generator", createComponent(project, "chart-generator", "Price chart generation", "Reporting"));
            componentsMap.put("market-snapshot-service", createComponent(project, "market-snapshot-service", "Market snapshot reports", "Reporting"));
            componentsMap.put("compliance-reporter", createComponent(project, "compliance-reporter", "Regulatory compliance reporting", "Reporting"));

        }

        return componentsMap;
    }

    private Component createComponent(Project project, String name, String description, String module) {
        Component component = new Component();
        component.setComponentName(name);
        component.setDescription(description);
        component.setModule(module);
        String[] infraTypes = {"linux", "windows", "ecs"};
        component.setDefaultInfraType(infraTypes[random.nextInt(infraTypes.length)]);
        component.setDefaultPort(7000 + random.nextInt(2000));
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

    /**
     * Extract profile from infrastructure name
     * Examples:
     *   "event-horizon-dev-vm-01" -> "dev"
     *   "khayyam-apac-prod-vm-01" -> "apac-prod"
     *   "khayyam-apac-uat1-vm-01" -> "apac-uat1"
     */
    private String extractProfileFromInfraName(String infraName) {
        if (infraName == null || infraName.isEmpty()) {
            return null;
        }

        // Split by "-" and remove project name and "vm-XX" suffix
        String[] parts = infraName.split("-");
        if (parts.length < 4) {
            return null;
        }

        // Build profile from the middle parts (skip first 1-2 parts for project name, and last 2 for "vm-XX")
        StringBuilder profile = new StringBuilder();
        int startIdx = (parts[0].equals("event") && parts[1].equals("horizon")) ? 2 : 1;
        int endIdx = parts.length - 2;

        for (int i = startIdx; i < endIdx; i++) {
            if (!profile.isEmpty()) {
                profile.append("-");
            }
            profile.append(parts[i]);
        }

        return profile.toString();
    }

    /**
     * Create deployment parameters as JSON stored in byte array
     * For ECS: MIN_POD=1, MAX_POD=5, REQ_MEMORY=1GB, LIMIT_MEMORY=2GB, REQ_CPU=100m, LIMIT_CPU=250m
     * For Linux/Windows: MAX_MEMORY=2GB
     */
    private byte[] createDeploymentParams(String infraType) {
        Map<String, Object> params = new HashMap<>();

        if ("ecs".equalsIgnoreCase(infraType)) {
            // ECS parameters
            params.put("MIN_POD", 1);
            params.put("MAX_POD", 5);
            params.put("REQ_MEMORY", "1GB");
            params.put("LIMIT_MEMORY", "2GB");
            params.put("REQ_CPU", "100m");
            params.put("LIMIT_CPU", "250m");
        } else {
            // Linux/Windows VM parameters
            params.put("MAX_MEMORY", "2GB");
        }

        // Convert to JSON string and then to bytes
        String jsonString = convertMapToJson(params);
        return jsonString.getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    /**
     * Simple JSON converter for deployment params
     */
    private String convertMapToJson(Map<String, Object> map) {
        StringBuilder json = new StringBuilder("{");
        boolean first = true;

        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (!first) {
                json.append(",");
            }
            first = false;

            json.append("\"").append(entry.getKey()).append("\":");

            Object value = entry.getValue();
            if (value instanceof String) {
                json.append("\"").append(value).append("\"");
            } else {
                json.append(value);
            }
        }

        json.append("}");
        return json.toString();
    }
}
