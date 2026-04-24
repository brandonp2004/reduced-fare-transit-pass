package sessions

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

type Session struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	TokenHash string    `json:"-"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

func GenerateSessionToken() (string, error) {
	tokenBytes := make([]byte, 32)

	_, err := rand.Read(tokenBytes)
	if err != nil {
		return "", fmt.Errorf("failed to generate session token: %w", err)
	}

	return base64.RawURLEncoding.EncodeToString(tokenBytes), nil
}

func HashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

func CreateSession(conn *pgx.Conn, userID int, duration time.Duration) (string, *Session, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rawToken, err := GenerateSessionToken()
	if err != nil {
		return "", nil, err
	}

	tokenHash := HashToken(rawToken)
	expiresAt := time.Now().Add(duration)

	query := `
		INSERT INTO sessions (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
		RETURNING id, user_id, token_hash, expires_at, created_at
	`

	var session Session

	err = conn.QueryRow(ctx, query, userID, tokenHash, expiresAt).Scan(
		&session.ID,
		&session.UserID,
		&session.TokenHash,
		&session.ExpiresAt,
		&session.CreatedAt,
	)
	if err != nil {
		return "", nil, fmt.Errorf("failed to create session: %w", err)
	}

	return rawToken, &session, nil
}

func GetSessionByToken(conn *pgx.Conn, rawToken string) (*Session, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	tokenHash := HashToken(rawToken)

	query := `
		SELECT id, user_id, token_hash, expires_at, created_at
		FROM sessions
		WHERE token_hash = $1
	`

	var session Session

	err := conn.QueryRow(ctx, query, tokenHash).Scan(
		&session.ID,
		&session.UserID,
		&session.TokenHash,
		&session.ExpiresAt,
		&session.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get session by token: %w", err)
	}

	return &session, nil
}

func DeleteSessionByToken(conn *pgx.Conn, rawToken string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	tokenHash := HashToken(rawToken)

	query := `
		DELETE FROM sessions
		WHERE token_hash = $1
	`

	_, err := conn.Exec(ctx, query, tokenHash)
	if err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}

	return nil
}
