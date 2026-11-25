# 1. Software Requirements Specification (SRS)

**Product:** VehicleCare  
**Version:** 1.0  
**Status:** Proposed baseline  
**Primary platform:** Responsive web application

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for VehicleCare. It is the product-level source of truth for developers, testers and AI coding agents.

### 1.2 Product summary
VehicleCare helps individual vehicle owners keep a digital record of their vehicles and their replaceable or serviceable components. It calculates estimated replacement dates from user-entered lifespan values, tracks warranty dates, manages maintenance schedules and generates reminders.

### 1.3 Problem statement
Vehicle owners may forget when components were installed, when warranties expire, when servicing is due, or what work was performed previously. Information may be scattered across invoices, messages and memory. VehicleCare centralizes these records and provides timely reminders.

### 1.4 Intended users
The MVP supports one user role: an individual vehicle owner. A user can manage multiple vehicles and the components belonging to each vehicle.

## 2. Goals and success outcomes
- Allow an owner to register and manage multiple vehicles.
- Allow an owner to record components and their lifecycle information.
- Track warranty expiry separately from expected replacement.
- Support calendar-based and odometer-based maintenance schedules.
- Preserve completed maintenance and replacement history.
- Generate useful, non-duplicated reminders.
- Protect each user's data from other users.
- Work on modern desktop and mobile browsers.

## 3. Scope

### 3.1 In scope for MVP
- Email/password account registration, login, logout and password recovery using Supabase Auth.
- User profile and timezone.
- Create, view, edit and archive/delete vehicles.
- Two-wheeler and four-wheeler categories.
- Create, view, edit and retire vehicle components.
- User-entered installation date, expected lifespan, warranty dates and notes.
- Calculate an estimated replacement date.
- Create date-based and distance-based maintenance schedules.
- Manually record odometer readings.
- Record completed services, repairs, inspections and replacements.
- Dashboard summaries and upcoming/overdue lists.
- In-app notifications and read/unread state.
- Configurable reminder preferences.
- Scheduled reminder generation.
- Optional email delivery after in-app reminders are stable.
- Responsive interface and deployment.

### 3.2 Explicitly out of scope for MVP
- Sensors, IoT devices, GPS or OBD-II integration.
- Automatic detection or diagnosis of mechanical faults.
- Automatic retrieval or verification of manufacturer warranty.
- Manufacturer-specific service-plan database.
- Workshop, dealer or fleet-management accounts.
- Payments, subscriptions or marketplace.
- AI diagnosis or safety scoring.
- Native Android/iOS applications.
- Automatic odometer collection.

### 3.3 Future enhancements
- Workshop/service-centre accounts.
- Invoice and service-document uploads.
- QR codes for component records.
- Manufacturer/model-specific maintenance templates from verified sources.
- Vehicle diagnostic integrations.
- Analytics for ownership and maintenance costs.
- Native push notifications.

## 4. Definitions
- **Vehicle:** A registered car or two-wheeler.
- **Part/component:** A component installed in a vehicle, such as a battery, tyre, brake pad or engine.
- **Expected lifespan:** A user-entered estimate, not a guarantee of actual life.
- **Expected replacement date:** Installation date plus user-entered lifespan.
- **Warranty expiry:** Date on which the recorded warranty period ends.
- **Maintenance schedule:** A rule describing when a maintenance activity is next due.
- **Maintenance record:** A historical entry describing work that has been completed.
- **Odometer reading:** A user-entered vehicle distance reading in kilometres.
- **Reminder:** A notification generated before or at a due event.

## 5. Functional requirements

### FR-01 Account and profile
- The system shall allow a user to register and authenticate using Supabase Auth.
- The system shall allow the user to sign out and request password recovery.
- The system shall maintain a profile linked to the authenticated account.
- The user shall be able to set a timezone for date/time presentation and reminder scheduling.
- The system shall not expose another user's profile or records.

### FR-02 Vehicle management
- The user shall be able to create, view, edit and archive a vehicle.
- A vehicle shall have a category: `TWO_WHEELER` or `FOUR_WHEELER`.
- A vehicle shall support brand, model, registration identifier and optional manufacture/purchase year.
- A user may own multiple vehicles.
- Registration identifier uniqueness shall be scoped to a user when a value is supplied.
- The system shall validate required fields and sensible year ranges.

### FR-03 Component management
- The user shall be able to add components to a vehicle.
- The component shall support a name, category, manufacturer (optional), installation date, purchase date (optional), cost (optional), warranty start/end dates (optional), expected lifespan in months (optional), notes and status.
- The user shall be able to edit component information.
- A component may be marked `ACTIVE`, `REPLACED` or `REMOVED`.
- The system shall calculate the expected replacement date when both installation date and expected lifespan are provided.
- The system shall not infer actual failure from an estimated date.
- The user may register custom component names.

### FR-04 Warranty tracking
- Warranty expiry shall be tracked independently from expected replacement.
- Warranty dates shall be optional.
- If both warranty start and end dates are entered, the end date shall not precede the start date.
- The system shall generate configured reminders before warranty expiry and on the expiry date.
- A warranty expiry reminder shall not state that the component has failed.

### FR-05 Maintenance schedules
- A component may have zero or more maintenance schedules.
- The MVP shall support calendar-based intervals in months and distance-based intervals in kilometres.
- Each schedule shall have a name, type, interval, active state and next due value.
- A calendar schedule shall require a positive month interval and a valid next due date.
- A distance schedule shall require a positive kilometre interval and a valid next due odometer value.
- A schedule may be linked to maintenance records.
- The user shall be able to pause, edit or deactivate a schedule.

### FR-06 Odometer readings
- The user shall be able to record odometer readings for a vehicle.
- Readings shall be non-negative integers in kilometres.
- The system shall warn about a reading lower than the latest accepted reading.
- Corrections shall be explicit and auditable at the application level; the system shall not silently replace historical readings.
- The latest accepted reading shall be used to evaluate distance-based schedules.

### FR-07 Maintenance records
- The user shall be able to create a record for service, repair, inspection or replacement.
- A record shall include date, optional odometer reading, description and optional cost.
- A record may reference a component and/or maintenance schedule.
- Completed history shall remain available after a component is replaced or retired.
- When a scheduled activity is completed, the user shall be able to mark the related schedule as serviced and calculate its next due point.

### FR-08 Lifecycle calculation
- If installation date and expected lifespan are present, the system shall calculate an expected replacement date.
- Month arithmetic shall use calendar-month addition with a documented end-of-month rule.
- If required inputs are absent, the replacement date shall remain unset.
- Editing the installation date or lifespan shall recalculate the date.
- The interface shall label this value as an estimate.

### FR-09 Reminder generation
- The system shall support configurable day offsets before date-based due events. Default: 30, 7 and 0 days.
- The system shall support a configurable kilometre threshold before distance-based maintenance. Initial suggested default: 500 km.
- Reminder types shall include warranty, expected replacement and maintenance.
- The system shall generate reminders using a scheduled server-side process.
- Reminder generation shall be idempotent: repeated job execution shall not create duplicate reminders for the same event and offset.
- In-app notification generation shall not depend on the user keeping the browser open.
- The system shall record job execution errors for troubleshooting.

### FR-10 Notifications
- Users shall be able to view notifications.
- Users shall be able to mark a notification read/unread.
- Notifications shall identify the related vehicle/component where applicable.
- Email delivery shall be optional and controlled by user preferences.
- Email failures shall not delete or suppress the in-app notification.
- Email sending shall use a server-side provider integration; provider secrets shall never be exposed in browser code.

### FR-11 Dashboard
- The dashboard shall show vehicle count, active component count, upcoming maintenance, approaching replacement dates, warranty expiries and overdue items.
- Dashboard summaries shall be derived from persisted records and current dates/readings.
- Empty states shall guide a new user to add a vehicle.
- The dashboard shall distinguish overdue, due soon and informational items.

### FR-12 Data lifecycle
- Deleting or archiving a vehicle shall not accidentally erase historical information without a clear, documented policy.
- The MVP should prefer archive/soft-delete for vehicles and components.
- A component replacement shall create a new component record and mark the old component as replaced; old records shall be preserved.
- Component replacement shall not automatically copy maintenance schedules from the replaced component without user consent; the UI shall provide an optional "Copy maintenance schedules from previous part" choice.

## 6. Business rules
1. User-entered lifespan and intervals are estimates/instructions supplied by the owner, not authoritative mechanical advice.
2. Warranty expiry and expected replacement are independent events.
3. A component can have multiple maintenance schedules.
4. Maintenance history is immutable in meaning: corrections may be made, but the application should preserve an updated timestamp and avoid silently discarding history.
5. Odometer-based reminders require a current odometer reading. Without one, show that the schedule cannot be evaluated.
6. The system shall not label a component “failed” solely because a date has passed.
7. Reminder offsets are preferences; the due event itself remains tied to the schedule.
8. All displayed dates shall be interpreted consistently using the user's configured timezone; date-only values should not shift because of browser timezone conversion.

## 7. Non-functional requirements

### Security
- Supabase Auth shall manage credentials.
- All user-owned tables shall use Row Level Security.
- Server-only secrets shall remain in Edge Function secrets/environment configuration.
- Inputs shall be validated on both client and server/database boundaries where appropriate.
- Use least-privilege access.

### Performance
- Common pages should avoid fetching unrelated users' data.
- Add indexes for ownership foreign keys and due-date queries.
- Paginate long histories and notification lists.
- Avoid unnecessary network requests and duplicate data fetching.

### Usability and accessibility
- Responsive desktop/mobile layout.
- Consistent navigation and clear labels.
- Keyboard-accessible controls and visible focus states.
- Form validation with actionable error messages.
- Do not rely on colour alone to communicate urgency.
- Provide loading, empty, success and error states.

### Reliability
- Scheduled jobs must be safe to retry.
- Duplicate reminders must be prevented at database level.
- Failures must be observable through logs.
- Core vehicle and maintenance records must remain usable if email delivery is unavailable.

### Maintainability
- Use modular components and service functions.
- Keep business calculations separate from UI components.
- Use TypeScript for type safety.
- Maintain migrations and documentation in version control.
- Add tests for date calculations, reminder rules and access control.

## 8. Acceptance criteria
The MVP is acceptable when:
- A user can register, log in and recover access.
- A user can create and manage multiple two-wheelers/four-wheelers.
- A user can register multiple components per vehicle.
- User-entered lifespan produces the correct estimated replacement date.
- Warranty dates are tracked independently.
- Calendar and kilometre maintenance schedules can be created and updated.
- Odometer readings can be recorded and validated.
- Completed maintenance records are retained.
- Scheduled reminders are generated at configured offsets.
- Re-running reminder processing does not create duplicates.
- One user cannot read or modify another user's data.
- The interface works on supported desktop and mobile browsers.
- The deployed application can be demonstrated using test accounts and sample data.

## 9. Assumptions and constraints
- The project is developed by a small student team/individual.
- No paid hardware is available or required.
- Free service tiers are preferred; current quotas, inactivity rules and email restrictions must be checked before deployment.
- The user is responsible for entering accurate dates, intervals and odometer readings.
- VehicleCare is not a substitute for manufacturer guidance or professional inspection.
