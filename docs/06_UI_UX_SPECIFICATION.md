# 6. UI/UX Specification

**Version:** 1.0  
**Design direction:** Clean, responsive, practical vehicle-maintenance dashboard

## 1. UX principles
- Make the next important action obvious.
- Use plain language; avoid mechanical jargon where possible.
- Distinguish “warranty expires”, “maintenance due” and “estimated replacement”.
- Do not imply a part has failed because a date has passed.
- Support mobile screens first-class, not as an afterthought.
- Provide loading, empty, success and error states.

## 2. Main navigation
Authenticated application:
- Dashboard
- My Vehicles
- Maintenance
- Notifications
- Settings
- Profile / Sign out

## 3. Screen specifications

### 3.1 Landing / authentication
- Product name and short explanation.
- Sign in and create account.
- Password recovery.
- Clear validation and authentication errors.

### 3.2 Dashboard
Summary cards:
- My vehicles
- Active components
- Upcoming maintenance
- Upcoming warranty expiries

Content sections:
- Due soon
- Overdue maintenance
- Components approaching estimated replacement
- Recent notifications

Empty state: explain how to add the first vehicle.

### 3.3 Vehicle list
- List/grid of the user's vehicles.
- Vehicle type, brand, model and registration label.
- Add vehicle action.
- Edit/archive actions.
- Empty state for a new account.

### 3.4 Vehicle details
- Vehicle summary.
- Current odometer and option to add a reading.
- Components grouped by active/replaced/removed.
- Add component action.
- Recent maintenance history.

### 3.5 Add/edit component
Fields:
- Component name/category.
- Manufacturer (optional).
- Installation date.
- Purchase date (optional).
- Cost (optional).
- Warranty start/end (optional).
- Expected lifespan in months (optional).
- Notes.

Show a preview of expected replacement date when enough data is supplied. Explain that this is an estimate based on user-entered data.

When replacing an existing component:
- Do not automatically copy maintenance schedules from the previous part without user consent.
- Provide an explicit optional checkbox/toggle: "Copy maintenance schedules from previous part".

### 3.6 Maintenance schedule
- Schedule name.
- Schedule type: calendar interval or odometer interval.
- Interval months or kilometres.
- Last completed date/reading.
- Next due date/reading.
- Active toggle.

Do not present an ambiguous combined date-and-distance schedule in MVP. A future enhancement may support “whichever occurs first”.

### 3.7 Maintenance record form
- Component.
- Service type.
- Date.
- Odometer reading (optional).
- Description.
- Cost (optional).
- Related schedule (optional).

After saving a scheduled service, ask whether to update the associated schedule.

### 3.8 Notifications
- Unread/read filter.
- Notification type.
- Related vehicle/component.
- Due date or distance.
- Mark as read action.
- Clear explanation and link to relevant record.

### 3.9 Settings
- User name and timezone.
- In-app notification preference.
- Email notification preference.
- Date reminder offsets.
- Distance reminder threshold.
- Sign out and account management.

## 4. Status language
Use:
- `Upcoming`
- `Due soon`
- `Due today`
- `Overdue`
- `Warranty expired`
- `Estimated replacement date passed`
- `Replaced`
- `Removed`

Avoid:
- “Engine failed” based only on date.
- “Unsafe” without an inspection/diagnostic basis.
- “Expired part” if the part does not have a manufacturer-defined expiry.

## 5. Accessibility
- Keyboard-operable navigation and forms.
- Visible focus states.
- Proper labels for form controls.
- Sufficient contrast.
- Icons accompanied by text or accessible labels.
- Colour is not the only indicator of urgency.
- Error messages associated with the relevant field.

## 6. Responsive behavior
- Desktop: sidebar navigation and dashboard grid.
- Tablet: collapsible navigation and two-column cards where appropriate.
- Mobile: compact navigation, stacked cards and full-width forms.
