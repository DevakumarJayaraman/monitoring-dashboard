# Copilot Instructions for Monitoring Dashboard

This file contains detailed conventions, coding standards, and implementation patterns for backend and frontend development in the Monitoring Dashboard project.

---

## Backend Conventions

### Entity Design
- Use `@Entity`, `@Table(name = "ops_[entity_name]")`, `@Id`, `@Version` for optimistic locking.
- Use proper JPA relationships (`@ManyToOne`, `@OneToMany`, etc.) and `@JsonIgnore` to prevent circular serialization.

### Repository Pattern
- Extend `JpaRepository`.
- Use derived query methods (e.g., `findByField`, `findByParent_GrandParent_Field`).
- Use custom JPQL queries with `@Query` as needed.

### Service Layer Pattern
- Use `@Service`, constructor injection, and `@Transactional` for write operations.
- Convert entities to DTOs for all API responses.
- Log CRUD operations with Slf4j.

### Controller Pattern
- Use `@RestController`, `@RequestMapping`.
- Expose only DTOs, not entities.
- Follow RESTful conventions.

### DTO Pattern
- Use validation annotations (`@NotNull`, `@NotBlank`, etc.).
- Include nested data for API responses.
- Use builder pattern where appropriate.

---

## Frontend Conventions

### Component Structure
- Use functional components with hooks.
- Strict TypeScript types for props and API responses.
- Tailwind CSS for styling.
- Clear loading and error states.

### Modal Pattern
- Controlled via `isOpen`, `onClose`, `onSave`, and `editData`.
- Validate on submit, not blur. Show all errors at once.

### API Services
- Centralized in `services/api.ts`.
- Use async/await, handle errors, and type all responses.
- All controller API's should have actual method in its path. e.g) 
- e.g) ProjectController.getProjectMappings should be /api/projects/ at controller level 
- and getProjectMappings should be getProjectMappings/{id} method level. Path variable should be placed at the end of the method.

### Project Configuration
- Always check project config before using environments/regions/profiles.
- Never hardcode defaults.

### Table/Grid Views
- Use reusable `TableGrid` component.
- Handle loading/empty/error states.
- Follow UI/UX standards.

---

## UI/UX & Coding Standards
- Color palette: slate/emerald/rose/amber.
- Spacing: `space-y-6`, `gap-4`, `px-6 py-4`, etc.
- Button styles: pre-defined Tailwind classes for primary, secondary, danger actions.
- TypeScript: always type props, API responses, avoid `any`.
- Validation: validate on submit, show all errors, disable submit while loading.
- State management: useState/useEffect/useCallback, always handle loading and error states.

---

## Common Pitfalls
- Never hardcode environment/region/profile defaults—always use project config.
- Always use DTOs in API responses, never JPA entities.
- Always use dependency arrays in useEffect.
- Always handle loading and error states in UI.
- Use @Transactional for service methods that modify data.

---

