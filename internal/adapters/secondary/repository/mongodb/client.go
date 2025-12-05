package mongodb

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

const (
	// Collection names
	CollectionProjects      = "projects"
	CollectionAPILogs       = "api_logs"
	CollectionAPILogHeaders = "api_log_headers"
	CollectionAPILogBodies  = "api_log_bodies"
	CollectionUsers         = "users"

	// TTL durations
	LogsTTLDays    = 30
	HeadersTTLDays = 30
	BodiesTTLDays  = 14
)

// Client wraps MongoDB client and database
type Client struct {
	client *mongo.Client
	db     *mongo.Database
}

// NewClient creates a new MongoDB client
func NewClient(ctx context.Context, uri, dbName string) (*Client, error) {
	// Set client options
	clientOptions := options.Client().ApplyURI(uri)
	clientOptions.SetMaxPoolSize(100)
	clientOptions.SetMinPoolSize(10)

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, err
	}

	// Ping the database
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		return nil, err
	}

	db := client.Database(dbName)

	return &Client{
		client: client,
		db:     db,
	}, nil
}

// Close closes the MongoDB connection
func (c *Client) Close(ctx context.Context) error {
	return c.client.Disconnect(ctx)
}

// Database returns the database instance
func (c *Client) Database() *mongo.Database {
	return c.db
}

// Collection returns a collection by name
func (c *Client) Collection(name string) *mongo.Collection {
	return c.db.Collection(name)
}

// CreateIndexes creates all required indexes for collections
func (c *Client) CreateIndexes(ctx context.Context) error {
	// Projects indexes
	projectsCol := c.Collection(CollectionProjects)
	_, err := projectsCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "api_key", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "environment", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "created_at", Value: -1}},
		},
	})
	if err != nil {
		return err
	}

	// API Logs indexes
	logsCol := c.Collection(CollectionAPILogs)
	_, err = logsCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "project_id", Value: 1},
				{Key: "timestamp", Value: -1},
			},
		},
		{
			Keys: bson.D{{Key: "environment", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "status_code", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "method", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "user_id", Value: 1}},
		},
		{
			Keys:    bson.D{{Key: "timestamp", Value: 1}},
			Options: options.Index().SetExpireAfterSeconds(int32(LogsTTLDays * 24 * 60 * 60)),
		},
	})
	if err != nil {
		return err
	}

	// Headers indexes
	headersCol := c.Collection(CollectionAPILogHeaders)
	_, err = headersCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "log_id", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "created_at", Value: 1}},
			Options: options.Index().SetExpireAfterSeconds(int32(HeadersTTLDays * 24 * 60 * 60)),
		},
	})
	if err != nil {
		return err
	}

	// Bodies indexes
	bodiesCol := c.Collection(CollectionAPILogBodies)
	_, err = bodiesCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "log_id", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "created_at", Value: 1}},
			Options: options.Index().SetExpireAfterSeconds(int32(BodiesTTLDays * 24 * 60 * 60)),
		},
	})
	if err != nil {
		return err
	}

	// Users indexes
	usersCol := c.Collection(CollectionUsers)
	_, err = usersCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "identifier", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "email", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "created_at", Value: -1}},
		},
	})
	if err != nil {
		return err
	}

	return nil
}
