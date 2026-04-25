package main

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"reduced-fare-transit-pass/backend/internal/db"
)

type applicationAPIResponse struct {
	ID                int        `json:"id"`
	UserID            int        `json:"user_id"`
	FullName          string     `json:"full_name"`
	DateOfBirth       string     `json:"date_of_birth"`
	TransitIDNumber   string     `json:"transit_id_number"`
	EligibilityReason string     `json:"eligibility_reason"`
	Status            string     `json:"status"`
	CreatedAt         time.Time  `json:"created_at"`
	ReviewedAt        *time.Time `json:"reviewed_at"`
}

type passAPIResponse struct {
	ID            int       `json:"id"`
	ApplicationID int       `json:"application_id"`
	UserID        int       `json:"user_id"`
	PassNumber    string    `json:"pass_number"`
	Status        string    `json:"status"`
	IssuedAt      time.Time `json:"issued_at"`
	ExpiresAt     time.Time `json:"expires_at"`
}

func requireIntegrationDB(t *testing.T) {
	t.Helper()

	conn, err := db.Open()
	if err != nil {
		t.Skipf("skipping integration test, database unavailable: %v", err)
		return
	}
	defer conn.Close(context.Background())

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := conn.Ping(ctx); err != nil {
		t.Skipf("skipping integration test, database ping failed: %v", err)
	}
}

func resetTestDatabase(t *testing.T) {
	t.Helper()

	conn, err := db.Open()
	if err != nil {
		t.Fatalf("failed to open database for reset: %v", err)
	}
	defer conn.Close(context.Background())

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = conn.Exec(ctx, `
		TRUNCATE TABLE sessions, passes, applications, users
		RESTART IDENTITY CASCADE
	`)
	if err != nil {
		t.Fatalf("failed to reset test database: %v", err)
	}
}

func newTestClient(t *testing.T) *http.Client {
	t.Helper()

	jar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatalf("failed to create cookie jar: %v", err)
	}

	return &http.Client{
		Jar: jar,
	}
}

func doJSONRequest(t *testing.T, client *http.Client, method, url string, body any) (int, []byte) {
	t.Helper()

	var requestBody io.Reader
	if body != nil {
		payload, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("failed to marshal request body: %v", err)
		}
		requestBody = bytes.NewReader(payload)
	}

	req, err := http.NewRequest(method, url, requestBody)
	if err != nil {
		t.Fatalf("failed to create request: %v", err)
	}

	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("failed to read response body: %v", err)
	}

	return resp.StatusCode, responseBody
}

func registerTestUser(t *testing.T, client *http.Client, baseURL, email, password, role string) UserResponse {
	t.Helper()

	status, body := doJSONRequest(t, client, http.MethodPost, baseURL+"/api/register", map[string]string{
		"email":    email,
		"password": password,
		"role":     role,
	})

	if status != http.StatusCreated {
		t.Fatalf("expected register status %d, got %d, body=%s", http.StatusCreated, status, string(body))
	}

	var response UserResponse
	if err := json.Unmarshal(body, &response); err != nil {
		t.Fatalf("failed to parse register response: %v", err)
	}

	return response
}

func loginTestUser(t *testing.T, client *http.Client, baseURL, email, password string) UserResponse {
	t.Helper()

	status, body := doJSONRequest(t, client, http.MethodPost, baseURL+"/api/login", map[string]string{
		"email":    email,
		"password": password,
	})

	if status != http.StatusOK {
		t.Fatalf("expected login status %d, got %d, body=%s", http.StatusOK, status, string(body))
	}

	var response UserResponse
	if err := json.Unmarshal(body, &response); err != nil {
		t.Fatalf("failed to parse login response: %v", err)
	}

	return response
}

func TestIntegrationRegisterLoginMeAndLogout(t *testing.T) {
	requireIntegrationDB(t)
	resetTestDatabase(t)

	server := httptest.NewServer(newMux())
	defer server.Close()

	client := newTestClient(t)

	createdUser := registerTestUser(
		t,
		client,
		server.URL,
		"resident.integration@example.com",
		"residentpass123",
		"resident",
	)

	if createdUser.Email != "resident.integration@example.com" {
		t.Fatalf("unexpected registered email: %s", createdUser.Email)
	}

	loggedInUser := loginTestUser(
		t,
		client,
		server.URL,
		"resident.integration@example.com",
		"residentpass123",
	)

	if loggedInUser.Role != "resident" {
		t.Fatalf("expected role resident, got %s", loggedInUser.Role)
	}

	status, body := doJSONRequest(t, client, http.MethodGet, server.URL+"/api/me", nil)
	if status != http.StatusOK {
		t.Fatalf("expected /api/me status %d, got %d, body=%s", http.StatusOK, status, string(body))
	}

	var me UserResponse
	if err := json.Unmarshal(body, &me); err != nil {
		t.Fatalf("failed to parse /api/me response: %v", err)
	}

	if me.Email != "resident.integration@example.com" {
		t.Fatalf("unexpected /api/me email: %s", me.Email)
	}

	status, body = doJSONRequest(t, client, http.MethodPost, server.URL+"/api/logout", nil)
	if status != http.StatusOK {
		t.Fatalf("expected logout status %d, got %d, body=%s", http.StatusOK, status, string(body))
	}

	status, body = doJSONRequest(t, client, http.MethodGet, server.URL+"/api/me", nil)
	if status != http.StatusUnauthorized {
		t.Fatalf("expected /api/me after logout status %d, got %d, body=%s", http.StatusUnauthorized, status, string(body))
	}

	if strings.TrimSpace(string(body)) != "authentication required" {
		t.Fatalf("unexpected /api/me after logout body: %q", string(body))
	}
}

func TestIntegrationResidentAdminWorkflowAndPassIssuance(t *testing.T) {
	requireIntegrationDB(t)
	resetTestDatabase(t)

	server := httptest.NewServer(newMux())
	defer server.Close()

	residentClient := newTestClient(t)
	adminClient := newTestClient(t)

	registerTestUser(
		t,
		residentClient,
		server.URL,
		"resident.workflow@example.com",
		"residentpass123",
		"resident",
	)

	registerTestUser(
		t,
		adminClient,
		server.URL,
		"admin.workflow@example.com",
		"adminpass123",
		"admin",
	)

	loginTestUser(
		t,
		residentClient,
		server.URL,
		"resident.workflow@example.com",
		"residentpass123",
	)

	status, body := doJSONRequest(t, residentClient, http.MethodPost, server.URL+"/api/applications", map[string]string{
		"full_name":          "Brandon Workflow",
		"date_of_birth":      "2000-01-01",
		"transit_id_number":  "TR-INT-1001",
		"eligibility_reason": "Student reduced fare eligibility",
	})
	if status != http.StatusCreated {
		t.Fatalf("expected application create status %d, got %d, body=%s", http.StatusCreated, status, string(body))
	}

	var createdApplication applicationAPIResponse
	if err := json.Unmarshal(body, &createdApplication); err != nil {
		t.Fatalf("failed to parse created application: %v", err)
	}

	if createdApplication.Status != "pending" {
		t.Fatalf("expected created application status pending, got %s", createdApplication.Status)
	}

	status, body = doJSONRequest(t, residentClient, http.MethodGet, server.URL+"/api/applications/me", nil)
	if status != http.StatusOK {
		t.Fatalf("expected resident applications status %d, got %d, body=%s", http.StatusOK, status, string(body))
	}

	var residentApplications []applicationAPIResponse
	if err := json.Unmarshal(body, &residentApplications); err != nil {
		t.Fatalf("failed to parse resident applications: %v", err)
	}

	if len(residentApplications) != 1 {
		t.Fatalf("expected 1 resident application, got %d", len(residentApplications))
	}

	loginTestUser(
		t,
		adminClient,
		server.URL,
		"admin.workflow@example.com",
		"adminpass123",
	)

	status, body = doJSONRequest(t, adminClient, http.MethodGet, server.URL+"/api/admin/applications", nil)
	if status != http.StatusOK {
		t.Fatalf("expected admin applications status %d, got %d, body=%s", http.StatusOK, status, string(body))
	}

	var adminApplications []applicationAPIResponse
	if err := json.Unmarshal(body, &adminApplications); err != nil {
		t.Fatalf("failed to parse admin applications: %v", err)
	}

	if len(adminApplications) != 1 {
		t.Fatalf("expected 1 admin application, got %d", len(adminApplications))
	}

	status, body = doJSONRequest(t, adminClient, http.MethodPost, server.URL+"/api/admin/applications/review", map[string]any{
		"application_id": createdApplication.ID,
		"status":         "approved",
	})
	if status != http.StatusOK {
		t.Fatalf("expected approve status %d, got %d, body=%s", http.StatusOK, status, string(body))
	}

	var approvedApplication applicationAPIResponse
	if err := json.Unmarshal(body, &approvedApplication); err != nil {
		t.Fatalf("failed to parse approved application: %v", err)
	}

	if approvedApplication.Status != "approved" {
		t.Fatalf("expected approved application status approved, got %s", approvedApplication.Status)
	}

	status, body = doJSONRequest(t, adminClient, http.MethodGet, server.URL+"/api/admin/passes", nil)
	if status != http.StatusOK {
		t.Fatalf("expected admin passes status %d, got %d, body=%s", http.StatusOK, status, string(body))
	}

	var adminPasses []passAPIResponse
	if err := json.Unmarshal(body, &adminPasses); err != nil {
		t.Fatalf("failed to parse admin passes: %v", err)
	}

	if len(adminPasses) != 1 {
		t.Fatalf("expected 1 admin pass, got %d", len(adminPasses))
	}

	if adminPasses[0].Status != "active" {
		t.Fatalf("expected active pass, got %s", adminPasses[0].Status)
	}

	status, body = doJSONRequest(t, residentClient, http.MethodGet, server.URL+"/api/passes/me", nil)
	if status != http.StatusOK {
		t.Fatalf("expected resident passes status %d, got %d, body=%s", http.StatusOK, status, string(body))
	}

	var residentPasses []passAPIResponse
	if err := json.Unmarshal(body, &residentPasses); err != nil {
		t.Fatalf("failed to parse resident passes: %v", err)
	}

	if len(residentPasses) != 1 {
		t.Fatalf("expected 1 resident pass, got %d", len(residentPasses))
	}

	if residentPasses[0].PassNumber == "" {
		t.Fatal("expected issued pass number to be non-empty")
	}

	verifyURL := server.URL + "/api/verify-pass?pass_number=" + residentPasses[0].PassNumber
	status, body = doJSONRequest(t, adminClient, http.MethodGet, verifyURL, nil)
	if status != http.StatusOK {
		t.Fatalf("expected verify status %d, got %d, body=%s", http.StatusOK, status, string(body))
	}

	var verification VerifyPassResponse
	if err := json.Unmarshal(body, &verification); err != nil {
		t.Fatalf("failed to parse verification response: %v", err)
	}

	if !verification.Valid {
		t.Fatalf("expected verification valid=true, got false")
	}
}

func TestIntegrationResidentCannotVerifyPass(t *testing.T) {
	requireIntegrationDB(t)
	resetTestDatabase(t)

	server := httptest.NewServer(newMux())
	defer server.Close()

	residentClient := newTestClient(t)
	adminClient := newTestClient(t)

	registerTestUser(
		t,
		residentClient,
		server.URL,
		"resident.forbidden@example.com",
		"residentpass123",
		"resident",
	)

	registerTestUser(
		t,
		adminClient,
		server.URL,
		"admin.forbidden@example.com",
		"adminpass123",
		"admin",
	)

	loginTestUser(
		t,
		residentClient,
		server.URL,
		"resident.forbidden@example.com",
		"residentpass123",
	)

	status, body := doJSONRequest(t, residentClient, http.MethodPost, server.URL+"/api/applications", map[string]string{
		"full_name":          "Resident Forbidden",
		"date_of_birth":      "2000-01-01",
		"transit_id_number":  "TR-INT-2001",
		"eligibility_reason": "Student reduced fare eligibility",
	})
	if status != http.StatusCreated {
		t.Fatalf("expected application create status %d, got %d, body=%s", http.StatusCreated, status, string(body))
	}

	var createdApplication applicationAPIResponse
	if err := json.Unmarshal(body, &createdApplication); err != nil {
		t.Fatalf("failed to parse created application: %v", err)
	}

	loginTestUser(
		t,
		adminClient,
		server.URL,
		"admin.forbidden@example.com",
		"adminpass123",
	)

	status, body = doJSONRequest(t, adminClient, http.MethodPost, server.URL+"/api/admin/applications/review", map[string]any{
		"application_id": createdApplication.ID,
		"status":         "approved",
	})
	if status != http.StatusOK {
		t.Fatalf("expected approve status %d, got %d, body=%s", http.StatusOK, status, string(body))
	}

	status, body = doJSONRequest(t, residentClient, http.MethodGet, server.URL+"/api/passes/me", nil)
	if status != http.StatusOK {
		t.Fatalf("expected resident passes status %d, got %d, body=%s", http.StatusOK, status, string(body))
	}

	var residentPasses []passAPIResponse
	if err := json.Unmarshal(body, &residentPasses); err != nil {
		t.Fatalf("failed to parse resident passes: %v", err)
	}

	if len(residentPasses) != 1 {
		t.Fatalf("expected 1 resident pass, got %d", len(residentPasses))
	}

	verifyURL := server.URL + "/api/verify-pass?pass_number=" + residentPasses[0].PassNumber
	status, body = doJSONRequest(t, residentClient, http.MethodGet, verifyURL, nil)
	if status != http.StatusForbidden {
		t.Fatalf("expected verify forbidden status %d, got %d, body=%s", http.StatusForbidden, status, string(body))
	}

	if strings.TrimSpace(string(body)) != "forbidden" {
		t.Fatalf("expected forbidden body, got %q", string(body))
	}
}
