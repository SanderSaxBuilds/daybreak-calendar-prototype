# Daybreak planner

An independent, self-initiated response to the public [Daybreak prototype brief](https://contra.com/opportunity/62BB7XeR-prototype-designs-for-calendar-deep-focus-desktopmobile-application). This concept was not commissioned or endorsed by Daybreak. It uses a fictional sample week and does not connect to external calendars or client accounts.

## What works

- A day view with planned time, protected focus time and the longest open stretch, a timeline strip of the day and a schedule that shows open gaps between blocks. Any gap of 45 minutes or more can be protected as focus time in one step.
- A week view with seven columns on wide screens and a stacked list on phones. Every block opens its editor directly.
- Work, personal and family calendars that can be shown or hidden. Hidden calendars still count for overlap checks and open time.
- Add, edit and delete blocks with field validation and a specific overlap warning. Blocks can end exactly at midnight.
- A focus timer with 25, 50 and 90 minute lengths, and a search for an open slot of the chosen length. A running or paused timer survives a page reload. A short breathing break timer is also included.
- The plan is saved in this browser. Download it as a JSON file and restore it later. If the saved plan is damaged, Daybreak keeps every readable block, offers the stored copy as a download and never overwrites it without asking.
- Desktop, tablet and phone layouts with keyboard-accessible controls.

The day summary is calculated from entered blocks. It is not a productivity score. Times stay as entered and are not converted across time zones. There is no account sync, sharing, recurrence, notifications, app blocking or calendar integration.

## Run

Serve this folder with any static web server, then open its root URL in a modern browser. With Node.js installed:

```sh
node preview-server.mjs
```

Open `http://127.0.0.1:8765/`. Data is stored in the browser's local storage for this origin. Avoid entering sensitive information in a shared browser profile. To check the date, planning and backup logic:

```sh
node --test tests/model.test.mjs tests/backup.test.mjs
```

## Suggested funded first phase

This proof is a conversation starter, not a promise to deliver the full public brief without a contract. A paid first phase should establish the intended platforms, calendar integration requirements, target users, existing research, design-source format, revision limit and acceptance criteria. A practical first milestone would cover a tested daily and weekly planning flow, a consistent desktop and mobile component system, and an editable design handoff. The interactive code here can inform that milestone, but it does not replace editable Figma source or a production backend.

The suggested review script is: find a block on another day, add a family commitment, detect and resolve an overlap, protect an open gap as focus time, pause and resume a timer, then reload and confirm the plan remains. This is a proposed usability exercise. No participant study has been conducted or claimed.
