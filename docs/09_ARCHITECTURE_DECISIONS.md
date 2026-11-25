# 9. Architecture Decision Records (ADR)

**Version:** 1.0

## ADR-001: User-defined lifespan and maintenance intervals
**Status:** Accepted (Finalized)

**Decision:** Users enter expected lifespan, warranty dates and maintenance intervals. Do not hardcode manufacturer lifespan recommendations in the application; all expected lifespans and maintenance intervals must be user-entered estimates.

**Reason:** Component life varies by manufacturer, model, usage, climate, load and maintenance. A universal value could mislead users.

**Consequence:** More data entry is required, but reminders are based on the owner's chosen information.

## ADR-002: No sensors or automatic fault detection in MVP
**Status:** Accepted

**Decision:** No IoT sensors, GPS or OBD integration.

**Reason:** The project should be affordable, achievable and focused on lifecycle records and reminders.

**Consequence:** Odometer readings and component information are manually entered. The system cannot detect actual faults.

## ADR-003: React + Vite + TypeScript frontend
**Status:** Accepted, subject to developer learning needs

**Decision:** Use React with Vite and TypeScript.

**Reason:** Component-based UI, strong ecosystem, maintainable structure and useful type checking.

**Consequence:** Developer must learn components, props, state, hooks and TypeScript basics. AI assistance must not replace understanding.

## ADR-004: Supabase managed backend
**Status:** Accepted

**Decision:** Use Supabase Auth and PostgreSQL, with Edge Functions for privileged background work.

**Reason:** Reduces the need to build and host a separate custom backend for the MVP.

**Consequence:** Project depends on Supabase service limits and configuration. RLS must be implemented and tested carefully.

## ADR-005: In-app notifications before email
**Status:** Accepted

**Decision:** Implement persistent in-app notifications first; email is a later milestone.

**Reason:** In-app reminders are easier to test and do not depend on an external email provider.

**Consequence:** Users must open the application to see in-app reminders. Scheduled processing still runs server-side.

## ADR-006: Date and distance schedules are separate in MVP
**Status:** Accepted

**Decision:** Each maintenance schedule uses either a calendar interval or an odometer interval. Combined “whichever comes first” schedules are deferred.

**Reason:** Avoid ambiguous logic in the first release.

**Consequence:** A component may have separate calendar and distance schedules if both are required.

## ADR-007: Preserve replaced component history
**Status:** Accepted (Finalized)

**Decision:** Replacement creates a new component record and marks the previous component as replaced. Maintenance schedules are **not** copied automatically without user consent; the UI provides an optional "Copy maintenance schedules from previous part" choice.

**Reason:** Maintains lifecycle and service history.

**Consequence:** UI must distinguish active components from historical components.

## ADR-008: Use free tiers but do not promise zero ongoing cost
**Status:** Accepted

**Decision:** Prefer free-tier services and verify limits before deployment.

**Reason:** Student project budget is constrained.

**Consequence:** Quotas, inactivity policies, sender verification and deployment restrictions must be checked periodically.

## ADR-009: Authoritative database-side derived fields
**Status:** Accepted (Finalized)

**Decision:**
1. `parts.expected_replacement_on` is computed and maintained authoritatively by a PostgreSQL `BEFORE INSERT OR UPDATE` trigger using the documented month-end clamping rule. The frontend uses a matching pure TypeScript helper for live previews, tested against identical boundary cases.
2. `odometer_readings` is the historical source of truth; `vehicles.current_odometer_km` is updated atomically via database trigger/RPC when readings are inserted or corrected.

## Open decisions to resolve during implementation
1. Exact Supabase scheduling mechanism (`pg_cron` + `pg_net`, GitHub Actions, or an external scheduler): **must verify actual availability, restrictions, and free-tier limits of the chosen Supabase plan before selecting**. Do not assume any scheduling feature is free or permanently available.
2. Email provider and current free-tier limits (only after in-app notifications are implemented and tested).
3. Whether account deletion is implemented in MVP or documented as a manual support process.
4. Whether registration number is mandatory or optional. Recommended: optional, unique per user when supplied.
5. Whether a component can have multiple simultaneous date and distance schedules. Recommended: yes, as separate schedule records.
6. Whether component lifespan is stored in months only or supports days/years in the UI. Recommended: UI may accept years/months but normalize to months in storage.
