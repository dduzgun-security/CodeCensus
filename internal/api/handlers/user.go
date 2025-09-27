package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/dduzgun-security/codecensus/internal/api/middleware"
	"github.com/dduzgun-security/codecensus/internal/services"
	pb "github.com/dduzgun-security/codecensus/internal/models/gen/codecensus/v1"
	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type UserHandler struct {
	userService *services.UserService
}

type CreateUserRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

func NewUserHandler(userService *services.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	role, exists := pb.UserRole_value[req.Role]
	if !exists {
		http.Error(w, "Invalid role", http.StatusBadRequest)
		return
	}

	user := &pb.User{
		Id:        uuid.New().String(),
		Username:  req.Username,
		Email:     req.Email,
		Name:      req.Name,
		Role:      pb.UserRole(role),
		CreatedAt: timestamppb.Now(),
		UpdatedAt: timestamppb.Now(),
	}

	if err := h.userService.CreateUser(user, req.Password); err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if user.Role != pb.UserRole_USER_ROLE_ADMIN && user.Id != id {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	targetUser, err := h.userService.GetUserByID(id)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(targetUser)
}

func (h *UserHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil || user.Role != pb.UserRole_USER_ROLE_ADMIN {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	users, err := h.userService.ListUsers()
	if err != nil {
		http.Error(w, "Failed to list users", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if user.Role != pb.UserRole_USER_ROLE_ADMIN && user.Id != id {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var updateUser pb.User
	if err := json.NewDecoder(r.Body).Decode(&updateUser); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updateUser.Id = id
	if err := h.userService.UpdateUser(&updateUser); err != nil {
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(&updateUser)
}

func (h *UserHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	if err := h.userService.DeleteUser(id); err != nil {
		http.Error(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}