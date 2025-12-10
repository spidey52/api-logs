package output

import (
	"context"

	"github.com/spidey52/api-logs/internal/domain"
)

// UserRepository defines the interface for user storage operations
type UserRepository interface {
	// Create creates a new user
	Create(ctx context.Context, user *domain.User) error

	// FindByID retrieves a user by ID
	FindByID(ctx context.Context, id string) (*domain.User, error)

	// FindByIdentifier retrieves a user by identifier
	FindByIdentifier(ctx context.Context, identifier string, projectID string) (*domain.User, error)

	// Update updates an existing user
	Update(ctx context.Context, user *domain.User) error

	// Delete deletes a user by ID
	Delete(ctx context.Context, id string) error

	// List retrieves all users with pagination
	List(ctx context.Context, page, pageSize int) ([]*domain.User, int, error)
}
