package domain

import "time"

// User represents basic user details for API logs
type User struct {
	ID         string         `json:"id" bson:"_id,omitempty"`
	Name       string         `json:"name" bson:"name"`
	Identifier string         `json:"identifier" bson:"identifier"` // Employee ID, Customer ID, etc.
	Metadata   map[string]any `json:"metadata" bson:"metadata"`     // Additional custom fields
	CreatedAt  time.Time      `json:"created_at" bson:"created_at"`
	ProjectID  string         `json:"project_id" bson:"project_id"`
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
