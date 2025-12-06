package mongodb

import (
	"context"

	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/output"
	"github.com/spidey52/api-logs/pkg/logger"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// apiLogRepository implements APILogRepository interface
type apiLogRepository struct {
	collection *mongo.Collection
}

// NewAPILogRepository creates a new MongoDB API log repository
func NewAPILogRepository(client *Client) output.APILogRepository {
	return &apiLogRepository{
		collection: client.Collection(CollectionAPILogs),
	}
}

// Create stores a new API log entry
func (r *apiLogRepository) Create(ctx context.Context, log *domain.APILog) error {
	doc := apiLogToDocument(log)
	_, err := r.collection.InsertOne(ctx, doc)
	return err
}

// FindByID retrieves a log by ID
func (r *apiLogRepository) FindByID(ctx context.Context, id string) (*domain.APILog, error) {
	filter := bson.M{"_id": id}
	var doc apiLogDocument

	err := r.collection.FindOne(ctx, filter).Decode(&doc)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, domain.ErrLogNotFound
		}
		return nil, err
	}

	return documentToAPILog(&doc), nil
}

// FindByFilter retrieves logs based on filter criteria
func (r *apiLogRepository) FindByFilter(ctx context.Context, filter domain.LogFilter) ([]*domain.APILog, error) {
	mongoFilter := bson.M{}

	if filter.ProjectID != "" {
		mongoFilter["project_id"] = filter.ProjectID
	}

	if filter.Environment != "" {
		mongoFilter["environment"] = filter.Environment
	}

	if filter.Method != "" {
		mongoFilter["method"] = filter.Method
	}

	// Handle status code filtering (exact, min/max range)
	if filter.StatusCode != nil {
		// Exact status code
		mongoFilter["status_code"] = *filter.StatusCode
	} else if filter.StatusCodeMin != nil || filter.StatusCodeMax != nil {
		// Status code range
		statusFilter := bson.M{}
		if filter.StatusCodeMin != nil {
			statusFilter["$gte"] = *filter.StatusCodeMin
		}
		if filter.StatusCodeMax != nil {
			statusFilter["$lte"] = *filter.StatusCodeMax
		}
		mongoFilter["status_code"] = statusFilter
	}

	if filter.Path != "" {
		mongoFilter["path"] = bson.M{"$regex": filter.Path, "$options": "i"}
	}

	if filter.Search != "" {
		// Search in path, user_name, user_agent, or ip_address
		mongoFilter["$or"] = []bson.M{
			{"path": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"user_name": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"user_agent": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"ip_address": bson.M{"$regex": filter.Search, "$options": "i"}},
		}
	}

	logger.Info("environment", mongoFilter["environment"])

	if filter.FromDate != nil || filter.ToDate != nil {
		timeFilter := bson.M{}
		if filter.FromDate != nil {
			timeFilter["$gte"] = *filter.FromDate
		}
		if filter.ToDate != nil {
			timeFilter["$lte"] = *filter.ToDate
		}
		mongoFilter["timestamp"] = timeFilter
	}

	opts := options.Find().
		SetLimit(int64(filter.Limit)).
		SetSkip(int64(filter.Offset)).
		SetSort(bson.D{{Key: "timestamp", Value: -1}})

	cursor, err := r.collection.Find(ctx, mongoFilter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var docs []apiLogDocument
	if err := cursor.All(ctx, &docs); err != nil {
		return nil, err
	}

	logs := make([]*domain.APILog, len(docs))
	for i, doc := range docs {
		logs[i] = documentToAPILog(&doc)
	}

	return logs, nil
}

// Delete removes a log by ID
func (r *apiLogRepository) Delete(ctx context.Context, id string) error {
	filter := bson.M{"_id": id}

	result, err := r.collection.DeleteOne(ctx, filter)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return domain.ErrLogNotFound
	}

	return nil
}

// CountByProject counts logs for a specific project
func (r *apiLogRepository) CountByProject(ctx context.Context, projectID string, environment domain.Environment) (int64, error) {
	filter := bson.M{
		"project_id":  projectID,
		"environment": string(environment),
	}

	return r.collection.CountDocuments(ctx, filter)
}

// CountByFilter counts logs matching the filter criteria
func (r *apiLogRepository) CountByFilter(ctx context.Context, filter domain.LogFilter) (int64, error) {
	mongoFilter := bson.M{}

	if filter.ProjectID != "" {
		mongoFilter["project_id"] = filter.ProjectID
	}

	if filter.Environment != "" {
		mongoFilter["environment"] = filter.Environment
	}

	if filter.Method != "" {
		mongoFilter["method"] = filter.Method
	}

	// Handle status code filtering (exact, min/max range)
	if filter.StatusCode != nil {
		// Exact status code
		mongoFilter["status_code"] = *filter.StatusCode
	} else if filter.StatusCodeMin != nil || filter.StatusCodeMax != nil {
		// Status code range
		statusFilter := bson.M{}
		if filter.StatusCodeMin != nil {
			statusFilter["$gte"] = *filter.StatusCodeMin
		}
		if filter.StatusCodeMax != nil {
			statusFilter["$lte"] = *filter.StatusCodeMax
		}
		mongoFilter["status_code"] = statusFilter
	}

	if filter.Path != "" {
		mongoFilter["path"] = bson.M{"$regex": filter.Path, "$options": "i"}
	}

	if filter.Search != "" {
		// Search in path, user_name, user_agent, or ip_address
		mongoFilter["$or"] = []bson.M{
			{"path": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"user_name": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"user_agent": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"ip_address": bson.M{"$regex": filter.Search, "$options": "i"}},
		}
	}

	if filter.FromDate != nil || filter.ToDate != nil {
		timeFilter := bson.M{}
		if filter.FromDate != nil {
			timeFilter["$gte"] = *filter.FromDate
		}
		if filter.ToDate != nil {
			timeFilter["$lte"] = *filter.ToDate
		}
		mongoFilter["timestamp"] = timeFilter
	}

	return r.collection.CountDocuments(ctx, mongoFilter)
}

// GetStatusCodeDistribution returns distribution of status codes
func (r *apiLogRepository) GetStatusCodeDistribution(ctx context.Context, projectID string, environment domain.Environment) (map[int]int64, error) {
	filter := bson.M{
		"project_id":  projectID,
		"environment": string(environment),
	}

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: filter}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$status_code",
			"count": bson.M{"$sum": 1},
		}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	distribution := make(map[int]int64)
	for cursor.Next(ctx) {
		var result struct {
			StatusCode int   `bson:"_id"`
			Count      int64 `bson:"count"`
		}
		if err := cursor.Decode(&result); err != nil {
			continue
		}
		distribution[result.StatusCode] = result.Count
	}

	return distribution, nil
}

// GetAverageResponseTime returns average response time
func (r *apiLogRepository) GetAverageResponseTime(ctx context.Context, projectID string, environment domain.Environment) (float64, error) {
	filter := bson.M{
		"project_id":  projectID,
		"environment": string(environment),
	}

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: filter}},
		{{Key: "$group", Value: bson.M{
			"_id": nil,
			"avg": bson.M{"$avg": "$response_time_ms"},
		}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return 0, err
	}
	defer cursor.Close(ctx)

	if cursor.Next(ctx) {
		var result struct {
			Avg float64 `bson:"avg"`
		}
		if err := cursor.Decode(&result); err != nil {
			return 0, err
		}
		return result.Avg, nil
	}

	return 0, nil
}

// GetTimeSeriesStats returns request count grouped by hour for last 24 hours
func (r *apiLogRepository) GetTimeSeriesStats(ctx context.Context, projectID string, environment domain.Environment) ([]map[string]interface{}, error) {
	filter := bson.M{
		"project_id":  projectID,
		"environment": string(environment),
	}

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: filter}},
		{{Key: "$group", Value: bson.M{
			"_id": bson.M{
				"year":  bson.M{"$year": "$timestamp"},
				"month": bson.M{"$month": "$timestamp"},
				"day":   bson.M{"$dayOfMonth": "$timestamp"},
				"hour":  bson.M{"$hour": "$timestamp"},
			},
			"count":     bson.M{"$sum": 1},
			"timestamp": bson.M{"$first": "$timestamp"},
		}}},
		{{Key: "$sort", Value: bson.M{"timestamp": 1}}},
		{{Key: "$limit", Value: 24}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []map[string]interface{}
	for cursor.Next(ctx) {
		var result bson.M
		if err := cursor.Decode(&result); err != nil {
			continue
		}
		results = append(results, result)
	}

	return results, nil
}

// GetTopEndpoints returns top N most requested endpoints
func (r *apiLogRepository) GetTopEndpoints(ctx context.Context, projectID string, environment domain.Environment, limit int) ([]map[string]interface{}, error) {
	filter := bson.M{
		"project_id":  projectID,
		"environment": string(environment),
	}

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: filter}},
		{{Key: "$group", Value: bson.M{
			"_id":               "$path",
			"count":             bson.M{"$sum": 1},
			"method":            bson.M{"$first": "$method"},
			"avg_response_time": bson.M{"$avg": "$response_time_ms"},
		}}},
		{{Key: "$sort", Value: bson.M{"count": -1}}},
		{{Key: "$limit", Value: limit}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []map[string]interface{}
	for cursor.Next(ctx) {
		var result bson.M
		if err := cursor.Decode(&result); err != nil {
			continue
		}
		results = append(results, result)
	}

	return results, nil
}

// GetMethodDistribution returns distribution of HTTP methods
func (r *apiLogRepository) GetMethodDistribution(ctx context.Context, projectID string, environment domain.Environment) (map[string]int64, error) {
	filter := bson.M{
		"project_id":  projectID,
		"environment": string(environment),
	}

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: filter}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$method",
			"count": bson.M{"$sum": 1},
		}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	distribution := make(map[string]int64)
	for cursor.Next(ctx) {
		var result struct {
			Method string `bson:"_id"`
			Count  int64  `bson:"count"`
		}
		if err := cursor.Decode(&result); err != nil {
			continue
		}
		distribution[result.Method] = result.Count
	}

	return distribution, nil
}

// GetUniquePaths returns list of unique paths for autocomplete
func (r *apiLogRepository) GetUniquePaths(ctx context.Context, projectID string, environment domain.Environment) ([]string, error) {
	filter := bson.M{
		"project_id":  projectID,
		"environment": string(environment),
	}

	// Use distinct to get unique paths
	paths, err := r.collection.Distinct(ctx, "path", filter)
	if err != nil {
		return nil, err
	}

	// Convert []interface{} to []string
	result := make([]string, 0, len(paths))
	for _, path := range paths {
		if pathStr, ok := path.(string); ok {
			result = append(result, pathStr)
		}
	}

	return result, nil
}
