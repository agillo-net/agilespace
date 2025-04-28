# Work Session Tracker - Supabase + Next.js

## Database Schema (Supabase)

### Tables

#### 1. `work_sessions`
| Column             | Type          | Description                                      |
|--------------------|---------------|--------------------------------------------------|
| id                 | UUID (PK)     | Primary key                                     |
| github_issue_id    | Text          | ID or URL of linked GitHub issue                |
| note               | Text          | Markdown text note                              |
| status             | Enum          | `active`, `paused`, `completed`                  |
| start_time         | Timestamp     | When the session was started                    |
| end_time           | Timestamp     | When the session was completed                  |
| total_tracked_time | Integer       | Total tracked time in seconds                   |
| labels             | Text[]        | Array of labels                                 |
| created_by         | UUID (FK)     | Linked to `auth.users.id`                       |
| created_at         | Timestamp     | Timestamp when created                          |
| updated_at         | Timestamp     | Timestamp when last updated                     |

#### 2. `work_session_participants`
| Column             | Type          | Description                                      |
|--------------------|---------------|--------------------------------------------------|
| id                 | UUID (PK)     | Primary key                                     |
| work_session_id    | UUID (FK)     | Linked to `work_sessions.id`                    |
| github_login       | Text          | GitHub username                                 |
| is_creator         | Boolean       | True if participant is the creator              |

### Enums

- `status_enum`: `active`, `paused`, `completed`

### Relationships

- `work_sessions` has many `work_session_participants`.
- `work_session_participants.work_session_id` references `work_sessions.id`.


## Business Rules

1. **Starting a Work Session**:
   - Validate that none of the participants have an `active` session.
   - If a conflict, return the usernames of the blocking participants.

2. **Work Session Life Cycle**:
   - Active -> Paused -> Continued -> Completed.
   - After `completed`, only `labels` field is editable.

3. **Single Active Session Constraint**:
   - No user should have more than one active session simultaneously.

4. **Default Participant**:
   - Creator is automatically added as the first participant with `is_creator = true`.


## Important Queries

### For User
- Fetch active session.
- Fetch in-progress (paused) sessions.
- Fetch completed sessions.

### For Dashboard
- Total hours logged:
  - Grouped by: Day, Week, 2 Weeks, Month, 6 Months, Year.
- Total hours per label and per user.

### Optimizations
- Use database **indexes** on `status`, `created_by`, `start_time`, and `end_time`.
- Use **Postgres functions** (`rpc`) for aggregations.


## Tech Stack

- **Supabase** (PostgreSQL, Auth, Storage)
- **Next.js** (TypeScript)
- **React Query** or **SWR** for data fetching
- **Shadcn/ui** or **TailwindCSS** for UI components


## Example Supabase Row Level Security (RLS)
```sql
CREATE POLICY "Allow users to access their sessions"
ON work_sessions
FOR SELECT USING (created_by = auth.uid());
```

## Example Aggregation Function (RPC)
```sql
CREATE OR REPLACE FUNCTION get_total_hours_by_user(start_date DATE, end_date DATE)
RETURNS TABLE(user_id UUID, total_hours NUMERIC)
LANGUAGE SQL
AS $$
  SELECT p.github_login, SUM(ws.total_tracked_time) / 3600 AS total_hours
  FROM work_sessions ws
  JOIN work_session_participants p ON ws.id = p.work_session_id
  WHERE ws.status = 'completed'
    AND ws.start_time BETWEEN start_date AND end_date
  GROUP BY p.github_login;
$$;
```

---

# End of Specification

---

**Next Step:**
You can copy this `.md` content and send it directly to the AI Agent for an extremely clear development start!

