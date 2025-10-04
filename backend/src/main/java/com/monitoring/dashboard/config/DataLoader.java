package com.monitoring.dashboard.config;

import com.monitoring.dashboard.model.Project;
import com.monitoring.dashboard.model.ProjectEnvironment;
import com.monitoring.dashboard.model.RoleFunctionAccess;
import com.monitoring.dashboard.repository.ProjectRepository;
import com.monitoring.dashboard.repository.ProjectEnvironmentRepository;
import com.monitoring.dashboard.repository.RoleFunctionAccessRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Populates the in-memory database with sample projects, environments, and access mappings 
 * on application startup. This provides sensible defaults for the Support, Developer and Admin 
 * roles across various environments. In a real application these values would be stored and
 * maintained externally (e.g. via an admin UI).
 */
@Component
public class DataLoader implements CommandLineRunner {
    private final ProjectRepository projectRepository;
    private final ProjectEnvironmentRepository environmentRepository;
    private final RoleFunctionAccessRepository accessRepository;

    public DataLoader(
            ProjectRepository projectRepository,
            ProjectEnvironmentRepository environmentRepository,
            RoleFunctionAccessRepository accessRepository) {
        this.projectRepository = projectRepository;
        this.environmentRepository = environmentRepository;
        this.accessRepository = accessRepository;
    }

    @Override
    public void run(String... args) {
        // Create the main monitoring dashboard project
        Project project = new Project("Monitoring Dashboard", "Main monitoring and operations dashboard");
        
        // Create DEV environments (simple, no region/profile variations)
        ProjectEnvironment devEnv = new ProjectEnvironment("DEV", null, null, "Development environment");
        
        // Create STAGING environments with region and profile variations
        // APAC STAGING
        ProjectEnvironment stagingApacDailyRefresh = new ProjectEnvironment("STAGING", "APAC", "apacdailyrefresh", "APAC STAGING Daily Refresh");
        ProjectEnvironment stagingApacQa = new ProjectEnvironment("STAGING", "APAC", "apacqa", "APAC STAGING QA");
        ProjectEnvironment stagingApacUat = new ProjectEnvironment("STAGING", "APAC", "apacuat", "APAC STAGING UAT");
        
        // EMEA STAGING
        ProjectEnvironment stagingEmeaDailyRefresh = new ProjectEnvironment("STAGING", "EMEA", "emeadailyrefresh", "EMEA STAGING Daily Refresh");
        ProjectEnvironment stagingEmeaQa = new ProjectEnvironment("STAGING", "EMEA", "emeaqa", "EMEA STAGING QA");
        ProjectEnvironment stagingEmeaUat = new ProjectEnvironment("STAGING", "EMEA", "emeauat", "EMEA STAGING UAT");
        
        // NAM STAGING
        ProjectEnvironment stagingNamDailyRefresh = new ProjectEnvironment("STAGING", "NAM", "namdailyrefresh", "NAM STAGING Daily Refresh");
        ProjectEnvironment stagingNamQa = new ProjectEnvironment("STAGING", "NAM", "namqa", "NAM STAGING QA");
        ProjectEnvironment stagingNamUat = new ProjectEnvironment("STAGING", "NAM", "namuat", "NAM STAGING UAT");
        
        // Create PROD environments with region and profile variations
        // APAC PROD
        ProjectEnvironment prodApacProd = new ProjectEnvironment("PROD", "APAC", "apacprod", "APAC Production");
        ProjectEnvironment prodApacCob = new ProjectEnvironment("PROD", "APAC", "apaccob", "APAC disaster recovery");
        
        // EMEA PROD
        ProjectEnvironment prodEmeaProd = new ProjectEnvironment("PROD", "EMEA", "emeaprod", "EMEA Production");
        ProjectEnvironment prodEmeaCob = new ProjectEnvironment("PROD", "EMEA", "emeacob", "EMEA disaster recovery");

        // NAM PROD
        ProjectEnvironment prodNamProd = new ProjectEnvironment("PROD", "NAM", "namprod", "NAM Production");
        ProjectEnvironment prodNamCob = new ProjectEnvironment("PROD", "NAM", "namcob", "NAM disaster recovery");
        
        // Add all environments to project
        project.addEnvironment(devEnv);
        
        project.addEnvironment(stagingApacDailyRefresh);
        project.addEnvironment(stagingApacQa);
        project.addEnvironment(stagingApacUat);
        project.addEnvironment(stagingEmeaDailyRefresh);
        project.addEnvironment(stagingEmeaQa);
        project.addEnvironment(stagingEmeaUat);
        project.addEnvironment(stagingNamDailyRefresh);
        project.addEnvironment(stagingNamQa);
        project.addEnvironment(stagingNamUat);
        
        project.addEnvironment(prodApacProd);
        project.addEnvironment(prodApacCob);
        project.addEnvironment(prodEmeaProd);
        project.addEnvironment(prodEmeaCob);
        project.addEnvironment(prodNamProd);
        project.addEnvironment(prodNamCob);
        
        // Save project (cascade will save all environments)
        project = projectRepository.save(project);
        
        accessRepository.save(new RoleFunctionAccess("default", "VIEW_ALL", "STAGING", "Y"));

        accessRepository.save(new RoleFunctionAccess("Support", "VIEW_ALL", "PROD", "Y"));
        accessRepository.save(new RoleFunctionAccess("Support", "MANAGE_SERVICES", "PROD", "Y"));
        accessRepository.save(new RoleFunctionAccess("Support", "CONFIG_UPDATE", "PROD", "Y"));

        // Developer role: can view everywhere; manage services in STAGING
        accessRepository.save(new RoleFunctionAccess("Developer", "VIEW_ALL", null, "Y"));
        accessRepository.save(new RoleFunctionAccess("Developer", "MANAGE_SERVICES", "STAGING", "Y"));

        // Admin role: can view and edit configurations but CANNOT manage services
        accessRepository.save(new RoleFunctionAccess("Admin", "VIEW_ALL", null, "Y"));
        accessRepository.save(new RoleFunctionAccess("Admin", "EDIT_INFRA", null, "Y"));
        accessRepository.save(new RoleFunctionAccess("Admin", "EDIT_SERVICES", null, "Y"));
        accessRepository.save(new RoleFunctionAccess("Admin", "CONFIG_UPDATE", null, "Y"));
    }
}