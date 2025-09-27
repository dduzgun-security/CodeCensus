# Request for Comments (RFC): CodeCensus Implementation

## Overview

This RFC outlines the technical implementation approach for CodeCensus, an enterprise asset ownership platform. The system will be built as a simple monolith with a Go backend serving a React frontend, using PostgreSQL for data persistence.

## Goals

1. Implement a centralized asset catalog with ownership tracking
2. Provide fast search and discovery capabilities
3. Support user management with role-based access control
4. Enable notifications for ownership changes
5. Maintain simplicity while ensuring scalability for future growth
6. Make it secure and reduce using archived or unofficial libraries, prioritize standard libraries.

## Non-Goals

- Complex microservices architecture
- Advanced analytics and predictive insights (future enhancement)
- Real-time collaboration features
- Complex workflow engines

## Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    HTTP/JSON    ┌──────────────────┐    SQL    ┌─────────────┐
│   React SPA     │ ◄──────────────► │   Go Backend     │ ◄────────► │ PostgreSQL  │
│   (Frontend)    │                  │   (API Server)   │             │ Database    │
└─────────────────┘                  └──────────────────┘             └─────────────┘
```

### Technology Stack

**Frontend:**
- React 19+ with functional components and hooks
- Standard fetch API for HTTP requests
- TailwindCSS for styling
- React Router for client-side routing

**Backend:**
- Go 1.25+ using standard library
- `net/http` for HTTP server
- `database/sql` with `pq` driver for PostgreSQL
- `encoding/json` for JSON handling
- `crypto/bcrypt` for password hashing

**Models:**
- Use buf.io to create the models for everything
- Use https://github.com/bufbuild/protovalidate-go for validation the types for the models in the backend
- Use https://github.com/bufbuild/protovalidate-es for validation the types for the models in the backend
- Share the models so there is no difference between the frontend and backend

**Database:**
- PostgreSQL 18+ for primary data storage
- Built-in full-text search capabilities (similar to Elasticsearch-based search with advanced filtering, faceted search, and real-time indexing)

**Deployment:**
- Single binary deployment (Go backend with embedded React build)
- Docker container for easy deployment
- Docker compose file

## Data Models

### Protobuf Schema Definition

All data models are defined using Protocol Buffers with buf.io for code generation and protovalidate for validation.

#### Core Messages

```protobuf
syntax = "proto3";

package codecensus.v1;

import "buf/validate/validate.proto";
import "google/protobuf/timestamp.proto";

// Asset represents a digital asset in the system
message Asset {
  string id = 1 [(buf.validate.field).string.uuid = true];
  string name = 2 [(buf.validate.field).string.min_len = 1, (buf.validate.field).string.max_len = 255];
  string description = 3 [(buf.validate.field).string.max_len = 2000];
  AssetType type = 4 [(buf.validate.field).enum.defined_only = true];
  repeated string tags = 5 [(buf.validate.field).repeated.max_items = 20];
  BusinessCriticality business_criticality = 6 [(buf.validate.field).enum.defined_only = true];
  string repository_url = 7 [(buf.validate.field).string.uri = true];
  string primary_owner_id = 8 [(buf.validate.field).string.uuid = true];
  string team_id = 9 [(buf.validate.field).string.uuid = true];
  google.protobuf.Timestamp created_at = 10;
  google.protobuf.Timestamp updated_at = 11;
  AssetStatus status = 12 [(buf.validate.field).enum.defined_only = true];
}

// User represents a system user
message User {
  string id = 1 [(buf.validate.field).string.uuid = true];
  string username = 2 [(buf.validate.field).string.min_len = 3, (buf.validate.field).string.max_len = 50];
  string email = 3 [(buf.validate.field).string.email = true];
  string name = 4 [(buf.validate.field).string.min_len = 1, (buf.validate.field).string.max_len = 255];
  UserRole role = 5 [(buf.validate.field).enum.defined_only = true];
  google.protobuf.Timestamp created_at = 6;
  google.protobuf.Timestamp updated_at = 7;
}

// Team represents a group of users
message Team {
  string id = 1 [(buf.validate.field).string.uuid = true];
  string name = 2 [(buf.validate.field).string.min_len = 1, (buf.validate.field).string.max_len = 255];
  string description = 3 [(buf.validate.field).string.max_len = 2000];
  string leader_id = 4 [(buf.validate.field).string.uuid = true];
  google.protobuf.Timestamp created_at = 5;
  google.protobuf.Timestamp updated_at = 6;
}

// TeamMember represents the relationship between a user and team
message TeamMember {
  string team_id = 1 [(buf.validate.field).string.uuid = true];
  string user_id = 2 [(buf.validate.field).string.uuid = true];
  TeamMemberRole role = 3 [(buf.validate.field).enum.defined_only = true];
}

// Enums
enum AssetType {
  ASSET_TYPE_UNSPECIFIED = 0;
  ASSET_TYPE_CODE = 1;
  ASSET_TYPE_INFRASTRUCTURE = 2;
  ASSET_TYPE_APPLICATION = 3;
  ASSET_TYPE_SYSTEM = 4;
}

enum BusinessCriticality {
  BUSINESS_CRITICALITY_UNSPECIFIED = 0;
  BUSINESS_CRITICALITY_LOW = 1;
  BUSINESS_CRITICALITY_MEDIUM = 2;
  BUSINESS_CRITICALITY_HIGH = 3;
  BUSINESS_CRITICALITY_CRITICAL = 4;
}

enum AssetStatus {
  ASSET_STATUS_UNSPECIFIED = 0;
  ASSET_STATUS_ACTIVE = 1;
  ASSET_STATUS_DEPRECATED = 2;
  ASSET_STATUS_ARCHIVED = 3;
}

enum UserRole {
  USER_ROLE_UNSPECIFIED = 0;
  USER_ROLE_VIEWER = 1;
  USER_ROLE_USER = 2;
  USER_ROLE_ADMIN = 3;
}

enum TeamMemberRole {
  TEAM_MEMBER_ROLE_UNSPECIFIED = 0;
  TEAM_MEMBER_ROLE_MEMBER = 1;
  TEAM_MEMBER_ROLE_LEAD = 2;
}
```

## API Design

### RESTful Endpoints

#### Assets
- `GET /api/assets` - List assets with filtering and pagination
- `GET /api/assets/{id}` - Get specific asset
- `POST /api/assets` - Create new asset
- `PUT /api/assets/{id}` - Update asset
- `DELETE /api/assets/{id}` - Delete asset
- `GET /api/assets/search?q={query}` - Search assets

#### Users
- `GET /api/users` - List users (admin only)
- `GET /api/users/{id}` - Get user profile
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user (admin only)

#### Teams
- `GET /api/teams` - List teams
- `GET /api/teams/{id}` - Get team details
- `POST /api/teams` - Create team
- `PUT /api/teams/{id}` - Update team
- `DELETE /api/teams/{id}` - Delete team

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

## Database Schema

### Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Assets table
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    tags TEXT[], -- PostgreSQL array
    business_criticality VARCHAR(20),
    repository_url VARCHAR(500),
    primary_owner_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Team memberships
CREATE TABLE team_members (
    team_id UUID REFERENCES teams(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(50) DEFAULT 'member',
    PRIMARY KEY (team_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_assets_name ON assets USING gin(to_tsvector('english', name));
CREATE INDEX idx_assets_description ON assets USING gin(to_tsvector('english', description));
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_owner ON assets(primary_owner_id);
CREATE INDEX idx_assets_team ON assets(team_id);
CREATE INDEX idx_assets_tags ON assets USING gin(tags);
```

## Implementation Details

### Backend Structure

```
cmd/
  server/
    main.go              # Application entry point
proto/
  codecensus/
    v1/
      models.proto       # Protobuf schema definitions
buf.gen.yaml             # Buf configuration for code generation
buf.work.yaml            # Buf workspace configuration
internal/
  api/
    handlers/
      assets.go          # Asset HTTP handlers
      auth.go            # Authentication handlers
      users.go           # User HTTP handlers
      teams.go           # Team HTTP handlers
    middleware/
      auth.go            # Authentication middleware
      cors.go            # CORS middleware
    router.go            # HTTP router setup
  config/
    config.go            # Configuration management
  db/
    migrations/          # SQL migration files
    postgres.go          # Database connection and queries
  models/
    gen/                 # Generated protobuf code (Go)
      codecensus/
        v1/
          models.pb.go   # Generated protobuf messages
          models_protovalidate.pb.go # Generated validation code
  services/
    asset.go             # Asset business logic
    auth.go              # Authentication logic
    user.go              # User business logic
    team.go              # Team business logic
ui/                      # React frontend build output
  src/
    gen/                 # Generated protobuf code (TypeScript)
      codecensus/
        v1/
          models_pb.ts   # Generated protobuf messages
          models_protovalidate.ts # Generated validation code
```

### Frontend Structure

```
src/
  components/
    common/              # Reusable components
    assets/              # Asset-related components
    users/               # User-related components
    teams/               # Team-related components
  pages/
    Dashboard.js         # Main dashboard
    Assets.js            # Asset management
    Users.js             # User management
    Teams.js             # Team management
  services/
    api.js               # API client
    auth.js              # Authentication service
  utils/
    constants.js         # Application constants
  App.js                 # Main application component
  index.js               # Application entry point
```

### Authentication & Security

1. **Session-based Authentication**: Use HTTP-only cookies for session management
2. **Password Security**: bcrypt hashing with appropriate cost factor
3. **RBAC**: Role-based access control with three roles (admin, user, viewer)
4. **Input Validation**: Server-side validation for all inputs
5. **SQL Injection Prevention**: Use parameterized queries exclusively

### Search Implementation

Use PostgreSQL's built-in full-text search capabilities:

```sql
-- Search query example
SELECT * FROM assets
WHERE to_tsvector('english', name || ' ' || description) @@ plainto_tsquery('english', $1)
OR $1 = ANY(tags)
ORDER BY ts_rank(to_tsvector('english', name || ' ' || description), plainto_tsquery('english', $1)) DESC;
```

### Notification System

Simple in-memory notification queue for MVP:

```go
type NotificationService struct {
    subscribers map[string]chan Notification
    mu          sync.RWMutex
}

type Notification struct {
    Type    string `json:"type"`
    Message string `json:"message"`
    UserID  string `json:"user_id"`
}
```

## Performance Considerations

1. **Database Indexing**: Comprehensive indexes on searchable fields
2. **Connection Pooling**: Configure appropriate database connection limits
3. **Pagination**: Implement cursor-based pagination for large datasets
4. **Caching**: Simple in-memory caching for frequently accessed data
5. **Static Assets**: Serve React build files with appropriate cache headers

## Security Considerations

1. **Input Sanitization**: Validate and sanitize all user inputs
2. **Authentication**: Secure session management with proper timeout
3. **Authorization**: Enforce RBAC at API layer
4. **HTTPS**: Require TLS in production environments
5. **Database Security**: Use least-privilege database user
6. **Secrets Management**: Use environment variables for sensitive configuration

## Deployment Strategy

1. **Single Binary**: Embed React build into Go binary using `embed` package
2. **Environment Configuration**: Use environment variables for configuration
3. **Database Migrations**: Run migrations on startup
4. **Health Checks**: Implement `/health` endpoint for monitoring
5. **Logging**: Structured logging with appropriate log levels

## Testing Strategy

1. **Unit Tests**: Test business logic and utilities
2. **Integration Tests**: Test API endpoints with test database
3. **Frontend Tests**: Component testing with React Testing Library
4. **E2E Tests**: Basic user journey tests

## Monitoring & Observability

1. **Metrics**: Basic HTTP metrics (response time, status codes)
2. **Logging**: Structured JSON logging with request IDs
3. **Health Checks**: Database connectivity and basic functionality
4. **Error Tracking**: Log errors with context for debugging

## Future Enhancements

1. **Advanced Analytics**: Usage patterns and ownership trends
2. **Bulk Operations**: Import/export functionality
3. **Audit Trail**: Detailed change tracking
4. **Advanced Search**: Filters, faceted search, saved searches
5. **Integrations**: Git provider APIs for automatic asset discovery

## Risks & Mitigations

1. **Data Consistency**: Use database transactions for multi-table operations
2. **Performance**: Monitor query performance and optimize indexes as needed
3. **Security**: Regular dependency updates and security reviews
4. **Scalability**: Design allows for future horizontal scaling if needed

## Success Criteria

1. **Functionality**: All MVP features implemented and tested
2. **Performance**: Search responses under 200ms for 95% of queries
3. **Security**: No critical security vulnerabilities
4. **Usability**: Intuitive interface for common workflows
5. **Maintainability**: Clean, well-documented codebase

## Timeline

**Phase 1 (Weeks 1-4): Core Infrastructure**
- Database schema and migrations
- Authentication system
- Basic API structure
- React application setup

**Phase 2 (Weeks 5-8): Asset Management**
- Asset CRUD operations
- Search functionality
- User management
- Basic frontend components

**Phase 3 (Weeks 9-12): Polish & Testing**
- Team management
- Notification system
- Testing and bug fixes
- Documentation and deployment

## Conclusion

This RFC provides a comprehensive technical approach for implementing CodeCensus as a simple, maintainable monolith. The architecture prioritizes simplicity and standard libraries while ensuring the system can meet the performance and security requirements outlined in the PRD.