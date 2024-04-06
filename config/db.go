package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var DB = connectDB()

func connectDB() *mongo.Database {
	if err := godotenv.Load(); err != nil {
		log.Println("Error loading .env file")
	}

	mongoUri := os.Getenv("MONGODB_URI")

	if mongoUri == "" {
		log.Fatal("MONGODB_URI is not set")
	}

	// create a new  client options
	options := options.Client()

	// connection options
	options.ApplyURI(mongoUri)
	options.SetMaxPoolSize(1000)
	options.SetMinPoolSize(10)
	options.SetAppName("log_manager")

	client, err := mongo.Connect(context.TODO(), options)

	if err != nil {
		fmt.Println("Error in connecting to the database: ", err)
	}

	dbName := mongoUri[strings.LastIndex(mongoUri, "/")+1:]
	dbName = strings.Split(dbName, "?")[0]

	fmt.Println(("Connected to the database: " + mongoUri))

	if dbName == "" {
		log.Fatal("Database name not found in the MONGODB_URI")
	}

	db := client.Database(dbName)

	return db

}
