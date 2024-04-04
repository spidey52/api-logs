package utils

import (
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type PopulatedUser struct {
	ID     primitive.ObjectID `json:"_id" bson:"_id,omitempty"`
	Name   string             `json:"name" bson:"name,omitempty"`
	CpCode string             `json:"cp_code" bson:"cp_code,omitempty"`
	Phone  string             `json:"phone" bson:"phone,omitempty"`
}

func GetPopulatedUserMap(users []PopulatedUser) map[primitive.ObjectID]PopulatedUser {
	userMap := make(map[primitive.ObjectID]PopulatedUser)

	for _, user := range users {
		userMap[user.ID] = user
	}

	return userMap
}

func GetPopulatedUsersByIds(userIds []primitive.ObjectID) []PopulatedUser {

	userOptions := options.FindOptions{}

	userOptions.SetProjection(bson.M{
		"name":    1,
		"cp_code": 1,
		"phone":   1,
	})

	users, err := UserModel.FindAll(bson.M{"_id": bson.M{"$in": userIds}}, &userOptions)

	if err != nil {
		return []PopulatedUser{}
	}

	populatedUsers := make([]PopulatedUser, 0)

	for _, user := range users {
		populatedUsers = append(populatedUsers, PopulatedUser{
			ID:     user["_id"].(primitive.ObjectID),
			Name:   user["name"].(string),
			CpCode: user["cp_code"].(string),
			Phone:  user["phone"].(string),
		})
	}

	return populatedUsers
}
