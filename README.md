# Daybreak planning and focus concept

An independent, self-initiated response to the public [Daybreak prototype brief](https://contra.com/opportunity/62BB7XeR-prototype-designs-for-calendar-deep-focus-desktopmobile-application). This concept was not commissioned or endorsed by Daybreak. It uses fictional schedule data and does not connect to external calendars or client accounts.

## What works

- Navigate between dates and a seven-day agenda, including across month boundaries.
- Show work, personal and family blocks together or filter each calendar.
- Add, edit and delete blocks with field validation and a specific overlap warning.
- Find an available 25-minute interval across all entered calendars, including hidden calendars.
- Start, pause, resume and end a focus timer or optional quiet timer. A running timer recovers from a page reload.
- Save the entered plan in this browser. Reset it to the fictional sample plan when desired.
- Use the desktop, tablet and mobile layouts with keyboard-accessible controls.

The day summary is calculated from entered blocks. It is not a productivity score, prediction or scientific assessment. Times remain as entered and are not converted across time zones. This proof has no account sync, shared permissions, recurrence, notifications, app blocking or calendar integrations.

## Run

Serve this folder with a local static web server, then open its root URL in a modern browser. For example, with Node.js installed:

```sh
node preview-server.mjs
```

Open `http://127.0.0.1:8765/`. Data is stored in the browser's local storage for this origin. Avoid entering sensitive information in a shared browser profile. To check the date and planning logic:

```sh
node --test tests/model.test.mjs
```

## Suggested funded first phase

This proof is a conversation starter, not a promise to deliver the full public brief without a contract. A paid first phase should establish the intended platforms, calendar integration requirements, target users, existing research, design-source format, revision limit and acceptance criteria. A practical first milestone would cover a tested daily and weekly planning flow, a consistent desktop and mobile component system, and an editable design handoff. The interactive code here can inform that milestone, but it does not replace editable Figma source or a production backend.

The suggested review script is: find a block on another day, add a family commitment, detect and resolve an overlap, reserve a focus interval, pause and resume a timer, then reload and confirm the plan remains. This is a proposed usability exercise. No participant study has been conducted or claimed.
