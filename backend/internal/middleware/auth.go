package middleware

import (
	"context"
	"net/http"
	"time"

	"reduced-fare-transit-pass/backend/internal/db"
	"reduced-fare-transit-pass/backend/internal/sessions"
	"reduced-fare-transit-pass/backend/internal/users"
)

const SessionCookieName = "rftp_session"

type contextKey string

const currentUserKey contextKey = "current_user"

func CurrentUser(r *http.Request) (*users.User, bool) {
	user, ok := r.Context().Value(currentUserKey).(*users.User)
	return user, ok
}

func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie(SessionCookieName)
		if err != nil || cookie.Value == "" {
			http.Error(w, "authentication required", http.StatusUnauthorized)
			return
		}

		conn, err := db.Open()
		if err != nil {
			http.Error(w, "database connection failed: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer conn.Close(context.Background())

		session, err := sessions.GetSessionByToken(conn, cookie.Value)
		if err != nil {
			http.Error(w, "invalid session", http.StatusUnauthorized)
			return
		}

		if session.ExpiresAt.Before(time.Now()) {
			_ = sessions.DeleteSessionByToken(conn, cookie.Value)
			http.Error(w, "session expired", http.StatusUnauthorized)
			return
		}

		user, err := users.GetUserByID(conn, session.UserID)
		if err != nil {
			http.Error(w, "user not found", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), currentUserKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func RequireRoles(allowedRoles ...string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return RequireAuth(func(w http.ResponseWriter, r *http.Request) {
			user, ok := CurrentUser(r)
			if !ok {
				http.Error(w, "authentication required", http.StatusUnauthorized)
				return
			}

			for _, role := range allowedRoles {
				if user.Role == role {
					next.ServeHTTP(w, r)
					return
				}
			}

			http.Error(w, "forbidden", http.StatusForbidden)
		})
	}
}

func RequireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return RequireRoles("admin")(next)
}
