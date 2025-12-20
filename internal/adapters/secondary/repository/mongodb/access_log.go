package mongodb

import (
	"context"

	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/output"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type mongoAccessLogRepository struct {
	collection *mongo.Collection
}

func NewMongoAccessLogRepository(client *Client) output.AccessLogRepository {
	return &mongoAccessLogRepository{
		collection: client.Collection(CollectionAccessLogs),
	}
}

var _ output.AccessLogRepository = (*mongoAccessLogRepository)(nil)

func buildAccessLogFilterBSON(filter domain.AccessLogFilter) bson.M {
	bsonFilter := bson.M{}

	if filter.ProjectID != "" {
		bsonFilter["project_id"] = filter.ProjectID
	}

	if filter.ActorID != "" {
		bsonFilter["actor_id"] = filter.ActorID
	}

	if filter.Action != "" {
		bsonFilter["action"] = filter.Action
	}

	if filter.ResourceType != "" {
		bsonFilter["resource_type"] = filter.ResourceType
	}

	if filter.ResourceID != "" {
		bsonFilter["resource_id"] = filter.ResourceID
	}

	if filter.Search != "" {
		bsonFilter["$text"] = bson.M{"$search": filter.Search}
	}

	if filter.FromDate != nil || filter.ToDate != nil {
		dateFilter := bson.M{}
		if filter.FromDate != nil {
			dateFilter["$gte"] = *filter.FromDate
		}
		if filter.ToDate != nil {
			dateFilter["$lte"] = *filter.ToDate
		}
		bsonFilter["timestamp"] = dateFilter
	}

	return bsonFilter
}

// CountByFilter implements output.AccessLogRepository.
func (m *mongoAccessLogRepository) CountByFilter(ctx context.Context, filter domain.AccessLogFilter) (int64, error) {
	bsonFilter := buildAccessLogFilterBSON(filter)
	return m.collection.CountDocuments(ctx, bsonFilter)
}

// Create implements output.AccessLogRepository.
func (m *mongoAccessLogRepository) Create(ctx context.Context, log *domain.AccessLog) error {
	_, err := m.collection.InsertOne(ctx, log)
	return err
}

// CreateMany implements output.AccessLogRepository.
func (m *mongoAccessLogRepository) CreateMany(ctx context.Context, logs []*domain.AccessLog) error {
	var docs []any

	for _, log := range logs {
		docs = append(docs, log)
	}

	_, err := m.collection.InsertMany(ctx, docs)

	return err
}

// DeleteByFilter implements output.AccessLogRepository.
func (m *mongoAccessLogRepository) DeleteByFilter(ctx context.Context, filter domain.AccessLogFilter) (int64, error) {
	bsonFilter := buildAccessLogFilterBSON(filter)
	result, err := m.collection.DeleteMany(ctx, bsonFilter)

	if err != nil {
		return result.DeletedCount, err
	}

	return result.DeletedCount, nil

}

// DeleteByID implements output.AccessLogRepository.
func (m *mongoAccessLogRepository) DeleteByID(ctx context.Context, id string) error {
	_, err := m.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

// FindByFilter implements output.AccessLogRepository.
func (m *mongoAccessLogRepository) FindByFilter(ctx context.Context, filter domain.AccessLogFilter) ([]*domain.AccessLog, error) {
	var logs []*domain.AccessLog

	bsonFilter := buildAccessLogFilterBSON(filter)

	cursor, err := m.collection.Find(ctx, bsonFilter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &logs)

	if err != nil {
		return nil, err
	}

	return logs, nil
}

// FindByID implements output.AccessLogRepository.
func (m *mongoAccessLogRepository) FindByID(ctx context.Context, id string) (*domain.AccessLog, error) {
	var log domain.AccessLog

	err := m.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&log)

	if err != nil {
		return nil, err
	}

	return &log, nil
}
