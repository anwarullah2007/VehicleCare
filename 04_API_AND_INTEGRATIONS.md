# 4. API and Integration Design

**Version:** 1.0  
**Backend platform:** Supabase

## 1. General approach
The MVP does not require a separate custom REST API server for ordinary CRUD. The React application uses the Supabase client with the authenticated user session. PostgreSQL RLS is the authoritative authorization boundary.

Privileged operations (scheduled reminder generation and email sending) run in server-side Edge Functions.

## 2. Frontend service modules
Create a service layer so React components do not contain raw database queries everywhere.

Suggested modules:
- `authService`: sign-up, sign-in, sign-out, password recovery, session.
- `vehicleService`: list/create/update/archive vehicles.
- `partService`: list/create/update/retire parts.
- `maintenanceService`: schedules, completed records and odometer readings.
- `notificationService`: list, mark read, unread count.
- `settingsService`: retrieve/update reminder preferences.

Each service should:
- Accept typed inputs.
- Return typed data or a normalized error.
- Avoid privileged credentials.
- Rely on RLS for ownership enforcement.
- Avoid logging personal data unnecessarily.

## 3. Logical operation catalogue

| Area | Operation | Data object |
|---|---|---|
| Auth | Register / login / logout / recovery | Supabase Auth |
| Vehicles | List owned vehicles | vehicles |
| Vehicles | Create vehicle | vehicles |
| Vehicles | Update vehicle | vehicles |
| Vehicles | Archive vehicle | vehicles |
| Parts | List parts for owned vehicle | parts |
| Parts | Create component | parts |
| Parts | Update component | parts |
| Parts | Retire/replace component | parts |
| Maintenance | Create schedule | maintenance_schedules |
| Maintenance | Update/deactivate schedule | maintenance_schedules |
| Maintenance | Add completed service | maintenance_records |
| Odometer | Add reading | odometer_readings |
| Notifications | List / mark read | notifications |
| Settings | Get / update preferences | reminder_settings |

These are logical operations, not a commitment to hand-build custom HTTP endpoints.

## 4. Business calculation interfaces
Keep pure functions separate from React components.

Recommended functions:
- `calculateExpectedReplacementDate(installedOn, lifespanMonths)`
- `calculateNextCalendarDueDate(lastCompletedOn, intervalMonths)`
- `calculateNextOdometerDue(lastCompletedKm, intervalKm)`
- `getDateReminderOffsets(dueDate, today, offsets)`
- `getDistanceReminderState(currentKm, dueKm, thresholdKm)`
- `buildReminderDedupeKey(eventType, sourceId, dueValue, offset)`

Requirements:
- Functions must handle missing values.
- Functions must validate positive intervals.
- Month arithmetic must follow the end-of-month rule in the architecture document.
- Date-only calculations must not accidentally shift dates because of UTC conversion.
- Add unit tests for month-end, leap year and boundary cases.

## 5. Scheduled reminder function

### Trigger
Run once per day initially. The exact scheduler mechanism and available quota must be verified in the selected Supabase plan.

### Processing steps
1. Load eligible active parts and schedules.
2. Determine each owner's timezone and reminder settings.
3. Evaluate warranty expiry dates.
4. Evaluate expected replacement dates.
5. Evaluate date-based maintenance due dates.
6. Evaluate distance-based maintenance against the latest accepted odometer reading.
7. Generate deterministic dedupe keys.
8. Insert notification rows with conflict-safe behavior.
9. Queue or send email only when enabled.
10. Update delivery status and log summary/error details.

### Idempotency
A retry must not create a second notification for the same event and offset. Enforce uniqueness in PostgreSQL, not only in application code.

### Failure handling
- If email fails, keep the in-app notification.
- Record failure status and attempt count.
- Use bounded retries; avoid infinite rapid retry loops.
- Do not log secrets or full sensitive payloads.
- Make the function safe to rerun.

## 6. Email integration
Email is a secondary channel.

Requirements:
- Select a provider only after checking current free-tier terms and verification requirements.
- Store provider API key as an Edge Function secret.
- Never put the key in React environment variables exposed to the browser.
- Use a verified sender/domain if required by the provider.
- Respect the user's email preference.
- Do not send email before the user has a valid email address and the application has configured delivery.
- Email templates should include the part/vehicle label, due event, due date or distance, and a link back to the application.
- Avoid wording that claims the part is faulty or unsafe.

## 7. Browser notifications
MVP priority:
1. In-app notification centre.
2. Email reminders.
3. Browser push notifications only if time and implementation complexity allow.

Browser push requires service-worker and permission handling and should not block the core project.

## 8. Error model
The UI should distinguish:
- Validation error: user must correct input.
- Authentication error: sign-in/session issue.
- Authorization error: user lacks access.
- Network/service error: retry may help.
- Not found: record no longer exists or is inaccessible.

Never reveal database internals, secrets or stack traces to end users.
