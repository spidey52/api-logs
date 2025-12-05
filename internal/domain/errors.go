package domain

import "errors"

var (
	// ErrProjectNotFound is returned when a project is not found
	ErrProjectNotFound = errors.New("project not found")

	// ErrLogNotFound is returned when a log is not found
	ErrLogNotFound = errors.New("log not found")

	// ErrHeadersNotFound is returned when headers are not found
	ErrHeadersNotFound = errors.New("headers not found")

	// ErrBodyNotFound is returned when body is not found
	ErrBodyNotFound = errors.New("body not found")

	// ErrInvalidAPIKey is returned when an API key is invalid
	ErrInvalidAPIKey = errors.New("invalid API key")

	// ErrUnauthorized is returned when a request is unauthorized
	ErrUnauthorized = errors.New("unauthorized")

	// ErrInvalidInput is returned when input validation fails
	ErrInvalidInput = errors.New("invalid input")

	// ErrDuplicateAPIKey is returned when an API key already exists
	ErrDuplicateAPIKey = errors.New("api key already exists")

	// ErrInvalidEnvironment is returned when environment is invalid
	ErrInvalidEnvironment = errors.New("invalid environment")

	// User related errors
	ErrUserNotFound            = errors.New("user not found")
	ErrInvalidUserName         = errors.New("user name is required")
	ErrInvalidUserIdentifier   = errors.New("user identifier is required")
	ErrDuplicateUserIdentifier = errors.New("user identifier already exists")
)
