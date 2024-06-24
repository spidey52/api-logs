package utils

import (
	"context"
	"log_manager/config"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Model struct {
	*mongo.Collection
}

var NotificationLogModel = Model{
	config.USERDB.Collection("notification_logs"),
}

var ApiLogModel = Model{
	config.DB.Collection("api_logs"),
}

var UserModel = Model{
	config.USERDB.Collection("users"),
}

func (m *Model) FindAll(filter bson.M, opt *options.FindOptions) ([]bson.M, error) {

	cursor, err := m.Find(context.Background(), filter, opt)

	if err != nil {
		return nil, err
	}

	var data []bson.M = make([]bson.M, 0)

	if err = cursor.All(context.Background(), &data); err != nil {
		return nil, err
	}

	// fmt.Println("Data: ", data)

	return data, nil
}
