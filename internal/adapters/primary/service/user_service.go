package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/input"
	"github.com/spidey52/api-logs/internal/ports/output"
)

type userService struct {
	userRepo output.UserRepository
}

// NewUserService creates a new user service
func NewUserService(userRepo output.UserRepository) input.UserService {
	return &userService{
		userRepo: userRepo,
	}
}

func (s *userService) CreateUser(ctx context.Context, user *domain.User) error {
	// Validate user
	if err := user.Validate(); err != nil {
		return err
	}

	// Check if identifier already exists
	existing, _ := s.userRepo.FindByIdentifier(ctx, user.Identifier, user.ProjectID)
	if existing != nil {
		return domain.ErrDuplicateUserIdentifier
	}

	// Generate ID
	user.ID = uuid.New().String()
	user.CreatedAt = time.Now()

	return s.userRepo.Create(ctx, user)
}

func (s *userService) GetUser(ctx context.Context, id string) (*domain.User, error) {
	return s.userRepo.FindByID(ctx, id)
}

func (s *userService) GetUserByIdentifier(ctx context.Context, identifier string, projectID string) (*domain.User, error) {
	return s.userRepo.FindByIdentifier(ctx, identifier, projectID)
}

func (s *userService) UpdateUser(ctx context.Context, user *domain.User) error {
	// Validate user
	if err := user.Validate(); err != nil {
		return err
	}

	// Check if user exists
	existing, err := s.userRepo.FindByID(ctx, user.ID)
	if err != nil {
		return err
	}

	// Check if identifier is being changed and if it's already taken
	if existing.Identifier != user.Identifier {
		existingByIdentifier, _ := s.userRepo.FindByIdentifier(ctx, user.Identifier, user.ProjectID)
		if existingByIdentifier != nil && existingByIdentifier.ID != user.ID {
			return domain.ErrDuplicateUserIdentifier
		}
	}

	return s.userRepo.Update(ctx, user)
}

func (s *userService) DeleteUser(ctx context.Context, id string) error {
	// Check if user exists
	_, err := s.userRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	return s.userRepo.Delete(ctx, id)
}

func (s *userService) ListUsers(ctx context.Context, page, pageSize int) ([]*domain.User, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.userRepo.List(ctx, page, pageSize)
}
