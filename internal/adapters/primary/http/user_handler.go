package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/input"
)

type UserHandler struct {
	userService input.UserService
}

// NewUserHandler creates a new user handler
func NewUserHandler(userService input.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// CreateUser godoc
// @Summary Create a new user
// @Tags users
// @Accept json
// @Produce json
// @Param user body CreateUserRequest true "User details"
// @Success 201 {object} UserResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /users [post]
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	user := &domain.User{
		Name:       req.Name,
		Identifier: req.Identifier,
		Metadata:   req.Metadata,
		ProjectID:  req.ProjectID,
	}

	if err := h.userService.CreateUser(c.Request.Context(), user); err != nil {
		if err == domain.ErrDuplicateUserIdentifier {
			c.JSON(http.StatusConflict, ErrorResponse{Error: "User identifier already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, UserResponse{
		Data: user,
	})
}

// GetUser godoc
// @Summary Get user by ID
// @Tags users
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} UserResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /users/{id} [get]
func (h *UserHandler) GetUser(c *gin.Context) {
	id := c.Param("id")

	user, err := h.userService.GetUser(c.Request.Context(), id)
	if err != nil {
		if err == domain.ErrUserNotFound {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, UserResponse{
		Data: user,
	})
}

// GetUserByIdentifier godoc
// @Summary Get user by identifier
// @Tags users
// @Produce json
// @Param identifier query string true "User Identifier"
// @Success 200 {object} UserResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /users/by-identifier [get]
func (h *UserHandler) GetUserByIdentifier(c *gin.Context) {
	identifier := c.Query("identifier")
	if identifier == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Identifier is required"})
		return
	}

	projectID := c.Query("project_id")

	user, err := h.userService.GetUserByIdentifier(c.Request.Context(), identifier, projectID)
	if err != nil {
		if err == domain.ErrUserNotFound {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, UserResponse{
		Data: user,
	})
}

// UpdateUser godoc
// @Summary Update user
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param user body UpdateUserRequest true "Updated user details"
// @Success 200 {object} UserResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /users/{id} [put]
func (h *UserHandler) UpdateUser(c *gin.Context) {
	id := c.Param("id")

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	user := &domain.User{
		ID:         id,
		Name:       req.Name,
		Identifier: req.Identifier,
		Metadata:   req.Metadata,
	}

	if err := h.userService.UpdateUser(c.Request.Context(), user); err != nil {
		if err == domain.ErrUserNotFound {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "User not found"})
			return
		}
		if err == domain.ErrDuplicateUserIdentifier {
			c.JSON(http.StatusConflict, ErrorResponse{Error: "User identifier already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, UserResponse{
		Data: user,
	})
}

// DeleteUser godoc
// @Summary Delete user
// @Tags users
// @Produce json
// @Param id path string true "User ID"
// @Success 204
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /users/{id} [delete]
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")

	if err := h.userService.DeleteUser(c.Request.Context(), id); err != nil {
		if err == domain.ErrUserNotFound {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// ListUsers godoc
// @Summary List users
// @Tags users
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Success 200 {object} UsersListResponse
// @Failure 500 {object} ErrorResponse
// @Router /users [get]
func (h *UserHandler) ListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	users, total, err := h.userService.ListUsers(c.Request.Context(), page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, UsersListResponse{
		Data: users,
		Pagination: PaginationInfo{
			Page:     page,
			PageSize: pageSize,
			Total:    total,
		},
	})
}

// Request/Response types

type CreateUserRequest struct {
	Name       string         `json:"name" binding:"required"`
	Identifier string         `json:"identifier" binding:"required"`
	Email      string         `json:"email"`
	Metadata   map[string]any `json:"metadata"`
	ProjectID  string         `json:"project_id" binding:"required"`
}

type UpdateUserRequest struct {
	Name       string         `json:"name" binding:"required"`
	Identifier string         `json:"identifier" binding:"required"`
	Email      string         `json:"email"`
	Metadata   map[string]any `json:"metadata"`
}

type UserResponse struct {
	Data *domain.User `json:"data"`
}

type UsersListResponse struct {
	Data       []*domain.User `json:"data"`
	Pagination PaginationInfo `json:"pagination"`
}

type PaginationInfo struct {
	Page     int `json:"page"`
	PageSize int `json:"page_size"`
	Total    int `json:"total"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}
