package main

import (
	"fmt"
	"log"
	api_logs_handler "log_manager/handler/api_logs"
	cryptostream "log_manager/handler/crypto_stream"
	notification_log_handler "log_manager/handler/notifications"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func init() {
	if err := godotenv.Load(); err != nil {
		log.Println("Error loading .env file")
	}
}

func main() {
	// gin.SetMode(gin.ReleaseMode)
	// go cryptostream.BroadcastMessage()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{},
		AllowMethods:     []string{"PUT", "PATCH", "GET", "POST", "DELETE"},
		AllowHeaders:     []string{"Origin"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		AllowOriginFunc: func(origin string) bool {
			return true
		},
		MaxAge: 12 * time.Hour,
	}))

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Welcome to the log manager",
		})
	})

	r.GET("/api-logs", api_logs_handler.GetApiLogs)
	// r.GET("/api-urls", getUrlsForFilter)
	r.GET("/api-logs/urls", api_logs_handler.GetUrlsForFilter)
	r.GET("/api-logs/users", api_logs_handler.UserSelector)

	r.GET("/api-logs/:id", api_logs_handler.GetLogDetails)

	r.GET("/notification-logs/templates", notification_log_handler.GetNotificationTemplates)
	r.GET("/notification-logs", notification_log_handler.GetNotificationLogs)
	r.GET("/notification-logs/daily-count", notification_log_handler.GetDailyNotificationCount)

	r.GET("/crypto-stream", cryptostream.CryptoStreamHandler)

	fmt.Println("Server is running on port 8080")
	r.Run(":8082") // listen and serve on
}
