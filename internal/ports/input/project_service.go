package input

import (
	"context"

	"github.com/spidey52/api-logs/internal/domain"
)

// ProjectService defines the interface for project business logic (Primary Port)
type ProjectService interface {
	// CreateProject creates a new project with generated API key
	CreateProject(ctx context.Context, project *domain.Project) error

	// GetProject retrieves a project by ID
	GetProject(ctx context.Context, id string) (*domain.Project, error)

	// GetProjectByAPIKey retrieves a project by API key
	GetProjectByAPIKey(ctx context.Context, apiKey string) (*domain.Project, error)

	// ListProjects retrieves projects based on filter criteria
	ListProjects(ctx context.Context, filter domain.ProjectFilter) ([]*domain.Project, error)

	// UpdateProject updates an existing project
	UpdateProject(ctx context.Context, project *domain.Project) error

	// DeleteProject deletes a project by ID
	DeleteProject(ctx context.Context, id string) error

	// ValidateAPIKey validates an API key and returns the associated project
	ValidateAPIKey(ctx context.Context, apiKey string, environment domain.Environment) (*domain.Project, error)

	// RegenerateAPIKey generates a new API key for a project
	RegenerateAPIKey(ctx context.Context, projectID string) (string, error)
}
