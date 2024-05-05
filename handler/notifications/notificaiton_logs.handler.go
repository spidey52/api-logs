package notification_log_handler

import (
	"context"
	"log"
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

func GetDailyNotificationCount(c *gin.Context) {
	pipeline := []bson.M{}

	pipeline = append(pipeline, bson.M{
		"$group": bson.M{
			"_id": bson.M{
				"date":     bson.M{"$dateToString": bson.M{"format": "%Y-%m-%d", "date": "$createdAt", "timezone": "+05:30"}},
				"template": "$template",
			},
			"count": bson.M{"$sum": 1},
		},
	})

	pipeline = append(pipeline, bson.M{
		"$project": bson.M{
			"date":     "$_id.date",
			"template": "$_id.template",
			"count":    "$count",
		},
	})

	pipeline = append(pipeline, bson.M{
		"$sort": bson.M{
			"date": -1,
		},
	})

	result, err := utils.NotificationLogModel.Aggregate(context.Background(), pipeline)

	if err != nil {
		log.Println("Error in getting the daily notification count\n", err)
		return
	}

	type NotificationCount struct {
		Date     string `json:"date" bson:"date"`
		Template string `json:"template"  bson:"template"`
		Count    int32  `json:"count" bson:"count"`
	}

	var res []NotificationCount

	err = result.All(context.Background(), &res)

	if err != nil {
		log.Println("Error in getting the daily notification count\n", err)
		return
	}

	c.IndentedJSON(200, gin.H{
		"logs": res,
	})

}

func GetNotificationTemplates(c *gin.Context) {
	result, err := utils.NotificationLogModel.Distinct(context.Background(), "template", bson.M{})

	if err != nil {
		c.IndentedJSON(500, gin.H{
			"message": "Error in getting the notification types\n" + err.Error(),
		})
		return
	}

	c.IndentedJSON(200, gin.H{
		"templates": result,
	})

}
