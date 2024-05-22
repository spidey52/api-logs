package cryptostream

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// router.GET("/ws", func(c *gin.Context) {

// 	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
// 	if err != nil {
// 		return
// 	}
// 	defer conn.Close()
// 	for {
// 		conn.WriteMessage(websocket.TextMessage, []byte("Hello, WebSocket!"))
// 		time.Sleep(time.Second)
// 	}
// })

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

var connections = make(map[*websocket.Conn]bool)

func addConnection(conn *websocket.Conn) {
	connections[conn] = true
}

func removeConnection(conn *websocket.Conn) {
	delete(connections, conn)

	conn.Close()
}

func CryptoStreamHandler(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	addConnection(conn)

	defer removeConnection(conn)

	isActive := false

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
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
	Ticker string
	Price  float64
}

func GetTickerData(tickers []string) []TickerData {

	var tickerData []TickerData = []TickerData{}

	for _, ticker := range tickers {
		tickerData = append(tickerData, TickerData{
			Ticker: ticker,
			Price:  0,
		})

	}

	return tickerData
}

func broadcastMessage(conn *websocket.Conn, tickers string) error {
	tickerList := parseTickers(tickers)

	if len(tickerList) == 0 {

		err := conn.WriteMessage(websocket.TextMessage, []byte("tickers list is empty"))

		if err != nil {
			return err
		}

		return fmt.Errorf("tickers list is empty")
	}

	for {

		tickerData := GetTickerData(tickerList)

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
