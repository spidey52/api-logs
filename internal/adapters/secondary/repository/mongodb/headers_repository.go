package mongodb

import (
	"context"

	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/output"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// headersRepository implements APILogHeadersRepository interface
type headersRepository struct {
	collection *mongo.Collection
}

// NewHeadersRepository creates a new MongoDB headers repository
func NewHeadersRepository(client *Client) output.APILogHeadersRepository {
	return &headersRepository{
		collection: client.Collection(CollectionAPILogHeaders),
	}
}

// Create stores headers for a log
func (r *headersRepository) Create(ctx context.Context, headers *domain.APILogHeaders) error {
	doc := headersToDocument(headers)
	_, err := r.collection.InsertOne(ctx, doc)
	return err
}

// FindByLogID retrieves headers by log ID
func (r *headersRepository) FindByLogID(ctx context.Context, logID string) (*domain.APILogHeaders, error) {
	filter := bson.M{"log_id": logID}
	var doc apiLogHeadersDocument

	err := r.collection.FindOne(ctx, filter).Decode(&doc)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, domain.ErrHeadersNotFound
		}
		return nil, err
	}

	return documentToHeaders(&doc), nil
}

// Delete removes headers by log ID
func (r *headersRepository) Delete(ctx context.Context, logID string) error {
	filter := bson.M{"log_id": logID}
	_, err := r.collection.DeleteOne(ctx, filter)
	return err
}

// DeleteBatch removes headers for multiple log IDs
func (r *headersRepository) DeleteBatch(ctx context.Context, logIDs []string) error {
	filter := bson.M{"log_id": bson.M{"$in": logIDs}}
	_, err := r.collection.DeleteMany(ctx, filter)
	return err
}
