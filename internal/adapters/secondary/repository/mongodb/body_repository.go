package mongodb

import (
	"context"

	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/output"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// bodyRepository implements APILogBodyRepository interface
type bodyRepository struct {
	collection *mongo.Collection
}

// NewBodyRepository creates a new MongoDB body repository
func NewBodyRepository(client *Client) output.APILogBodyRepository {
	return &bodyRepository{
		collection: client.Collection(CollectionAPILogBodies),
	}
}

// Create stores request/response bodies for a log
func (r *bodyRepository) Create(ctx context.Context, body *domain.APILogBody) error {
	doc := bodyToDocument(body)
	_, err := r.collection.InsertOne(ctx, doc)
	return err
}

// FindByLogID retrieves body by log ID
func (r *bodyRepository) FindByLogID(ctx context.Context, logID string) (*domain.APILogBody, error) {
	filter := bson.M{"log_id": logID}
	var doc apiLogBodyDocument

	err := r.collection.FindOne(ctx, filter).Decode(&doc)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, domain.ErrBodyNotFound
		}
		return nil, err
	}

	return documentToBody(&doc), nil
}

// Delete removes body by log ID
func (r *bodyRepository) Delete(ctx context.Context, logID string) error {
	filter := bson.M{"log_id": logID}
	_, err := r.collection.DeleteOne(ctx, filter)
	return err
}

// DeleteBatch removes bodies for multiple log IDs
func (r *bodyRepository) DeleteBatch(ctx context.Context, logIDs []string) error {
	filter := bson.M{"log_id": bson.M{"$in": logIDs}}
	_, err := r.collection.DeleteMany(ctx, filter)
	return err
}
