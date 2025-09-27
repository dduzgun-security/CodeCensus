package services

import (
	"database/sql"
	"fmt"

	"github.com/dduzgun-security/codecensus/internal/db"
	pb "github.com/dduzgun-security/codecensus/internal/models/gen/codecensus/v1"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type TeamService struct {
	queries *db.Queries
}

func NewTeamService(queries *db.Queries) *TeamService {
	return &TeamService{queries: queries}
}

func (s *TeamService) CreateTeam(team *pb.Team) error {
	query := `
		INSERT INTO teams (id, name, description, leader_id)
		VALUES ($1, $2, $3, $4)`

	_, err := s.queries.ExecContext(query, team.Id, team.Name, team.Description, team.LeaderId)
	if err != nil {
		return fmt.Errorf("failed to create team: %w", err)
	}

	return nil
}

func (s *TeamService) GetTeamByID(id string) (*pb.Team, error) {
	query := `
		SELECT id, name, description, leader_id, created_at, updated_at
		FROM teams WHERE id = $1`

	var team pb.Team
	err := s.queries.QueryRowContext(query, id).Scan(
		&team.Id, &team.Name, &team.Description, &team.LeaderId,
		&team.CreatedAt, &team.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("team not found")
		}
		return nil, fmt.Errorf("failed to get team: %w", err)
	}

	return &team, nil
}

func (s *TeamService) ListTeams() ([]*pb.Team, error) {
	query := `
		SELECT id, name, description, leader_id, created_at, updated_at
		FROM teams ORDER BY name`

	rows, err := s.queries.QueryContext(query)
	if err != nil {
		return nil, fmt.Errorf("failed to list teams: %w", err)
	}
	defer rows.Close()

	var teams []*pb.Team
	for rows.Next() {
		var team pb.Team
		err := rows.Scan(
			&team.Id, &team.Name, &team.Description, &team.LeaderId,
			&team.CreatedAt, &team.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan team: %w", err)
		}

		teams = append(teams, &team)
	}

	return teams, nil
}

func (s *TeamService) UpdateTeam(team *pb.Team) error {
	team.UpdatedAt = timestamppb.Now()

	query := `
		UPDATE teams
		SET name = $2, description = $3, leader_id = $4, updated_at = $5
		WHERE id = $1`

	_, err := s.queries.ExecContext(query, team.Id, team.Name, team.Description, team.LeaderId, team.UpdatedAt.AsTime())
	if err != nil {
		return fmt.Errorf("failed to update team: %w", err)
	}

	return nil
}

func (s *TeamService) DeleteTeam(id string) error {
	query := `DELETE FROM teams WHERE id = $1`
	_, err := s.queries.ExecContext(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete team: %w", err)
	}
	return nil
}