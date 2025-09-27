package middleware

import (
	"context"
	"net/http"

	"github.com/dduzgun-security/codecensus/internal/services"
	pb "github.com/dduzgun-security/codecensus/internal/models/gen/codecensus/v1"
)

type contextKey string

const UserContextKey contextKey = "user"

type AuthMiddleware struct {
	authService *services.AuthService
	userService *services.UserService
}

func NewAuthMiddleware(authService *services.AuthService, userService *services.UserService) *AuthMiddleware {
	return &AuthMiddleware{
		authService: authService,
		userService: userService,
	}
}

func (m *AuthMiddleware) RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sessionToken := getSessionToken(r)
		if sessionToken == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		userID, err := m.authService.ValidateSession(sessionToken)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		user, err := m.userService.GetUserByID(userID)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, user)
		next(w, r.WithContext(ctx))
	}
}

func (m *AuthMiddleware) RequireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return m.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		user := GetUserFromContext(r.Context())
		if user == nil || user.Role != pb.UserRole_USER_ROLE_ADMIN {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		next(w, r)
	})
}

func getSessionToken(r *http.Request) string {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		return ""
	}
	return cookie.Value
}

func GetUserFromContext(ctx context.Context) *pb.User {
	user, ok := ctx.Value(UserContextKey).(*pb.User)
	if !ok {
		return nil
	}
	return user
}