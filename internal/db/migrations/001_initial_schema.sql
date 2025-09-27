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

-- Create default admin user (password: admin123)
INSERT INTO users (username, email, name, password_hash, role) VALUES
('admin', 'admin@codecensus.local', 'Administrator', '$2a$10$K3xp4xJ8yV9M8L7qR5N6VeBtK2dU1cF8wA3lM9sP7nE4vB6dX8yHm', 'admin');