package domain

import (
	"errors"
	"time"
)

// Project represents a project that generates API logs
type Project struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	APIKey      string      `json:"api_key"`
	Environment Environment `json:"environment"`
	IsActive    bool        `json:"is_active"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

// Validate validates the project
func (p *Project) Validate() error {
	if p.Name == "" {
		return errors.New("project name is required")
	}
	if len(p.Name) < 3 {
		return errors.New("project name must be at least 3 characters")
	}
	if p.APIKey == "" {
		return errors.New("api key is required")
	}

	if err := p.Environment.Validate(); err != nil {
		return err
	}
	return nil
}
