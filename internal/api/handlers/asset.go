package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/dduzgun-security/codecensus/internal/services"
	pb "github.com/dduzgun-security/codecensus/internal/models/gen/codecensus/v1"
	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type AssetHandler struct {
	assetService *services.AssetService
}

func NewAssetHandler(assetService *services.AssetService) *AssetHandler {
	return &AssetHandler{assetService: assetService}
}

func (h *AssetHandler) CreateAsset(w http.ResponseWriter, r *http.Request) {
	var asset pb.Asset
	if err := json.NewDecoder(r.Body).Decode(&asset); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	asset.Id = uuid.New().String()
	asset.CreatedAt = timestamppb.Now()
	asset.UpdatedAt = timestamppb.Now()

	if err := h.assetService.CreateAsset(&asset); err != nil {
		http.Error(w, "Failed to create asset", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(&asset)
}

func (h *AssetHandler) GetAsset(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Asset ID is required", http.StatusBadRequest)
		return
	}

	asset, err := h.assetService.GetAssetByID(id)
	if err != nil {
		http.Error(w, "Asset not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(asset)
}

func (h *AssetHandler) ListAssets(w http.ResponseWriter, r *http.Request) {
	assets, err := h.assetService.ListAssets()
	if err != nil {
		http.Error(w, "Failed to list assets", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(assets)
}

func (h *AssetHandler) SearchAssets(w http.ResponseWriter, r *http.Request) {
	req := &pb.SearchAssetRequest{
		Query: r.URL.Query().Get("q"),
	}

	if typeStr := r.URL.Query().Get("type"); typeStr != "" {
		if typeVal, exists := pb.AssetType_value[typeStr]; exists {
			req.Type = pb.AssetType(typeVal)
		}
	}

	if criticalityStr := r.URL.Query().Get("business_criticality"); criticalityStr != "" {
		if criticalityVal, exists := pb.BusinessCriticality_value[criticalityStr]; exists {
			req.BusinessCriticality = pb.BusinessCriticality(criticalityVal)
		}
	}

	req.OwnerId = r.URL.Query().Get("owner_id")
	req.TeamId = r.URL.Query().Get("team_id")

	if tags := r.URL.Query()["tags"]; len(tags) > 0 {
		req.Tags = tags
	}

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			req.Limit = int32(limit)
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil {
			req.Offset = int32(offset)
		}
	}

	response, err := h.assetService.SearchAssets(req)
	if err != nil {
		http.Error(w, "Failed to search assets", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *AssetHandler) UpdateAsset(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Asset ID is required", http.StatusBadRequest)
		return
	}

	var asset pb.Asset
	if err := json.NewDecoder(r.Body).Decode(&asset); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	asset.Id = id
	if err := h.assetService.UpdateAsset(&asset); err != nil {
		http.Error(w, "Failed to update asset", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(&asset)
}

func (h *AssetHandler) DeleteAsset(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Asset ID is required", http.StatusBadRequest)
		return
	}

	if err := h.assetService.DeleteAsset(id); err != nil {
		http.Error(w, "Failed to delete asset", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}