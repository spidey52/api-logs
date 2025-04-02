package api_logs_handler

import (
	"cmp"
	"context"
	"log_manager/utils"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func getUserIdFilter(userId string) (bson.M, error) {
	if userId == "" {
		return bson.M{}, nil
	}

	if userId == "null" {
		return bson.M{"user": nil}, nil
	}

	userIdObj, err := primitive.ObjectIDFromHex(userId)

	if err != nil {
		return bson.M{}, err
	}

	return bson.M{"user": userIdObj}, nil
}

func GetApiLogs(c *gin.Context) {

	paginationData := utils.GetQueryData(c)
	status := c.Query("status")
	method := c.Query("method")
	sortKey := cmp.Or(c.Query("sortKey"), c.Query("sortBy"), "createdAt")
	userId := c.Query("userId")
	baseUrl := c.Query("baseUrl")
	sortValue := c.Query("sortValue")
	server := c.Query("server")
	duration := c.Query("duration") // "key:gte:value"

	filter := bson.M{}

	if status != "" {
		multiStatus := strings.Split(status, ",")

		statusIntArr := []int{}

		for _, status := range multiStatus {
			statusInt, err := strconv.Atoi(status)

			if err != nil {
				c.IndentedJSON(400, gin.H{
					"message": "Invalid status, please provide a valid status",
				})
				return
			}

			statusIntArr = append(statusIntArr, statusInt)
		}

		if len(statusIntArr) > 0 {
			filter["status"] = bson.M{"$in": statusIntArr}
		}
	}

	if method != "" {
		multiStatus := strings.Split(method, ",")

		if len(multiStatus) > 0 {
			filter["method"] = bson.M{"$in": multiStatus}
		}

	}

	if server != "" {
		filter["server"] = server
	}

	if userId != "" {
		userFilter, err := getUserIdFilter(userId)

		if err != nil {
			c.IndentedJSON(400, gin.H{
				"message": "Invalid user id, please provide a valid user id",
			})
			return
		}
		filter["user"] = userFilter["user"]
	}

	if paginationData.Search != "" {
		filter["url"] = bson.M{"$regex": paginationData.Search, "$options": "i"}
	}

	if baseUrl != "" {
		filter["baseUrl"] = baseUrl
	}

	if !paginationData.StartDate.IsZero() && !paginationData.EndDate.IsZero() {
		filter["createdAt"] = bson.M{"$gte": paginationData.StartDate, "$lte": paginationData.EndDate}
	}

	if duration != "" {
		// Parse the duration string
		durationParts := strings.Split(duration, ":")
		if len(durationParts) != 3 {
			c.IndentedJSON(400, gin.H{
				"message": "Invalid duration format, expected 'duration:gte:value'",
			})
			return
		}

		operator := durationParts[1]
		value, err := strconv.Atoi(durationParts[2])
		if err != nil {
			c.IndentedJSON(400, gin.H{
				"message": "Invalid duration value, please provide a valid integer",
			})
			return
		}

		filter["duration"] = bson.M{operator: value}
	}

	options := utils.GetPaginatedOptions(paginationData, nil)

	sortValueInt := -1

	if sortValue == "asc" || sortValue == "1" {
		sortValueInt = 1
	}

	options.SetSort(bson.M{sortKey: sortValueInt})

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

type User struct {
	ID      primitive.ObjectID `bson:"_id" json:"id"`
	CpCode  string             `bson:"cp_code" json:"cp_code"`
	Name    string             `bson:"name" json:"name"`
	EmpType string             `bson:"emp_type" json:"emp_type"`
	Phone   string             `bson:"phone" json:"phone"`
}

var cachedUsers []User = []User{}

func UserSelector(c *gin.Context) {

	if len(cachedUsers) > 0 {
		c.IndentedJSON(200, gin.H{
			"count": len(cachedUsers),
			"users": cachedUsers,
		})
		return
	}

	options := options.Find()
	options.SetProjection(bson.M{
		"cp_code":  1,
		"name":     1,
		"emp_type": 1,
		"phone":    1,
	})

	users, err := utils.UserModel.FindAll(bson.M{}, options)

	if err != nil {
		c.IndentedJSON(500, gin.H{
			"message": "Error in getting the users\n" + err.Error(),
		})
		return
	}

	for i, user := range users {

		id, ok := user["_id"].(primitive.ObjectID)

		if ok {
			users[i]["id"] = id
		}

		cachedUsers = append(cachedUsers, User{
			ID:      id,
			CpCode:  user["cp_code"].(string),
			Name:    user["name"].(string),
			EmpType: user["emp_type"].(string),
			Phone:   user["phone"].(string),
		})

	}

	c.IndentedJSON(200, gin.H{
		"count": len(users),
		"users": users,
	})

}

func GetUrlsForFilter(c *gin.Context) {

	// result, err := utils.ApiLogModel.Distinct(context.Background(), "baseUrl", bson.M{})

	// if err != nil {
	// 	c.IndentedJSON(500, gin.H{
	// 		"message": "Error in getting the urls\n" + err.Error(),
	// 	})
	// 	return
	// }

	c.IndentedJSON(200, gin.H{
		"urls": []string{},
	})

}
