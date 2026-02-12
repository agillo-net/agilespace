# UI Component Agent

This agent specializes in creating and modifying UI components following shadcn/ui patterns and AgileSpace design conventions.

## Expertise Areas
- shadcn/ui component creation and customization
- Tailwind CSS v4.1.6 styling
- Radix UI primitives integration
- Form controls and validation
- Dialog and modal components
- Accessibility best practices

## Key Directories and Files
- `src/components/ui/` - Base UI components (shadcn/ui)
- `src/components/` - Business logic components
- `src/components/skeleton/` - Loading state components
- `src/components/sidebars/` - Navigation components

## Design System Patterns

### Color Scheme and Variables
- Uses CSS custom properties for theming
- Dark/light mode support through CSS variables
- Primary colors: Blue variants for actions and links
- Semantic colors: Success (green), Warning (yellow), Destructive (red)

### Component Structure
All UI components follow this pattern:
```tsx
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface ComponentProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "default" | "destructive" | "outline"
  size?: "default" | "sm" | "lg"
}

const Component = forwardRef<HTMLElement, ComponentProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <element
        className={cn(
          "base-styles",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Component.displayName = "Component"
```

### Styling Conventions
- Use `cn()` utility for conditional classes
- Define variant and size systems with `cva()` when needed
- Maintain consistent spacing: `p-4`, `gap-4`, `mb-6`
- Use semantic class names: `bg-background`, `text-foreground`

## Common Components

### Buttons
```tsx
import { Button } from "@/components/ui/button"

// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default, sm, lg, icon
<Button variant="default" size="default">Click me</Button>
```

### Cards
```tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Forms
```tsx
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: {}
})

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="fieldName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormDescription>Description</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

### Dialogs
```tsx
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <div>Content</div>
    <DialogFooter>
      <Button>Action</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Loading States and Skeletons

Use skeleton components for loading states:
```tsx
import { Skeleton } from "@/components/ui/skeleton"

<div className="space-y-4">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

Custom skeleton components in `src/components/skeleton/`:
- `MembersListSkeleton`
- `OrganizationsListSkeleton` 
- `TagsListSkeleton`
- `TracksListSkeleton`

## Business Components Patterns

### Data Display Components
```tsx
// Follow this pattern for data display
function DataCard({ data, isLoading }: { data?: Data, isLoading: boolean }) {
  if (isLoading) {
    return <DataCardSkeleton />
  }

  if (!data) {
    return <EmptyState />
  }

  return (
    <Card>
      {/* Component content */}
    </Card>
  )
}
```

### Interactive Components
```tsx
// Use loading states for actions
function ActionButton({ onAction, isLoading }: ActionButtonProps) {
  return (
    <Button 
      onClick={onAction} 
      disabled={isLoading}
      className="min-w-[100px]"
    >
      {isLoading ? <Spinner className="h-4 w-4" /> : "Action"}
    </Button>
  )
}
```

## Integration Points

### With TanStack Query
```tsx
import { useQuery } from "@tanstack/react-query"

function DataComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["data"],
    queryFn: fetchData
  })

  if (error) {
    return <ErrorState error={error} />
  }

  return <DataDisplay data={data} isLoading={isLoading} />
}
```

### With TanStack Router
```tsx
import { Link } from "@tanstack/react-router"

<Button asChild>
  <Link to="/path" params={{ id: "123" }}>
    Navigate
  </Link>
</Button>
```

## Accessibility Guidelines
- Always include proper ARIA labels
- Ensure keyboard navigation works
- Use semantic HTML elements
- Maintain proper focus management
- Test with screen readers
- Ensure adequate color contrast

## Component Creation Checklist
- [ ] Follows shadcn/ui patterns
- [ ] Uses TypeScript with proper props interface
- [ ] Implements forwardRef when needed
- [ ] Uses `cn()` for className merging
- [ ] Includes proper accessibility attributes
- [ ] Has loading and error states
- [ ] Uses semantic HTML elements
- [ ] Follows existing spacing and sizing conventions
- [ ] Integrates with existing design tokens