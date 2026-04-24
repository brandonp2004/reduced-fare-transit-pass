package passes

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

type Pass struct {
	ID            int       `json:"id"`
	ApplicationID int       `json:"application_id"`
	UserID        int       `json:"user_id"`
	PassNumber    string    `json:"pass_number"`
	Status        string    `json:"status"`
	IssuedAt      time.Time `json:"issued_at"`
	ExpiresAt     time.Time `json:"expires_at"`
}

func GetPassByApplicationID(conn *pgx.Conn, applicationID int) (*Pass, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, application_id, user_id, pass_number, status, issued_at, expires_at
		FROM passes
		WHERE application_id = $1
	`

	var pass Pass

	err := conn.QueryRow(ctx, query, applicationID).Scan(
		&pass.ID,
		&pass.ApplicationID,
		&pass.UserID,
		&pass.PassNumber,
		&pass.Status,
		&pass.IssuedAt,
		&pass.ExpiresAt,
	)
	if err != nil {
		return nil, err
	}

	return &pass, nil
}

func EnsureActivePassForApplication(conn *pgx.Conn, applicationID int, userID int) (*Pass, error) {
	existing, err := GetPassByApplicationID(conn, applicationID)
	if err == nil {
		if existing.Status == "active" {
			return existing, nil
		}

		return UpdatePassStatusByApplicationID(conn, applicationID, "active")
	}

	if err != pgx.ErrNoRows {
		return nil, fmt.Errorf("failed checking existing pass: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	passNumber := fmt.Sprintf("PASS-%d-%d-%d", userID, applicationID, time.Now().UnixNano())

	query := `
		INSERT INTO passes (
			application_id,
			user_id,
			pass_number
		)
		VALUES ($1, $2, $3)
		RETURNING id, application_id, user_id, pass_number, status, issued_at, expires_at
	`

	var pass Pass

	err = conn.QueryRow(ctx, query, applicationID, userID, passNumber).Scan(
		&pass.ID,
		&pass.ApplicationID,
		&pass.UserID,
		&pass.PassNumber,
		&pass.Status,
		&pass.IssuedAt,
		&pass.ExpiresAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create pass: %w", err)
	}

	return &pass, nil
}

func UpdatePassStatusByApplicationID(conn *pgx.Conn, applicationID int, status string) (*Pass, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE passes
		SET status = $2
		WHERE application_id = $1
		RETURNING id, application_id, user_id, pass_number, status, issued_at, expires_at
	`

	var pass Pass

	err := conn.QueryRow(ctx, query, applicationID, status).Scan(
		&pass.ID,
		&pass.ApplicationID,
		&pass.UserID,
		&pass.PassNumber,
		&pass.Status,
		&pass.IssuedAt,
		&pass.ExpiresAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update pass status: %w", err)
	}

	return &pass, nil
}

func SetPassStatusByApplicationIDIfExists(conn *pgx.Conn, applicationID int, status string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE passes
		SET status = $2
		WHERE application_id = $1
	`

	_, err := conn.Exec(ctx, query, applicationID, status)
	if err != nil {
		return fmt.Errorf("failed to set pass status: %w", err)
	}

	return nil
}

func GetPassesByUserID(conn *pgx.Conn, userID int) ([]Pass, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, application_id, user_id, pass_number, status, issued_at, expires_at
		FROM passes
		WHERE user_id = $1
		ORDER BY id
	`

	rows, err := conn.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query passes: %w", err)
	}
	defer rows.Close()

	results := make([]Pass, 0)

	for rows.Next() {
		var pass Pass

		err := rows.Scan(
			&pass.ID,
			&pass.ApplicationID,
			&pass.UserID,
			&pass.PassNumber,
			&pass.Status,
			&pass.IssuedAt,
			&pass.ExpiresAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan pass row: %w", err)
		}

		results = append(results, pass)
	}

	return results, nil
}

func GetAllPasses(conn *pgx.Conn) ([]Pass, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, application_id, user_id, pass_number, status, issued_at, expires_at
		FROM passes
		ORDER BY id
	`

	rows, err := conn.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query all passes: %w", err)
	}
	defer rows.Close()

	results := make([]Pass, 0)

	for rows.Next() {
		var pass Pass

		err := rows.Scan(
			&pass.ID,
			&pass.ApplicationID,
			&pass.UserID,
			&pass.PassNumber,
			&pass.Status,
			&pass.IssuedAt,
			&pass.ExpiresAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan pass row: %w", err)
		}

		results = append(results, pass)
	}

	return results, nil
}

func GetPassByPassNumber(conn *pgx.Conn, passNumber string) (*Pass, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, application_id, user_id, pass_number, status, issued_at, expires_at
		FROM passes
		WHERE pass_number = $1
	`

	var pass Pass

	err := conn.QueryRow(ctx, query, passNumber).Scan(
		&pass.ID,
		&pass.ApplicationID,
		&pass.UserID,
		&pass.PassNumber,
		&pass.Status,
		&pass.IssuedAt,
		&pass.ExpiresAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get pass by pass number: %w", err)
	}

	return &pass, nil
}
