package notification_log_handler

import (
	"context"
	"log_manager/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func GetNotificationLogs(c *gin.Context) {
	paginationData := utils.GetQueryData(c)
	status := c.Query("status")
	sortKey := c.Query("sortKey")

	filter := bson.M{}

	if status != "" {
		filter["status"] = status
	}

	if paginationData.Search != "" {
		filter["phone"] = bson.M{"$regex": paginationData.Search, "$options": "i"}
	}

	if !paginationData.StartDate.IsZero() && !paginationData.EndDate.IsZero() {
		filter["createdAt"] = bson.M{"$gte": paginationData.StartDate, "$lte": paginationData.EndDate}
	}

	options := utils.GetPaginatedOptions(paginationData, nil)

	options.SetSort(bson.M{"createdAt": -1})

	if sortKey != "" {
		options.SetSort(bson.M{sortKey: -1})
	}

	logs, err := utils.NotificationLogModel.FindAll(filter, options)

	if err != nil {
		c.IndentedJSON(500, gin.H{
			"message": "Error in getting the logs\n" + err.Error(),
		})
		return
	}

	count, err := utils.NotificationLogModel.CountDocuments(context.Background(), filter)

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
