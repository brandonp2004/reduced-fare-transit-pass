package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestRootHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rr := httptest.NewRecorder()

	newMux().ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rr.Code)
	}

	body := strings.TrimSpace(rr.Body.String())
	if body != "Backend is running" {
		t.Fatalf("expected body %q, got %q", "Backend is running", body)
	}
}

func TestUnknownRouteReturns404(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/does-not-exist", nil)
	rr := httptest.NewRecorder()

	newMux().ServeHTTP(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d", http.StatusNotFound, rr.Code)
	}
}

func TestHealthHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rr := httptest.NewRecorder()

	newMux().ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rr.Code)
	}

	var response HealthResponse
	err := json.Unmarshal(rr.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("failed to parse health response: %v", err)
	}

	if response.Status != "ok" {
		t.Fatalf("expected health status %q, got %q", "ok", response.Status)
	}

	if response.Service != "reduced-fare-transit-pass-backend" {
		t.Fatalf("unexpected service name: %q", response.Service)
	}
}

func TestHealthHandlerRejectsPost(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/health", nil)
	rr := httptest.NewRecorder()

	newMux().ServeHTTP(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected status %d, got %d", http.StatusMethodNotAllowed, rr.Code)
	}
}

func TestMeRequiresAuthentication(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/me", nil)
	rr := httptest.NewRecorder()

	newMux().ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rr.Code)
	}

	body := strings.TrimSpace(rr.Body.String())
	if body != "authentication required" {
		t.Fatalf("expected body %q, got %q", "authentication required", body)
	}
}

func TestAdminApplicationsRequireAuthentication(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/admin/applications", nil)
	rr := httptest.NewRecorder()

	newMux().ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rr.Code)
	}

	body := strings.TrimSpace(rr.Body.String())
	if body != "authentication required" {
		t.Fatalf("expected body %q, got %q", "authentication required", body)
	}
}

func TestVerifyPassRequiresAuthentication(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/verify-pass?pass_number=PASS-TEST-123", nil)
	rr := httptest.NewRecorder()

	newMux().ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rr.Code)
	}

	body := strings.TrimSpace(rr.Body.String())
	if body != "authentication required" {
		t.Fatalf("expected body %q, got %q", "authentication required", body)
	}
}
