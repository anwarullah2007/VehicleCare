# VehicleCare – Project Documentation Pack

**Project:** VehicleCare – Vehicle Parts Lifecycle & Maintenance Management System  
**Document set:** 1.0  
**Status:** Design baseline – ready for technical review, not yet implementation-approved

## Purpose
This folder contains the requirements, architecture, data model, security, integration, testing, delivery plan and coding-agent instructions for VehicleCare. Read these documents before generating or modifying application code.

## Documents
1. `01_SRS.md` – product overview, scope, users, functional and non-functional requirements.
2. `02_SYSTEM_ARCHITECTURE.md` – system context, components, flows, design decisions and deployment view.
3. `03_DATABASE_DESIGN.md` – entities, fields, relationships, constraints, indexes and data lifecycle.
4. `04_API_AND_INTEGRATIONS.md` – frontend-to-Supabase interactions, background jobs and email integration.
5. `05_SECURITY_AND_PRIVACY.md` – authentication, authorization, RLS, secrets and privacy requirements.
6. `06_UI_UX_SPECIFICATION.md` – screens, navigation, forms, states and accessibility.
7. `07_TEST_STRATEGY.md` – acceptance criteria, functional tests, security tests and edge cases.
8. `08_DEVELOPMENT_AND_RELEASE_PLAN.md` – milestones, repository structure, definition of done and deployment.
9. `09_ARCHITECTURE_DECISIONS.md` – approved decisions and decisions requiring validation.
10. `10_AI_AGENT_RULES.md` – instructions for Copilot Agent / Antigravity.

## Product baseline
- Audience: individual vehicle owners.
- Vehicle types: two-wheelers and four-wheelers.
- Tracking: component lifecycle, warranty, date-based maintenance and distance-based maintenance.
- Data entry: users provide installation, warranty, lifespan, service interval and odometer details.
- Hardware: no sensors, OBD devices or IoT hardware in the MVP.
- Notifications: in-app reminders first; email reminders after the in-app flow is tested.
- Suggested lifespan values: not authoritative in the MVP. Users enter values based on manufacturer guidance or a qualified mechanic.
- Stack: React + Vite + TypeScript (recommended), Tailwind CSS, Supabase Auth, PostgreSQL, Supabase Edge Functions / scheduled execution, GitHub and Vercel.
- Cost: use free tiers where possible, but verify current provider limits before deployment. “Free” does not mean unlimited or guaranteed permanent availability.

## Important product limitation
VehicleCare is a reminder and record-keeping tool. It does not diagnose mechanical faults, determine actual component condition, guarantee safety, or replace the vehicle manufacturer's maintenance schedule or a qualified mechanic's inspection.

## How to use this pack
1. Keep this `docs/` folder in the root of the `VehicleCare` Git repository alongside the application source folders (`src/`, `supabase/`, etc.).
2. Give the AI coding agent `docs/10_AI_AGENT_RULES.md` as its operating instruction.
3. Ask the agent to review the full documentation and report contradictions or missing decisions.
4. Do not ask it to generate the entire application in one prompt.
5. Resolve open decisions and approve a milestone before implementation.
