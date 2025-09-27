package services

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/dduzgun-security/codecensus/internal/db"
	pb "github.com/dduzgun-security/codecensus/internal/models/gen/codecensus/v1"
	"github.com/lib/pq"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type AssetService struct {
	queries *db.Queries
}

func NewAssetService(queries *db.Queries) *AssetService {
	return &AssetService{queries: queries}
}

func (s *AssetService) CreateAsset(asset *pb.Asset) error {
	query := `
		INSERT INTO assets (id, name, description, type, tags, business_criticality, repository_url, primary_owner_id, team_id, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	_, err := s.queries.ExecContext(query,
		asset.Id, asset.Name, asset.Description, asset.Type.String(),
		pq.Array(asset.Tags), asset.BusinessCriticality.String(),
		asset.RepositoryUrl, asset.PrimaryOwnerId, asset.TeamId, asset.Status.String())
	if err != nil {
		return fmt.Errorf("failed to create asset: %w", err)
	}

	return nil
}

func (s *AssetService) GetAssetByID(id string) (*pb.Asset, error) {
	query := `
		SELECT id, name, description, type, tags, business_criticality, repository_url, primary_owner_id, team_id, status, created_at, updated_at
		FROM assets WHERE id = $1`

	var asset pb.Asset
	var typeStr, criticalityStr, statusStr string
	var tags pq.StringArray
	err := s.queries.QueryRowContext(query, id).Scan(
		&asset.Id, &asset.Name, &asset.Description, &typeStr, &tags,
		&criticalityStr, &asset.RepositoryUrl, &asset.PrimaryOwnerId,
		&asset.TeamId, &statusStr, &asset.CreatedAt, &asset.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("asset not found")
		}
		return nil, fmt.Errorf("failed to get asset: %w", err)
	}

	asset.Type = pb.AssetType(pb.AssetType_value[typeStr])
	asset.BusinessCriticality = pb.BusinessCriticality(pb.BusinessCriticality_value[criticalityStr])
	asset.Status = pb.AssetStatus(pb.AssetStatus_value[statusStr])
	asset.Tags = []string(tags)

	return &asset, nil
}

func (s *AssetService) ListAssets() ([]*pb.Asset, error) {
	query := `
		SELECT id, name, description, type, tags, business_criticality, repository_url, primary_owner_id, team_id, status, created_at, updated_at
		FROM assets ORDER BY name`

	rows, err := s.queries.QueryContext(query)
	if err != nil {
		return nil, fmt.Errorf("failed to list assets: %w", err)
	}
	defer rows.Close()

	var assets []*pb.Asset
	for rows.Next() {
		var asset pb.Asset
		var typeStr, criticalityStr, statusStr string
		var tags pq.StringArray
		err := rows.Scan(
			&asset.Id, &asset.Name, &asset.Description, &typeStr, &tags,
			&criticalityStr, &asset.RepositoryUrl, &asset.PrimaryOwnerId,
			&asset.TeamId, &statusStr, &asset.CreatedAt, &asset.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan asset: %w", err)
		}

		asset.Type = pb.AssetType(pb.AssetType_value[typeStr])
		asset.BusinessCriticality = pb.BusinessCriticality(pb.BusinessCriticality_value[criticalityStr])
		asset.Status = pb.AssetStatus(pb.AssetStatus_value[statusStr])
		asset.Tags = []string(tags)

		assets = append(assets, &asset)
	}

	return assets, nil
}

func (s *AssetService) SearchAssets(req *pb.SearchAssetRequest) (*pb.SearchAssetResponse, error) {
	var conditions []string
	var args []interface{}
	argIndex := 1

	baseQuery := `
		SELECT id, name, description, type, tags, business_criticality, repository_url, primary_owner_id, team_id, status, created_at, updated_at
		FROM assets`

	if req.Query != "" {
		conditions = append(conditions, fmt.Sprintf(`
			(to_tsvector('english', name || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', $%d)
			 OR $%d = ANY(tags))`, argIndex, argIndex))
		args = append(args, req.Query)
		argIndex++
	}

	if req.Type != pb.AssetType_ASSET_TYPE_UNSPECIFIED {
		conditions = append(conditions, fmt.Sprintf("type = $%d", argIndex))
		args = append(args, req.Type.String())
		argIndex++
	}

	if req.BusinessCriticality != pb.BusinessCriticality_BUSINESS_CRITICALITY_UNSPECIFIED {
		conditions = append(conditions, fmt.Sprintf("business_criticality = $%d", argIndex))
		args = append(args, req.BusinessCriticality.String())
		argIndex++
	}

	if req.OwnerId != "" {
		conditions = append(conditions, fmt.Sprintf("primary_owner_id = $%d", argIndex))
		args = append(args, req.OwnerId)
		argIndex++
	}

	if req.TeamId != "" {
		conditions = append(conditions, fmt.Sprintf("team_id = $%d", argIndex))
		args = append(args, req.TeamId)
		argIndex++
	}

	if len(req.Tags) > 0 {
		conditions = append(conditions, fmt.Sprintf("tags && $%d", argIndex))
		args = append(args, pq.Array(req.Tags))
		argIndex++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

	orderClause := " ORDER BY name"
	if req.Query != "" {
		orderClause = fmt.Sprintf(" ORDER BY ts_rank(to_tsvector('english', name || ' ' || COALESCE(description, '')), plainto_tsquery('english', $1)) DESC, name")
	}

	finalQuery := baseQuery + whereClause + orderClause

	if req.Limit > 0 {
		finalQuery += fmt.Sprintf(" LIMIT $%d", argIndex)
		args = append(args, req.Limit)
		argIndex++
	}

	if req.Offset > 0 {
		finalQuery += fmt.Sprintf(" OFFSET $%d", argIndex)
		args = append(args, req.Offset)
		argIndex++
	}

	rows, err := s.queries.QueryContext(finalQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to search assets: %w", err)
	}
	defer rows.Close()

	var assets []*pb.Asset
	for rows.Next() {
		var asset pb.Asset
		var typeStr, criticalityStr, statusStr string
		var tags pq.StringArray
		err := rows.Scan(
			&asset.Id, &asset.Name, &asset.Description, &typeStr, &tags,
			&criticalityStr, &asset.RepositoryUrl, &asset.PrimaryOwnerId,
			&asset.TeamId, &statusStr, &asset.CreatedAt, &asset.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan asset: %w", err)
		}

		asset.Type = pb.AssetType(pb.AssetType_value[typeStr])
		asset.BusinessCriticality = pb.BusinessCriticality(pb.BusinessCriticality_value[criticalityStr])
		asset.Status = pb.AssetStatus(pb.AssetStatus_value[statusStr])
		asset.Tags = []string(tags)

		assets = append(assets, &asset)
	}

	countQuery := "SELECT COUNT(*) FROM assets" + whereClause
	countArgs := args
	if req.Limit > 0 || req.Offset > 0 {
		countArgs = args[:len(args)-1]
		if req.Offset > 0 {
			countArgs = args[:len(args)-2]
		}
	}

	var totalCount int32
	err = s.queries.QueryRowContext(countQuery, countArgs...).Scan(&totalCount)
	if err != nil {
		return nil, fmt.Errorf("failed to count assets: %w", err)
	}

	return &pb.SearchAssetResponse{
		Assets:     assets,
		TotalCount: totalCount,
		Offset:     req.Offset,
		Limit:      req.Limit,
	}, nil
}

func (s *AssetService) UpdateAsset(asset *pb.Asset) error {
	asset.UpdatedAt = timestamppb.Now()

	query := `
		UPDATE assets
		SET name = $2, description = $3, type = $4, tags = $5, business_criticality = $6, repository_url = $7, primary_owner_id = $8, team_id = $9, status = $10, updated_at = $11
		WHERE id = $1`

	_, err := s.queries.ExecContext(query,
		asset.Id, asset.Name, asset.Description, asset.Type.String(),
		pq.Array(asset.Tags), asset.BusinessCriticality.String(),
		asset.RepositoryUrl, asset.PrimaryOwnerId, asset.TeamId,
		asset.Status.String(), asset.UpdatedAt.AsTime())
	if err != nil {
		return fmt.Errorf("failed to update asset: %w", err)
	}

	return nil
}

func (s *AssetService) DeleteAsset(id string) error {
	query := `DELETE FROM assets WHERE id = $1`
	_, err := s.queries.ExecContext(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete asset: %w", err)
	}
	return nil
}