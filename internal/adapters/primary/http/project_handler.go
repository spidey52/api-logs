package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/input"
)

// ProjectHandler handles HTTP requests for projects
type ProjectHandler struct {
	projectService input.ProjectService
}

// NewProjectHandler creates a new instance of ProjectHandler
func NewProjectHandler(projectService input.ProjectService) *ProjectHandler {
	return &ProjectHandler{
		projectService: projectService,
	}
}

// CreateProjectRequest represents the request body for creating a project
type CreateProjectRequest struct {
	Name        string             `json:"name" binding:"required,min=3"`
	Description string             `json:"description"`
	Environment domain.Environment `json:"environment" binding:"required"`
}

// UpdateProjectRequest represents the request body for updating a project
type UpdateProjectRequest struct {
	Name        string             `json:"name" binding:"required,min=3"`
	Description string             `json:"description"`
	Environment domain.Environment `json:"environment" binding:"required"`
	IsActive    bool               `json:"is_active"`
}

// CreateProject handles POST /api/v1/projects
func (h *ProjectHandler) CreateProject(c *gin.Context) {
	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project := &domain.Project{
		Name:        req.Name,
		Description: req.Description,
		Environment: req.Environment,
		IsActive:    true,
	}

	if err := h.projectService.CreateProject(c.Request.Context(), project); err != nil {
		if err == domain.ErrDuplicateAPIKey {
			c.JSON(http.StatusConflict, gin.H{"error": "API key already exists"})
			return
		}
		if err == domain.ErrInvalidInput {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input", "details": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": project})
}

// GetProject handles GET /api/v1/projects/:id
func (h *ProjectHandler) GetProject(c *gin.Context) {
	id := c.Param("id")

	project, err := h.projectService.GetProject(c.Request.Context(), id)
	if err != nil {
		if err == domain.ErrProjectNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve project"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": project})
}

// ListProjects handles GET /api/v1/projects
func (h *ProjectHandler) ListProjects(c *gin.Context) {
	var filter domain.ProjectFilter

	// Parse query parameters
	if env := c.Query("environment"); env != "" {
		filter.Environment = domain.Environment(env)
	}

	filter.Limit = 50
	filter.Offset = 0

	projects, err := h.projectService.ListProjects(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve projects"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": projects})
}

// UpdateProject handles PUT /api/v1/projects/:id
func (h *ProjectHandler) UpdateProject(c *gin.Context) {
	id := c.Param("id")

	var req UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project := &domain.Project{
		ID:          id,
		Name:        req.Name,
		Description: req.Description,
		Environment: req.Environment,
		IsActive:    req.IsActive,
	}

	if err := h.projectService.UpdateProject(c.Request.Context(), project); err != nil {
		if err == domain.ErrProjectNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		if err == domain.ErrInvalidInput {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": project})
}

// DeleteProject handles DELETE /api/v1/projects/:id
func (h *ProjectHandler) DeleteProject(c *gin.Context) {
	id := c.Param("id")

	if err := h.projectService.DeleteProject(c.Request.Context(), id); err != nil {
		if err == domain.ErrProjectNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete project"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// RegenerateAPIKey handles POST /api/v1/projects/:id/regenerate-key
func (h *ProjectHandler) RegenerateAPIKey(c *gin.Context) {
	id := c.Param("id")

	newKey, err := h.projectService.RegenerateAPIKey(c.Request.Context(), id)
	if err != nil {
		if err == domain.ErrProjectNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to regenerate API key"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"api_key": newKey}})
}
