# Contributing to AgileSpace

Thank you for your interest in contributing to AgileSpace! This guide will help you get started.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:
- Be respectful and considerate
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Assume good intentions

## Getting Started

### 1. Set Up Development Environment

Follow the [ENVIRONMENT.md](./ENVIRONMENT.md) guide to set up your local development environment.

### 2. Understand the Architecture

Read [CLAUDE.md](./CLAUDE.md) to understand:
- Project structure
- Architecture patterns
- Component conventions
- Data flow

### 3. Review Specialized Agents

Check `subagents/` directory for in-depth documentation on specific areas:
- GitHub Integration
- Session Tracking
- Database Operations
- UI Components
- And more...

## How to Contribute

### Ways to Contribute

1. **Report Bugs** - Submit detailed bug reports
2. **Suggest Features** - Propose new features or improvements
3. **Fix Issues** - Pick up issues labeled `good first issue`
4. **Improve Documentation** - Help make docs clearer
5. **Code Review** - Review pull requests from others

### Before Starting

1. **Check Existing Issues** - Avoid duplicate work
2. **Discuss Major Changes** - Create an issue first for big features
3. **Follow Conventions** - Maintain consistency with existing code

## Development Workflow

### 1. Fork and Clone

```bash
# Fork the repository on GitHub

# Clone your fork
git clone https://github.com/agillo-net/agilespace.git
cd agilespace

# Add upstream remote
git remote add upstream https://github.com/original-org/agilespace.git
```

### 2. Create a Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# or for bug fixes
git checkout -b fix/bug-description
```

### Branch Naming Conventions

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or fixes
- `chore/` - Maintenance tasks

Examples:
- `feature/command-palette-shortcuts`
- `fix/session-timer-drift`
- `docs/update-setup-guide`
- `refactor/extract-notification-utils`

### 3. Make Changes

Follow these guidelines:

#### Code Style

- **TypeScript**: Use strict types, avoid `any`
- **Components**: Use functional components with hooks
- **Imports**: Use `@/` alias for all imports
- **Formatting**: Code will be auto-formatted on commit

#### Component Structure

```typescript
// 1. Imports (grouped: external, internal, types)
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Session } from "@/types"

// 2. Types/Interfaces
interface SessionCardProps {
  session: Session
  onEnd: (id: string) => void
}

// 3. Component
export function SessionCard({ session, onEnd }: SessionCardProps) {
  // Hooks at top
  const [isEnding, setIsEnding] = useState(false)

  // Event handlers
  const handleEnd = async () => {
    setIsEnding(true)
    await onEnd(session.id)
    setIsEnding(false)
  }

  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  )
}
```

#### Database Changes

If your change requires database modifications:

1. **Update Schema**
   ```bash
   # Create migration
   supabase migration new your_migration_name

   # Edit migration file
   # supabase/migrations/TIMESTAMP_your_migration_name.sql
   ```

2. **Regenerate Types**
   ```bash
   pnpm supabase:db:generate
   ```

3. **Update Queries/Mutations**
   - Add to `src/lib/supabase/queries.ts` (reads)
   - Add to `src/lib/supabase/mutations.ts` (writes)

4. **Create TanStack Query Hook**
   ```typescript
   // src/hooks/api/use-your-feature.ts
   export function useYourFeature() {
     return useQuery({
       queryKey: ['your-feature'],
       queryFn: getYourFeature
     })
   }
   ```

#### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(sessions): add duration milestone notifications"
git commit -m "fix(timer): correct drift calculation in session timer"
git commit -m "docs(readme): update installation instructions"
git commit -m "refactor(auth): extract token refresh logic"
```

### 4. Test Your Changes

Before submitting:

```bash
# Type check
pnpm build

# Lint code
pnpm lint

# Fix linting issues
pnpm lint --fix
```

Manual testing checklist from [TESTING.md](./TESTING.md):
- [ ] Feature works as expected
- [ ] Loading states display correctly
- [ ] Error states handled gracefully
- [ ] No console errors
- [ ] Works on mobile
- [ ] Real-time features work (if applicable)

### 5. Commit and Push

```bash
# Stage changes
git add .

# Commit with message
git commit -m "feat(feature): description"

# Push to your fork
git push origin feature/your-feature-name
```

### 6. Create Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill in the PR template:

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- List of changes made
- Another change
- One more change

## Testing
- [ ] TypeScript compiles without errors
- [ ] Linting passes
- [ ] Manually tested locally
- [ ] Verified on mobile (if UI change)

## Screenshots (if applicable)
Add screenshots showing the changes

## Related Issues
Fixes #123
Relates to #456
```

## Pull Request Guidelines

### PR Requirements

- [ ] Title follows convention: `type(scope): description`
- [ ] Description clearly explains the changes
- [ ] Code follows project conventions
- [ ] TypeScript types are correct
- [ ] No linting errors
- [ ] Database types regenerated (if schema changed)
- [ ] Loading and error states implemented
- [ ] Real-time subscriptions cleaned up
- [ ] No console errors or warnings

### PR Size

Keep PRs focused and manageable:
- **Small**: < 200 lines - Ideal
- **Medium**: 200-500 lines - Good
- **Large**: 500-1000 lines - Break down if possible
- **Very Large**: > 1000 lines - Should be split

### Review Process

1. **Automated Checks** - Must pass before review
   - TypeScript compilation
   - ESLint
   - Build process

2. **Code Review** - At least one approval required
   - Reviewers may request changes
   - Address feedback promptly
   - Push new commits to same branch

3. **Testing** - Reviewer will test functionality
   - Verify feature works as described
   - Check for edge cases
   - Test on different devices if UI change

4. **Approval and Merge**
   - Once approved, maintainer will merge
   - Delete your branch after merge

## Code Review Best Practices

### When Reviewing Others' PRs

- **Be Kind and Constructive** - Focus on the code, not the person
- **Ask Questions** - "What if...?" instead of "This is wrong"
- **Provide Context** - Explain why something matters
- **Suggest Alternatives** - Offer concrete solutions
- **Appreciate Good Work** - Highlight what's done well

Example reviews:
```markdown
✅ Good:
"This component looks great! One suggestion: Could we extract the
validation logic into a custom hook? That would make it easier to
test and reuse. What do you think?"

❌ Avoid:
"This is wrong. Use a hook instead."
```

### When Receiving Feedback

- **Stay Open-Minded** - Consider suggestions objectively
- **Ask for Clarification** - If feedback is unclear
- **Explain Your Reasoning** - If you disagree, explain why
- **Say Thank You** - Appreciate the time reviewers spent

## Feature Development Guide

### Adding a New Feature

Follow this workflow from [CLAUDE.md](./CLAUDE.md):

1. **Plan the Feature**
   - Create issue describing feature
   - Discuss approach with maintainers
   - Design database schema (if needed)

2. **Implement Database Changes**
   - Create migration
   - Update RLS policies
   - Regenerate types

3. **Create Data Layer**
   - Add queries/mutations
   - Create TanStack Query hooks
   - Handle loading/error states

4. **Build UI**
   - Use shadcn/ui components
   - Follow existing patterns
   - Include loading skeletons

5. **Add Routes** (if needed)
   - Create route files
   - Configure navigation

6. **Test Thoroughly**
   - Manual testing
   - Test on mobile
   - Verify real-time updates

7. **Create PR**
   - Clear description
   - Screenshots if UI
   - Link related issues

### Best Practices

**Always:**
- Use TypeScript strict mode
- Follow existing patterns
- Provide user feedback (toasts)
- Handle loading states
- Handle error states
- Clean up subscriptions
- Use optimistic updates (mutations)
- Include accessibility attributes

**Never:**
- Use `any` type (use `unknown` if needed)
- Expose sensitive data client-side
- Skip RLS policies
- Create memory leaks
- Leave console.log in production code
- Commit `.env.local` or secrets

## Documentation Contributions

Good documentation is crucial! Help us by:

### Improving Existing Docs

- Fix typos and grammatical errors
- Add missing information
- Update outdated content
- Improve clarity and examples

### Adding New Documentation

- API documentation
- Architecture decisions
- Component usage examples
- Troubleshooting guides

### Documentation Standards

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep examples up-to-date
- Link to related documentation

## Issue Guidelines

### Reporting Bugs

Use this template:

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: Chrome 120
- OS: macOS 14
- AgileSpace version: 1.0.0

## Screenshots
Add screenshots if applicable

## Additional Context
Any other relevant information
```

### Feature Requests

Use this template:

```markdown
## Feature Description
Clear description of the feature

## Problem it Solves
What user problem does this solve?

## Proposed Solution
How do you envision this working?

## Alternatives Considered
Other approaches you've thought about

## Additional Context
Mockups, examples from other apps, etc.
```

## Community

### Getting Help

- **Documentation**: Start with [CLAUDE.md](./CLAUDE.md) and other docs
- **Issues**: Search existing issues first
- **Discussions**: Use GitHub Discussions for questions
- **Team Chat**: Join our Slack/Discord (if available)

### Staying Updated

- **Watch Repository**: Get notifications for new issues/PRs
- **Follow Releases**: Subscribe to release notifications
- **Join Discussions**: Participate in feature discussions

## Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Special thanks section (for major features)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Questions?

- Check [CLAUDE.md](./CLAUDE.md) for development guidance
- Read [ENVIRONMENT.md](./ENVIRONMENT.md) for setup help
- See [TESTING.md](./TESTING.md) for testing guidelines
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment info
- Ask in GitHub Discussions
- Reach out to maintainers

---

Thank you for contributing to AgileSpace! 🚀
