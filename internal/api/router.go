package api

import (
	"io/fs"
	"net/http"

	"github.com/dduzgun-security/codecensus/internal/api/handlers"
	"github.com/dduzgun-security/codecensus/internal/api/middleware"
	"github.com/dduzgun-security/codecensus/internal/services"
)

type Services struct {
	User  *services.UserService
	Team  *services.TeamService
	Asset *services.AssetService
	Auth  *services.AuthService
}

func NewRouter(svc Services, uiFS fs.FS) http.Handler {
	mux := http.NewServeMux()

	authHandler := handlers.NewAuthHandler(svc.Auth, svc.User)
	userHandler := handlers.NewUserHandler(svc.User)
	teamHandler := handlers.NewTeamHandler(svc.Team)
	assetHandler := handlers.NewAssetHandler(svc.Asset)

	authMiddleware := middleware.NewAuthMiddleware(svc.Auth, svc.User)

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	mux.HandleFunc("POST /api/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/auth/login", authHandler.Login)
	mux.HandleFunc("POST /api/auth/logout", authHandler.Logout)
	mux.HandleFunc("GET /api/auth/me", authMiddleware.RequireAuth(authHandler.Me))

	mux.HandleFunc("GET /api/users", authMiddleware.RequireAuth(userHandler.ListUsers))
	mux.HandleFunc("GET /api/users/{id}", authMiddleware.RequireAuth(userHandler.GetUser))
	mux.HandleFunc("POST /api/users", authMiddleware.RequireAdmin(userHandler.CreateUser))
	mux.HandleFunc("PUT /api/users/{id}", authMiddleware.RequireAuth(userHandler.UpdateUser))
	mux.HandleFunc("DELETE /api/users/{id}", authMiddleware.RequireAdmin(userHandler.DeleteUser))

	mux.HandleFunc("GET /api/teams", authMiddleware.RequireAuth(teamHandler.ListTeams))
	mux.HandleFunc("GET /api/teams/{id}", authMiddleware.RequireAuth(teamHandler.GetTeam))
	mux.HandleFunc("POST /api/teams", authMiddleware.RequireAuth(teamHandler.CreateTeam))
	mux.HandleFunc("PUT /api/teams/{id}", authMiddleware.RequireAuth(teamHandler.UpdateTeam))
	mux.HandleFunc("DELETE /api/teams/{id}", authMiddleware.RequireAuth(teamHandler.DeleteTeam))

	mux.HandleFunc("GET /api/assets", authMiddleware.RequireAuth(assetHandler.ListAssets))
	mux.HandleFunc("GET /api/assets/{id}", authMiddleware.RequireAuth(assetHandler.GetAsset))
	mux.HandleFunc("GET /api/assets/search", authMiddleware.RequireAuth(assetHandler.SearchAssets))
	mux.HandleFunc("POST /api/assets", authMiddleware.RequireAuth(assetHandler.CreateAsset))
	mux.HandleFunc("PUT /api/assets/{id}", authMiddleware.RequireAuth(assetHandler.UpdateAsset))
	mux.HandleFunc("DELETE /api/assets/{id}", authMiddleware.RequireAuth(assetHandler.DeleteAsset))

	mux.Handle("/", http.FileServer(http.FS(uiFS)))

	corsHandler := middleware.NewCORSMiddleware()
	return corsHandler.Handler(mux)
}