# CareLog

Thai interactive presentation prototype for remote family care. Static app; open `dist/index.html` through a local HTTP server. No build required.

## Included flows

- Family and loved-one modes, shared browser-local demo state.
- Simulated LINE onboarding, profile and invite-code acceptance.
- Medication creation/editing and intake logs.
- Appointment review/confirmation and travel handoff.
- Treatment records with filename-only attachment metadata.
- Activity recommendations using explicit demo rules, detail/registration and simulated totals.
- Local transport selection, accessibility preference, booking and step-through tracking.
- Family requests, sharing settings, activity logs and simulated notifications.
- Responsive navigation and accessible native dialogs/forms.

## Prototype boundaries

All records are illustrative. State is stored only in this browser under `carelog-demo-v1`; it is not synchronized between devices. This is not an authenticated health-record service. LINE sign-in/messages, AI result interpretation, hospital booking, GPS, partner transport and payments are demonstrations only. Attachment contents are not uploaded or retained. Sharing settings demonstrate configuration, not production authorization. Vehicle routes and prices are fixed sample data, not map-service calculations. Dates intentionally follow the September 2026 presentation scenario.

## Verification

Checked JavaScript syntax, local assets, phone and desktop layouts, appointment-to-ride confirmation and tracking, activity registration, medication creation, and WebMCP navigation/read summaries. Invalid page navigation rejects without state changes.
