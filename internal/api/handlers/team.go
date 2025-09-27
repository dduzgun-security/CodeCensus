package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/dduzgun-security/codecensus/internal/services"
	pb "github.com/dduzgun-security/codecensus/internal/models/gen/codecensus/v1"
	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type TeamHandler struct {
	teamService *services.TeamService
}

func NewTeamHandler(teamService *services.TeamService) *TeamHandler {
	return &TeamHandler{teamService: teamService}
}

func (h *TeamHandler) CreateTeam(w http.ResponseWriter, r *http.Request) {
	var team pb.Team
	if err := json.NewDecoder(r.Body).Decode(&team); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	team.Id = uuid.New().String()
	team.CreatedAt = timestamppb.Now()
	team.UpdatedAt = timestamppb.Now()

	if err := h.teamService.CreateTeam(&team); err != nil {
		http.Error(w, "Failed to create team", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(&team)
}

func (h *TeamHandler) GetTeam(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Team ID is required", http.StatusBadRequest)
		return
	}

	team, err := h.teamService.GetTeamByID(id)
	if err != nil {
		http.Error(w, "Team not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(team)
}

func (h *TeamHandler) ListTeams(w http.ResponseWriter, r *http.Request) {
	teams, err := h.teamService.ListTeams()
	if err != nil {
		http.Error(w, "Failed to list teams", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(teams)
}

func (h *TeamHandler) UpdateTeam(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Team ID is required", http.StatusBadRequest)
		return
	}

	var team pb.Team
	if err := json.NewDecoder(r.Body).Decode(&team); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	team.Id = id
	if err := h.teamService.UpdateTeam(&team); err != nil {
		http.Error(w, "Failed to update team", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(&team)
}

func (h *TeamHandler) DeleteTeam(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Team ID is required", http.StatusBadRequest)
		return
	}

	if err := h.teamService.DeleteTeam(id); err != nil {
		http.Error(w, "Failed to delete team", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}