package cryptostream

import (
	"context"
	"encoding/json"
	"fmt"
	"log_manager/config"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var lock = &sync.Mutex{}
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,

	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var connections = make(map[*websocket.Conn]bool)

func addConnection(conn *websocket.Conn) {
	lock.Lock()
	connections[conn] = true
	lock.Unlock()
}

func removeConnection(conn *websocket.Conn) {
	lock.Lock()
	delete(connections, conn)
	lock.Unlock()

	conn.Close()
}

func CryptoStreamHandler(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {

		message := gin.H{
			"error": "Error in upgrading connection",
			"msg":   err.Error(),
		}

		fmt.Println("Error in upgrading connection")

		c.JSON(400, message)

		return
	}

	addConnection(conn)

	defer removeConnection(conn)

	isActive := false

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {

			message := gin.H{
				"error": "Error in reading message",
				"msg":   err.Error(),
			}

			c.JSON(400, message)

			return

		}

		if !isActive {
			isActive = true
			fmt.Println("Starting broadcast")

			go (func() {
				err := broadcastMessage(conn, string(msg))
				if err != nil {
					fmt.Println("Error in broadcast")
				}

				defer removeConnection(conn)
			})()

		} else {
			fmt.Println("Broadcast already active")
		}

	}
}

func parseTickers(msg string) []string {
	var tickers []string = []string{}
	json.Unmarshal([]byte(msg), &tickers)

	return tickers
}

type TickerData struct {
	Ticker string  `json:"ticker"`
	Price  float64 `json:"price"`
}

func getTickerDetailsFromRedis(ticker []string) []TickerData {

	// Implement Redis logic here
	vals := config.DefaultRedis().HMGet(context.TODO(), "satyam-coins", ticker...)
	result := vals.Val()

	tickerResult := []TickerData{}

	// string to float64

	for i, val := range ticker {
		value := result[i]

		if value == nil {
			continue
		}

		floatValue, err := strconv.ParseFloat(value.(string), 64)

		if err != nil {
			continue
		}

		tickerResult = append(tickerResult, TickerData{
			Ticker: val,
			Price:  floatValue,
		})
	}

	return tickerResult
}

func broadcastMessage(conn *websocket.Conn, tickers string) error {
	tickerList := parseTickers(tickers)

	emptyTickerList := make([]string, 0)

	if len(tickerList) == 0 {

		message, _ := json.Marshal(map[string]interface{}{
			"error":   "tickers list is empty",
			"tickers": emptyTickerList,
		})

		err := conn.WriteMessage(websocket.TextMessage, []byte(message))

		if err != nil {
			return err
		}

		return fmt.Errorf("tickers list is empty")
	}

	getTickerDetailsFromRedis(tickerList)

	for {
		tickerData := getTickerDetailsFromRedis(tickerList)

		jsonData := map[string]interface{}{
			"tickers": tickerData,
		}

		jsonString, _ := json.Marshal(jsonData)

		err := conn.WriteMessage(websocket.TextMessage, jsonString)

		if err != nil {
			return err
		}

		time.Sleep(1 * time.Second)
	}
}
