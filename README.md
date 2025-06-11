# AgileSpace

A modern web application that integrates with GitHub to provide comprehensive team effort tracking and visualization. AgileSpace helps organizations monitor team performance, track issues, and generate insightful charts for better project management and resource allocation.

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- Docker (for local Supabase development)
- Supabase CLI

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/agillo-net/agilespace.git
cd agilespace
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Local Development

1. Start the development server:
```bash
pnpm dev
```

2. Start Supabase locally:
```bash
pnpm supabase:start
```

The application will be available at `http://localhost:5173`

## Database Management

### Local Supabase Setup

1. Initialize Supabase (first time only):
```bash
pnpm supabase init
```

2. Start Supabase services:
```bash
pnpm supabase:start
```

3. Stop Supabase services:
```bash
pnpm supabase stop
```

### Database Migrations

1. Create a new migration:
```bash
pnpm supabase migration new your_migration_name
```

2. Apply migrations:
```bash
pnpm supabase db reset
```

3. Push migrations to remote:
```bash
pnpm supabase db push
```

## Project Structure

```
agilespace/
├── src/
│   ├── components/     # Reusable UI components
│   ├── lib/           # Utility functions and shared logic
│   │   └── supabase/  # Supabase client and queries
│   ├── pages/         # Page components
│   └── types/         # TypeScript type definitions
├── supabase/
│   ├── migrations/    # Database migrations
│   ├── seed.sql       # Seed data
│   └── config.toml    # Supabase configuration
└── public/           # Static assets
```

## Database Schema

The application uses the following main tables:
- `profiles`: User profiles
- `spaces`: Workspace spaces
- `space_members`: Space membership information
- `sessions`: Work sessions
- `tracks`: Issue tracking
- `tags`: Session tags

## Contributing

### Branch Naming Convention

Use the following format for branch names:
```
<type>/<ticket-number>-<short-description>
```

Types:
- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `chore/` - Maintenance tasks
- `test/` - Adding or modifying tests

Examples:
```bash
feat/AS-123-add-user-profile
fix/AS-456-fix-login-error
docs/AS-789-update-readme
```

### Commit Message Format

Follow the Conventional Commits specification:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

Examples:
```bash
feat(auth): add GitHub OAuth login
fix(api): handle null response in user profile
docs(readme): update installation instructions
```

### Pull Request Guidelines

1. PR Title Format:
```
<type>: <ticket-number> <description>
```

Examples:
```
feat: AS-123 Add user profile management
fix: AS-456 Fix login error handling
docs: AS-789 Update README with new setup instructions
```

2. PR Description Template:
```markdown
## Description
[Provide a brief description of the changes]

## Related Issues
Closes #[issue-number]

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Performance improvement
- [ ] Other (please describe)
```

3. Create a new branch for your feature:
```bash
git checkout -b feat/AS-123-your-feature-name
```

4. Make your changes and commit them:
```bash
git commit -m "feat(auth): add GitHub OAuth login"
```

5. Push your changes:
```bash
git push origin feat/AS-123-your-feature-name
```

6. Create a Pull Request using the template above

## License

[Your License Here]
