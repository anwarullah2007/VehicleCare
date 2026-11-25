# 5. Security and Privacy Specification

**Version:** 1.0

## 1. Security objectives
- Ensure users can only access their own records.
- Protect authentication sessions and secrets.
- Prevent unauthorized modification of vehicles, components and notifications.
- Minimize personal data collection.
- Make server-side scheduled operations privileged but controlled.

## 2. Authentication
- Use Supabase Auth; do not implement password storage manually.
- Support sign-up, sign-in, sign-out and password recovery.
- Use the supported Supabase session handling.
- Protect authenticated routes in the UI for user experience, but never treat route protection as database security.
- Handle expired sessions gracefully.

## 3. Authorization and Row Level Security
Enable RLS on every user-owned table.

Required ownership logic:
- `profiles`: user can select/update only the row where `id = auth.uid()`.
- `vehicles`: user can select/insert/update/archive only rows where `user_id = auth.uid()`.
- `parts`: access only when the parent vehicle belongs to `auth.uid()`.
- `maintenance_schedules`: access only when the parent part belongs to a vehicle owned by `auth.uid()`.
- `maintenance_records`: access only when the referenced part belongs to a vehicle owned by `auth.uid()`. If a schedule is supplied, it must belong to the same part.
- `odometer_readings`: access only when the parent vehicle belongs to `auth.uid()`.
- `notifications`: user can access only rows where `user_id = auth.uid()`; referenced part/schedule must be consistent with ownership.
- `reminder_settings`: user can access only the row where `user_id = auth.uid()`.

For insert policies, validate ownership using `WITH CHECK`. For updates, validate both existing row visibility and new row ownership. Test cross-user access explicitly.

## 4. Secrets and environment variables
- Browser may contain only public Supabase project URL and anon/publishable key.
- Supabase service-role key must never appear in frontend code, committed files, screenshots or logs.
- Email provider API key belongs only in server-side Edge Function secrets.
- `.env.local` and other secret-bearing files must be in `.gitignore`.
- Provide `.env.example` with variable names and placeholder values only.
- Rotate any key accidentally committed or exposed.

## 5. Input validation
Validate at both UI and trusted backend/database boundaries:
- Required vehicle brand/model.
- Valid vehicle category.
- Positive lifespan and intervals.
- Non-negative costs and odometer values.
- Warranty end date not before warranty start.
- Valid date ordering where applicable.
- Registration number normalization.
- Reasonable text length limits.
- Valid reminder offsets.

Never trust client-supplied user_id; derive ownership from the authenticated identity or verify it server-side.

## 6. Privacy
- Collect only information needed for the application.
- Explain why registration number and email are requested.
- Avoid exposing registration numbers in public URLs or logs.
- Do not share or sell user data.
- Provide a documented account/data deletion process.
- Use synthetic sample data for demos and screenshots.

## 7. Background function security
- Scheduled functions must authenticate their trigger or use the platform's supported secure scheduler integration.
- Keep service-role credentials server-side.
- Limit function permissions and returned data.
- Validate references before creating notifications.
- Add execution logging without exposing secrets.
- Rate-limit or bound email attempts.

## 8. Security test checklist
- User A cannot read User B's vehicle by guessing UUID.
- User A cannot update or delete User B's part.
- User A cannot create a maintenance record for User B's component.
- User A cannot read User B's notifications.
- A user cannot change a row's owner_id to another user.
- Unauthenticated database requests cannot access private rows.
- Browser bundle and Git history contain no service-role or email API keys.
- Scheduled function cannot be invoked by an unauthorized public request.
