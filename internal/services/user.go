package services

import (
	"database/sql"
	"fmt"

	"github.com/dduzgun-security/codecensus/internal/db"
	pb "github.com/dduzgun-security/codecensus/internal/models/gen/codecensus/v1"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type UserService struct {
	queries *db.Queries
}

func NewUserService(queries *db.Queries) *UserService {
	return &UserService{queries: queries}
}

func (s *UserService) CreateUser(user *pb.User, password string) error {
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	query := `
		INSERT INTO users (id, username, email, name, password_hash, role)
		VALUES ($1, $2, $3, $4, $5, $6)`

	_, err = s.queries.ExecContext(query, user.Id, user.Username, user.Email, user.Name, string(passwordHash), user.Role.String())
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

func (s *UserService) GetUserByID(id string) (*pb.User, error) {
	query := `
		SELECT id, username, email, name, role, created_at, updated_at
		FROM users WHERE id = $1`

	var user pb.User
	var roleStr string
	err := s.queries.QueryRowContext(query, id).Scan(
		&user.Id, &user.Username, &user.Email, &user.Name,
		&roleStr, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	user.Role = pb.UserRole(pb.UserRole_value[roleStr])
	return &user, nil
}

func (s *UserService) GetUserByUsername(username string) (*pb.User, error) {
	query := `
		SELECT id, username, email, name, role, created_at, updated_at
		FROM users WHERE username = $1`

	var user pb.User
	var roleStr string
	err := s.queries.QueryRowContext(query, username).Scan(
		&user.Id, &user.Username, &user.Email, &user.Name,
		&roleStr, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	user.Role = pb.UserRole(pb.UserRole_value[roleStr])
	return &user, nil
}

func (s *UserService) ListUsers() ([]*pb.User, error) {
	query := `
		SELECT id, username, email, name, role, created_at, updated_at
		FROM users ORDER BY name`

	rows, err := s.queries.QueryContext(query)
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}
	defer rows.Close()

	var users []*pb.User
	for rows.Next() {
		var user pb.User
		var roleStr string
		err := rows.Scan(
			&user.Id, &user.Username, &user.Email, &user.Name,
			&roleStr, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}

		user.Role = pb.UserRole(pb.UserRole_value[roleStr])
		users = append(users, &user)
	}

	return users, nil
}

func (s *UserService) UpdateUser(user *pb.User) error {
	user.UpdatedAt = timestamppb.Now()

	query := `
		UPDATE users
		SET email = $2, name = $3, role = $4, updated_at = $5
		WHERE id = $1`

	_, err := s.queries.ExecContext(query, user.Id, user.Email, user.Name, user.Role.String(), user.UpdatedAt.AsTime())
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}

func (s *UserService) DeleteUser(id string) error {
	query := `DELETE FROM users WHERE id = $1`
	_, err := s.queries.ExecContext(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	return nil
}