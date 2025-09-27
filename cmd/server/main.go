package main

import (
	"context"
	"database/sql"
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/dduzgun-security/codecensus/internal/api"
	"github.com/dduzgun-security/codecensus/internal/config"
	"github.com/dduzgun-security/codecensus/internal/db"
	"github.com/dduzgun-security/codecensus/internal/services"

	_ "github.com/lib/pq"
)

var uiFiles embed.FS

func main() {
	cfg := config.Load()

	database, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	if err := database.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	dbQueries := db.New(database)

	if err := db.RunMigrations(database); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	userService := services.NewUserService(dbQueries)
	teamService := services.NewTeamService(dbQueries)
	assetService := services.NewAssetService(dbQueries)
	authService := services.NewAuthService(dbQueries)

	uiFS, err := fs.Sub(uiFiles, "ui/build")
	if err != nil {
		log.Fatalf("Failed to create UI filesystem: %v", err)
	}

	router := api.NewRouter(api.Services{
		User:  userService,
		Team:  teamService,
		Asset: assetService,
		Auth:  authService,
	}, uiFS)

	server := &http.Server{
		Addr:         cfg.ServerAddr,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("Starting server on %s", cfg.ServerAddr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}
