# CodeCensus - Claude Code Development Guide

## Project Overview

CodeCensus is a fun asset ownership platform that helps track who owns what in your organization. Think of it as a simple directory for all your code, infrastructure, and systems - no more hunting around for the right person to contact!

### Tech Stack
- **Backend**: Go 1.25+ with standard library (net/http, database/sql)
- **Frontend**: React 19+ with TailwindCSS
- **Database**: PostgreSQL 18+
- **Models**: Protocol Buffers with buf.io for shared types
- **Deployment**: Single binary with embedded React build

### Architecture
Simple monolith design:
```
React SPA <-> Go Backend <-> PostgreSQL
```

## Key Features (MVP)
- Asset catalog (code, infrastructure, apps, systems)
- Owner assignment and tracking
- Fast search with PostgreSQL full-text search
- Role-based access control (admin, user, viewer)
- Simple notification system

## Claude Code Best Practices

### Token Management & Efficiency

#### Use `/clear` Command Strategically
- **Before major context switches**: `/clear` when moving between unrelated tasks
- **After completing features**: Clear context after finishing implementation phases
- **When context gets heavy**: If responses slow down, clear and restate your current goal

#### Restricted commands
- Never run any git related commands
- Never run any destructive commands

#### File Reading Strategy
- **Read selectively**: Only read files you actually need
- **Use Glob patterns**: Find files efficiently with `**/*.go` or `src/**/*.tsx`
- **Grep before reading**: Search for specific patterns before reading entire files

### Development Workflow

#### Planning Phase
1. Use TodoWrite for complex tasks (3+ steps)
2. Break down features into specific, actionable items
3. Mark todos as `in_progress` before starting work

#### Implementation Phase
1. **Search first**: Understand existing codebase patterns
2. **Follow conventions**: Match existing code style and structure
3. **Validate early**: Run lints/tests as you go, not just at the end

#### Useful Commands for This Project
```bash
# Development
go run cmd/server/main.go
npm run dev  # Frontend development

# Code generation (when we set up buf)
buf generate

# Testing
go test ./...
npm test

# Linting
golangci-lint run
npm run lint

# Database
psql -d codecensus
```

### Claude Code Efficiency Tips

#### Smart Search Strategies
```bash
# Find Go handlers
rg "func.*Handler" --type go

# Find React components
rg "export.*function.*Component" --type tsx

# Find database queries
rg "SELECT|INSERT|UPDATE|DELETE" --type sql
```

#### Context Management
- **Be specific**: "Fix the authentication bug in auth.go:45" vs "fix auth"
- **Reference line numbers**: Use `file:line` format for precise references
- **Minimize explanations**: Focus on implementation, not lengthy descriptions

#### File Organization
- Keep related files open in IDE for better context
- Use the file explorer to understand project structure
- Reference the RFC/PRD when making architectural decisions

### Project-Specific Guidelines

#### Database Patterns
- Use UUIDs for primary keys (`gen_random_uuid()`)
- Implement proper indexes for search performance
- Use PostgreSQL arrays for tags
- Always use parameterized queries

#### API Patterns
- RESTful endpoints following the RFC structure
- JSON request/response with protobuf validation
- Proper HTTP status codes
- Session-based authentication with HTTP-only cookies

#### Frontend Patterns
- Functional components with hooks
- TailwindCSS for styling
- Standard fetch API for HTTP requests
- Shared protobuf types between frontend/backend

### Common Tasks & Commands

#### Setting Up Development Environment
```bash
# Start PostgreSQL
docker run --name codecensus -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:18

# Run migrations (when implemented)
go run cmd/migrate/main.go up

# Start backend
go run cmd/server/main.go

# Start frontend (in ui/ directory)
npm start
```

#### Code Generation Workflow
```bash
# Generate protobuf code
buf generate

# Update dependencies
go mod tidy
npm install
```

### Token-Saving Strategies

1. **Use shorthand**: "Fix the bug" instead of "Please fix the authentication bug that is causing users to be unable to log in"

2. **Reference existing context**: "Apply the same pattern from users.go" instead of re-explaining the pattern

3. **Be direct**: Skip pleasantries and get straight to the technical request

4. **Use file references**: "Update auth.go:45" instead of pasting code blocks

5. **Leverage previous work**: Reference earlier implementations rather than re-describing

### Debugging Tips

#### Common Issues
- **CORS errors**: Check middleware setup in router.go
- **Database connection**: Verify PostgreSQL is running and credentials are correct
- **Build failures**: Ensure protobuf generation completed successfully
- **Search not working**: Check PostgreSQL full-text search indexes

#### Useful Debug Commands
```bash
# Check database connection
psql -d codecensus -c "SELECT version();"

# Test API endpoints
curl -X GET http://localhost:8080/api/health

# Check Go modules
go mod verify
```

## Getting Started

1. Set up the database schema following the RFC
2. Implement basic authentication and user management
3. Build the asset catalog with CRUD operations
4. Add search functionality
5. Implement the React frontend
6. Set up the build pipeline

Remember: This is a fun project focused on learning and experimentation. Keep it simple, follow the patterns in the RFC, and don't over-engineer!