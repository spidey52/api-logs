package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

type ActorType string

const (
	ActorUser    ActorType = "user"
	ActorService ActorType = "service"
	ActorSystem  ActorType = "system"
	ActorAPIKey  ActorType = "api_key"
	ActorCustom  ActorType = "custom"
)

type AccessOutcome string

const (
	OutcomeSuccess AccessOutcome = "success"
	OutcomeDenied  AccessOutcome = "denied"
	OutcomeError   AccessOutcome = "error"
)

// AccessLog represents an immutable, independent access/audit event
type AccessLog struct {
	ID        string    `json:"id" bson:"_id"`
	ProjectID string    `json:"project_id" bson:"project_id"`
	Timestamp time.Time `json:"timestamp"`

	// Actor (who)
	ActorID   string    `json:"actor_id" bson:"actor_id"`
	ActorType ActorType `json:"actor_type" bson:"actor_type"`

	// Access semantics (what)
	Action       string `json:"action" bson:"action"` // read, write, delete, login
	ResourceType string `json:"resource_type" bson:"resource_type,omitempty"`
	ResourceID   string `json:"resource_id" bson:"resource_id,omitempty"`

	// Result (decision)
	Outcome AccessOutcome `json:"outcome" bson:"outcome"`

	// Human context
	Message string `json:"message" bson:"message"`

	// Extensibility
	Metadata map[string]any `json:"metadata,omitempty" bson:"metadata,omitempty"`
}

func (a *AccessLog) SetDefaults() {
	if a.ID == "" {
		a.ID = uuid.New().String()
	}

	if a.ActorType == "" {
		a.ActorType = ActorUser
	}

	if a.Timestamp.IsZero() {
		a.Timestamp = time.Now().UTC()
	}

	if a.Metadata == nil {
		a.Metadata = map[string]any{}
	}
}

func (a *AccessLog) Validate() error {
	if a.ProjectID == "" {
		return errors.New("project_id is required")
	}
	if a.ActorID == "" {
		return errors.New("actor_id is required")
	}
	if a.ActorType == "" {
		return errors.New("actor_type is required")
	}
	if a.Action == "" {
		return errors.New("action is required")
	}
	if a.Outcome == "" {
		return errors.New("outcome is required")
	}

	switch a.ActorType {
	case ActorUser, ActorService, ActorSystem, ActorAPIKey, ActorCustom:
	default:
		return errors.New("invalid actor_type")
	}

	return nil
}

type AccessLogFilter struct {
	SharedFilter

	ProjectID string     `json:"project_id"`
	ActorID   string     `json:"actor_id"`
	ActorType *ActorType `json:"actor_type"`

	Action       string `json:"action"`
	ResourceType string `json:"resource_type"`
	ResourceID   string `json:"resource_id"`

	Outcome *AccessOutcome `json:"outcome"`
	Search  string         `json:"search"`

	FromDate *time.Time `json:"from_date"`
	ToDate   *time.Time `json:"to_date"`
}
