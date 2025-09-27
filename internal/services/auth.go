package services

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/dduzgun-security/codecensus/internal/db"
	pb "github.com/dduzgun-security/codecensus/internal/models/gen/codecensus/v1"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type AuthService struct {
	queries  *db.Queries
	sessions map[string]*SessionData
}

type SessionData struct {
	UserID    string
	ExpiresAt time.Time
}

func NewAuthService(queries *db.Queries) *AuthService {
	return &AuthService{
		queries:  queries,
		sessions: make(map[string]*SessionData),
	}
}

func (s *AuthService) Login(username, password string) (string, *pb.User, error) {
	query := `
		SELECT id, username, email, name, password_hash, role, created_at, updated_at
		FROM users WHERE username = $1`

	var user pb.User
	var passwordHash, roleStr string
	err := s.queries.QueryRowContext(query, username).Scan(
		&user.Id, &user.Username, &user.Email, &user.Name, &passwordHash,
		&roleStr, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil, fmt.Errorf("invalid credentials")
		}
		return "", nil, fmt.Errorf("failed to authenticate: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
		return "", nil, fmt.Errorf("invalid credentials")
	}

	user.Role = pb.UserRole(pb.UserRole_value[roleStr])

	sessionToken, err := s.generateSessionToken()
	if err != nil {
		return "", nil, fmt.Errorf("failed to generate session token: %w", err)
	}

	s.sessions[sessionToken] = &SessionData{
		UserID:    user.Id,
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}

	return sessionToken, &user, nil
}

func (s *AuthService) Logout(sessionToken string) {
	delete(s.sessions, sessionToken)
}

func (s *AuthService) ValidateSession(sessionToken string) (string, error) {
	session, exists := s.sessions[sessionToken]
	if !exists {
		return "", fmt.Errorf("invalid session")
	}

	if time.Now().After(session.ExpiresAt) {
		delete(s.sessions, sessionToken)
		return "", fmt.Errorf("session expired")
	}

	return session.UserID, nil
}

func (s *AuthService) Register(reg *pb.UserRegistration) (*pb.User, error) {
	// Check if username already exists
	var existingID string
	checkQuery := `SELECT id FROM users WHERE username = $1 OR email = $2`
	err := s.queries.QueryRowContext(checkQuery, reg.Username, reg.Email).Scan(&existingID)
	if err != sql.ErrNoRows {
		if err == nil {
			return nil, fmt.Errorf("username or email already exists")
		}
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(reg.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Insert new user
	insertQuery := `
		INSERT INTO users (id, username, email, name, password_hash, role, created_at, updated_at)
		VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, created_at, updated_at`

	var user pb.User
	user.Username = reg.Username
	user.Email = reg.Email
	user.Name = reg.Name
	user.Role = reg.Role

	roleStr := pb.UserRole_name[int32(reg.Role)]

	var createdAt, updatedAt time.Time
	err = s.queries.QueryRowContext(insertQuery, reg.Username, reg.Email, reg.Name, string(hashedPassword), roleStr).Scan(
		&user.Id, &createdAt, &updatedAt,
	)
	if err == nil {
		user.CreatedAt = timestamppb.New(createdAt)
		user.UpdatedAt = timestamppb.New(updatedAt)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return &user, nil
}

func (s *AuthService) generateSessionToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}