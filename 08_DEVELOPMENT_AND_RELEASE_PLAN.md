# 8. Development and Release Plan

**Version:** 1.0

## 1. Recommended technology baseline
- React
- Vite
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Edge Functions
- Supabase-supported scheduled execution
- Git and GitHub
- Vercel or equivalent static hosting

Use compatible stable versions at project initialization and record exact versions in `package.json` and the lockfile. Do not blindly upgrade dependencies mid-project.

## 2. Suggested repository structure

```text
vehiclecare/
├── docs/
│   ├── README.md
│   ├── 01_SRS.md
│   ├── 02_SYSTEM_ARCHITECTURE.md
│   ├── 03_DATABASE_DESIGN.md
│   ├── 04_API_AND_INTEGRATIONS.md
│   ├── 05_SECURITY_AND_PRIVACY.md
│   ├── 06_UI_UX_SPECIFICATION.md
│   ├── 07_TEST_STRATEGY.md
│   ├── 08_DEVELOPMENT_AND_RELEASE_PLAN.md
│   ├── 09_ARCHITECTURE_DECISIONS.md
│   └── 10_AI_AGENT_RULES.md
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── vehicles/
│   │   ├── parts/
│   │   ├── maintenance/
│   │   ├── notifications/
│   │   └── settings/
│   ├── lib/
│   │   └── supabase/
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── styles/
├── supabase/
│   ├── migrations/
│   └── functions/
├── tests/
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── vite.config.ts
```

The exact structure may evolve, but feature boundaries and separation of concerns should remain.

## 3. Development phases

### Phase 0 – Documentation review
- Review all documents.
- Identify contradictions and open decisions.
- Approve baseline.
- No application code yet.

Deliverable: approved design baseline.

### Phase 1 – Environment and repository
- Install Node.js LTS and VS Code.
- Initialize React + Vite + TypeScript.
- Configure Tailwind.
- Initialize Git.
- Create `.env.example` and `.gitignore`.
- Verify local development server.

Deliverable: running starter application.

### Phase 2 – UI shell
- Navigation and responsive layout.
- Dashboard placeholder.
- Vehicle list and forms with temporary mock data.
- Reusable form controls and status badges.

Deliverable: navigable frontend prototype.

### Phase 3 – Supabase foundation
- Create Supabase project.
- Add database migrations.
- Configure Auth.
- Create tables, constraints, indexes and RLS.
- Test ownership with two accounts.

Deliverable: secure database foundation.

### Phase 4 – Core CRUD
- Connect authentication.
- Vehicle CRUD.
- Component CRUD.
- Schedule CRUD.
- Odometer readings.
- Maintenance records.

Deliverable: persistent application workflows.

### Phase 5 – Business logic
- Lifecycle date calculation.
- Calendar schedule calculation.
- Distance schedule calculation.
- Replacement workflow.
- Unit tests.

Deliverable: tested core domain logic.

### Phase 6 – In-app reminders
- Notification schema and UI.
- Scheduled Edge Function.
- Idempotency.
- Logs and retry behavior.
- Test with controlled dates/sample records.

Deliverable: automated in-app reminders.

### Phase 7 – Email notifications
- Choose and configure provider.
- Verify sender.
- Store secrets server-side.
- Implement email templates and delivery status.
- Test disabled, successful and failed delivery.

Deliverable: optional email reminders.

### Phase 8 – Quality and deployment
- End-to-end testing.
- Security/RLS regression tests.
- Responsive/accessibility review.
- Deploy frontend.
- Configure production Supabase settings and environment variables.
- Prepare demo data and README.

Deliverable: deployed MVP and demonstration guide.

## 4. Definition of done for each feature
A feature is complete only when:
- Requirement is understood.
- UI is implemented.
- Validation is implemented.
- Database access is protected by RLS.
- Loading, empty, success and error states exist.
- Relevant tests pass.
- Code is reviewed and documented.
- No secret is exposed.
- The developer can explain the feature's data flow.

## 5. Git workflow
- Use small, meaningful commits.
- Suggested branches: `main`, `develop`, and short feature branches if useful.
- Do not commit `.env.local`, API keys or service-role keys.
- Commit database migrations with related feature changes.
- Review AI-generated diffs before committing.
- Keep `main` deployable.

## 6. Deployment checklist
- Frontend build succeeds.
- Production Supabase URL and public key configured.
- Database migrations applied.
- RLS enabled and tested.
- Edge Function secrets configured server-side.
- Scheduler configured and verified.
- Email sender verified if email enabled.
- Redirect URLs and Auth settings configured.
- No test credentials or secrets in repository.
- Smoke test completed using a fresh account.

## 7. Cost controls
- Use free tiers for development where possible.
- Check current limits, inactivity/pause rules, storage, database, function and email quotas before choosing providers.
- Avoid paid maps, SMS, AI APIs, sensor hardware and premium templates in the MVP.
- In-app notifications are the baseline delivery mechanism.
- Do not promise unlimited or permanently free hosting.
