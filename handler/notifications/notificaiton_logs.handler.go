package notification_log_handler

import (
	"context"
	"fmt"
	"log"
	"log_manager/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

var templateMap = map[string]string{}

func init() {
	templateMap["notification_bucket"] = "#FF0000"
	templateMap["notification_order"] = "#007bff"
	templateMap["notification_order_vehicle"] = "#800080"
	templateMap["notification_vehicle_parked_in"] = "#008000"
	templateMap["notification_vehicle_request"] = "#FFA500"
}

func GetNotificationLogs(c *gin.Context) {
	paginationData := utils.GetQueryData(c)
	status := c.Query("status")
	template := c.Query("template")
	sortKey := c.Query("sortKey")

	filter := bson.M{}

	if status != "" {
		filter["status"] = status
	}

	if template != "" {
		filter["template"] = template
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

func getConditionAggregation(field, value, fulfilled, rest any) bson.M {
	return bson.M{
		"$cond": bson.M{
			"if":   bson.M{"$eq": []interface{}{fmt.Sprintf("$%s", field), value}},
			"then": fulfilled,
			"else": rest,
		},
	}
}

func GetDailyNotificationCount(c *gin.Context) {

	paginationData := utils.GetQueryData(c)

	pipeline := []bson.M{}

	if !paginationData.StartDate.IsZero() && !paginationData.EndDate.IsZero() {
		pipeline = append(pipeline, bson.M{
			"$match": bson.M{
				"createdAt": bson.M{"$gte": paginationData.StartDate, "$lte": paginationData.EndDate},
			},
		})
	}

	pipeline = append(pipeline, bson.M{
		"$group": bson.M{
			"_id": bson.M{
				"date":     bson.M{"$dateToString": bson.M{"format": "%Y-%m-%d", "date": "$createdAt", "timezone": "+05:30"}},
				"template": "$template",
			},
			// "count": bson.M{"$sum": 1},
			"count":         bson.M{"$sum": 1},
			"failed_count":  bson.M{"$sum": getConditionAggregation("status", "FAILED", 1, 0)},
			"success_count": bson.M{"$sum": getConditionAggregation("status", "SENT", 1, 0)},
		},
	})

	pipeline = append(pipeline, bson.M{
		"$project": bson.M{
			"date":          "$_id.date",
			"template":      "$_id.template",
			"count":         1,
			"failed_count":  1,
			"success_count": 1,
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
		Date         string `json:"date" bson:"date"`
		Template     string `json:"template"  bson:"template"`
		Count        int32  `json:"count" bson:"count"`
		FailedCount  int32  `json:"failed_count" bson:"failed_count"`
		SuccessCount int32  `json:"success_count" bson:"success_count"`

		TemplateColor string `json:"template_color"`
	}

	var res []NotificationCount

	err = result.All(context.Background(), &res)

	if err != nil {
		log.Println("Error in getting the daily notification count\n", err)
		return
	}

	for i, r := range res {
		res[i].TemplateColor = templateMap[r.Template]
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
