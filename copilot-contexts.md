# Copilot Contexts for Monitoring Dashboard

This document provides high-level context, domain model, and references for the Monitoring Dashboard project. For detailed conventions and ready-made prompts, see copilot-instructions.md and copilot-prompts.md.

---

## 1. Project Overview

**Monitoring Dashboard** is a full-stack application for managing infrastructure, services, deployments, and service instances across multiple projects and environments.

- **Backend:** Spring Boot 3.x, Java 17, JPA/Hibernate, H2 Database
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Build:** Gradle (backend), Vite (frontend)
- **Architecture:** RESTful API, Component-based UI, Project-scoped configuration

---

## 2. Domain Model Relationships

- **Project** (1) → (N) **Component**, **Infrastructure**, **ProjectEnvironmentMapping**
- **Component** (1) → (N) **DeploymentConfig**
- **Infrastructure** (1) → (N) **DeploymentConfig**
- **DeploymentConfig** (1) → (N) **ServiceInstance**

---

## 3. References

- `copilot-instructions.md` — Conventions, coding standards, implementation patterns
- `copilot-prompts.md` — Ready-made prompts and scaffolding commands
