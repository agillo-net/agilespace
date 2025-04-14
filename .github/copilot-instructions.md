# AgileSpace Dashboard Development Guide

## Architecture Overview

The AgileSpace dashboard is built with:
- **Frontend:** React-based dashboard in `/apps/dashboard`
- **Backend:** Convex backend in `/packages/backend` 
- **UI Library:** Component library in `/packages/ui`
- **Authentication:** Clerk for user authentication
- **Design System:** Following GitHub's design system principles

## Backend Integration

- Backend is managed by Convex in the `/packages/backend` folder
- AI agents have access to the Convex MCP server
- Use Convex hooks for data fetching and mutations

Example connecting to Convex:
```tsx
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";

// For fetching data
const tasks = useQuery(api.tasks.get, { userId });

// For mutations
const createTask = useMutation(api.tasks.create);
// Use with: createTask({ title, description });
```

## UI Components

- Use components from `/packages/ui` package
- Follow atomic design principles
- Keep components small and focused on a single responsibility

### Component Best Practices

✅ **GOOD: Small, focused component**
```tsx
// TaskCard.tsx
import { Card, Text, Button } from "@/packages/ui";

export function TaskCard({ task, onComplete }) {
  return (
    <Card>
      <Text variant="title">{task.title}</Text>
      <Text variant="body">{task.description}</Text>
      <Button onClick={onComplete}>Complete</Button>
    </Card>
  );
}
```

❌ **BAD: Overly complex component**
```tsx
// TaskManager.tsx - TOO COMPLEX!
import { Card, Text, Button, Input, Dropdown } from "@/packages/ui";

export function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [filter, setFilter] = useState("all");
  
  // Fetch tasks logic...
  // Filter tasks logic...
  // Add task logic...
  // Delete task logic...
  // Update task logic...
  
  return (
    <div>
      <Input value={newTask} onChange={e => setNewTask(e.target.value)} />
      <Button onClick={addTask}>Add Task</Button>
      <Dropdown value={filter} onChange={setFilter}>
        {/* Dropdown items... */}
      </Dropdown>
      
      {tasks.map(task => (
        <Card key={task.id}>
          <Text>{task.title}</Text>
          <Button onClick={() => deleteTask(task.id)}>Delete</Button>
          <Button onClick={() => completeTask(task.id)}>Complete</Button>
        </Card>
      ))}
    </div>
  );
}
```

## File Structure

Favor flat file structures over deeply nested ones:

✅ **GOOD: Flat structure**
```
components/
  TaskCard.tsx
  TaskList.tsx
  UserProfile.tsx
  TaskFilter.tsx
```

❌ **BAD: Overly nested structure**
```
components/
  tasks/
    card/
      CardHeader.tsx
      CardBody.tsx
      CardFooter.tsx
      index.tsx
    list/
      ListItem.tsx
      ListHeader.tsx
      index.tsx
```

## State Management

Use Convex for most state management needs:

```tsx
// Fetching data with useQuery
const tasks = useQuery(api.tasks.list, { status: "active" });

// Updating data with useMutation
const updateTask = useMutation(api.tasks.update);
function handleUpdate(id, data) {
  updateTask({ id, ...data });
}
```

For local UI state, use React's built-in hooks (useState, useReducer).

## Authentication

Authentication is handled by Clerk:

```tsx
import { useAuth } from "@clerk/nextjs";

function ProfilePage() {
  const { userId, isSignedIn } = useAuth();
  
  if (!isSignedIn) {
    return <SignInPrompt />;
  }
  
  return <UserProfile userId={userId} />;
}
```

## Best Practices

1. **Code Organization**
   - Group related components and utilities
   - Separate business logic from presentation
   - Use named exports for better imports

2. **Error Handling**
   - Always handle loading, error, and empty states
   - Provide meaningful feedback to users

3. **Performance**
   - Memoize expensive computations with useMemo and useCallback
   - Virtualize long lists
   - Use React.lazy for code splitting

4. **Styling**
   - Use the GitHub design system principles
   - Utilize the UI package for consistent styling
   - Keep styling close to components

5. **Testing**
   - Write unit tests for critical components
   - Separate business logic for easier testing
   - Mock Convex queries/mutations in tests
