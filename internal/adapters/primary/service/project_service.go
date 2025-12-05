package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/google/uuid"
	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/input"
	"github.com/spidey52/api-logs/internal/ports/output"
	"github.com/spidey52/api-logs/pkg/logger"
)

// projectService implements the ProjectService interface
type projectService struct {
	projectRepo output.ProjectRepository
}

// NewProjectService creates a new instance of ProjectService
func NewProjectService(projectRepo output.ProjectRepository) input.ProjectService {
	return &projectService{
		projectRepo: projectRepo,
	}
}

// CreateProject creates a new project with generated API key
func (s *projectService) CreateProject(ctx context.Context, project *domain.Project) error {
	// Generate ID if not provided
	if project.ID == "" {
		project.ID = uuid.New().String()
	}

	// Generate API key if not provided
	if project.APIKey == "" {
		apiKey, err := s.generateAPIKey(project)
		if err != nil {
			return err
		}
		project.APIKey = apiKey
	}

	// Validate project
	if err := project.Validate(); err != nil {
		logger.Error("Invalid project input", "error", err)
		return domain.ErrInvalidInput
	}

	// Check if API key already exists
	exists, err := s.projectRepo.ExistsByAPIKey(ctx, project.APIKey)
	if err != nil {
		return err
	}
	if exists {
		return domain.ErrDuplicateAPIKey
	}

	// Set timestamps
	now := time.Now()
	project.CreatedAt = now
	project.UpdatedAt = now

	// Set default active status
	if !project.IsActive {
		project.IsActive = true
	}

	return s.projectRepo.Create(ctx, project)
}

// GetProject retrieves a project by ID
func (s *projectService) GetProject(ctx context.Context, id string) (*domain.Project, error) {
	return s.projectRepo.FindByID(ctx, id)
}

// GetProjectByAPIKey retrieves a project by API key
func (s *projectService) GetProjectByAPIKey(ctx context.Context, apiKey string) (*domain.Project, error) {
	return s.projectRepo.FindByAPIKey(ctx, apiKey)
}

// ListProjects retrieves projects based on filter criteria
func (s *projectService) ListProjects(ctx context.Context, filter domain.ProjectFilter) ([]*domain.Project, error) {
	filter.ApplyDefaults()
	return s.projectRepo.FindAll(ctx, filter)
}

// UpdateProject updates an existing project
func (s *projectService) UpdateProject(ctx context.Context, project *domain.Project) error {
	if err := project.Validate(); err != nil {
		return domain.ErrInvalidInput
	}

	// Check if project exists
	existing, err := s.projectRepo.FindByID(ctx, project.ID)
	if err != nil {
		return err
	}
	if existing == nil {
		return domain.ErrProjectNotFound
	}

	// Update timestamp
	project.UpdatedAt = time.Now()

	return s.projectRepo.Update(ctx, project)
}

// DeleteProject deletes a project by ID
func (s *projectService) DeleteProject(ctx context.Context, id string) error {
	// Check if project exists
	existing, err := s.projectRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return domain.ErrProjectNotFound
	}

	return s.projectRepo.Delete(ctx, id)
}

// ValidateAPIKey validates an API key and returns the associated project
func (s *projectService) ValidateAPIKey(ctx context.Context, apiKey string, environment domain.Environment) (*domain.Project, error) {
	if apiKey == "" {
		return nil, domain.ErrInvalidAPIKey
	}

	if err := environment.Validate(); err != nil {
		return nil, domain.ErrInvalidEnvironment
	}

	project, err := s.projectRepo.FindByAPIKey(ctx, apiKey)
	if err != nil {
		return nil, domain.ErrInvalidAPIKey
	}

	if !project.IsActive {
		return nil, domain.ErrUnauthorized
	}

	if project.Environment != environment {
		return nil, domain.ErrUnauthorized
	}

	return project, nil
}

// RegenerateAPIKey generates a new API key for a project
func (s *projectService) RegenerateAPIKey(ctx context.Context, projectID string) (string, error) {
	// Get existing project
	project, err := s.projectRepo.FindByID(ctx, projectID)
	if err != nil {
		return "", err
	}
	if project == nil {
		return "", domain.ErrProjectNotFound
	}

	// Generate new API key
	newAPIKey, err := s.generateAPIKey(project)
	if err != nil {
		return "", err
	}

	// Update project
	project.APIKey = newAPIKey
	project.UpdatedAt = time.Now()

	if err := s.projectRepo.Update(ctx, project); err != nil {
		return "", err
	}

	return newAPIKey, nil
}

// generateAPIKey generates a random API key with prefix
func (s *projectService) generateAPIKey(p *domain.Project) (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	prefix := "dev_"

	if p != nil && p.Environment == domain.EnvironmentProduction {
		prefix = "prod_"
	}

	return prefix + hex.EncodeToString(bytes), nil
}
