package mongodb

import (
	"context"

	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/output"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type userRepository struct {
	collection *mongo.Collection
}

// NewUserRepository creates a new MongoDB user repository
func NewUserRepository(client *Client) output.UserRepository {
	return &userRepository{
		collection: client.Collection(CollectionUsers),
	}
}

func (r *userRepository) Create(ctx context.Context, user *domain.User) error {
	doc := userToDocument(user)
	_, err := r.collection.InsertOne(ctx, doc)
	return err
}

func (r *userRepository) FindByID(ctx context.Context, id string) (*domain.User, error) {
	filter := bson.M{"_id": id}

	var doc userDocument
	err := r.collection.FindOne(ctx, filter).Decode(&doc)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}

	return documentToUser(&doc), nil
}

func (r *userRepository) FindByIdentifier(ctx context.Context, identifier string, projectID string) (*domain.User, error) {
	filter := bson.M{"identifier": identifier, "project_id": projectID}

	var doc userDocument
	err := r.collection.FindOne(ctx, filter).Decode(&doc)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}

	return documentToUser(&doc), nil
}

func (r *userRepository) Update(ctx context.Context, user *domain.User) error {
	filter := bson.M{"_id": user.ID}
	update := bson.M{
		"$set": bson.M{
			"name":       user.Name,
			"identifier": user.Identifier,
			"metadata":   user.Metadata,
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return domain.ErrUserNotFound
	}

	return nil
}

func (r *userRepository) Delete(ctx context.Context, id string) error {
	filter := bson.M{"_id": id}

	result, err := r.collection.DeleteOne(ctx, filter)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return domain.ErrUserNotFound
	}

	return nil
}

func (r *userRepository) List(ctx context.Context, page, pageSize int) ([]*domain.User, int, error) {
	skip := (page - 1) * pageSize
	opts := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(pageSize)).
		SetSort(bson.M{"created_at": -1})

	cursor, err := r.collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var users = []*domain.User{}
	for cursor.Next(ctx) {
		var doc userDocument
		if err := cursor.Decode(&doc); err != nil {
			return nil, 0, err
		}
		users = append(users, documentToUser(&doc))
	}

	if err := cursor.Err(); err != nil {
		return nil, 0, err
	}

	// Get total count
	total, err := r.collection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return users, 0, err
	}

	return users, int(total), nil
}

func (r *userRepository) GetUserMap(ctx context.Context, ids []string) (map[string]*domain.User, error) {
	filter := bson.M{"_id": bson.M{"$in": ids}}
	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	userMap := make(map[string]*domain.User)
	for cursor.Next(ctx) {
		var doc userDocument
		if err := cursor.Decode(&doc); err != nil {
			return nil, err
		}
		user := documentToUser(&doc)
		userMap[user.ID] = user
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return userMap, nil
}
