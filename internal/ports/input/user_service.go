package input

import (
	"context"

	"github.com/spidey52/api-logs/internal/domain"
)

// UserService defines the interface for user business logic
type UserService interface {
	// CreateUser creates a new user
	CreateUser(ctx context.Context, user *domain.User) error

	// GetUser retrieves a user by ID
	GetUser(ctx context.Context, id string) (*domain.User, error)

	// GetUserByIdentifier retrieves a user by identifier
	GetUserByIdentifier(ctx context.Context, identifier string, project_id string) (*domain.User, error)

	// UpdateUser updates an existing user
	UpdateUser(ctx context.Context, user *domain.User) error

	// DeleteUser deletes a user by ID
	DeleteUser(ctx context.Context, id string) error

	// ListUsers retrieves all users with pagination
	ListUsers(ctx context.Context, page, pageSize int) ([]*domain.User, int, error)
}
