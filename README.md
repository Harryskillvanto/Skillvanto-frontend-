# Skillvanto Frontend

A real, connected UI for Skillvanto — talks to your `skillvanto-backend` server
over plain HTTP on localhost (this is why it's a separate local project
rather than a Claude.ai artifact: browsers block a secure chat page from
reaching `http://localhost`, so this has to run on your machine like the
backend does).

## Before you start

Your backend must already be running in its own terminal window:
```bash
cd ~/Downloads/skillvanto-backend
npm run dev
```
Leave that running. This frontend expects it at `http://localhost:4000`.

## Setup

In a **new** terminal window:
```bash
cd ~/Downloads/skillvanto-frontend   # wherever you unzip this
npm install
npm run dev
```

It'll print something like:
```
Local:   http://localhost:5173/
```

Open that URL in your browser. You should see a login screen.

## Logging in

Use any account you've already created on the backend, e.g.:
- Admin: `admin@skillvanto.com` / `ChangeMe123!`
- Or any Recruiter/BDM account you created along the way (e.g. `jane@skillvanto.com` / `Recruit123!`)

## What's connected

Everything talks to the real backend now — no more browser-only storage:
- **Clients** — list, create (Admin/BDM), view detail with their job orders
- **Job orders** — list/filter, create (Admin/BDM), assign/reassign recruiter (Admin/BDM), full candidate pipeline
- **Candidates** — search, add, notes
- **Pipeline stages** — the stage buttons are *role-aware*: a Recruiter only sees their allowed stages enabled, a BDM sees theirs. Trying to click a disallowed one is prevented in the UI, and the server would reject it anyway even if it somehow got through — the real enforcement is always on the backend.
- **Notifications** — the 🔔 bell in the header polls every 15 seconds, shows unread count, and marks everything read when you open it

## A few honest limitations

- Resume upload isn't wired up yet — candidates have a plain "skills" text field for now, matching what the backend stores (`skills`, `resumeUrl`, `resumeText` are all plain string fields you could fill in via a future upload feature)
- No password reset / "forgot password" flow
- Session is stored in `sessionStorage`, so it clears when you close the browser tab — you'll need to log in again next time (this was a deliberate simple choice, easy to change to `localStorage` for a longer-lived session if you'd prefer)

## Next steps

- Bulk-create your 20 recruiter + BDM accounts (Admin's "New job order" → assign flow already supports picking among them)
- Deploy both backend and frontend somewhere real instead of your laptop, with Postgres instead of SQLite
