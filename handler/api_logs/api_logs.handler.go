package api_logs_handler

import (
	"context"
	"fmt"
	"log_manager/utils"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func GetApiLogs(c *gin.Context) {

	paginationData := utils.GetQueryData(c)
	status := c.Query("status")
	method := c.Query("method")
	sortKey := c.Query("sortKey")
	// sortValue := c.Query("sortValue")

	filter := bson.M{}

	if status != "" {
		statusInt, err := strconv.Atoi(status)
		if err != nil {
			fmt.Println("Error in parsing status")
		}

		filter["status"] = statusInt
	}

	if method != "" {
		filter["method"] = method
	}

	if paginationData.Search != "" {
		filter["url"] = bson.M{"$regex": paginationData.Search, "$options": "i"}
	}

	if !paginationData.StartDate.IsZero() && !paginationData.EndDate.IsZero() {
		filter["createdAt"] = bson.M{"$gte": paginationData.StartDate, "$lte": paginationData.EndDate}
	}

	options := utils.GetPaginatedOptions(paginationData, nil)

	options.SetSort(bson.M{"createdAt": -1})

	if sortKey != "" {
		options.SetSort(bson.M{sortKey: -1})
	}

	options.SetProjection(bson.M{
		"baseUrl":   1,
		"url":       1,
		"method":    1,
		"status":    1,
		"duration":  1,
		"createdAt": 1,
		"updatedAt": 1,
		"user":      1,
	})

	logs, err := utils.ApiLogModel.FindAll(filter, options)

	if err != nil {
		c.IndentedJSON(500, gin.H{
			"message": "Error in getting the logs\n" + err.Error(),
		})
		return
	}

	userIds := []primitive.ObjectID{}

	for _, log := range logs {
		userId, ok := log["user"].(primitive.ObjectID)

		if ok {
			userIds = append(userIds, userId)
		}
	}

	userMap := utils.GetPopulatedUserMap(utils.GetPopulatedUsersByIds(userIds))

	for i, log := range logs {
		userId, ok := log["user"].(primitive.ObjectID)

		if ok {
			user, ok := userMap[userId]

			if ok {
				logs[i]["user"] = user
			}
		}
	}

	count, err := utils.ApiLogModel.CountDocuments(context.Background(), filter)

	if err != nil {
		c.IndentedJSON(500, gin.H{
			"message": "Error in getting the count\n" + err.Error(),
		})
		return
	}

	c.IndentedJSON(200, gin.H{
		"logs":  logs,
		"count": count,
	})
}

func GetLogDetails(c *gin.Context) {
	id := c.Param("id")

	logId, err := primitive.ObjectIDFromHex(id)

	if err != nil {
		c.IndentedJSON(400, gin.H{
			"message": "Invalid log id, please provide a valid log id",
		})
		return
	}

	filter := bson.M{"_id": logId}

	var result bson.M

	err = utils.ApiLogModel.FindOne(context.Background(), filter, options.FindOne()).Decode(&result)

	if err != nil {
		c.IndentedJSON(404, gin.H{
			"message": "Log not found",
		})
		return
	}

	c.IndentedJSON(200, gin.H{
		"log": result,
	})
}
