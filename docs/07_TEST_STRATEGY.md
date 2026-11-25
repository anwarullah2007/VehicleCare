# 7. Test Strategy and Acceptance Test Plan

**Version:** 1.0

## 1. Testing goals
Verify functional correctness, date calculations, data ownership, reminder idempotency, usability and deployment readiness.

## 2. Test levels
- Unit tests: pure calculations and validation.
- Component tests: forms, cards, filters and UI states.
- Integration tests: Supabase CRUD and authentication.
- Security tests: RLS and ownership boundaries.
- End-to-end tests: complete user journeys.
- Manual acceptance tests: final demonstration flows.

## 3. Critical unit test cases

### Lifecycle date calculation
- Installation date + 12 months.
- Installation date + 36 months.
- Month-end addition (Jan 31 + 1 month).
- Leap-year boundary.
- Missing installation date.
- Missing lifespan.
- Zero/negative lifespan rejected.

### Calendar maintenance
- Add 6 months to a normal date.
- Add months across year boundary.
- Month-end behavior.
- Due today.
- Due in 7 days.
- Due in 30 days.
- Overdue.
- Invalid interval rejected.

### Distance maintenance
- Current reading below threshold.
- Current reading equals threshold.
- Current reading exceeds threshold.
- Missing odometer reading.
- Negative reading rejected.
- Lower-than-previous reading flagged.

### Reminder idempotency
- First job run creates expected reminder.
- Second run creates no duplicate.
- Different reminder offsets create distinct reminders.
- Updated due date creates a new event identity.
- Inactive/replaced part does not generate new lifecycle reminders.

## 4. Functional acceptance tests

| ID | Scenario | Expected result |
|---|---|---|
| AT-01 | Register account | Account created and profile available |
| AT-02 | Log in | Authenticated dashboard shown |
| AT-03 | Add two-wheeler | Vehicle appears in list |
| AT-04 | Add four-wheeler | Vehicle appears in list |
| AT-05 | Add component with lifespan | Expected date calculated |
| AT-06 | Add warranty date | Warranty tracked separately |
| AT-07 | Add date schedule | Next due date shown |
| AT-08 | Add distance schedule | Next due kilometre shown |
| AT-09 | Add odometer reading | Reading saved and schedule evaluated |
| AT-10 | Add maintenance record | History updated |
| AT-11 | Replace component | Old component retained as replaced; new component created |
| AT-12 | Run reminder job | Matching notification created |
| AT-13 | Run reminder job twice | No duplicate notification |
| AT-14 | Mark notification read | Read state persists |
| AT-15 | Disable email | No email attempt; in-app alert still works |

## 5. Security tests
Use two separate test users, User A and User B.

- A cannot list B's vehicles.
- A cannot retrieve B's component by UUID.
- A cannot modify B's maintenance schedule.
- A cannot insert a record referencing B's part.
- A cannot view B's notifications.
- A cannot modify B's reminder settings.
- Anonymous users cannot access private rows.
- Client cannot supply another user's identity to bypass RLS.

These tests must run against the actual Supabase RLS policies, not merely mocked frontend code.

## 6. UI tests
- Empty dashboard.
- Loading states.
- Network/API error states.
- Invalid form values.
- Mobile layout.
- Keyboard navigation.
- Long component names and large history lists.
- Notification read/unread filtering.

## 7. Release acceptance
Do not call the MVP complete until:
- All critical tests pass.
- RLS tests pass.
- Reminder duplicate tests pass.
- No secrets are exposed in the frontend bundle or Git repository.
- Production environment variables are configured.
- A clean test account can complete the main demo journey.
