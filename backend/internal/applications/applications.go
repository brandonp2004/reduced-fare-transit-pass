package applications

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type Application struct {
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

type CreateApplicationInput struct {
	FullName          string `json:"full_name"`
	DateOfBirth       string `json:"date_of_birth"`
	TransitIDNumber   string `json:"transit_id_number"`
	EligibilityReason string `json:"eligibility_reason"`
}

type ReviewApplicationInput struct {
	ApplicationID int    `json:"application_id"`
	Status        string `json:"status"`
}

func ValidateCreateApplicationInput(input CreateApplicationInput) error {
	input.FullName = strings.TrimSpace(input.FullName)
	input.DateOfBirth = strings.TrimSpace(input.DateOfBirth)
	input.TransitIDNumber = strings.TrimSpace(input.TransitIDNumber)
	input.EligibilityReason = strings.TrimSpace(input.EligibilityReason)

	if input.FullName == "" {
		return fmt.Errorf("full_name is required")
	}
	if input.DateOfBirth == "" {
		return fmt.Errorf("date_of_birth is required")
	}
	if input.TransitIDNumber == "" {
		return fmt.Errorf("transit_id_number is required")
	}
	if input.EligibilityReason == "" {
		return fmt.Errorf("eligibility_reason is required")
	}

	return nil
}

func ValidateReviewApplicationInput(input ReviewApplicationInput) error {
	if input.ApplicationID <= 0 {
		return fmt.Errorf("application_id must be greater than 0")
	}

	if input.Status != "approved" && input.Status != "rejected" {
		return fmt.Errorf("status must be approved or rejected")
	}

	return nil
}

func CreateApplication(
	conn *pgx.Conn,
	userID int,
	fullName string,
	dateOfBirth string,
	transitIDNumber string,
	eligibilityReason string,
) (*Application, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO applications (
			user_id,
			full_name,
			date_of_birth,
			transit_id_number,
			eligibility_reason
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, user_id, full_name, date_of_birth::text, transit_id_number, eligibility_reason, status, created_at, reviewed_at
	`

	var app Application

	err := conn.QueryRow(
		ctx,
		query,
		userID,
		fullName,
		dateOfBirth,
		transitIDNumber,
		eligibilityReason,
	).Scan(
		&app.ID,
		&app.UserID,
		&app.FullName,
		&app.DateOfBirth,
		&app.TransitIDNumber,
		&app.EligibilityReason,
		&app.Status,
		&app.CreatedAt,
		&app.ReviewedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create application: %w", err)
	}

	return &app, nil
}

func GetApplicationsByUserID(conn *pgx.Conn, userID int) ([]Application, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, user_id, full_name, date_of_birth::text, transit_id_number, eligibility_reason, status, created_at, reviewed_at
		FROM applications
		WHERE user_id = $1
		ORDER BY id
	`

	rows, err := conn.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query applications: %w", err)
	}
	defer rows.Close()

	results := make([]Application, 0)

	for rows.Next() {
		var app Application

		err := rows.Scan(
			&app.ID,
			&app.UserID,
			&app.FullName,
			&app.DateOfBirth,
			&app.TransitIDNumber,
			&app.EligibilityReason,
			&app.Status,
			&app.CreatedAt,
			&app.ReviewedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan application row: %w", err)
		}

		results = append(results, app)
	}

	return results, nil
}

func GetAllApplications(conn *pgx.Conn) ([]Application, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, user_id, full_name, date_of_birth::text, transit_id_number, eligibility_reason, status, created_at, reviewed_at
		FROM applications
		ORDER BY id
	`

	rows, err := conn.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query all applications: %w", err)
	}
	defer rows.Close()

	results := make([]Application, 0)

	for rows.Next() {
		var app Application

		err := rows.Scan(
			&app.ID,
			&app.UserID,
			&app.FullName,
			&app.DateOfBirth,
			&app.TransitIDNumber,
			&app.EligibilityReason,
			&app.Status,
			&app.CreatedAt,
			&app.ReviewedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan application row: %w", err)
		}

		results = append(results, app)
	}

	return results, nil
}

func UpdateApplicationStatus(conn *pgx.Conn, applicationID int, status string) (*Application, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE applications
		SET status = $2, reviewed_at = NOW()
		WHERE id = $1
		RETURNING id, user_id, full_name, date_of_birth::text, transit_id_number, eligibility_reason, status, created_at, reviewed_at
	`

	var app Application

	err := conn.QueryRow(ctx, query, applicationID, status).Scan(
		&app.ID,
		&app.UserID,
		&app.FullName,
		&app.DateOfBirth,
		&app.TransitIDNumber,
		&app.EligibilityReason,
		&app.Status,
		&app.CreatedAt,
		&app.ReviewedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update application status: %w", err)
	}

	return &app, nil
}
