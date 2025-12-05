package output

import (
	"context"

	"github.com/spidey52/api-logs/internal/domain"
)

// ProjectRepository defines the interface for project data persistence (Secondary Port)
type ProjectRepository interface {
	// Create stores a new project
	Create(ctx context.Context, project *domain.Project) error

	// FindByID retrieves a project by ID
	FindByID(ctx context.Context, id string) (*domain.Project, error)

	// FindByAPIKey retrieves a project by API key
	FindByAPIKey(ctx context.Context, apiKey string) (*domain.Project, error)

	// FindAll retrieves projects based on filter criteria
	FindAll(ctx context.Context, filter domain.ProjectFilter) ([]*domain.Project, error)

	// Update updates an existing project
	Update(ctx context.Context, project *domain.Project) error

	// Delete removes a project by ID
	Delete(ctx context.Context, id string) error

	// ExistsByAPIKey checks if an API key already exists
	ExistsByAPIKey(ctx context.Context, apiKey string) (bool, error)
}
