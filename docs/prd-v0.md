# Product Requirements Document

## Product Name
**GitHub Work Session Tracker**

## Overview
This application is a web-based dashboard for teams to track and analyze GitHub issue work sessions. It provides GitHub authentication, work session tracking, and time analysis features.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Routing](#2-routing)
3. [Login Page](#3-login-page)
4. [Dashboard Layout](#4-dashboard-layout)
5. [Tracker Page](#5-tracker-page)
6. [Work Session Card](#6-work-session-card)
7. [Analysis Page](#7-analysis-page)

---

## 1. Authentication

- If a user is **not authenticated**, they should be **redirected** to the `/login` page.
- Once authenticated (via GitHub or email), the user is **redirected** to the `/dashboard` page.
- Authentication should persist across sessions using secure cookies or tokens.

---

## 2. Routing

| Path                     | Component                  | Auth Required |
|--------------------------|-----------------------------|----------------|
| `/login`                | LoginPage                   | No             |
| `/dashboard`            | DashboardLayout (default)   | Yes            |
| `/dashboard/tracker`    | TrackerPage                 | Yes            |
| `/dashboard/analysis`   | AnalysisPage                | Yes            |

---

## 3. Login Page

- **Layout:**
  - Centered card on the screen.
  - Two login options:
    - GitHub OAuth
    - Email/Password

- **Behavior:**
  - If already authenticated, redirect to `/dashboard`.
  - Show error messages if login fails.

---

## 4. Dashboard Layout

- Contains a **persistent sidebar**.
- Sidebar has **two navigation items**:
  - **Tracker** → navigates to `/dashboard/tracker`
  - **Analysis** → navigates to `/dashboard/analysis`

---

## 5. Tracker Page

### Layout
The page is split into **three vertical sections**:

#### 1. Search Bar
- Input for searching GitHub issues via GitHub API.
- Selecting a result creates a new active work session.

#### 2. Active Work Sessions
- Cards representing **ongoing** sessions.
- Each card corresponds to a selected GitHub issue.

#### 3. Completed Work Sessions
- Cards representing **submitted** sessions.
- Read-only version of the active work session cards.

---

## 6. Work Session Card

### Active Work Session Card

**Fields & Components:**
- **Issue Title**: from selected GitHub issue
- **Timer**: real-time session duration (start, pause, resume)
- **Notes Input**: free text field
- **Participants Input**: tags or email-style input
- **Action Buttons**:
  - **Pause/Resume**
  - **Discard**
  - **Submit** (moves to completed section)

**Behavior:**
- Submit moves the card to the "Completed Work Sessions" section.
- Discard deletes the session permanently.

---

### Completed Work Session Card

- Same layout as active session card.
- All fields are **read-only**.
- Timer is shown as total time spent.
- No action buttons.

---

## 7. Analysis Page

### Layout:
- List of all **team members**.
- For each member, display **aggregated session time**:
  - **Today**
  - **Last 2 Weeks**
  - **Last Month**

### Data Source:
- Work sessions submitted by users.
- Aggregation logic is based on session timestamps and user ID.

---

## Future Enhancements (Optional)

- Filtering by GitHub repo or label.
- Export work sessions as CSV.
- Session tagging for types of work (e.g., bugfix, feature).
- User settings (timezone, theme).

---

## Tech Notes (Optional)

- **Frontend:** React + Next.js
- **Backend:** Node.js or Serverless (API routes)
- **Database:** PostgreSQL / Supabase
- **Auth:** NextAuth.js (GitHub + Email)
- **CI/CD:** Vercel
