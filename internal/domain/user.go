package domain

import "time"

// User represents basic user details for API logs
type User struct {
	ID         string
	Name       string
	Identifier string         // Employee ID, Customer ID, etc.
	Metadata   map[string]any // Additional custom fields
	CreatedAt  time.Time
	ProjectID  string `json:"project_id"`
}

// Validate validates user fields
func (u *User) Validate() error {
	if u.Name == "" {
		return ErrInvalidUserName
	}

	if u.Identifier == "" {
		return ErrInvalidUserIdentifier
	}

	return nil
}
