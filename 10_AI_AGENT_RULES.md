# 10. Instructions for AI Coding Agents

You are acting as a senior full-stack engineer working on VehicleCare.

## 1. Mandatory first action
Before editing or generating code:
1. Read every file in the `docs/` directory.
2. Summarize the system purpose, scope, architecture, database model and security model.
3. Identify contradictions, missing decisions and implementation risks.
4. Ask for approval before changing an accepted architecture decision.
5. Do not generate the complete application in one step.

## 2. Product boundaries
VehicleCare is a web application for individual owners of two-wheelers and four-wheelers.

The MVP tracks:
- Vehicles.
- Components/parts.
- User-entered expected lifespan.
- Warranty dates.
- Calendar-based maintenance schedules.
- Odometer-based maintenance schedules.
- Maintenance history.
- In-app reminders.
- Optional email reminders.

Do not add sensors, OBD, GPS, AI diagnosis, workshop accounts, payments or unrelated features unless explicitly approved.

Never claim that a component has failed based only on its expected replacement date.

## 3. Approved technology baseline
- React
- Vite
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Edge Functions / supported scheduled execution
- Git and GitHub
- Vercel or an approved static host

Do not introduce a second backend framework or unnecessary dependencies without explaining the reason and obtaining approval.

## 4. Security requirements
- Enable and test RLS on every user-owned table.
- Never trust a client-supplied user ID for ownership.
- Never expose the Supabase service-role key or email provider secret in browser code.
- Keep secrets in server-side configuration.
- Validate all input.
- Test with at least two separate users.
- Do not treat frontend route guards as authorization.

## 5. Coding standards
- Use TypeScript and explicit types for domain models and service interfaces.
- Keep UI components focused and reusable.
- Keep business logic out of large presentation components.
- Put Supabase queries in service modules.
- Keep date calculations in tested pure functions.
- Use accessible labels, keyboard support and visible focus states.
- Provide loading, empty, error and success states.
- Avoid unnecessary abstraction and overengineering.
- Do not add dependencies without explaining their purpose.

## 6. Database standards
- Use version-controlled SQL migrations.
- Define primary keys, foreign keys, constraints and indexes.
- Preserve replaced component and maintenance history.
- Enforce ownership with RLS.
- Make reminder deduplication a database-enforced rule.
- Do not perform destructive schema changes without approval and migration notes.

## 7. Date and reminder standards
- Use DATE for date-only concepts and TIMESTAMPTZ for event timestamps.
- Respect the user's configured timezone.
- Follow the documented month-end date arithmetic rule.
- Test leap years and month-end dates.
- Make scheduled reminder processing idempotent.
- Email failure must not remove in-app notifications.
- Distance reminders require a valid latest odometer reading.

## 8. Required workflow for every milestone
Before implementation:
- State the goal and relevant requirements.
- List files expected to change.
- Explain the approach and risks.

After implementation:
- Summarize files created/modified.
- Explain important components, functions and data flow.
- List commands to run and tests to execute.
- Report test results honestly.
- Identify known limitations and remaining work.
- Do not claim a feature is complete unless it has been tested.

## 9. Do not
- Generate the whole project in one response.
- silently change the database model.
- hardcode sample data into production logic.
- invent manufacturer lifespan recommendations.
- expose secrets.
- skip RLS because the frontend hides other users' records.
- claim email or scheduled jobs work without verifying configuration.
- add paid services without approval.
- make unrelated refactors during a feature task.

## 10. First task for the agent
Do not write application code yet.

Read the documentation and return:
1. A concise architecture summary.
2. A list of contradictions or missing details.
3. A proposed implementation sequence.
4. A list of risks.
5. Any questions requiring the project owner's decision.

Wait for approval before starting Phase 1.
