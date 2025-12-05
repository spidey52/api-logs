package mongodb

import (
	"context"

	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/output"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// projectRepository implements ProjectRepository interface
type projectRepository struct {
	collection *mongo.Collection
}

// NewProjectRepository creates a new MongoDB project repository
func NewProjectRepository(client *Client) output.ProjectRepository {
	return &projectRepository{
		collection: client.Collection(CollectionProjects),
	}
}

// Create stores a new project
func (r *projectRepository) Create(ctx context.Context, project *domain.Project) error {
	doc := projectToDocument(project)
	_, err := r.collection.InsertOne(ctx, doc)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return domain.ErrDuplicateAPIKey
		}
		return err
	}
	return nil
}

// FindByID retrieves a project by ID
func (r *projectRepository) FindByID(ctx context.Context, id string) (*domain.Project, error) {
	filter := bson.M{"_id": id}
	var doc projectDocument

	err := r.collection.FindOne(ctx, filter).Decode(&doc)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, domain.ErrProjectNotFound
		}
		return nil, err
	}

	return documentToProject(&doc), nil
}

// FindByAPIKey retrieves a project by API key
func (r *projectRepository) FindByAPIKey(ctx context.Context, apiKey string) (*domain.Project, error) {
	filter := bson.M{"api_key": apiKey}
	var doc projectDocument

	err := r.collection.FindOne(ctx, filter).Decode(&doc)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, domain.ErrProjectNotFound
		}
		return nil, err
	}

	return documentToProject(&doc), nil
}

// FindAll retrieves projects based on filter criteria
func (r *projectRepository) FindAll(ctx context.Context, filter domain.ProjectFilter) ([]*domain.Project, error) {
	mongoFilter := bson.M{}

	if filter.Environment != "" {
		mongoFilter["environment"] = filter.Environment
	}

	if filter.IsActive != nil {
		mongoFilter["is_active"] = *filter.IsActive
	}

	opts := options.Find().
		SetLimit(int64(filter.Limit)).
		SetSkip(int64(filter.Offset)).
		SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := r.collection.Find(ctx, mongoFilter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var docs []projectDocument
	if err := cursor.All(ctx, &docs); err != nil {
		return nil, err
	}

	projects := make([]*domain.Project, len(docs))
	for i, doc := range docs {
		projects[i] = documentToProject(&doc)
	}

	return projects, nil
}

// Update updates an existing project
func (r *projectRepository) Update(ctx context.Context, project *domain.Project) error {
	filter := bson.M{"_id": project.ID}
	update := bson.M{
		"$set": bson.M{
			"name":        project.Name,
			"description": project.Description,
			"api_key":     project.APIKey,
			"environment": project.Environment,
			"is_active":   project.IsActive,
			"updated_at":  project.UpdatedAt,
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return domain.ErrProjectNotFound
	}

	return nil
}

// Delete removes a project by ID
func (r *projectRepository) Delete(ctx context.Context, id string) error {
	filter := bson.M{"_id": id}

	result, err := r.collection.DeleteOne(ctx, filter)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return domain.ErrProjectNotFound
	}

	return nil
}

// ExistsByAPIKey checks if an API key already exists
func (r *projectRepository) ExistsByAPIKey(ctx context.Context, apiKey string) (bool, error) {
	filter := bson.M{"api_key": apiKey}
	count, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
