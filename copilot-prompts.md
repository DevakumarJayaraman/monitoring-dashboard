# Copilot Prompts for Monitoring Dashboard

This file contains ready-made prompts and scaffolding commands for GitHub Copilot and AI code assistants to quickly generate backend and frontend features in the Monitoring Dashboard project.

---

## Backend Development Prompts

### Create a New REST Controller
Create a Spring Boot REST controller for [Entity] with endpoints:
- GET /api/[entity] - list all
- GET /api/[entity]/{id} - get by ID
- POST /api/[entity] - create new
- PUT /api/[entity]/{id} - update existing
- DELETE /api/[entity]/{id} - delete by ID
Follow the pattern in ProjectController.java and use @RestController, @RequestMapping, @Transactional

### Create JPA Repository with Custom Queries
Create a Spring Data JPA repository for [Entity] extending JpaRepository.
Add derived query methods and custom @Query as needed.
Follow the pattern in ComponentDeploymentRepository.java

### Create Service Layer with DTOs
Create a service class [EntityName]Service with CRUD operations, DTO conversion, transaction management, and logging.
Follow the pattern in ComponentDeploymentService.java

### Add Query to Fetch Related Entities
Add a repository method to fetch [Entity] with related [RelatedEntity] by criteria.
Use property navigation and add corresponding service method that converts to DTO.

### Create DTO with Validation
Create a DTO class [Entity]DTO with validation annotations and nested DTOs for relationships.
Follow the pattern in ComponentDeploymentDTO.java

---

## Frontend Development Prompts

### Create a New React Component
Create a React TypeScript component [ComponentName] with:
- Functional component using hooks
- Typed props
- Tailwind CSS styling
- Error boundary and loading states
- Modal/card styling pattern as InfrastructureFormModal.tsx

### Create a Form Modal Component
Create a modal form component for adding/editing [Entity] with:
- useState for form data
- useEffect for initialization
- Form validation before submit
- API integration
- Loading state and error display
- Tailwind styling

### Add API Service Functions
Add API service functions in services/api.ts for [Entity]:
- fetch[Entity]ByProject
- create[Entity]
- update[Entity]
- delete[Entity]

### Create a View Component with Table
Create a [Entity]View component that fetches data, displays in TableGrid, includes add/edit/delete actions, and filters by selectedProject.

### Add Conditional Rendering Based on Project Config
Update components to conditionally render fields based on project configuration.

### Create Auto-Selection Logic
Add auto-selection logic to components for filtered options.

### Add Toast Notifications
Add toast notification support to components for success, error, and info events.

---

## Architecture Patterns

### Backend Patterns
- Entity relationships, service layer, repository queries

### Frontend Patterns
- Modal, table view, form state, conditional fields

---

## Specific Feature Prompts
- Add new infrastructure type
- Add project-level configuration
- Link new entity to deployment config

---
