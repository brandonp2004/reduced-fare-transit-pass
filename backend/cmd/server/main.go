package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"reduced-fare-transit-pass/backend/internal/applications"
	"reduced-fare-transit-pass/backend/internal/auth"
	"reduced-fare-transit-pass/backend/internal/db"
	"reduced-fare-transit-pass/backend/internal/middleware"
	"reduced-fare-transit-pass/backend/internal/passes"
	"reduced-fare-transit-pass/backend/internal/sessions"
	"reduced-fare-transit-pass/backend/internal/users"
)

const sessionDuration = 7 * 24 * time.Hour

type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
}

type DBHealthResponse struct {
	Status   string `json:"status"`
	Service  string `json:"service"`
	Database string `json:"database"`
}

type UserResponse struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type MessageResponse struct {
	Message string `json:"message"`
}

type VerifyPassResponse struct {
	PassNumber string    `json:"pass_number"`
	Status     string    `json:"status"`
	IssuedAt   time.Time `json:"issued_at"`
	ExpiresAt  time.Time `json:"expires_at"`
	Valid      bool      `json:"valid"`
	Message    string    `json:"message"`
}

func safeUserResponse(user *users.User) UserResponse {
	return UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	response := HealthResponse{
		Status:  "ok",
		Service: "reduced-fare-transit-pass-backend",
	}

	w.Header().Set("Content-Type", "application/json")
	err := json.NewEncoder(w).Encode(response)
	if err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}

func dbHealthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	conn, err := db.Open()
	if err != nil {
		http.Error(w, "database connection failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer conn.Close(context.Background())

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err = conn.Ping(ctx)
	if err != nil {
		http.Error(w, "database ping failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := DBHealthResponse{
		Status:   "ok",
		Service:  "reduced-fare-transit-pass-backend",
		Database: "connected",
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input users.RegisterInput

	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "invalid JSON body", http.StatusBadRequest)
		return
	}

	err = users.ValidateRegisterInput(input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	conn, err := db.Open()
	if err != nil {
		http.Error(w, "database connection failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer conn.Close(context.Background())

	passwordHash, err := auth.HashPassword(input.Password)
	if err != nil {
		http.Error(w, "failed to hash password", http.StatusInternalServerError)
		return
	}

	user, err := users.CreateUser(conn, input.Email, passwordHash, input.Role)
	if err != nil {
		http.Error(w, "failed to create user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	err = json.NewEncoder(w).Encode(safeUserResponse(user))
	if err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input users.LoginInput

	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "invalid JSON body", http.StatusBadRequest)
		return
	}

	err = users.ValidateLoginInput(input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	conn, err := db.Open()
	if err != nil {
		http.Error(w, "database connection failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer conn.Close(context.Background())

	user, err := users.GetUserByEmail(conn, input.Email)
	if err != nil {
		http.Error(w, "invalid email or password", http.StatusUnauthorized)
		return
	}

	err = auth.CheckPassword(input.Password, user.PasswordHash)
	if err != nil {
		http.Error(w, "invalid email or password", http.StatusUnauthorized)
		return
	}

	rawToken, _, err := sessions.CreateSession(conn, user.ID, sessionDuration)
	if err != nil {
		http.Error(w, "failed to create session", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     middleware.SessionCookieName,
		Value:    rawToken,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
		Expires:  time.Now().Add(sessionDuration),
	})

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(safeUserResponse(user))
	if err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie(middleware.SessionCookieName)
	if err == nil && cookie.Value != "" {
		conn, dbErr := db.Open()
		if dbErr == nil {
			_ = sessions.DeleteSessionByToken(conn, cookie.Value)
			conn.Close(context.Background())
		}
	}

	http.SetCookie(w, &http.Cookie{
		Name:     middleware.SessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
	})

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(MessageResponse{Message: "logout successful"})
	if err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}

func meHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := middleware.CurrentUser(r)
	if !ok {
		http.Error(w, "authentication required", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err := json.NewEncoder(w).Encode(safeUserResponse(user))
	if err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}

func createApplicationHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := middleware.CurrentUser(r)
	if !ok {
		http.Error(w, "authentication required", http.StatusUnauthorized)
		return
	}

	if user.Role != "resident" {
		http.Error(w, "resident access required", http.StatusForbidden)
		return
	}

	var input applications.CreateApplicationInput

	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "invalid JSON body", http.StatusBadRequest)
		return
	}

	err = applications.ValidateCreateApplicationInput(input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	conn, err := db.Open()
	if err != nil {
		http.Error(w, "database connection failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer conn.Close(context.Background())

	app, err := applications.CreateApplication(
		conn,
		user.ID,
		input.FullName,
		input.DateOfBirth,
		input.TransitIDNumber,
		input.EligibilityReason,
	)
	if err != nil {
		http.Error(w, "failed to create application: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	err = json.NewEncoder(w).Encode(app)
	if err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}

func getMyApplicationsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := middleware.CurrentUser(r)
	if !ok {
		http.Error(w, "authentication required", http.StatusUnauthorized)
		return
	}

	conn, err := db.Open()
	if err != nil {
		http.Error(w, "database connection failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer conn.Close(context.Background())

	apps, err := applications.GetApplicationsByUserID(conn, user.ID)
	if err != nil {
		http.Error(w, "failed to load applications: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(apps)
	if err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}

func getAllApplicationsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	conn, err := db.Open()
	if err != nil {
		http.Error(w, "database connection failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer conn.Close(context.Background())

	apps, err := applications.GetAllApplications(conn)
	if err != nil {
		http.Error(w, "failed to load applications: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(apps)
	if err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}

func reviewApplicationHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input applications.ReviewApplicationInput

	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "invalid JSON body", http.StatusBadRequest)
		return
	}

	err = applications.ValidateReviewApplicationInput(input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	conn, err := db.Open()
	if err != nil {
		http.Error(w, "database connection failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer conn.Close(context.Background())

	app, err := applications.UpdateApplicationStatus(conn, input.ApplicationID, input.Status)
	if err != nil {
		http.Error(w, "failed to review application: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if input.Status == "approved" {
		_, err = passes.EnsureActivePassForApplication(conn, app.ID, app.UserID)
		if err != nil {
			http.Error(w, "failed to issue pass: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if input.Status == "rejected" {
		err = passes.SetPassStatusByApplicationIDIfExists(conn, app.ID, "revoked")
		if err != nil {
			http.Error(w, "failed to revoke pass: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(app)
	if err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}

func getMyPassesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := middleware.CurrentUser(r)
	if !ok {
		http.Error(w, "authentication required", http.StatusUnauthorized)
		return
	}

	conn, err := db.Open()
	if err != nil {
		http.Error(w, "database connection failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer conn.Close(context.Background())

	passList, err := passes.GetPassesByUserID(conn, user.ID)
	if err != nil {
		http.Error(w, "failed to load passes: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(passList)
	if err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}

func getAllPassesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	conn, err := db.Open()
	if err != nil {
		http.Error(w, "database connection failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer conn.Close(context.Background())

	passList, err := passes.GetAllPasses(conn)
	if err != nil {
		http.Error(w, "failed to load passes: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(passList)
	if err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}

func verifyPassHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	passNumber := r.URL.Query().Get("pass_number")
	if passNumber == "" {
		http.Error(w, "pass_number query parameter is required", http.StatusBadRequest)
		return
	}

	conn, err := db.Open()
	if err != nil {
		http.Error(w, "database connection failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer conn.Close(context.Background())

	pass, err := passes.GetPassByPassNumber(conn, passNumber)
	if err != nil {
		http.Error(w, "pass not found", http.StatusNotFound)
		return
	}

	now := time.Now()
	valid := pass.Status == "active" && pass.ExpiresAt.After(now)

	message := "pass is valid"
	if pass.Status != "active" {
		message = "pass is not active"
	} else if !pass.ExpiresAt.After(now) {
		message = "pass has expired"
	}

	response := VerifyPassResponse{
		PassNumber: pass.PassNumber,
		Status:     pass.Status,
		IssuedAt:   pass.IssuedAt,
		ExpiresAt:  pass.ExpiresAt,
		Valid:      valid,
		Message:    message,
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	w.WriteHeader(http.StatusOK)
	_, err := w.Write([]byte("Backend is running"))
	if err != nil {
		log.Println("failed to write response:", err)
	}
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/", rootHandler)
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/api/health", healthHandler)
	mux.HandleFunc("/api/db-health", dbHealthHandler)
	mux.HandleFunc("/api/register", registerHandler)
	mux.HandleFunc("/api/login", loginHandler)
	mux.HandleFunc("/api/logout", middleware.RequireAuth(logoutHandler))
	mux.HandleFunc("/api/me", middleware.RequireAuth(meHandler))
	mux.HandleFunc("/api/applications", middleware.RequireAuth(createApplicationHandler))
	mux.HandleFunc("/api/applications/me", middleware.RequireAuth(getMyApplicationsHandler))
	mux.HandleFunc("/api/admin/applications", middleware.RequireAdmin(getAllApplicationsHandler))
	mux.HandleFunc("/api/admin/applications/review", middleware.RequireAdmin(reviewApplicationHandler))
	mux.HandleFunc("/api/passes/me", middleware.RequireAuth(getMyPassesHandler))
	mux.HandleFunc("/api/admin/passes", middleware.RequireAdmin(getAllPassesHandler))
	mux.HandleFunc("/api/verify-pass", middleware.RequireRoles("verifier", "admin")(verifyPassHandler))

	server := &http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	log.Println("server starting on http://localhost:8080")
	err := server.ListenAndServe()
	if err != nil {
		log.Fatal(err)
	}
}
